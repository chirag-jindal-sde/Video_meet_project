import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import withAuth from "../utils/withAuth";
import "../styles/homeComponent.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClockRotateLeft , faArrowLeft, faPlus, faUsers } from "@fortawesome/free-solid-svg-icons";

function HomeComponent() {
  const navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState("");

  const handleJoinVideoCall = () => {
    if (!meetingCode.trim()) {   
      alert("Please enter a meeting code");
      return;
    }
    navigate(`/${meetingCode}`);
  };

  const handleCreateMeeting = () => {
    const randomCode = Math.random().toString(36).substring(2, 10);
    navigate(`/${randomCode}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/auth");
  };

  const handleHistory = () => {
    navigate("/history");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleJoinVideoCall();
    }
  };

  return (
    <div className="home-container">
      {/* Navbar */}
      <nav className="home-navbar">
        <div className="navbar-brand">
          <h1 className="brand-name">CJ Video Meet</h1>
        </div>
        
        <div className="navbar-actions">
          <button className="nav-button history-button" onClick={handleHistory}>
          <FontAwesomeIcon icon={faClockRotateLeft} />
            <span className="button-text">History</span>
          </button>
          <button className="nav-button logout-button" onClick={handleLogout}>
            <FontAwesomeIcon icon={faArrowLeft} />
            <span className="button-text">Logout</span>
          </button>
        </div>
      </nav>

      {/* Main Content Section */}
      <div className="main-content">
        <div className="content-wrapper">
          {/* Left Side - Meeting Input Section */}
          <div className="left-section">
            <div className="welcome-text">
              <h1 className="main-title">
                Real Time 
                <span className="gradient-text"> Video conferencing</span>
              </h1>
              <p className="main-description">
                Connect, collaborate and celebrate from anywhere with CJ Video Meet
              </p>
            </div>

            <div className="meeting-actions">
              <div className="action-card">
                <h3 className="action-title">Create or Join a Meeting</h3>
                
                <div className="input-group">
                  <input
                    type="text"
                    className="meeting-input"
                    placeholder="Enter meeting code"
                    value={meetingCode}
                    onChange={(e) => setMeetingCode(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <button 
                    className="join-button" 
                    onClick={handleJoinVideoCall}
                    disabled={!meetingCode.trim()}
                  >
                    Join
                  </button>
                </div>

                <div className="separator">
                  <span className="separator-text">or</span>
                </div>

                <button className="create-meeting-button" onClick={handleCreateMeeting}>
                <FontAwesomeIcon icon={faPlus} />
                  <span>Create New Meeting</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Side - Image Section */}
          <div className="right-section">
            <div className="image-container">
              <img 
                src="https://images.unsplash.com/photo-1585974738771-84483dd9f89f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fHZpZGVvY2FsbHxlbnwwfHwwfHx8MA%3D%3D" 
                alt="Video Meeting Illustration" 
                className="hero-image"
              />
              <div className="image-overlay">
                <div className="overlay-badge">
<FontAwesomeIcon icon={faUsers} />
                  <span className="badge-text">Connect with anyone, anywhere</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(HomeComponent);
