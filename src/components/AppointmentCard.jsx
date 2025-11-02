// src/components/AppointmentCard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import '../styles/AppointmentCard.css';

// Accept clinicName, tagline and address as props
const AppointmentCard = ({ onBookAppointmentClick, clinicName, tagline, address }) => {
  return (
    <div className="appointment-card">
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
        className="btn btn-primary"
        onClick={onBookAppointmentClick}
        whileHover={{ scale: 1.05, boxShadow: '0 6px 15px rgba(0, 123, 255, 0.4)' }}
        whileTap={{ scale: 0.95 }}
      >
        Book an Appointment
      </motion.button>
    </div>
  );
};

export default AppointmentCard;