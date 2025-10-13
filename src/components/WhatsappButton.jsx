// src/components/WhatsappButton.jsx
import React from 'react';
import { RiWhatsappLine } from 'react-icons/ri';
import '../styles/WhatsappButton.css';

const WhatsappButton = ({ phone = '+918431609250' }) => {
  const handleClick = () => {
    // Use wa.me for direct chat; strip non-digits and ensure country code
    const digits = phone.replace(/\D/g, '');
    const withCountry = digits.startsWith('91') ? digits : `91${digits}`;
    const url = `https://wa.me/${withCountry}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="whatsapp-fab" onClick={handleClick} role="button" aria-label="Chat on WhatsApp" title="Chat on WhatsApp">
      <RiWhatsappLine className="whatsapp-icon" />
      <span className="whatsapp-tooltip">WhatsApp</span>
    </div>
  );
};

export default WhatsappButton;
