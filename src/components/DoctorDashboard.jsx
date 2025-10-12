// src/components/DoctorDashboard.jsx
import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { getLocalDateString, API_BASE_URL } from '../api/bookingApi';
import LoadingSpinner from './LoadingSpinner';
import "react-datepicker/dist/react-datepicker.css";
import '../styles/DoctorDashboard.css';

const DoctorDashboard = ({ onClose }) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(tomorrow);

    // Load saved filters from localStorage when component mounts
    useEffect(() => {
        const savedFilters = localStorage.getItem('doctorDashboardFilters');
        if (savedFilters) {
            const { status, start, end } = JSON.parse(savedFilters);
            setStatusFilter(status || 'all');
            setStartDate(start ? new Date(start) : today);
            setEndDate(end ? new Date(end) : tomorrow);
        }
    }, []);

    // Save filters to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('doctorDashboardFilters', JSON.stringify({
            status: statusFilter,
            start: startDate?.toISOString(),
            end: endDate?.toISOString()
        }));
    }, [statusFilter, startDate, endDate]);

    // Fetch appointments whenever filters change
    useEffect(() => {
        const controller = new AbortController();
        fetchAppointments(controller.signal);
        return () => controller.abort(); // Cleanup on unmount or when dependencies change
    }, [statusFilter, startDate, endDate]);

    const fetchAppointments = async (signal) => {
        try {
            setLoading(true);
            setError(null);
            
            // Create cache key based on current filters
            const cacheKey = `appointments-${statusFilter}-${getLocalDateString(startDate)}-${getLocalDateString(endDate)}`;
            
            // Try to get cached data first
            const cachedData = sessionStorage.getItem(cacheKey);
            if (cachedData) {
                const { data, timestamp } = JSON.parse(cachedData);
                const cacheAge = Date.now() - timestamp;
                // Use cache if it's less than 30 seconds old
                if (cacheAge < 30000) {
                    console.log('Using cached appointments data');
                    setAppointments(data);
                    setLoading(false);
                    return;
                }
            }
            
            const queryParams = new URLSearchParams();
            if (statusFilter !== 'all') {
                queryParams.append('status', statusFilter);
            }
            if (startDate) {
                queryParams.append('startDate', getLocalDateString(startDate));
            }
            if (endDate) {
                queryParams.append('endDate', getLocalDateString(endDate));
            }

            const url = `${API_BASE_URL}/doctor/appointments?${queryParams}`;
            console.log('Fetching fresh appointments data from:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                },
                signal // Add abort signal
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server response:', errorText);
                throw new Error(`Server error: ${response.status} - ${errorText}`);
            }
            
            const data = await response.json();
            console.log('Received response:', data);
            
            if (!data.success || !Array.isArray(data.appointments)) {
                console.error('Invalid response format:', data);
                throw new Error(data.message || 'Invalid response format from server');
            }
            
            // Cache the successful response
            sessionStorage.setItem(cacheKey, JSON.stringify({
                data: data.appointments,
                timestamp: Date.now()
            }));
            
            setAppointments(data.appointments);
            
            if (data.appointments.length === 0) {
                console.log('No appointments found for the selected criteria');
            } else {
                console.log(`Found ${data.appointments.length} appointments`);
            }
            setError(null);
        } catch (err) {
            setError('Failed to load appointments. Please try again.');
            console.error('Error fetching appointments:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (appointmentId, newStatus) => {
        try {
            const response = await fetch(`${API_BASE_URL}/${appointmentId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                throw new Error('Failed to update appointment status');
            }

            fetchAppointments();
        } catch (err) {
            setError('Failed to update appointment status. Please try again.');
            console.error('Error updating appointment:', err);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="doctor-dashboard">
            <button className="close-button" onClick={onClose}>
                Close Dashboard
            </button>
            
            <h2>Doctor's Dashboard</h2>
            
            <div className="dashboard-filters">
                <div className="filter-group">
                    <label>Status:</label>
                    <select 
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All</option>
                        <option value="booked">Booked</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>

                <div className="filter-group date-range-group">
                    <div className="date-picker-container">
                        <label>From:</label>
                        <DatePicker
                            selected={startDate}
                            onChange={date => setStartDate(date)}
                            selectsStart
                            startDate={startDate}
                            endDate={endDate}
                            dateFormat="dd/MM/yyyy"
                            placeholderText="Start Date"
                        />
                    </div>
                    <div className="date-picker-container">
                        <label>To:</label>
                        <DatePicker
                            selected={endDate}
                            onChange={date => setEndDate(date)}
                            selectsEnd
                            startDate={startDate}
                            endDate={endDate}
                            minDate={startDate}
                            dateFormat="dd/MM/yyyy"
                            placeholderText="End Date"
                        />
                    </div>
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="appointments-list">
                {appointments.length === 0 ? (
                    <p className="no-appointments">No appointments found for the selected criteria.</p>
                ) : (
                    <table className="appointment-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Patient Name</th>
                                <th>Contact</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {appointments.map(appointment => (
                                <tr key={appointment._id} className={`status-${appointment.status}`}>
                                    <td>{new Date(appointment.date).toLocaleDateString()}</td>
                                    <td>{appointment.time}</td>
                                    <td>{appointment.patientName}</td>
                                    <td>
                                        <div>{appointment.patientEmail}</div>
                                        <div>{appointment.patientPhone}</div>
                                    </td>
                                    <td>
                                        <span className={`status-badge status-${appointment.status}`}>
                                            {appointment.status}
                                        </span>
                                    </td>
                                    <td>
                                        {appointment.status === 'booked' && (
                                            <button 
                                                onClick={() => handleStatusChange(appointment._id, 'completed')}
                                                className="action-button complete-btn"
                                            >
                                                Mark Complete
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default DoctorDashboard;