// src/components/AboutSection.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { useCountUp } from '../hooks/useCountUp';
import '../styles/AboutSection.css';

const StatItem = ({ value, label, duration, formatter }) => {
  // Supports custom formatter to render suffixes while animating
  const ref = useCountUp(value, duration, true, 0.2, formatter);
  return (
    <div className="stat-item">
      <h3 ref={ref}>0</h3>
      <p>{label}</p>
    </div>
  );
};

const AboutSection = () => {
  const [ref, controls] = useScrollAnimation(0.2);

  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
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
        <div className="about-section-text">
          <h2 className="about-title">Meet Dr. K Madhusudana</h2>
          <p className="intro-paragraph">
            Dr. K Madhusudana is a distinguished general physician with over 25 years of experience in providing comprehensive healthcare services. Specializing in diabetes management, hypertension treatment, and preventive medicine, he brings expertise, compassion, and evidence-based care to every patient consultation.
          </p>
          <p className="details-paragraph">
            Known for his patient-centered approach and thorough diagnostic skills, Dr. Madhusudana creates a comfortable environment where patients feel confident discussing their health concerns. He believes in building long-term relationships with his patients, focusing on preventive care, lifestyle modifications, and personalized treatment plans for optimal health outcomes.
          </p>
          <div className="about-stats">
            <StatItem value={25} label="Years Experience" duration={2} />
            <StatItem value={4} label="Happy Patients" duration={2.2} formatter={(v, rounded) => `${rounded}L+`} />
            <StatItem value={98} label="Satisfaction" duration={3} />
          </div>
          <blockquote className="doctor-quote">
            "My commitment is to provide comprehensive healthcare that not only treats illness but also promotes wellness through preventive care and patient education for a healthier community."
          </blockquote>
        </div>
      </div>
    </motion.section>
  );
};

export default AboutSection;