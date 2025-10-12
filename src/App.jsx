// src/App.jsx
import React, { useState } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import AboutSection from './components/AboutSection';
import BookingModal from './components/BookingModal';
import AdminButton from './components/AdminButton';
import DoctorDashboard from './components/DoctorDashboard';
import ServicesSection from './components/ServicesSection'; // Importing ServicesSection component
import WhyChooseUsSection from './components/WhyChooseUsSection'; // Importing WhyChooseUsSection component
import FamilyHealthcareSection from './components/FamilyHealthcareSection';
import ContactSection from './components/ContactSection';
import WhatsappButton from './components/WhatsappButton';
// No App.css needed if using component-specific CSS

function App() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isDashboardVisible, setIsDashboardVisible] = useState(false);

  const handleOpenBookingModal = () => {
    setIsBookingModalOpen(true);
  };

  const handleCloseBookingModal = () => {
    setIsBookingModalOpen(false);
  };

  return (
    <div className="app">
      {isDashboardVisible ? (
        <DoctorDashboard onClose={() => setIsDashboardVisible(false)} />
      ) : (
        <>
          <Navbar 
            onBookAppointmentClick={handleOpenBookingModal}
            onAdminAccess={() => setIsDashboardVisible(true)}
          />
          <HeroSection onBookAppointmentClick={handleOpenBookingModal} />
          <AboutSection />
          <ServicesSection /> {/* Adding ServicesSection to the main App component */}
          <WhyChooseUsSection /> {/* Adding WhyChooseUsSection to the main App component */}
          <FamilyHealthcareSection onBookAppointmentClick={handleOpenBookingModal} />
          <ContactSection onBookAppointmentClick={handleOpenBookingModal} />
          <WhatsappButton phone="+919448883063" />
        </>
      )}
      
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={handleCloseBookingModal}
      />
    </div>
  );
}

export default App;