// src/components/ServicesSection.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import '../styles/ServicesSection.css';

const services = [
  {
    title: 'General Health Checkup',
    description: 'Comprehensive health assessments to monitor and maintain your overall well-being.',
    icon: 'fa-solid fa-stethoscope',
  },
  {
    title: 'Diabetes Management',
    description: 'Personalized care plans to manage blood sugar levels and prevent complications.',
    icon: 'fa-solid fa-heart-pulse',
  },
  {
    title: 'Hypertension Care',
    description: 'Effective strategies to control high blood pressure and reduce cardiovascular risk.',
    icon: 'fa-solid fa-user-doctor',
  },
  {
    title: 'Preventive Medicine',
    description: 'Proactive healthcare focused on disease prevention and promoting a healthy lifestyle.',
    icon: 'fa-solid fa-shield-virus',
  },
  {
    title: 'Fever & Infections',
    description: 'Diagnosis and treatment for a wide range of infectious diseases and fevers.',
    icon: 'fa-solid fa-bacterium',
  },
  {
    title: 'Chronic Disease Management',
    description: 'Ongoing support and treatment for long-term health conditions.',
    icon: 'fa-solid fa-kit-medical',
  },
];

const ServicesSection = () => {
  const [ref, controls] = useScrollAnimation(0.1);

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  };

  return (
    <section className="services-section" id="services">
      <div className="services-section-content">
        <h2 className="services-title">Our Services</h2>
        <motion.div
          className="services-grid"
          ref={ref}
          initial="hidden"
          animate={controls}
          variants={containerVariants}
        >
          {services.map((service, index) => (
            <motion.div className="service-card" key={index} variants={itemVariants}>
              <div className="service-icon">
                <i className={service.icon}></i>
              </div>
              <h3 className="service-card-title">{service.title}</h3>
              <p className="service-card-description">{service.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ServicesSection;