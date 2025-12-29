// utils/meetingHistory.js

/**
 * Save a meeting to history
 * @param {string} meetingId - The meeting ID/code
 * @param {number} duration - Duration of the meeting in seconds (optional)
 */
export const saveMeetingToHistory = (meetingId, duration = null) => {
  try {
    // Get existing history
    const history = JSON.parse(localStorage.getItem("meetingHistory")) || [];
    
    // Check if meeting already exists in history
    const existingMeetingIndex = history.findIndex(
      meeting => meeting.meetingId === meetingId
    );
    
    if (existingMeetingIndex !== -1) {
      // Update existing meeting with new date/time and duration
      history[existingMeetingIndex] = {
        meetingId: meetingId,
        dateTime: new Date().toISOString(),
        duration: duration
      };
    } else {
      // Add new meeting to history
      const newMeeting = {
        meetingId: meetingId,
        dateTime: new Date().toISOString(),
        duration: duration
      };
      history.push(newMeeting);
    }
    
    // Save back to localStorage
    localStorage.setItem("meetingHistory", JSON.stringify(history));
    console.log("Meeting saved to history:", meetingId);
  } catch (error) {
    console.error("Error saving meeting to history:", error);
  }
};

/**
 * Get all meeting history
 * @returns {Array} Array of meeting history objects
 */
export const getMeetingHistory = () => {
  try {
    const history = JSON.parse(localStorage.getItem("meetingHistory")) || [];
    return history.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
  } catch (error) {
    console.error("Error getting meeting history:", error);
    return [];
  }
};

/**
 * Delete a specific meeting from history
 * @param {string} meetingId - The meeting ID to delete
 */
export const deleteMeetingFromHistory = (meetingId) => {
  try {
    const history = JSON.parse(localStorage.getItem("meetingHistory")) || [];
    const updatedHistory = history.filter(
      meeting => meeting.meetingId !== meetingId
    );
    localStorage.setItem("meetingHistory", JSON.stringify(updatedHistory));
    console.log("Meeting deleted from history:", meetingId);
  } catch (error) {
    console.error("Error deleting meeting from history:", error);
  }
};

/**
 * Clear all meeting history
 */
export const clearAllMeetingHistory = () => {
  try {
    localStorage.removeItem("meetingHistory");
    console.log("All meeting history cleared");
  } catch (error) {
    console.error("Error clearing meeting history:", error);
  }
};