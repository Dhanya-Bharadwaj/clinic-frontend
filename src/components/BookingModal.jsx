// src/components/BookingModal.jsx - REVISED for Booking Status Confirmation

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { IoCloseSharp } from 'react-icons/io5';
import { getAvailableSlots, bookAppointment } from '../api/bookingApi';
import LoadingSpinner from './LoadingSpinner';
import '../styles/BookingModal.css';
import 'react-datepicker/dist/react-datepicker.css';

const modalVariants = {
  hidden: { opacity: 0, scale: 0.7 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3, type: 'spring', damping: 20, stiffness: 200 } },
  exit: { opacity: 0, scale: 0.7, transition: { duration: 0.2 } },
};

const BookingModal = ({ isOpen, onClose }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingStatus, setBookingStatus] = useState({ message: '', type: '' });
  const [submittingBooking, setSubmittingBooking] = useState(false);
  // NEW STATE: To hold details of a successfully booked appointment
  const [bookingConfirmedData, setBookingConfirmedData] = useState(null);

  const modalRef = useRef(null);

  // Effect for handling body scroll and keyboard/backdrop close
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);

      const handleEscape = (event) => {
        if (event.key === 'Escape') {
          onClose();
        }
      };
      document.addEventListener('keydown', handleEscape);

      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.classList.remove('modal-open');
        document.documentElement.style.removeProperty('--scrollbar-width');
      };
    } else {
      document.body.classList.remove('modal-open');
      document.documentElement.style.removeProperty('--scrollbar-width');
    }
  }, [isOpen, onClose]);

  // Effect for fetching slots & resetting state
  useEffect(() => {
    if (isOpen && selectedDate) {
      fetchSlots(selectedDate);
    } else if (!isOpen) {
      // Reset all state when modal closes
      setSelectedDate(null);
      setAvailableSlots([]);
      setSelectedTime('');
      setPatientName('');
      setPatientEmail('');
      setPatientPhone('');
      setBookingStatus({ message: '', type: '' });
      setSubmittingBooking(false);
      setBookingConfirmedData(null); // IMPORTANT: Reset confirmation data too
    }
  }, [isOpen, selectedDate]);

  const fetchSlots = async (date) => {
    setLoadingSlots(true);
    setAvailableSlots([]);
    setSelectedTime('');
    setBookingStatus({ message: '', type: '' });
    try {
      const slots = await getAvailableSlots(date);
      setAvailableSlots(slots.sort());
    } catch (error) {
      console.error('Failed to fetch slots:', error);
      setBookingStatus({ message: 'Failed to load slots. Please try again.', type: 'error' });
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    setBookingStatus({ message: '', type: '' });

    if (!selectedDate || !selectedTime || !patientName || !patientEmail || !patientPhone) {
      setBookingStatus({ message: 'Please fill in all required fields and select a date/time.', type: 'error' });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patientEmail)) {
      setBookingStatus({ message: 'Please enter a valid email address.', type: 'error' });
      return;
    }

    if (!/^\d{10}$/.test(patientPhone)) {
      setBookingStatus({ message: 'Please enter a valid 10-digit phone number.', type: 'error' });
      return;
    }

    setSubmittingBooking(true);
    try {
      const appointmentDetails = {
        date: selectedDate,
        time: selectedTime,
        patientName,
        patientEmail,
        patientPhone,
        // In a real app, you'd get an actual booking ID from the backend
        bookingId: `BK-${Date.now()}` // Mock booking ID
      };
      const result = await bookAppointment(appointmentDetails);
      setBookingStatus({ message: result.message, type: 'success' });
      fetchSlots(selectedDate); // Refresh slots immediately
      setBookingConfirmedData(appointmentDetails); // Store confirmed details

      // Removed immediate onClose() to show confirmation screen
      // setTimeout(() => { onClose(); }, 2000); // This will now be handled by confirmation view
    } catch (error) {
      console.error('Booking error:', error);
      setBookingStatus({ message: error.message || 'Failed to book appointment. Please try a different slot.', type: 'error' });
    } finally {
      setSubmittingBooking(false);
    }
  };

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleBackdropClick}
        >
          <motion.div
            className="modal-content"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            ref={modalRef}
          >
            <div className="modal-header">
              <h3>{bookingConfirmedData ? 'Appointment Confirmed!' : 'Book Your Appointment'}</h3>
              <button onClick={onClose} className="modal-close-button" aria-label="Close modal">
                <IoCloseSharp />
              </button>
            </div>

            {/* Conditional Rendering: Show Confirmation View or Booking Form */}
            {bookingConfirmedData ? (
              <motion.div
                className="booking-confirmation-view"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
              >
                <div className="confirmation-icon">
                    <i className="fas fa-check-circle"></i> {/* Font Awesome check icon */}
                </div>
                <h4 className="confirmation-message">Your appointment has been successfully booked.</h4>
                <p className="confirmation-detail-item">
                  <strong>Booking ID:</strong> <span>{bookingConfirmedData.bookingId}</span>
                </p>
                <p className="confirmation-detail-item">
                  <strong>Doctor:</strong> <span>Dr. Madhusudhan</span>
                </p>
                <p className="confirmation-detail-item">
                  <strong>Date:</strong> <span>{bookingConfirmedData.date.toLocaleDateString()}</span>
                </p>
                <p className="confirmation-detail-item">
                  <strong>Time:</strong> <span>{bookingConfirmedData.time}</span>
                </p>
                <p className="confirmation-detail-item">
                  <strong>Patient Name:</strong> <span>{bookingConfirmedData.patientName}</span>
                </p>
                <p className="confirmation-detail-item">
                  <strong>Email:</strong> <span>{bookingConfirmedData.patientEmail}</span>
                </p>
                <p className="confirmation-detail-item">
                  <strong>Phone:</strong> <span>{bookingConfirmedData.patientPhone}</span>
                </p>

                <p className="confirmation-note">
                  Please keep this information for your reference.
                  An email confirmation with these details has also been sent.
                </p>

                <motion.button
                  onClick={onClose}
                  className="close-confirmation-button"
                  whileHover={{ scale: 1.05, boxShadow: '0 6px 15px rgba(0, 123, 255, 0.4)' }}
                  whileTap={{ scale: 0.95 }}
                >
                  Close
                </motion.button>
              </motion.div>
            ) : (
              <> {/* Original Booking Form content */}
                <div className="date-picker-container">
                  <label>Select Date:</label>
                  <DatePicker
                    selected={selectedDate}
                    onChange={handleDateChange}
                    minDate={new Date()}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Click to select a date"
                    inline
                  />
                </div>

                <div>
                  <label>Available Time Slots for {selectedDate?.toLocaleDateString() || 'selected date'}:</label>
                  {loadingSlots ? (
                    <LoadingSpinner />
                  ) : availableSlots.length > 0 ? (
                    <div className="time-slots-container">
                      {availableSlots.map((time) => (
                        <motion.button
                          key={time}
                          className={`time-slot-button ${selectedTime === time ? 'selected' : ''}`}
                          onClick={() => handleTimeSelect(time)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          disabled={submittingBooking}
                        >
                          {time}
                        </motion.button>
                      ))}
                    </div>
                  ) : (
                    <p>No slots available for this date. Please choose another date.</p>
                  )}
                </div>

                {selectedTime && (
                  <form onSubmit={handleSubmitBooking} className="appointment-form">
                    <h4>Confirm Your Details</h4>
                    <div>
                      <label htmlFor="patient-name">Full Name:</label>
                    <input
                        type="text"
                        id="patient-name"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        required
                        disabled={submittingBooking}
                      />
                    </div>
                    <div>
                      <label htmlFor="patient-email">Email:</label>
                      <input
                        type="email"
                        id="patient-email"
                        value={patientEmail}
                        onChange={(e) => setPatientEmail(e.target.value)}
                        required
                        disabled={submittingBooking}
                      />
                    </div>
                    <div>
                      <label htmlFor="patient-phone">Phone Number:</label>
                      <input
                        type="tel"
                        id="patient-phone"
                        value={patientPhone}
                        onChange={(e) => setPatientPhone(e.target.value)}
                        pattern="[0-9]{10}"
                        required
                        disabled={submittingBooking}
                      />
                    </div>

                    {bookingStatus.message && (
                      <p className={`modal-message ${bookingStatus.type}`}>
                        {bookingStatus.message}
                      </p>
                    )}

                    <div className="modal-actions">
                      <motion.button
                        type="button"
                        onClick={onClose}
                        className="cancel-button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={submittingBooking}
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        type="submit"
                        disabled={submittingBooking || !selectedTime}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {submittingBooking ? 'Booking...' : 'Confirm Booking'}
                      </motion.button>
                    </div>
                  </form>
                )}
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BookingModal;