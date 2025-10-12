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
            name: 'Dr K Madhusudana',
            specialization: 'M.B.B.S | F.A.G.E',
            experience: 25,
            clinicName: 'Dr K Madhusudana Clinic',
            address: '4th cross road, New Bank Colony, Bank Colony,Konankunte, Bangalore - 560078',
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
          {/** Ensure single 'Dr' prefix and no duplication */}
          {(() => {
            // Always show the exact preferred display name
            const displayName = 'Dr madhusudhana';
            return (
              <>
                <img src={doctorInfo.photoUrl} alt={displayName} className="doctor-photo" />
                <h2>{displayName}</h2>
              </>
            );
          })()}
          <p>M.B.B.S | F.A.G.E</p>
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
            clinicName={'Dr madhusudhana Clinic'}
            address={'4th cross road, New Bank Colony, Bank Colony, Konankunte, Bangalore - 560078'}
          />
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;