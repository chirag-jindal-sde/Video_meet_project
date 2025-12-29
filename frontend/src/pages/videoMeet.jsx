import React, { useEffect, useRef, useState } from "react";
import { TextField, Button } from "@mui/material";
import io from "socket.io-client";
import "../styles/videoComponent.css";
import { saveMeetingToHistory } from "../utils/meetingHistory";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClockRotateLeft , faArrowLeft, faPlus, faUsers, faVolumeXmark, faVolumeHigh ,faComment,
faXmark,
faSpinner,
faCircleExclamation,
faVideoSlash,
faVideo,
faTabletButton,
faLinkSlash,
faComments,
faPhoneSlash,} from "@fortawesome/free-solid-svg-icons";

const server_url = "https://video-meet-project.onrender.com";

export default function VideoMeetComponent() {
    const socketRef = useRef(null);
    const localVideoRef = useRef(null);
    const chatEndRef = useRef(null);
    const navigate = useNavigate();

    // FIXED: Separate states for video/audio status and remote videos
    const [meetingStartTime, setMeetingStartTime] = useState(null);
    const [videoEnabled, setVideoEnabled] = useState(true);
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [remoteVideos, setRemoteVideos] = useState([]); // Remote video streams
    const [screen, setScreen] = useState(false);
    const [screenAvailable, setScreenAvailable] = useState(true);

    const [askForUsername, setAskForUsername] = useState(true);
    const [username, setUsername] = useState("");
    const [isConnected, setIsConnected] = useState(false);

    // Chat states
    const [showChat, setShowChat] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [unreadCount, setUnreadCount] = useState(0);

    const connections = useRef({});
    const socketIdRef = useRef(null);

    const peerConfigConnections = {
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" }
        ]
    };

    // ------------------ HELPER FUNCTIONS ------------------

    const silence = () => {
        let ctx = new AudioContext()
        let oscillator = ctx.createOscillator()
        let dst = oscillator.connect(ctx.createMediaStreamDestination());
        oscillator.start();
        ctx.resume();
        return Object.assign(dst.stream.getAudioTracks()[0], {enabled : false})
    }

    const black = ({ width = 640, height = 480 } = {}) => {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").fillRect(0, 0, width, height);
        const stream = canvas.captureStream();
        const track = stream.getVideoTracks()[0];
        track.enabled = false;
        return track;
    };

    // ------------------ MEDIA PERMISSIONS ------------------

    const getPermissions = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });

            window.localStream = stream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            
            console.log("Local stream obtained:", stream);
            console.log("Video tracks:", stream.getVideoTracks().length);
            console.log("Audio tracks:", stream.getAudioTracks().length);
            return stream;
        } catch (err) {
            console.error("Error getting media permissions:", err);
            alert("Please allow camera and microphone access to join the call.");
            throw err;
        }
    };

// ✅ BEST SOLUTION: Proper useEffect separation with correct dependencies

// 1. Media Permissions - Run ONCE on mount
useEffect(() => {
    console.log("🔵 Component mounted, requesting permissions...");
    getPermissions();
}, []); // Empty deps = runs once on mount only

// 2. Cleanup - Run ONLY on unmount
useEffect(() => {
    return () => {
        console.log("Component unmounting, cleaning up...");
        
        // Save meeting duration before cleanup
        if (meetingStartTime) {
            const endTime = new Date();
            const durationInSeconds = Math.floor((endTime - meetingStartTime) / 1000);
            const meetingCode = window.location.pathname.substring(1);
            saveMeetingToHistory(meetingCode, durationInSeconds);
        }
        
        // Stop all media tracks
        if (window.localStream) {
            window.localStream.getTracks().forEach(track => track.stop());
        }
        
        // Disconnect socket
        if (socketRef.current) {
            socketRef.current.disconnect();
        }
    };
}, []); // Empty deps = cleanup runs only on unmount

// 3. Re-attach local video when username screen closes
useEffect(() => {
    if (!askForUsername && localVideoRef.current && window.localStream) {
        console.log("Re-attaching local stream to video element");
        localVideoRef.current.srcObject = window.localStream;
    }
}, [askForUsername]); // Only re-run when askForUsername changes

// 4. Auto-scroll chat
useEffect(() => {
    if (showChat && chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
}, [messages, showChat]); // Only re-run when messages or showChat changes

// 5. Screen share toggle
useEffect(() => {
    if (screen !== undefined && !askForUsername) {
        getDisplayMedia();
    }
}, [screen]); // Only re-run when screen state changes// ✅ ADD dependencies

    // ------------------ SIGNALING ------------------

    const gotMessageFromServer = (fromId, message) => {
        console.log("Got message from server. From:", fromId);
        
        try {
            const signal = JSON.parse(message);
            console.log("Signal type:", signal.sdp ? `SDP (${signal.sdp.type})` : signal.ice ? "ICE" : "unknown");
            
            if(fromId === socketIdRef.current) {
                console.log("Ignoring message from self");
                return;
            }
            
            if(!connections.current[fromId]) {
                console.log("No connection for:", fromId);
                return;
            }
            
            if(signal.sdp){
                connections.current[fromId]
                    .setRemoteDescription(new RTCSessionDescription(signal.sdp))
                    .then(() => {
                        console.log("Remote description set for:", fromId);
                        if(signal.sdp.type === 'offer'){
                            console.log("Creating answer for:", fromId);
                            connections.current[fromId].createAnswer()
                                .then((description) => {
                                    return connections.current[fromId].setLocalDescription(description);
                                })
                                .then(() => {
                                    console.log("Sending answer to:", fromId);
                                    socketRef.current.emit("signal", fromId, JSON.stringify({
                                        "sdp": connections.current[fromId].localDescription
                                    }));
                                })
                                .catch(e => console.error("Error creating answer:", e));
                        }
                    })
                    .catch(e => console.error("Error setting remote description:", e));
            }
            
            if(signal.ice){
                console.log("Adding ICE candidate for:", fromId);
                connections.current[fromId]
                    .addIceCandidate(new RTCIceCandidate(signal.ice))
                    .catch(e => console.error("Error adding ICE candidate:", e));
            }
        } catch (e) {
            console.error("Error in gotMessageFromServer:", e);
        }
    }

    const addMessage = (data, sender, socketIdSender) => {
        console.log("Chat message received:", data);
        
        const newMsg = {
            sender: sender,
            data: data,
            socketId: socketIdSender,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isOwn: socketIdSender === socketIdRef.current
        };
        
        setMessages(prevMessages => [...prevMessages, newMsg]);
        
        // Increment unread count if chat is closed
        if (!showChat) {
            setUnreadCount(prev => prev + 1);
        }
    };

    // ------------------ SOCKET CONNECTION ------------------
    const connectToSocketServer = () => {
        if (socketRef.current) {
            console.log("Socket already connected");
            return;
        }

        console.log("Connecting to socket server:", server_url);
        socketRef.current = io(server_url);

        socketRef.current.on("connect", () => {
    socketIdRef.current = socketRef.current.id;
    console.log("Frontend socket connected! ID:", socketRef.current.id);
    setIsConnected(true);
    
    // ✅ ADD THESE LINES:
    const meetingCode = window.location.pathname.substring(1);
    saveMeetingToHistory(meetingCode);
    setMeetingStartTime(new Date());
    
    socketRef.current.emit("join-call", window.location.href);
    console.log("Emitted join-call event");
});

        socketRef.current.on("disconnect", () => {
            console.log("Socket disconnected");
            setIsConnected(false);
        });

        socketRef.current.on('signal', gotMessageFromServer);

        socketRef.current.on("chat-message", addMessage);

        socketRef.current.on("user-left", (id) => {
            console.log("User left:", id);
            setRemoteVideos((videos) => videos.filter((video) => video.socketId !== id));
            
            // Close and cleanup connection
            if(connections.current[id]) {
                connections.current[id].close();
                delete connections.current[id];
            }
        });

        socketRef.current.on("user-joined", (id, clients) => {
            console.log("User joined event!");
            console.log("  My ID:", id);
            console.log("  All clients:", clients);
            console.log("  Number of clients:", clients.length);
            
            clients.forEach((socketListId) => {
                console.log("Setting up connection for:", socketListId);
                
                // Create peer connection
                connections.current[socketListId] = new RTCPeerConnection(peerConfigConnections);
                
                // Handle ICE candidates
                connections.current[socketListId].onicecandidate = (event) => {
                    if(event.candidate != null){
                        console.log("Sending ICE candidate to:", socketListId);
                        socketRef.current.emit("signal", socketListId, JSON.stringify({
                            'ice': event.candidate
                        }));
                    }
                }

                // Handle incoming streams
                connections.current[socketListId].ontrack = (event) => {
                    console.log("Received track from:", socketListId);
                    console.log("  Streams:", event.streams);
                    
                    if(event.streams && event.streams[0]) {
                        console.log("  Adding stream to video state");
                        setRemoteVideos(videos => {
                            const videoExist = videos.find(v => v.socketId === socketListId);
                            
                            if(videoExist) {
                                console.log("  Updating existing video");
                                return videos.map(v => 
                                    v.socketId === socketListId 
                                        ? {...v, stream: event.streams[0]} 
                                        : v
                                );
                            } else {
                                console.log("  Adding new video");
                                const newVideo = {
                                    socketId: socketListId,
                                    stream: event.streams[0],
                                    autoPlay: true,
                                    playsinline: true
                                }
                                const updatedVideos = [...videos, newVideo];
                                console.log("  Total videos now:", updatedVideos.length);
                                return updatedVideos;
                            }
                        });
                    }
                };

                // Add local stream tracks
                if(window.localStream) {
                    console.log("  Adding local stream tracks to connection");
                    window.localStream.getTracks().forEach(track => {
                        console.log("    Adding track:", track.kind);
                        connections.current[socketListId].addTrack(track, window.localStream);
                    });
                } else {
                    console.warn("No local stream available, using black/silence");
                    let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
                    window.localStream = blackSilence();
                    window.localStream.getTracks().forEach(track => {
                        connections.current[socketListId].addTrack(track, window.localStream);
                    });
                }
            });

            // If this is my own join event, create offers for existing connections
            if(id === socketIdRef.current){
                console.log("🚀 This is MY join event, creating offers...");
                const connectionIds = Object.keys(connections.current);
                console.log("  Existing connections:", connectionIds);
                
                for(let id2 in connections.current){
                    if(id2 === socketIdRef.current) continue;
                    
                    console.log("Creating offer for:", id2);
                    connections.current[id2].createOffer()
                        .then((description) => {
                            return connections.current[id2].setLocalDescription(description);
                        })
                        .then(() => {
                            console.log("Sending offer to:", id2);
                            socketRef.current.emit('signal', id2, JSON.stringify({
                                "sdp": connections.current[id2].localDescription
                            }));
                        })
                        .catch(e => console.error("Error creating offer:", e));
                }
            }
        });

        socketRef.current.on("connect_error", (error) => {
            console.error("Socket connection error:", error);
            alert("Failed to connect to server. Please make sure the server is running at " + server_url);
        });
    };

    const handleConnect = () => {
        if(!username.trim()) {
            alert("Please enter a username");
            return;
        }
        
        console.log("Connecting with username:", username);
        setAskForUsername(false);
        connectToSocketServer();
    };

    // Re-attach local stream after component renders
    useEffect(() => {
        if (!askForUsername && localVideoRef.current && window.localStream) {
            console.log("Re-attaching local stream to video element");
            localVideoRef.current.srcObject = window.localStream;
        }
    }, [askForUsername]);

    // Auto-scroll chat to bottom
    useEffect(() => {
        if (showChat && chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, showChat]);

    // ------------------ MEDIA CONTROLS ------------------

    const handleVideo = () => {
        if(window.localStream) {
            const videoTrack = window.localStream.getVideoTracks()[0];
            if(videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setVideoEnabled(videoTrack.enabled);
                console.log("Video track enabled:", videoTrack.enabled);
            }
        }
    };

    const handleAudio = () => {
        if(window.localStream) {
            const audioTrack = window.localStream.getAudioTracks()[0];
            if(audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setAudioEnabled(audioTrack.enabled);
                console.log("Audio track enabled:", audioTrack.enabled);
            }
        }
    };

    // ------------------ CHAT FUNCTIONS ------------------

    const handleToggleChat = () => {
        setShowChat(!showChat);
        if (!showChat) {
            setUnreadCount(0); // Reset unread count when opening chat
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        
        if (!newMessage.trim()) return;
        
        console.log("Sending message:", newMessage);
        
        // Emit message to server (server will broadcast to everyone including sender)
        socketRef.current.emit("chat-message", newMessage, username);
        
        // Clear input
        setNewMessage("");
    };

    // ------------------ SCREEN SHARE ------------------

    const stopScreenShare = async () => {
        console.log("Stopping screen share and returning to camera");
        
        // Stop screen share tracks
        if(window.localStream) {
            window.localStream.getTracks().forEach(track => {
                track.stop();
            });
        }
        
        // Get camera back
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });

            window.localStream = stream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            
            console.log("Camera stream restored");
            
            // Replace tracks in all peer connections with camera
            for(let id in connections.current) {
                if(id === socketIdRef.current) continue;
                
                const senders = connections.current[id].getSenders();
                
                // Replace video track
                const videoSender = senders.find(sender => sender.track && sender.track.kind === 'video');
                if(videoSender) {
                    const videoTrack = stream.getVideoTracks()[0];
                    if(videoTrack) {
                        await videoSender.replaceTrack(videoTrack);
                        console.log("✅ Replaced screen with camera video for:", id);
                    }
                }
                
                // Replace audio track
                const audioSender = senders.find(sender => sender.track && sender.track.kind === 'audio');
                if(audioSender) {
                    const audioTrack = stream.getAudioTracks()[0];
                    if(audioTrack) {
                        await audioSender.replaceTrack(audioTrack);
                        console.log("✅ Replaced screen audio with camera audio for:", id);
                    }
                }
            }
            
            return stream;
        } catch (err) {
            console.error("Error getting camera back:", err);
            alert("Could not restore camera access");
            throw err;
        }
    };

    const getDisplayMediaSuccess = (stream) => {
        console.log("Screen share stream obtained");
        
        try {
            // Stop all tracks from current local stream
            window.localStream.getTracks().forEach(track => {
                track.stop();
            });
        } catch(e) {
            console.log("Error stopping tracks:", e);
        }
        
        // Set the new screen share stream
        window.localStream = stream;
        localVideoRef.current.srcObject = stream;

        // Handle when user stops screen share from browser UI
        stream.getVideoTracks()[0].onended = () => {
            console.log("Screen share ended by user");
            setScreen(false);
            stopScreenShare();
        };

        // Replace tracks in all peer connections
        for(let id in connections.current) {
            if(id === socketIdRef.current) continue;
            
            const senders = connections.current[id].getSenders();
            
            // Replace video track with screen share
            const videoSender = senders.find(sender => sender.track && sender.track.kind === 'video');
            if(videoSender) {
                const screenVideoTrack = stream.getVideoTracks()[0];
                if(screenVideoTrack) {
                    videoSender.replaceTrack(screenVideoTrack)
                        .then(() => {
                            console.log("✅ Replaced camera with screen video for:", id);
                        })
                        .catch(e => console.log("❌ Error replacing video track:", e));
                }
            }
            
            // Replace audio track if screen has audio
            const audioSender = senders.find(sender => sender.track && sender.track.kind === 'audio');
            if(audioSender && stream.getAudioTracks().length > 0) {
                const screenAudioTrack = stream.getAudioTracks()[0];
                if(screenAudioTrack) {
                    audioSender.replaceTrack(screenAudioTrack)
                        .then(() => {
                            console.log("✅ Replaced mic with screen audio for:", id);
                        })
                        .catch(e => console.log("❌ Error replacing audio track:", e));
                }
            }
        }
    };

    const getDisplayMedia = async () => {
        if(screen) {
            // Stop screen sharing and return to camera
            await stopScreenShare();
        } else {
            // Start screen sharing
            if(navigator.mediaDevices.getDisplayMedia) {
                try {
                    const stream = await navigator.mediaDevices.getDisplayMedia({
                        video: {
                            cursor: "always"
                        },
                        audio: {
                            echoCancellation: true,
                            noiseSuppression: true
                        }
                    });
                    getDisplayMediaSuccess(stream);
                } catch(e) {
                    console.log("Screen share error:", e);
                    if(e.name !== 'NotAllowedError') {
                        alert("Screen sharing error: " + e.message);
                    }
                    setScreen(false);
                }
            } else {
                alert("Screen sharing is not supported in this browser");
                setScreenAvailable(false);
            }
        }
    };

    const handleScreen = () => {
        setScreen(!screen);
    };

    useEffect(() => {
        if(screen !== undefined && !askForUsername) {
            getDisplayMedia();
        }
    }, [screen]);

    // ------------------ END CALL ------------------

    const handleEndCall = () => {
    console.log("Ending call...");
    
    // ✅ ADD: Calculate and save meeting duration
    if (meetingStartTime) {
        const endTime = new Date();
        const durationInSeconds = Math.floor((endTime - meetingStartTime) / 1000);
        const meetingCode = window.location.pathname.substring(1);
        saveMeetingToHistory(meetingCode, durationInSeconds);
    }
    
    // Stop all local media tracks
    if(window.localStream) {
        window.localStream.getTracks().forEach(track => {
            track.stop();
            console.log("Stopped track:", track.kind);
        });
    }
    
    // Close all peer connections
    for(let id in connections.current) {
        connections.current[id].close();
        console.log("Closed connection:", id);
    }
    connections.current = {};
    
    // Disconnect socket
    if(socketRef.current) {
        socketRef.current.disconnect();
        console.log("Disconnected socket");
    }
    
    // Reset states
    setIsConnected(false);
    setRemoteVideos([]);
    
    // ✅ CHANGED: Navigate to home instead of window.location.reload()
    navigate("/home");
};

    console.log("Render - askForUsername:", askForUsername, "isConnected:", isConnected, "remote videos:", remoteVideos.length);

    return (
        <div className="video-meet-app">
            {askForUsername ? 
                <div className="join-screen">
                    <div className="join-screen-container">
                        <div className="join-header">
                            <h1 className="join-title">Welcome to CJ Meet</h1>
                            <p className="join-subtitle">Enter your name to get started</p>
                        </div>

                        <div className="join-form">
                            <TextField
                                value={username}
                                label="Your Name"
                                variant="outlined"
                                onChange={(e) => setUsername(e.target.value)}
                                onKeyPress={(e) => {
                                    if(e.key === 'Enter') handleConnect();
                                }}
                                fullWidth
                                className="username-input"
                            />

                            <Button 
                                variant="contained" 
                                onClick={handleConnect}
                                fullWidth
                                className="join-button"
                                size="large"
                            >
                                Join Meeting
                            </Button>
                        </div>

                        <div className="video-preview-section">
                            <h3 className="preview-title">Camera Preview</h3>
                            <div className="video-preview-wrapper">
                                <video 
                                    ref={localVideoRef} 
                                    autoPlay 
                                    muted
                                    className="preview-video"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                : 
                <div className="meeting-screen">
                    {/* Header Bar */}
                    <div className="meeting-header">
                        <div className="meeting-info">
                            <h2 className="meeting-title">Meeting Room</h2>
                            <span className="username-badge">{username}</span>
                        </div>
                        
                        <div className="meeting-stats">
                            <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                                <span className="status-dot"></span>
                                {isConnected ? 'Connected' : 'Disconnected'}
                            </span>
                            <span className="participants-count">
                                <FontAwesomeIcon icon={faUsers} /> {remoteVideos.length + 1} Participant{remoteVideos.length !== 0 ? 's' : ''}
                            </span>
                        </div>
                    </div>

                    {/* Video Grid */}
                    <div className="video-grid-container">
                        <div className={`video-grid ${remoteVideos.length === 0 ? 'single-user' : remoteVideos.length === 1 ? 'two-users' : 'multiple-users'}`}>
                            
                            {/* Local Video */}
                            <div className="video-card local-video-card">
                                <video 
                                    ref={localVideoRef} 
                                    autoPlay 
                                    muted
                                    className="video-element"
                                />
                                <div className="video-overlay">
                                    <span className="participant-name">
                                        You {screen && "(Sharing Screen)"}
                                    </span>
                                    <span className={`audio-indicator ${audioEnabled ? '' : 'muted'}`}>
                                        {audioEnabled ? <FontAwesomeIcon icon={faVolumeHigh} /> : <FontAwesomeIcon icon={faVolumeXmark} />}
                                    </span>
                                </div>
                            </div>
                            
                            {/* Remote Videos */}
                            {remoteVideos.map((vid, index) => (
                                <div key={vid.socketId} className="video-card remote-video-card">
                                    <video
                                        data-socket={vid.socketId}
                                        ref={ref => {
                                            if (ref && vid.stream) {
                                                console.log("Setting srcObject for video:", vid.socketId);
                                                ref.srcObject = vid.stream;
                                            }
                                        }}
                                        autoPlay
                                        playsInline
                                        className="video-element"
                                    />
                                    <div className="video-overlay">
                                        <span className="participant-name">
                                            Participant {index + 1}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Chat Panel */}
                    <div className={`chat-panel ${showChat ? 'chat-open' : ''}`}>
                        <div className="chat-header">
                            <h3 className="chat-title"><FontAwesomeIcon icon={faComment} />Chat</h3>
                            <button 
                                className="chat-close-button"
                                onClick={handleToggleChat}
                                title="Close Chat"
                            >
                                <FontAwesomeIcon icon={faXmark} />
                            </button>
                        </div>
                        
                        <div className="chat-messages">
                            {messages.length === 0 ? (
                                <div className="chat-empty-state">
                                    <p>No messages yet. Start the conversation!</p>
                                </div>
                            ) : (
                                messages.map((msg, index) => (
                                    <div 
                                        key={index} 
                                        className={`chat-message ${msg.isOwn ? 'own-message' : 'other-message'}`}
                                    >
                                        <div className="message-header">
                                            <span className="message-sender">
                                                {msg.isOwn ? 'You' : msg.sender}
                                            </span>
                                            <span className="message-time">{msg.time}</span>
                                        </div>
                                        <div className="message-content">
                                            {msg.data}
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={chatEndRef} />
                        </div>
                        
                        <form className="chat-input-container" onSubmit={handleSendMessage}>
                            <input
                                type="text"
                                className="chat-input"
                                placeholder="Type a message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                            />
                            <button 
                                type="submit" 
                                className="chat-send-button"
                                disabled={!newMessage.trim()}
                            >
                                Send
                            </button>
                        </form>
                    </div>

                    {/* Waiting Message */}
                    {remoteVideos.length === 0 && isConnected && (
                        <div className="waiting-room">
                            <div className="waiting-content">
                                <div className="waiting-icon"><FontAwesomeIcon icon={faSpinner} /></div>
                                <h3 className="waiting-title">Waiting for others to join...</h3>
                                <p className="waiting-description">
                                    Share this link with others to invite them:
                                </p>
                                <div className="meeting-link-box">
                                    <code className="meeting-link">{window.location.href}</code>
                                    <button 
                                        className="copy-link-button"
                                        onClick={() => {
                                            navigator.clipboard.writeText(window.location.href);
                                            alert('Link copied to clipboard!');
                                        }}
                                    >
                                        Copy Link
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Connection Error */}
                    {!isConnected && (
                        <div className="error-banner">
                            <span className="error-icon"><FontAwesomeIcon icon={faCircleExclamation} /></span>
                            <div className="error-content">
                                <strong className="error-title">Connection Error</strong>
                                <p className="error-message">Unable to connect to server. Please check your connection.</p>
                            </div>
                        </div>
                    )}

                    {/* Control Bar */}
                    <div className="control-bar">
                        <div className="control-buttons">
                            <button 
                                className={`control-button ${!audioEnabled ? 'muted' : ''}`}
                                onClick={handleAudio}
                                title={audioEnabled ? "Mute" : "Unmute"}
                            >
                                {audioEnabled ? <FontAwesomeIcon icon={faVolumeHigh} /> : <FontAwesomeIcon icon={faVolumeXmark} />}
                            </button>
                            <button 
                                className={`control-button ${!videoEnabled ? 'video-off' : ''}`}
                                onClick={handleVideo}
                                title={videoEnabled ? "Stop Video" : "Start Video"}
                            >
                                {videoEnabled ? <FontAwesomeIcon icon={faVideo} /> : <FontAwesomeIcon icon={faVideoSlash} />}
                            </button>
                            <button 
                                className={`control-button ${screen ? 'active' : ''}`}
                                onClick={handleScreen}
                                title={screen ? "Stop Sharing" : "Share Screen"}
                                disabled={!screenAvailable}
                            >
                                {!screen ? <FontAwesomeIcon icon={faTabletButton} />:<FontAwesomeIcon icon={faLinkSlash} />}
                            </button>
                            <button 
                                className={`control-button chat-toggle-button ${showChat ? 'active' : ''}`}
                                onClick={handleToggleChat}
                                title="Toggle Chat"
                            >
                                <FontAwesomeIcon icon={faComments} /> Chat
                                {unreadCount > 0 && (
                                    <span className="unread-badge">{unreadCount}</span>
                                )}
                            </button>
                            <button 
                                className="control-button leave-button" 
                                title="Leave Meeting"
                                onClick={handleEndCall}
                            >
                                < FontAwesomeIcon icon={faPhoneSlash} />Leave
                            </button>
                        </div>
                    </div>
                </div>
            }
        </div>
    );
}
