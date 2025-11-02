// src/components/CheckAppointmentModal.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoCloseSharp } from 'react-icons/io5';
import LoadingSpinner from './LoadingSpinner';
import ViewPrescriptionModal from './ViewPrescriptionModal';
import '../styles/CheckAppointmentModal.css';

const CheckAppointmentModal = ({ isOpen, onClose }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    console.log('=== Check Appointments Search ===');
    console.log('Phone number entered:', phoneNumber);
    
    if (!/^\d{10}$/.test(phoneNumber)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    setError('');
    setSearched(false);

    try {
      // Use VITE_API_BASE_URL if set, otherwise fallback based on mode
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL 
        ? `${import.meta.env.VITE_API_BASE_URL}/api/bookings`
        : (import.meta.env.MODE === 'production'
          ? 'https://clinic-backend-flame.vercel.app/api/bookings'
          : 'http://localhost:5001/api/bookings');

      const fullUrl = `${API_BASE_URL}/check-appointments?phone=${phoneNumber}`;
      console.log('API URL:', fullUrl);
      console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
      console.log('Final API_BASE_URL:', API_BASE_URL);
      console.log('Mode:', import.meta.env.MODE);

      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      let data;
      try {
        data = await response.json();
        console.log('Response data:', data);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        // If we get HTML instead of JSON, the endpoint doesn't exist yet
        throw new Error('This feature is not available yet. The backend needs to be updated.');
      }

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch appointments');
      }

      console.log('Appointments found:', data.appointments?.length || 0);
      setAppointments(data.appointments || []);
      setSearched(true);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError(err.message || 'Failed to fetch appointments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPhoneNumber('');
    setAppointments([]);
    setError('');
    setSearched(false);
    onClose();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="check-appointment-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="check-appointment-content"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="check-appointment-header">
              <h3>Check Your Appointments</h3>
              <button onClick={handleClose} className="close-button" aria-label="Close">
                <IoCloseSharp />
              </button>
            </div>

            <form onSubmit={handleSearch} className="phone-search-form">
              <div className="form-group">
                <label htmlFor="phone">Enter your phone number:</label>
                <input
                  type="tel"
                  id="phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="10-digit phone number"
                  maxLength="10"
                  pattern="[0-9]{10}"
                  required
                />
              </div>
              
              {error && <p className="error-message">{error}</p>}
              
              <div className="button-group">
                <motion.button
                  type="submit"
                  className="search-button"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? 'Searching...' : 'Search Appointments'}
                </motion.button>
                
                <motion.button
                  type="button"
                  className="prescription-button"
                  onClick={() => setShowPrescriptionModal(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  📋 View Prescription
                </motion.button>
              </div>
            </form>

            {loading && <LoadingSpinner />}

            {searched && !loading && (
              <div className="appointments-list">
                {appointments.length > 0 ? (
                  <>
                    <h4>Your Upcoming Appointments ({appointments.length})</h4>
                    {appointments.map((appointment) => (
                      <motion.div
                        key={appointment.id}
                        className="appointment-item"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="appointment-header">
                          <span className="booking-id">ID: {appointment.bookingId}</span>
                          <span className={`consult-badge ${appointment.consultType}`}>
                            {appointment.consultType === 'online' ? '🎥 Online' : '🏥 In-Clinic'}
                          </span>
                        </div>
                        <div className="appointment-details">
                          <div className="detail-row">
                            <span className="label">📅 Date:</span>
                            <span className="value">{formatDate(appointment.date)}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">🕐 Time:</span>
                            <span className="value">{formatTime(appointment.time)}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">👤 Patient:</span>
                            <span className="value">{appointment.patientName}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </>
                ) : (
                  <div className="no-appointments">
                    <p>No upcoming appointments found for this phone number.</p>
                    <p className="hint">Make sure you entered the same number used during booking.</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
      
      <ViewPrescriptionModal 
        isOpen={showPrescriptionModal}
        onClose={() => setShowPrescriptionModal(false)}
      />
    </AnimatePresence>
  );
};

export default CheckAppointmentModal;
