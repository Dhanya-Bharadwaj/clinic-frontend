export const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://clinic-backend-flame.vercel.app/api/bookings'  // Production URL
  : 'http://localhost:5001/api/bookings';                   // Local development URL

/**
 * A helper function to format a Date object into a 'YYYY-MM-DD' string
 * that respects the user's local timezone.
 * @param {Date} date - The date object to format.
 * @returns {string} The formatted date string.
 */
export const getLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // getMonth() is 0-indexed
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Fetches available slots for a given date from the backend.
 * @param {Date} date - The date to check for.
 * @returns {Promise<string[]>} A promise that resolves to an array of available time strings.
 */
export const getAvailableSlots = async (date) => {
  // Use the helper to get the correct local date string
  const dateString = getLocalDateString(date);
  console.log('Frontend: Fetching slots for date:', dateString);

  try {
    const url = `${API_BASE_URL}/slots?date=${dateString}`;
    console.log('Frontend: API URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    console.log('Frontend: Response status:', response.status);

    let responseText;
    try {
      responseText = await response.text(); // Get raw response text first
      console.log('Raw response:', responseText); // Debug log
      
      if (!response.ok) {
        let errorMessage = 'Failed to fetch available slots.';
        if (responseText) {
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            console.error('Error parsing error response:', e);
          }
        }
        throw new Error(`${errorMessage} (Status: ${response.status})`);
      }

      const data = JSON.parse(responseText);
      console.log('Parsed response data:', data); // Debug log
      return data.availableSlots || [];
      
    } catch (parseError) {
      console.error('Response parsing error:', parseError);
      console.error('Raw response was:', responseText);
      throw new Error(`Failed to parse server response: ${parseError.message}`);
    }
  } catch (error) {
    console.error('API Error (getAvailableSlots):', error);
    console.error('Full error details:', {
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};

/**
 * Books an appointment via the backend API.
 * @param {object} appointmentDetails - Details including date (Date object), time, patient name, etc.
 * @returns {Promise<object>} A promise that resolves to a confirmation object.
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
        // Use the helper to send the correct local date string to the backend
        date: getLocalDateString(appointmentDetails.date),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to book appointment.');
    }

    return data;
  } catch (error) {
    console.error('API Error (bookAppointment):', error);
    throw error;
  }
};

/**
 * Fetches general doctor information from the backend.
 * @returns {Promise<object>} A promise that resolves to the doctor's details object.
 */
export const getDoctorDetails = async () => {
  try {
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

/**
 * (Internal API for Demo) Marks an appointment as complete.
 * @param {string} appointmentId - The ID of the appointment.
 * @returns {Promise<object>} A promise that resolves to a success message.
 */
export const markAppointmentComplete = async (appointmentId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${appointmentId}/complete`, {
      method: 'PATCH',
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