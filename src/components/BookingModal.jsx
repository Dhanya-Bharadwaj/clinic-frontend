// src/components/BookingModal.jsx - REVISED for Step-by-Step Booking Flow with Razorpay

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { IoCloseSharp } from 'react-icons/io5';
import { getAvailableSlots, bookAppointment, createPaymentOrder, verifyPayment } from '../api/bookingApi';
import LoadingSpinner from './LoadingSpinner';
import '../styles/BookingModal.css';
// import 'react-datepicker/dist/react-datepicker.css'; // This import is redundant

const modalVariants = {
  hidden: { opacity: 0, scale: 0.7 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, type: 'spring', damping: 20, stiffness: 200 },
  },
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
  // New state for step-by-step flow
  const [step, setStep] = useState(0); // 0: consult type, 1: calendar, 2: slots, 3: details, 4: payment/confirm
  const [consultType, setConsultType] = useState(''); // 'online' or 'offline'
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [loadingPayment, setLoadingPayment] = useState(false);
  // Razorpay preflight
  const [razorpayReady, setRazorpayReady] = useState(false);
  const [razorpayKeyPresent, setRazorpayKeyPresent] = useState(!!import.meta.env.VITE_RAZORPAY_KEY_ID);
  const [razorpayLoadError, setRazorpayLoadError] = useState('');

  const modalRef = useRef(null);

  // Effect for handling body scroll and keyboard/backdrop close
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
      // Ensure scrollbar-width is set before calculating and removing if it doesn't exist
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      if (scrollbarWidth > 0) {
        document.documentElement.style.setProperty(
          '--scrollbar-width',
          `${scrollbarWidth}px`,
        );
      }

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
    if (isOpen && selectedDate && consultType) {
      // Ensure date is a valid Date object before trying to fetch slots
      if (selectedDate instanceof Date && !isNaN(selectedDate)) {
        fetchSlots(selectedDate);
      } else {
        console.error('Selected date is not a valid Date object:', selectedDate);
        setBookingStatus({
          message: 'Invalid date selected. Please choose a valid date.',
          type: 'error',
        });
      }
    } else if (!isOpen) {
      // Reset all state when modal closes
      setStep(0);
      setConsultType('');
      setGender('');
      setAge('');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedDate, consultType]); // Added consultType to refetch slots when it changes

  const fetchSlots = async (date) => {
    setLoadingSlots(true);
    setAvailableSlots([]);
    setSelectedTime(''); // Reset selected time when date changes
    setBookingStatus({ message: '', type: '' }); // Reset any previous error messages

    try {
      // Ensure the date passed to API is in the correct format (YYYY-MM-DD)
      // Pass the consultation type to get appropriate slots
      const slots = await getAvailableSlots(date, consultType);
      setAvailableSlots(slots.sort());
      if (slots.length === 0) {
        setBookingStatus({
          message: 'No slots available for this date. Please choose another date.',
          type: 'info',
        });
      }
    } catch (error) {
      console.error('Failed to fetch slots:', error);
      setBookingStatus({
        message: error.message || 'Failed to load slots. Please try again.',
        type: 'error',
      });
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    // When date changes, reset selected time and clear previous booking status
    setSelectedTime('');
    setBookingStatus({ message: '', type: '' });
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    setBookingStatus({ message: '', type: '' }); // Clear status when time changes
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    setBookingStatus({ message: '', type: '' });

    // Debug: log all values to see what's missing
    console.log('Validation check:', {
      selectedDate,
      selectedTime,
      patientName,
      patientPhone,
      age,
      gender,
      consultType
    });

    // Updated validation for new required fields
    if (!selectedDate || !selectedTime || !patientName || !patientPhone || !age || !gender) {
      const missingFields = [];
      if (!selectedDate) missingFields.push('Date');
      if (!selectedTime) missingFields.push('Time');
      if (!patientName) missingFields.push('Name');
      if (!patientPhone) missingFields.push('Phone');
      if (!age) missingFields.push('Age');
      if (!gender) missingFields.push('Gender');
      
      setBookingStatus({
        message: `Missing required fields: ${missingFields.join(', ')}`,
        type: 'error',
      });
      return;
    }

    // Basic phone number validation for 10 digits
    if (!/^\d{10}$/.test(patientPhone)) {
      setBookingStatus({
        message: 'Please enter a valid 10-digit phone number.',
        type: 'error',
      });
      return;
    }

    // Age validation
    if (!age || parseInt(age) < 1 || parseInt(age) > 120) {
      setBookingStatus({
        message: 'Please enter a valid age between 1 and 120.',
        type: 'error',
      });
      return;
    }

    setSubmittingBooking(true);
    try {
      const result = await bookAppointment({
        date: selectedDate, // Still sending the Date object, API will convert
        time: selectedTime,
        patientName,
        patientPhone,
        age: parseInt(age),
        gender,
        consultType,
        // The backend generates and returns the bookingId
      });
      setBookingStatus({ message: result.message, type: 'success' });
      fetchSlots(selectedDate); // Refresh slots immediately
      setBookingConfirmedData(result.appointment); // Store confirmed details from backend response

      // Removed immediate onClose() to show confirmation screen
      // setTimeout(() => { onClose(); }, 2000); // This will now be handled by confirmation view
    } catch (error) {
      console.error('Booking error:', error);
      setBookingStatus({
        message:
          error.message || 'Failed to book appointment. Please try a different slot.',
        type: 'error',
      });
    } finally {
      setSubmittingBooking(false);
    }
  };

  // Razorpay checkout loader
  const loadRazorpay = () => new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
    document.body.appendChild(script);
  });

  // Pre-load SDK and check key when entering payment step
  useEffect(() => {
    if (isOpen && step === 4 && consultType === 'online') {
      setRazorpayKeyPresent(!!import.meta.env.VITE_RAZORPAY_KEY_ID);
      loadRazorpay()
        .then(() => { setRazorpayReady(true); setRazorpayLoadError(''); })
        .catch((e) => { setRazorpayReady(false); setRazorpayLoadError(e.message || 'Failed to load Razorpay'); });
    } else {
      setRazorpayReady(false);
      setRazorpayLoadError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, step, consultType]);

  const handleOnlinePayment = async () => {
    console.log('=== handleOnlinePayment clicked ===');
    console.log('Razorpay ready:', razorpayReady);
    console.log('Razorpay key present:', razorpayKeyPresent);
    console.log('Form data:', { selectedDate, selectedTime, patientName, patientPhone, age, gender });
    
    try {
      setLoadingPayment(true);
      console.log('Loading payment set to true');
      
      // Basic validation
      if (!selectedDate || !selectedTime || !patientName || !patientPhone || !age || !gender) {
        console.log('Validation failed - missing fields');
        setBookingStatus({ message: 'Please complete all details before payment.', type: 'error' });
        setLoadingPayment(false);
        return;
      }
      
      // Load Razorpay SDK early in the user gesture chain
      console.log('About to load Razorpay...');
      await loadRazorpay();
      console.log('Razorpay loaded successfully');

      const order = await createPaymentOrder({
        date: selectedDate ? selectedDate.toISOString().slice(0,10) : '',
        time: selectedTime,
        patientName,
        patientPhone,
        age: parseInt(age, 10),
        gender,
        consultType: 'online',
      });

      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Windows Phone/i.test(navigator.userAgent);

      const publicKey = import.meta.env.VITE_RAZORPAY_KEY_ID || '';
      if (!publicKey) {
        console.error('Razorpay key missing. Set VITE_RAZORPAY_KEY_ID in frontend environment (Vercel).');
        setBookingStatus({ message: 'Payment configuration error. Please try again later.', type: 'error' });
        return;
      }

      const options = {
        key: publicKey,
        amount: order.amount,
        currency: order.currency,
        name: 'Dr K Madhusudana Clinic',
        description: 'Online Consultation',
        order_id: order.id,
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true
        },
        prefill: {
          name: patientName,
          contact: patientPhone,
          email: 'patient@example.com', // optional but improves Checkout defaults
        },
        theme: { color: '#0a63ff' },
        // Encourage UPI (including QR) to show prominently
        config: {
          display: {
            // Define a dedicated UPI block and put it first
            blocks: {
              upi: {
                name: 'UPI / QR',
                instruments: [
                  {
                    method: 'upi'
                  }
                ]
              }
            },
            sequence: ['block.upi', 'block.card', 'block.netbanking', 'block.wallet'],
            preferences: { show_default_blocks: true }
          },
          // Use intent on mobile (opens GPay/PhonePe), collect on desktop (VPA + QR)
          upi: { flow: isMobile ? 'intent' : 'collect' }
        },
        handler: async function (response) {
          try {
            const verifyRes = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setBookingStatus({ message: verifyRes.message, type: 'success' });
            setBookingConfirmedData(verifyRes.appointment);
          } catch (err) {
            setBookingStatus({ message: err.message || 'Payment verification failed', type: 'error' });
          }
        },
        modal: {
          ondismiss: () => {
            setBookingStatus({ message: 'Payment cancelled.', type: 'info' });
          }
        }
      };

      const rzp = new window.Razorpay(options);
      // Attach failure listener for better diagnostics (especially on production)
      rzp.on('payment.failed', function (resp) {
        console.error('Razorpay payment.failed:', resp?.error || resp);
        setBookingStatus({
          message: resp?.error?.description || 'Payment failed. Please try another method or card.',
          type: 'error',
        });
      });

      try {
        rzp.open();
      } catch (openErr) {
        console.error('Failed to open Razorpay Checkout:', openErr);
        setBookingStatus({ message: 'Could not open payment window. Please check your browser settings and try again.', type: 'error' });
      }
    } catch (err) {
      console.error('Online payment error:', err);
      setBookingStatus({ message: err.message || 'Failed to initiate payment', type: 'error' });
    } finally {
      setLoadingPayment(false);
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

            {/* Step 0: Consulting type selection */}
            {!bookingConfirmedData && step === 0 && (
              <div className="consult-type-step">
                <h4>Choose Consulting Type</h4>
                <div className="consult-type-radio-group">
                  <label className={`consult-type-radio${consultType === 'online' ? ' selected' : ''}`}>
                    <input
                      type="radio"
                      name="consultType"
                      value="online"
                      checked={consultType === 'online'}
                      onChange={() => setConsultType('online')}
                    />
                    <span className="custom-radio"></span>
                    Online Consulting
                  </label>
                  <label className={`consult-type-radio${consultType === 'offline' ? ' selected' : ''}`}>
                    <input
                      type="radio"
                      name="consultType"
                      value="offline"
                      checked={consultType === 'offline'}
                      onChange={() => setConsultType('offline')}
                    />
                    <span className="custom-radio"></span>
                    Offline Consulting
                  </label>
                </div>
                <motion.button
                  className="consult-type-next"
                  onClick={() => consultType && setStep(1)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={!consultType}
                  style={{ marginTop: '24px', width: '100%' }}
                >
                  Next
                </motion.button>
              </div>
            )}

            {/* Step 1: Show consult mode, then calendar */}
            {!bookingConfirmedData && step === 1 && (
              <div className="consult-mode-step">
                <h4>{consultType === 'online' ? 'Video Consult' : 'In Clinic Consulting'}</h4>
                <div className="date-picker-container">
                  <label>Select Date:</label>
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date) => { handleDateChange(date); setStep(2); }}
                    minDate={new Date()}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Click to select a date"
                    inline
                  />
                </div>
              </div>
            )}

            {/* Step 2: Show available slots */}
            {!bookingConfirmedData && step === 2 && (
              <div className="slots-step">
                <label>
                  Available Time Slots for {selectedDate?.toLocaleDateString() || 'selected date'}:
                </label>
                {loadingSlots ? (
                  <LoadingSpinner />
                ) : availableSlots.length > 0 ? (
                  <div className="time-slots-grouped">
                    {(() => {
                      const sorted = [...availableSlots].sort();
                      const morningSlots = sorted.filter(t => t < '12:00');
                      const afternoonSlots = sorted.filter(t => t >= '12:00' && t < '18:00');
                      const eveningSlots = sorted.filter(t => t >= '18:00');
                      return (
                        <>
                          {morningSlots.length > 0 && (
                            <div className="slot-section">
                              <h5 className="slot-section-title">Morning</h5>
                              <div className="time-slots-container">
                                {morningSlots.map((time) => (
                                  <motion.button
                                    key={`m-${time}`}
                                    className={`time-slot-button ${selectedTime === time ? 'selected' : ''}`}
                                    onClick={() => { handleTimeSelect(time); setStep(3); }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    disabled={submittingBooking}
                                  >
                                    {time}
                                  </motion.button>
                                ))}
                              </div>
                            </div>
                          )}
                          {afternoonSlots.length > 0 && (
                            <div className="slot-section">
                              <h5 className="slot-section-title">Afternoon</h5>
                              <div className="time-slots-container">
                                {afternoonSlots.map((time) => (
                                  <motion.button
                                    key={`a-${time}`}
                                    className={`time-slot-button ${selectedTime === time ? 'selected' : ''}`}
                                    onClick={() => { handleTimeSelect(time); setStep(3); }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    disabled={submittingBooking}
                                  >
                                    {time}
                                  </motion.button>
                                ))}
                              </div>
                            </div>
                          )}
                          {eveningSlots.length > 0 && (
                            <div className="slot-section">
                              <h5 className="slot-section-title">Evening</h5>
                              <div className="time-slots-container">
                                {eveningSlots.map((time) => (
                                  <motion.button
                                    key={`e-${time}`}
                                    className={`time-slot-button ${selectedTime === time ? 'selected' : ''}`}
                                    onClick={() => { handleTimeSelect(time); setStep(3); }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    disabled={submittingBooking}
                                  >
                                    {time}
                                  </motion.button>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <p className="no-slots-message">
                    {selectedDate
                      ? bookingStatus.message ||
                        'No slots available for this date. Please choose another date.'
                      : 'Please select a date to see available slots.'}
                  </p>
                )}
              </div>
            )}

            {/* Step 3: Mandatory details */}
            {!bookingConfirmedData && step === 3 && (
              <form onSubmit={(e) => { 
                e.preventDefault(); 
                // Validate required fields before proceeding
                if (!patientName || !patientPhone || !age || !gender) {
                  setBookingStatus({
                    message: 'Please fill in all required fields.',
                    type: 'error',
                  });
                  return;
                }
                // Clear any previous errors
                setBookingStatus({ message: '', type: '' });
                // Proceed to next step
                setStep(consultType === 'online' ? 4 : 5); 
              }} className="appointment-form">
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
                <div>
                  <label htmlFor="age">Age:</label>
                  <input
                    type="number"
                    id="age"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    required
                    min={0}
                    max={120}
                    disabled={submittingBooking}
                  />
                </div>
                <div className="gender-radio-group">
                  <label>Gender:</label>
                  <label className={`gender-radio${gender === 'male' ? ' selected' : ''}`}>
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={gender === 'male'}
                      onChange={() => setGender('male')}
                      disabled={submittingBooking}
                    />
                    <span className="custom-radio"></span>
                    Male
                  </label>
                  <label className={`gender-radio${gender === 'female' ? ' selected' : ''}`}>
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      checked={gender === 'female'}
                      onChange={() => setGender('female')}
                      disabled={submittingBooking}
                    />
                    <span className="custom-radio"></span>
                    Female
                  </label>
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
                    disabled={submittingBooking}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Next
                  </motion.button>
                </div>
              </form>
            )}

            {/* Step 4: Razorpay Payment for online consultation only */}
            {!bookingConfirmedData && step === 4 && consultType === 'online' && (
              <div className="payment-step">
                <h4>Online Payment</h4>
                <p>Pay the consultation fee securely via Razorpay to confirm your online booking.</p>
                <div className="payment-info">
                  <div className="fee-display">
                    <span className="fee-amount">₹1</span>
                    <span className="fee-label">Consultation Fee (Trial Mode)</span>
                  </div>
                  <p style={{ marginTop: '12px', fontSize: '0.9rem', color: '#718096' }}>
                    Secure payment powered by Razorpay
                  </p>
                  <div style={{ marginTop: '8px' }}>
                    {!razorpayKeyPresent && (
                      <p className="modal-message error">Payment is not configured for this site. Missing Razorpay public key.</p>
                    )}
                    {razorpayLoadError && (
                      <p className="modal-message error">{razorpayLoadError}</p>
                    )}
                    {razorpayKeyPresent && !razorpayLoadError && (
                      <p className="modal-message info">Razorpay is ready.</p>
                    )}
                  </div>
                </div>
                <motion.button
                  onClick={handleOnlinePayment}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={loadingPayment || !razorpayKeyPresent || !razorpayReady}
                  className="razorpay-pay-btn"
                >
                  {loadingPayment ? 'Processing...' : (!razorpayKeyPresent ? 'Payment Not Configured' : (!razorpayReady ? 'Loading Payment…' : 'Pay & Confirm Booking'))}
                </motion.button>
                {/* Test-mode skip removed for production safety */}
              </div>
            )}

            {/* Step 5: Final booking confirmation (offline or online) */}
            {!bookingConfirmedData && step === 5 && (
              <form onSubmit={(e) => {
                console.log('Form submission triggered!');
                handleSubmitBooking(e);
              }} className="appointment-form">
                <h4>Confirm Booking</h4>
                <div>
                  <label>Date:</label>
                  <span>{selectedDate?.toLocaleDateString()}</span>
                </div>
                <div>
                  <label>Time:</label>
                  <span>{selectedTime}</span>
                </div>
                <div>
                  <label>Name:</label>
                  <span>{patientName}</span>
                </div>
                <div>
                  <label>Phone:</label>
                  <span>{patientPhone}</span>
                </div>
                <div>
                  <label>Age:</label>
                  <span>{age}</span>
                </div>
                <div>
                  <label>Gender:</label>
                  <span>{gender}</span>
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
                    disabled={submittingBooking}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {submittingBooking ? 'Booking...' : 'Confirm Booking'}
                  </motion.button>
                </div>
              </form>
            )}

            {/* Conditional Rendering: Show Confirmation View or Booking Form */}
            {bookingConfirmedData && (
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
                  <strong>Booking ID:</strong>{' '}
                  <span>{bookingConfirmedData.bookingId}</span>
                </p>
                <p className="confirmation-detail-item">
                  <strong>Doctor:</strong> <span>Dr K Madhusudana</span>
                </p>
                <p className="confirmation-detail-item">
                  <strong>Date:</strong>{' '}
                  <span>{new Date(bookingConfirmedData.date).toLocaleDateString()}</span>
                  {/* Convert date string back to Date object for display */}
                </p>
                <p className="confirmation-detail-item">
                  <strong>Time:</strong> <span>{bookingConfirmedData.time}</span>
                </p>
                <p className="confirmation-detail-item">
                  <strong>Patient Name:</strong>{' '}
                  <span>{bookingConfirmedData.patientName}</span>
                </p>
                <p className="confirmation-detail-item">
                  <strong>Phone:</strong> <span>{bookingConfirmedData.patientPhone}</span>
                </p>

                {bookingConfirmedData.consultType === 'online' && (
                  <div className="video-call-info">
                    <p className="video-call-notice">
                      <i className="fas fa-video"></i> This is an <strong>Online Consultation</strong>
                    </p>
                    <p className="video-call-instruction">
                      The "Join Video Call" button will become active <strong>5 minutes before</strong> your appointment time.
                      Please join on time for your consultation with Dr K Madhusudana.
                    </p>
                    <div className="video-call-link">
                      <strong>Meeting Room ID:</strong> <span>DrMadhusudhan-{bookingConfirmedData.bookingId}</span>
                    </div>
                  </div>
                )}

                <p className="confirmation-note">
                  Please keep this information for your reference. An email confirmation with these
                  details has also been sent.
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
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BookingModal;