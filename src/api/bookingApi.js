// src/api/bookingApi.js - Complete & Corrected for Vercel Backend

// IMPORTANT: Replace with your actual Vercel backend URL!
const API_BASE_URL = 'https://clinic-backend-7gaj.vercel.app/api/bookings';

/**
 * Fetches available slots for a given date from the backend.
 * @param {Date} date - The date to check for.
 * @returns {Promise<string[]>} A promise that resolves to an array of available time strings (e.g., "09:00").
 */
export const getAvailableSlots = async (date) => {
  // Frontend Date object needs to be converted to 'YYYY-MM-DD' string for the backend.
  const dateString = date.toISOString().split('T')[0];

  try {
    const response = await fetch(`${API_BASE_URL}/slots?date=${dateString}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch available slots.');
    }
    const data = await response.json();
    return data.availableSlots;
  } catch (error) {
    console.error('API Error (getAvailableSlots):', error);
    // Re-throw the error so the calling component can handle it (e.g., display an error message)
    throw error;
  }
};

/**
 * Books an appointment via the backend API.
 * @param {object} appointmentDetails - Details including date (Date object), time, patient name, email, phone.
 * @returns {Promise<object>} A promise that resolves to a confirmation object or rejects on failure.
 */
export const bookAppointment = async (appointmentDetails) => {
  try {
    const response = await fetch(`${API_BASE_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...appointmentDetails,
        // Convert the Date object to an ISO string for consistent parsing on the backend
        date: appointmentDetails.date.toISOString(),
      }),
    });

    const data = await response.json(); // Always parse response, even if !ok, to get error message

    if (!response.ok) {
      throw new Error(data.message || 'Failed to book appointment.');
    }

    return data; // This should contain { message: "...", appointment: {...} }
  } catch (error) {
    console.error('API Error (bookAppointment):', error);
    throw error;
  }
};

/**
 * (Doctor's Internal API - for demonstration purposes)
 * Marks an appointment as complete. This would typically be called from a separate,
 * authenticated doctor-facing admin interface, not directly from this public frontend.
 * @param {string} appointmentId - The unique ID of the appointment to mark complete.
 * @returns {Promise<object>} A promise that resolves to a success message or rejects on failure.
 */
export const markAppointmentComplete = async (appointmentId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${appointmentId}/complete`, {
      method: 'PATCH', // Using PATCH for partial update (status change)
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to mark appointment as complete.');
    }

    return data;
  } catch (error) {
    console.error('API Error (markAppointmentComplete):', error);
    throw error;
  }
};

/**
 * Fetches general doctor information from the backend.
 * Used for populating sections like HeroSection and AboutSection dynamically.
 * @returns {Promise<object>} A promise that resolves to the doctor's details object.
 */
export const getDoctorDetails = async () => {
  try {
    // This route needs to be '/doctor' as defined in your backend bookingRoutes.js
    const response = await fetch(`${API_BASE_URL}/doctor`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch doctor details.');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Error (getDoctorDetails):', error);
    throw error;
  }
};