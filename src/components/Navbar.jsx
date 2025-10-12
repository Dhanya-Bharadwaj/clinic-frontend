// src/components/Navbar.jsx
import React from 'react';
import { motion } from 'framer-motion';
import AdminButton from './AdminButton';
import '../styles/Navbar.css';

const Navbar = ({ onBookAppointmentClick, onAdminAccess }) => {
  return (
    <motion.nav
      className="navbar"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
    >
      <div className="navbar-left">
        <AdminButton onAdminAccess={onAdminAccess} />
        <a href="/" className="navbar-brand">
          Dr Madhusudhan
        </a>
      </div>
      <motion.button
        className="navbar-button"
        onClick={onBookAppointmentClick}
        whileHover={{ scale: 1.05, boxShadow: '0 6px 15px rgba(0, 123, 255, 0.4)' }}
        whileTap={{ scale: 0.95 }}
      >
        Book an Appointment
      </motion.button>
    </motion.nav>
  );
};

export default Navbar;