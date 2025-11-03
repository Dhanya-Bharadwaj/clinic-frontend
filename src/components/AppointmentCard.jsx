// src/components/AppointmentCard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import '../styles/AppointmentCard.css';

// Accept clinicName, tagline and address as props
const AppointmentCard = ({ onBookAppointmentClick, clinicName, tagline, address, extraClass = '' }) => {
  return (
    <div className={`appointment-card ${extraClass}`}>
  <h3>{clinicName || 'Dr madhusudhana Clinic'}</h3> {/* Use prop or fallback */}
    {tagline ? (
      <p className="clinic-tagline" aria-label="clinic tagline">
        <span className="quote-mark">“</span>
        <span className="tagline-text">{tagline}</span>
        <span className="quote-mark">”</span>
      </p>
    ) : null}
    {address ? <p className="clinic-address">{address}</p> : null}
      <motion.button
        className="btn btn-gradient"
        onClick={onBookAppointmentClick}
        whileHover={{ scale: 1.05, boxShadow: '0 10px 24px rgba(37, 99, 235, 0.28)' }}
        whileTap={{ scale: 0.95 }}
      >
        Book an Appointment
      </motion.button>
    </div>
  );
};

export default AppointmentCard;