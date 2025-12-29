import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import withAuth from "../utils/withAuth";
import "../styles/historyComponent.css";

function HistoryComponent() {
  const navigate = useNavigate();
  const [meetingHistory, setMeetingHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Load meeting history from localStorage
    const history = JSON.parse(localStorage.getItem("meetingHistory")) || [];
    // Sort by date (newest first)
    const sortedHistory = history.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
    setMeetingHistory(sortedHistory);
    setFilteredHistory(sortedHistory);
  }, []);

  const handleBack = () => {
    navigate("/home");
  };

  const handleRejoinMeeting = (meetingId) => {
    navigate(`/${meetingId}`);
  };

  const handleCopyMeetingId = (meetingId) => {
    navigator.clipboard.writeText(meetingId);
    alert("Meeting ID copied to clipboard!");
  };

  const handleDeleteMeeting = (meetingId) => {
    if (window.confirm("Are you sure you want to delete this meeting from history?")) {
      const updatedHistory = meetingHistory.filter(
        meeting => meeting.meetingId !== meetingId
      );
      setMeetingHistory(updatedHistory);
      localStorage.setItem("meetingHistory", JSON.stringify(updatedHistory));
    }
  };

  const handleClearAllHistory = () => {
    if (window.confirm("Are you sure you want to clear all meeting history?")) {
      setMeetingHistory([]);
      setFilteredHistory([]);
      localStorage.removeItem("meetingHistory");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", { 
        month: "short", 
        day: "numeric", 
        year: "numeric" 
      });
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", { 
      hour: "2-digit", 
      minute: "2-digit",
      hour12: true 
    });
  };

  const getDuration = (duration) => {
    if (!duration) return "Unknown";
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    if (minutes === 0) return `${seconds}s`;
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="history-container">
      {/* Header */}
      <div className="history-header">
        <button className="back-button" onClick={handleBack}>
          <span className="back-icon">←</span>
          <span>Back</span>
        </button>
        <h1 className="history-title">Meeting History</h1>
        {meetingHistory.length > 0 && (
          <button className="clear-all-button" onClick={handleClearAllHistory}>
            <span>Clear All</span>
          </button>
        )}
      </div>
      {/* Meeting History List */}
      <div className="history-content">
        {filteredHistory.length === 0 ? (
          <div className="empty-state">
            <h2 className="empty-title">
              {searchTerm ? "No meetings found" : "No meeting history yet"}
            </h2>
            <p className="empty-description">
              {searchTerm 
                ? "Try searching with a different meeting ID" 
                : "Your past meetings will appear here once you join or create a meeting"}
            </p>
            {!searchTerm && (
              <button className="start-meeting-button" onClick={handleBack}>
                Start a Meeting
              </button>
            )}
          </div>
        ) : (
          <div className="history-list">
            {filteredHistory.map((meeting, index) => (
              <div key={index} className="meeting-card">
                <div className="meeting-card-header">
                  <div className="meeting-info">
                    <h3 className="meeting-id-title">Meeting ID</h3>
                    <p className="meeting-id">{meeting.meetingId}</p>
                  </div>
                </div>

                <div className="meeting-details">
                  <div className="detail-item">
                    <div className="detail-text">
                      <span className="detail-label">Date</span>
                      <span className="detail-value">{formatDate(meeting.dateTime)}</span>
                    </div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-text">
                      <span className="detail-label">Time</span>
                      <span className="detail-value">{formatTime(meeting.dateTime)}</span>
                    </div>
                  </div>

                  {meeting.duration && (
                    <div className="detail-item">
                      <div className="detail-text">
                        <span className="detail-label">Duration</span>
                        <span className="detail-value">{getDuration(meeting.duration)}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="meeting-actions">
                  <button 
                    className="action-button rejoin-button"
                    onClick={() => handleRejoinMeeting(meeting.meetingId)}
                    title="Rejoin Meeting"
                  >
                    <span>Rejoin</span>
                  </button>

                  <button 
                    className="action-button copy-button"
                    onClick={() => handleCopyMeetingId(meeting.meetingId)}
                    title="Copy Meeting ID"
                  >
                    <span>Copy ID</span>
                  </button>

                  <button 
                    className="action-button delete-button"
                    onClick={() => handleDeleteMeeting(meeting.meetingId)}
                    title="Delete from History"
                  >
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats Footer */}
      {meetingHistory.length > 0 && (
        <div className="history-footer">
          <div className="stats-container">
            <div className="stat-item">
              <span className="stat-value">{meetingHistory.length}</span>
              <span className="stat-label">Total Meetings</span>
            </div>
            {searchTerm && (
              <div className="stat-item">
                <span className="stat-value">{filteredHistory.length}</span>
                <span className="stat-label">Search Results</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default withAuth(HistoryComponent);