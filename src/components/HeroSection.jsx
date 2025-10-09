// src/components/HeroSection.jsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import AppointmentCard from './AppointmentCard';
import '../styles/HeroSection.css';
import { getDoctorDetails } from '../api/bookingApi'; // Import the new API call

const HeroSection = ({ onBookAppointmentClick }) => {
  const [doctorInfo, setDoctorInfo] = useState(null);

  useEffect(() => {
    const fetchDoctorInfo = async () => {
      try {
        const data = await getDoctorDetails();
        setDoctorInfo(data);
      } catch (error) {
        console.error("Failed to fetch doctor details for Hero section:", error);
        // Fallback to static or show error
        setDoctorInfo({
            name: 'Dr Madhusudhan',
            specialization: 'General Physician | Cardiologist',
            experience: 15,
            clinicName: 'Dr. Madhusudhan Clinic',
            address: '123 Healthway, Wellness City, State 45678',
            photoUrl: '/doctor-photo.jpg' // Use public path for local image
        });
      }
    };
    fetchDoctorInfo();
  }, []);


  const doctorInfoVariants = {
    hidden: { x: -100, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: 0.8, ease: 'easeOut' } },
  };

  const appointmentCardVariants = {
    hidden: { x: 100, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: 0.8, ease: 'easeOut', delay: 0.2 } },
  };

  if (!doctorInfo) {
    return (
        <section className="hero-section">
            <div className="hero-background"></div>
            <div className="hero-overlay"></div>
            <div className="hero-content">
                <p style={{ color: 'white' }}>Loading doctor information...</p>
            </div>
        </section>
    );
  }

  return (
    <section className="hero-section">
      <div className="hero-background"></div>
      <div className="hero-overlay"></div>
      <div className="hero-content">
        <motion.div
          className="doctor-info"
          initial="hidden"
          animate="visible"
          variants={doctorInfoVariants}
        >
          <img src={doctorInfo.photoUrl} alt={`Dr. ${doctorInfo.name}`} className="doctor-photo" />
          <h2>Dr. {doctorInfo.name}</h2>
          <p>{doctorInfo.specialization}</p>
          <p>Over {doctorInfo.experience} years of experience in patient care.</p>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={appointmentCardVariants}
        >
          {/* Pass clinicName and address from fetched doctorInfo */}
          <AppointmentCard
            onBookAppointmentClick={onBookAppointmentClick}
            clinicName={doctorInfo.clinicName}
            address={doctorInfo.address}
          />
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;