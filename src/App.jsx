// src/App.jsx
import React, { useState } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import AboutSection from './components/AboutSection';
import BookingModal from './components/BookingModal';
import CheckAppointmentModal from './components/CheckAppointmentModal';
import ViewPrescriptionModal from './components/ViewPrescriptionModal';
import AdminButton from './components/AdminButton';
import DoctorDashboard from './components/DoctorDashboard';
import ServicesSection from './components/ServicesSection'; // Importing ServicesSection component
import WhyChooseUsSection from './components/WhyChooseUsSection'; // Importing WhyChooseUsSection component
import FamilyHealthcareSection from './components/FamilyHealthcareSection';
import HappyClientsSection from './components/HappyClientsSection';
import ContactSection from './components/ContactSection';
import WhatsappButton from './components/WhatsappButton';
// No App.css needed if using component-specific CSS

function App() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isCheckAppointmentModalOpen, setIsCheckAppointmentModalOpen] = useState(false);
  const [isViewPrescriptionOpen, setIsViewPrescriptionOpen] = useState(false);
  const [isDashboardVisible, setIsDashboardVisible] = useState(false);

  const handleOpenBookingModal = () => {
    setIsBookingModalOpen(true);
  };

  const handleCloseBookingModal = () => {
    setIsBookingModalOpen(false);
  };

  const handleOpenCheckAppointments = () => {
    setIsCheckAppointmentModalOpen(true);
  };

  const handleCloseCheckAppointments = () => {
    setIsCheckAppointmentModalOpen(false);
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
            onCheckAppointments={handleOpenCheckAppointments}
            onOpenPrescriptions={() => setIsViewPrescriptionOpen(true)}
          />
          <HeroSection onBookAppointmentClick={handleOpenBookingModal} />
          <AboutSection />
          <ServicesSection /> {/* Adding ServicesSection to the main App component */}
          <WhyChooseUsSection /> {/* Adding WhyChooseUsSection to the main App component */}
          <FamilyHealthcareSection onBookAppointmentClick={handleOpenBookingModal} />
          <HappyClientsSection isAdmin={isDashboardVisible} />
          <ContactSection onBookAppointmentClick={handleOpenBookingModal} />
          <WhatsappButton phone="+918431609250" />
        </>
      )}
      
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={handleCloseBookingModal}
      />
      
      <CheckAppointmentModal
        isOpen={isCheckAppointmentModalOpen}
        onClose={handleCloseCheckAppointments}
      />
      <ViewPrescriptionModal
        isOpen={isViewPrescriptionOpen}
        onClose={() => setIsViewPrescriptionOpen(false)}
      />
    </div>
  );
}

export default App;