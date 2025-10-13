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

    useEffect(() => {
        localStorage.setItem('doctorDashboardFilters', JSON.stringify({
            status: statusFilter,
            start: startDate?.toISOString(),
            end: endDate?.toISOString()
        }));
    }, [statusFilter, startDate, endDate]);

    useEffect(() => {
        const fetchAppointments = async () => {
            setLoading(true);
            setError(null);
            try {
                const queryParams = new URLSearchParams();
                if (statusFilter !== 'all') queryParams.append('status', statusFilter);
                if (startDate) queryParams.append('startDate', getLocalDateString(startDate));
                if (endDate) queryParams.append('endDate', getLocalDateString(endDate));
                const url = `${API_BASE_URL}/doctor/appointments?${queryParams}`;
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    }
                });
                let rawText = await response.text();
                let data;
                try {
                    data = JSON.parse(rawText);
                } catch (jsonErr) {
                    setAppointments([]);
                    setError('Server returned invalid JSON: ' + rawText);
                    return;
                }
                if (response.ok && data && data.success && Array.isArray(data.appointments)) {
                    setAppointments(data.appointments);
                } else {
                    setAppointments([]);
                    setError((data.message || 'Failed to load appointments.') + '\nRaw response: ' + rawText);
                }
            } catch (err) {
                setAppointments([]);
                setError('Failed to load appointments: ' + err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchAppointments();
    }, [statusFilter, startDate, endDate]);

    if (loading) return <LoadingSpinner />;

    // Debug: log raw appointments to console
    console.log('Raw appointments from backend:', appointments);

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
            {/* Show raw appointments for debugging */}
            <pre style={{background:'#f8f8f8',padding:'8px',fontSize:'12px',overflow:'auto'}}>
                {JSON.stringify(appointments, null, 2)}
            </pre>
            {appointments.length === 0 ? (
                <div className="no-appointments">
                    No appointments found for the selected criteria.
                </div>
            ) : (
                <div className="appointments-list">
                    {appointments.map((apt) => (
                        <div key={apt._id || apt.bookingId || Math.random()} className="appointment-card">
                            <div><strong>Name:</strong> {apt.patientName || 'N/A'}</div>
                            <div><strong>Email:</strong> {apt.patientEmail || 'N/A'}</div>
                            <div><strong>Phone:</strong> {apt.patientPhone || 'N/A'}</div>
                            <div><strong>Date:</strong> {apt.date || 'N/A'}</div>
                            <div><strong>Time:</strong> {apt.time || 'N/A'}</div>
                            <div><strong>Status:</strong> {apt.status || 'N/A'}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DoctorDashboard;