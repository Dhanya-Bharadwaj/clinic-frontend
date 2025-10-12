// src/components/AppointmentCard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import '../styles/AppointmentCard.css';

// Accept clinicName and address as props
const AppointmentCard = ({ onBookAppointmentClick, clinicName, address }) => {
  return (
    <div className="appointment-card">
  <h3>{clinicName || 'Dr madhusudhana Clinic'}</h3> {/* Use prop or fallback */}
    {address ? <p>{address}</p> : null}
      <motion.button
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