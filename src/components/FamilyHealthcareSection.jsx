// src/components/FamilyHealthcareSection.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import '../styles/FamilyHealthcareSection.css';

const leftFeatures = [
  {
    title: 'Family-Friendly Environment',
    description:
      'Our clinic is designed to make patients of all ages feel comfortable and welcome during their visit.',
    icon: 'fa-solid fa-people-roof',
  },
  {
    title: 'Comprehensive Care',
    description:
      'We provide complete healthcare services for the entire family, from infants to elderly patients.',
    icon: 'fa-solid fa-hands-holding-circle',
  },
  {
    title: 'Preventive Focus',
    description:
      'Early health screening and preventive care to maintain optimal health for all family members.',
    icon: 'fa-solid fa-shield-heart',
  },
  {
    title: 'Health Education',
    description:
      'Interactive health education to help families understand and maintain their wellness journey.',
    icon: 'fa-solid fa-graduation-cap',
  },
];

const approachItems = [
  {
    title: "Patient Psychology",
    description:
      'Dr. Madhusudhan has specialized training in managing patient behavior and anxiety during consultations.',
    icon: 'fa-solid fa-face-smile-beam',
  },
  {
    title: 'Specialized Treatments',
    description:
      'From early interventions to special needs dentistry, complete family healthcare solutions are offered.',
    icon: 'fa-solid fa-stethoscope',
  },
  {
    title: 'Growth Monitoring',
    description:
      'Regular monitoring of development to detect concerns early and address issues promptly.',
    icon: 'fa-solid fa-chart-line',
  },
];

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const FamilyHealthcareSection = ({ onBookAppointmentClick }) => {
  const [ref, controls] = useScrollAnimation(0.15);

  return (
    <section className="family-section" id="family-healthcare">
      <div className="family-container">
        {/* Header spans full width */}
        <motion.div
          className="family-header"
          ref={ref}
          initial="hidden"
          animate={controls}
          variants={container}
        >
          <motion.h2 className="family-title" variants={fadeUp}>
            Family Healthcare
            <br />
            <span>With Dr. K Madhusudana</span>
          </motion.h2>

          <motion.p className="family-degree" variants={fadeUp}>
            MBBS, MD (General Medicine)
          </motion.p>

          <motion.p className="family-intro" variants={fadeUp}>
            We understand that healthcare needs vary across different life stages. Our comprehensive
            family healthcare under Dr. K Madhusudana is specially designed to provide personalized
            medical care for patients of all ages, ensuring optimal health and wellness for your
            entire family.
          </motion.p>
        </motion.div>

        {/* Features align with right card */}
        <motion.div
          className="family-features"
          initial="hidden"
          animate={controls}
          variants={container}
        >
          {leftFeatures.map((f, i) => (
            <motion.div className="family-feature" key={i} variants={fadeUp}>
              <div className="chip">
                <i className={f.icon} aria-hidden="true"></i>
              </div>
              <div className="feature-text">
                <h4>{f.title}</h4>
                <p>{f.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.button
          className="family-cta"
          variants={fadeUp}
          animate={controls}
          onClick={onBookAppointmentClick}
        >
          Book Family Care Appointment
        </motion.button>

        {/* Right: Approach card */}
        <motion.div
          className="family-right"
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <div className="approach-card">
            <h3>Dr. Madhusudana's Approach</h3>
            <div className="approach-list">
              {approachItems.map((a, i) => (
                <div className="approach-item" key={i}>
                  <div className="chip soft">
                    <i className={a.icon} aria-hidden="true"></i>
                  </div>
                  <div className="approach-text">
                    <h5>{a.title}</h5>
                    <p>{a.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FamilyHealthcareSection;
