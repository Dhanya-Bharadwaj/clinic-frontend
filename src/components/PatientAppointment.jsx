import React, { useState } from 'react';
import VideoCall from './VideoCall';
import '../styles/PatientAppointment.css';

const PatientAppointment = ({ booking, onClose }) => {
  const [showVideoCall, setShowVideoCall] = useState(false);

  // Check if video call button should be enabled (5 minutes before appointment)
  const canJoinCall = () => {
    if (booking.consultType !== 'online') return false;
    if (!booking.date || !booking.time) return false;

    try {
      // Parse appointment date and time
      const [day, month, year] = booking.date.split('/');
      const [hours, minutes] = booking.time.split(':');
      const appointmentTime = new Date(year, month - 1, day, hours, minutes);

      // Get current time
      const now = new Date();

      // Calculate time difference in minutes
      const timeDiff = (appointmentTime - now) / (1000 * 60);

      // Enable button 5 minutes before until 30 minutes after appointment
      return timeDiff <= 5 && timeDiff >= -30;
    } catch (e) {
      console.error('Error parsing appointment time:', e);
      return false;
    }
  };

  const getTimeUntilAppointment = () => {
    try {
      const [day, month, year] = booking.date.split('/');
      const [hours, minutes] = booking.time.split(':');
      const appointmentTime = new Date(year, month - 1, day, hours, minutes);
      const now = new Date();
      const timeDiff = (appointmentTime - now) / (1000 * 60);

      if (timeDiff > 5) {
        const minutesLeft = Math.floor(timeDiff);
        const hoursLeft = Math.floor(minutesLeft / 60);
        const minsLeft = minutesLeft % 60;
        return `${hoursLeft}h ${minsLeft}m until call is available`;
      }
      return 'Call available now!';
    } catch (e) {
      return '';
    }
  };

  if (showVideoCall) {
    return (
      <VideoCall
        bookingId={booking.bookingId || booking._id}
        patientName={booking.patientName}
        doctorName="Dr K Madhusudana"
        onClose={() => setShowVideoCall(false)}
      />
    );
  }

  return (
    <div className="patient-appointment-modal">
      <div className="appointment-details">
        <div className="appointment-header">
          <h2>Your Appointment</h2>
          {onClose && (
            <button className="close-btn" onClick={onClose}>×</button>
          )}
        </div>

        <div className="appointment-info">
          <div className="info-item">
            <label>Doctor:</label>
            <span>Dr K Madhusudana</span>
          </div>
          <div className="info-item">
            <label>Date:</label>
            <span>{booking.date}</span>
          </div>
          <div className="info-item">
            <label>Time:</label>
            <span>{booking.time}</span>
          </div>
          <div className="info-item">
            <label>Type:</label>
            <span className="consult-type">{booking.consultType}</span>
          </div>
          <div className="info-item">
            <label>Booking ID:</label>
            <span className="booking-id">{booking.bookingId || booking._id}</span>
          </div>
        </div>

        {booking.consultType === 'online' && (
          <div className="video-call-section">
            <div className="call-status">
              {canJoinCall() ? (
                <>
                  <i className="fas fa-video call-icon active"></i>
                  <p className="status-text active">Your video call is ready!</p>
                </>
              ) : (
                <>
                  <i className="fas fa-clock call-icon waiting"></i>
                  <p className="status-text waiting">{getTimeUntilAppointment()}</p>
                </>
              )}
            </div>

            <button
              className={`join-call-button ${canJoinCall() ? 'active' : 'disabled'}`}
              onClick={() => setShowVideoCall(true)}
              disabled={!canJoinCall()}
            >
              <i className="fas fa-video"></i>
              {canJoinCall() ? 'Join Video Call' : 'Call Not Available Yet'}
            </button>

            {!canJoinCall() && (
              <p className="call-note">
                The video call will be available 5 minutes before your appointment time.
                Please be ready to join at the scheduled time.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientAppointment;
