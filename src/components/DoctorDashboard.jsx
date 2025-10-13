// src/components/DoctorDashboard.jsx
import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { getLocalDateString, API_BASE_URL } from '../api/bookingApi';
import LoadingSpinner from './LoadingSpinner';
import "react-datepicker/dist/react-datepicker.css";
import '../styles/DoctorDashboard.css';

const DoctorDashboard = ({ onClose }) => {
    console.log('🏥 DoctorDashboard component rendered!');

    const today = new Date();
    
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);

    useEffect(() => {
        localStorage.setItem('doctorDashboardFilters', JSON.stringify({
            status: statusFilter,
            start: startDate?.toISOString(),
            end: endDate?.toISOString()
        }));
    }, [statusFilter, startDate, endDate]);

    useEffect(() => {
        console.log('🔄 useEffect triggered for fetchAppointments');
        const fetchAppointments = async () => {
            console.log('🔄 Starting to fetch appointments...');
            console.log('Current filters:', { statusFilter, startDate, endDate });
            setLoading(true);
            setError(null);
            try {
                const queryParams = new URLSearchParams();
                if (statusFilter !== 'all') queryParams.append('status', statusFilter);
                // Apply date filters (default to today's appointments)
                if (startDate) queryParams.append('startDate', getLocalDateString(startDate));
                if (endDate) queryParams.append('endDate', getLocalDateString(endDate));
                const url = `${API_BASE_URL}/doctor/appointments?${queryParams}`;
                console.log('📡 Fetching URL:', url);
                console.log('🌐 API_BASE_URL:', API_BASE_URL);
                
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });
                console.log('📥 Response status:', response.status, response.statusText);
                let rawText = await response.text();
                console.log('📄 Raw response text length:', rawText.length);
                console.log('📄 Raw response preview:', rawText.substring(0, 200));
                let data;
                try {
                    data = JSON.parse(rawText);
                    console.log('✅ Parsed JSON successfully:', data);
                } catch (jsonErr) {
                    console.error('❌ JSON Parse Error:', jsonErr);
                    setAppointments([]);
                    setError('Server returned invalid JSON: ' + rawText);
                    return;
                }
                if (response.ok && data && data.success && Array.isArray(data.appointments)) {
                    console.log('✅ Successfully loaded appointments:', data.appointments.length);
                    console.log('📋 Appointments data:', data.appointments);
                    setAppointments(data.appointments);
                } else {
                    console.error('❌ Failed to load appointments:', data);
                    setAppointments([]);
                    setError((data.message || 'Failed to load appointments.') + '\nRaw response: ' + rawText);
                }
            } catch (err) {
                console.error('❌ Fetch Error:', err);
                setAppointments([]);
                setError('Failed to load appointments: ' + err.message);
            } finally {
                console.log('🔚 Finished fetching, setting loading to false');
                setLoading(false);
            }
        };
        fetchAppointments();
    }, [statusFilter, startDate, endDate]);

    if (loading) return (
        <div style={{padding: '20px'}}>
            <h2>Doctor Dashboard - Loading...</h2>
            <LoadingSpinner />
            <p>Check browser console for debug logs</p>
        </div>
    );

    // Debug: log raw appointments to console
    console.log('🏥 Dashboard State - appointments:', appointments);
    console.log('🏥 Dashboard State - loading:', loading);
    console.log('🏥 Dashboard State - error:', error);

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
                <div className="booking-count">
                    <span className="count-label">Total Bookings:</span>
                    <span className="count-number">{appointments.length}</span>
                </div>
            </div>
            {error && <div className="error-message">{error}</div>}
            {appointments.length === 0 ? (
                <div className="no-appointments">
                    No appointments found for the selected criteria.
                </div>
            ) : (
                <div className="appointments-list">
                    {appointments.map((apt, index) => (
                        <div 
                            key={apt._id || apt.bookingId || Math.random()} 
                            className="appointment-card"
                        >
                            <div>
                                <strong>Booking ID:</strong> 
                                <span>{apt.bookingId || apt._id || 'N/A'}</span>
                            </div>
                            <div>
                                <strong>Patient Name:</strong> 
                                <span>{apt.patientName || 'N/A'}</span>
                            </div>
                            <div>
                                <strong>Phone:</strong> 
                                <span>{apt.patientPhone || 'N/A'}</span>
                            </div>
                            <div>
                                <strong>Age:</strong> 
                                <span>{apt.age || 'N/A'}</span>
                            </div>
                            <div>
                                <strong>Gender:</strong> 
                                <span style={{ textTransform: 'capitalize' }}>{apt.gender || 'N/A'}</span>
                            </div>
                            <div>
                                <strong>Consult Type:</strong> 
                                <span style={{ textTransform: 'capitalize' }}>{apt.consultType || 'N/A'}</span>
                            </div>
                            <div>
                                <strong>Date:</strong> 
                                <span>{apt.date ? new Date(apt.date).toLocaleDateString() : 'N/A'}</span>
                            </div>
                            <div>
                                <strong>Time:</strong> 
                                <span>{apt.time || 'N/A'}</span>
                            </div>
                            <div>
                                <strong>Status:</strong> 
                                <span className={`status-${apt.status || 'unknown'}`}>
                                    {(apt.status || 'N/A').toUpperCase()}
                                </span>
                            </div>
                            {apt.createdAt && (
                                <div>
                                    <strong>Booked At:</strong> 
                                    <span>{new Date(apt.createdAt).toLocaleDateString()} at {new Date(apt.createdAt).toLocaleTimeString()}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DoctorDashboard;