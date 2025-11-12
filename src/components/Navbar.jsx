// src/components/Navbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import AdminButton from './AdminButton';
import '../styles/Navbar.css';

const Navbar = ({ onBookAppointmentClick, onAdminAccess, onCheckAppointments, onOpenPrescriptions }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <motion.nav
      className="navbar"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
    >
      <div className="navbar-left">
        <AdminButton onAdminAccess={onAdminAccess} />
        <a href="/" className="navbar-brand gradient-text">
          Dr. K. Madhusudana
        </a>
      </div>
      <div className="navbar-right">
        {/* Desktop: show User button and Prescription only when NOT mobile */}
        {!isMobile && (
          <>
            <motion.button
              className="navbar-user-button navbar-button btn btn-ghost desktop-only"
              onClick={onCheckAppointments}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              My Appointments
            </motion.button>

            <motion.button
              className="navbar-prescription-button navbar-button btn btn-outline desktop-only"
              onClick={onOpenPrescriptions}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Prescription
            </motion.button>
          </>
        )}

        <motion.button
          className="navbar-button btn btn-gradient book-btn"
          onClick={onBookAppointmentClick}
          whileHover={{ scale: 1.05, boxShadow: '0 6px 15px rgba(0, 123, 255, 0.4)' }}
          whileTap={{ scale: 0.95 }}
        >
          Book an Appointment
        </motion.button>

        {/* Mobile: hamburger menu - visible only on small screens via CSS */}
        <div className="mobile-menu-wrapper mobile-only" ref={menuRef}>
          <button
            className={`hamburger ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <span className="hamburger-dot" />
            <span className="hamburger-dot" />
            <span className="hamburger-dot" />
          </button>

          {menuOpen && (
            <div className="nav-dropdown mobile-only" role="menu">
              <button className="dropdown-item btn btn-ghost" onClick={() => { setMenuOpen(false); onBookAppointmentClick(); }}>Book Appointment</button>
              <button className="dropdown-item btn btn-ghost" onClick={() => { setMenuOpen(false); onOpenPrescriptions(); }}>Prescription</button>
            </div>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;