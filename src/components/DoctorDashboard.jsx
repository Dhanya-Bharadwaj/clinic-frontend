// src/components/DoctorDashboard.jsx
import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { getLocalDateString, API_BASE_URL } from '../api/bookingApi';
import LoadingSpinner from './LoadingSpinner';
import '../styles/DoctorDashboard.css';

const DoctorDashboard = ({ onClose }) => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());

    useEffect(() => {
        fetchAppointments();
    }, [statusFilter, startDate, endDate]);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
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

            const response = await fetch(`${API_BASE_URL}/doctor/appointments?${queryParams}`);
            if (!response.ok) {
                throw new Error('Failed to fetch appointments');
            }
            const data = await response.json();
            setAppointments(data.appointments);
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
            const response = await fetch(`${API_BASE_URL}/${appointmentId}/complete`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                throw new Error('Failed to update appointment status');
            }

            // Refresh appointments after status update
            fetchAppointments();
        } catch (err) {
            setError('Failed to update appointment status. Please try again.');
            console.error('Error updating appointment:', err);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="doctor-dashboard">
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

                <div className="filter-group">
                    <label>Date Range:</label>
                    <DatePicker
                        selected={startDate}
                        onChange={date => setStartDate(date)}
                        selectsStart
                        startDate={startDate}
                        endDate={endDate}
                        dateFormat="dd/MM/yyyy"
                    />
                    <DatePicker
                        selected={endDate}
                        onChange={date => setEndDate(date)}
                        selectsEnd
                        startDate={startDate}
                        endDate={endDate}
                        minDate={startDate}
                        dateFormat="dd/MM/yyyy"
                    />
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="appointments-list">
                {appointments.length === 0 ? (
                    <p>No appointments found for the selected criteria.</p>
                ) : (
                    <table>
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
                                <tr key={appointment.id} className={`status-${appointment.status}`}>
                                    <td>{new Date(appointment.date).toLocaleDateString()}</td>
                                    <td>{appointment.time}</td>
                                    <td>{appointment.patientName}</td>
                                    <td>
                                        <div>{appointment.patientEmail}</div>
                                        <div>{appointment.patientPhone}</div>
                                    </td>
                                    <td>{appointment.status}</td>
                                    <td>
                                        {appointment.status === 'booked' && (
                                            <button 
                                                onClick={() => handleStatusChange(appointment.id, 'completed')}
                                                className="complete-btn"
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