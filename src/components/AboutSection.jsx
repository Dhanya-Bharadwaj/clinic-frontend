// src/components/AboutSection.jsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import '../styles/AboutSection.css';
import { getDoctorDetails } from '../api/bookingApi'; // Import the new API call

const AboutSection = () => {
  const [ref, controls] = useScrollAnimation(0.2);
  const [doctorAbout, setDoctorAbout] = useState(null);

  useEffect(() => {
    const fetchDoctorAbout = async () => {
      try {
        const data = await getDoctorDetails();
        setDoctorAbout(data.about); // Assuming the 'about' field exists
      } catch (error) {
        console.error("Failed to fetch doctor about section details:", error);
        setDoctorAbout("Dr. Madhusudhan is a highly respected General Physician and Cardiologist with over 15 years of dedicated experience in providing comprehensive healthcare. He is committed to delivering patient-centered care, focusing on preventive health, accurate diagnosis, and effective treatment strategies. His compassionate approach and extensive medical knowledge make him a trusted healthcare provider in the community. He believes in empowering patients with knowledge about their health and working collaboratively to achieve optimal wellness outcomes, ensuring every patient feels heard and cared for.");
      }
    };
    fetchDoctorAbout();
  }, []);

  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  };

  return (
    <motion.section
      className="about-section"
      id="about"
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={sectionVariants}
    >
      <div className="about-section-content">
        <h2>About Dr. Madhusudhan</h2>
        <p className="intro-paragraph">
          {doctorAbout ? doctorAbout.split('. ')[0] + '.' : "Loading about section..."}
        </p>
        <p className="details-paragraph">
          {doctorAbout ? doctorAbout.split('. ').slice(1).join('. ') : ""}
        </p>

        <motion.ul
          className="about-features-grid"
          initial="hidden"
          animate={controls}
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.2,
                delayChildren: 0.3,
              },
            },
          }}
        >
          <motion.li variants={itemVariants}>
            <h4>Extensive Experience</h4>
            <p>15+ years in General Medicine and Cardiology, managing diverse and complex cases with precision and care.</p>
          </motion.li>
          <motion.li variants={itemVariants}>
            <h4>Personalized Treatment</h4>
            <p>Dedicated to understanding individual patient needs to provide tailored, effective treatment plans.</p>
          </motion.li>
          <motion.li variants={itemVariants}>
            <h4>Modern Diagnostics</h4>
            <p>Utilizing the latest diagnostic tools and evidence-based medicine for accurate and timely assessments.</p>
          </motion.li>
          <motion.li variants={itemVariants}>
            <h4>Preventive Focus</h4>
            <p>Emphasizing proactive health management and lifestyle advice to prevent future health issues.</p>
          </motion.li>
          <motion.li variants={itemVariants}>
            <h4>Compassionate Care</h4>
            <p>Building strong doctor-patient relationships based on empathy, trust, and clear communication.</p>
          </motion.li>
          <motion.li variants={itemVariants}>
            <h4>Continuous Learning</h4>
            <p>Staying updated with the latest advancements in medical science to offer the best care possible.</p>
          </motion.li>
        </motion.ul>
      </div>
    </motion.section>
  );
};

export default AboutSection;