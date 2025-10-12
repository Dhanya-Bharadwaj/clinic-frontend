// src/components/WhyChooseUsSection.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import '../styles/WhyChooseUsSection.css';

const features = [
  {
    title: 'Experienced Physician',
    description: 'Over 25 years of clinical expertise in general medicine and chronic disease management.',
    icon: 'fa-solid fa-user-doctor',
  },
  {
    title: 'Patient-Centered Care',
    description: 'A compassionate approach focused on listening to your concerns and building trust.',
    icon: 'fa-solid fa-users',
  },
  {
    title: 'Evidence-Based Medicine',
    description: 'Integrating the latest medical research and clinical guidelines for optimal outcomes.',
    icon: 'fa-solid fa-book-medical',
  },
  {
    title: 'Comprehensive Services',
    description: 'From preventive care and health checkups to managing complex health conditions.',
    icon: 'fa-solid fa-notes-medical',
  },
];

const WhyChooseUsSection = () => {
  const [ref, controls] = useScrollAnimation(0.2);

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  return (
    <section className="why-choose-us-section" id="why-us">
      <div className="why-choose-us-content">
        <h2 className="why-choose-us-title">Why Choose Dr. Madhusudana?</h2>
        <motion.div
          className="features-grid"
          ref={ref}
          initial="hidden"
          animate={controls}
          variants={containerVariants}
        >
          {features.map((feature, index) => (
            <motion.div className="feature-card" key={index} variants={itemVariants}>
              <div className="feature-icon">
                <i className={feature.icon}></i>
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default WhyChooseUsSection;