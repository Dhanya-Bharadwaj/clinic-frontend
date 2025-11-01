// src/components/ContactSection.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import '../styles/ContactSection.css';

const ContactSection = ({ onBookAppointmentClick }) => {
  const [ref, controls] = useScrollAnimation(0.15);

  const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  };

  return (
    <section className="contact-section" id="contact">
      <div className="contact-container">
        <motion.div className="contact-header" ref={ref} initial="hidden" animate={controls} variants={fadeUp}>
          <p className="eyebrow">Get in touch</p>
          <h2 className="title">Contact Us</h2>
          <p className="subtitle">Have questions or ready to schedule an appointment? Get in touch with our friendly team.</p>
        </motion.div>

        <div className="contact-grid">
          <motion.div className="info-card" initial="hidden" animate={controls} variants={fadeUp}>
            <h3>Clinic Information</h3>

            <div className="info-row">
              <div className="chip"><i className="fa-solid fa-location-dot" /></div>
              <div>
                <h4>Address</h4>
                <p>125, 4th Cross Rd,<br/>
                  New Bank Colony, Bank Colony,<br/>
                  Konanakunte, Bengaluru,<br/>
                  Karnataka 560078
                </p>
              </div>
            </div>

            <div className="info-row">
              <div className="chip"><i className="fa-solid fa-phone" /></div>
              <div>
                <h4>Phone</h4>
                <a href="tel:+918431609250">+91 84316 09250</a>
              </div>
            </div>

            

            <div className="info-row">
              <div className="chip"><i className="fa-solid fa-clock" /></div>
              <div>
                <h4>Hours</h4>
                <p>
                  Tuesday to Saturday<br/>
                  Morning: 10:00 AM - 2:00 PM<br/>
                  Afternoon: 3:00 PM - 6:00 PM
                </p>
              </div>
            </div>

            <motion.button
              type="button"
              className="contact-cta"
              onClick={onBookAppointmentClick}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Book Consultation
            </motion.button>
          </motion.div>

          <motion.div className="map-card" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="map-toolbar">
              <a
                className="open-maps-link"
                href="https://www.google.com/maps?q=Balakrishna+Clinic,+Konanakunte,+Bengaluru+560078&hl=en"
                target="_blank"
                rel="noreferrer"
              >
                <i className="fa-solid fa-up-right-from-square" />
                Open in Google Maps
              </a>
            </div>
            <iframe
              title="Clinic Location"
              src="https://maps.google.com/maps?q=Balakrishna%20Clinic%20Konanakunte%20Bengaluru%20560078&t=&z=15&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;