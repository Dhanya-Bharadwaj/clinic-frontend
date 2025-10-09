// src/App.jsx
import React, { useState } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import AboutSection from './components/AboutSection';
import BookingModal from './components/BookingModal';
// No App.css needed if using component-specific CSS

function App() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const handleOpenBookingModal = () => {
    setIsBookingModalOpen(true);
  };

  const handleCloseBookingModal = () => {
    setIsBookingModalOpen(false);
  };

  return (
    <div className="app">
      <Navbar onBookAppointmentClick={handleOpenBookingModal} />
      <HeroSection onBookAppointmentClick={handleOpenBookingModal} />
      <AboutSection />

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={handleCloseBookingModal}
      />
    </div>
  );
}

export default App;