import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import DatePicker from 'react-datepicker';
import { getLocalDateString, API_BASE_URL } from '../api/bookingApi';
import LoadingSpinner from './LoadingSpinner';
import 'react-datepicker/dist/react-datepicker.css';
import '../styles/DoctorDashboard.css';

// Small hook to encapsulate fetching logic
function useAppointments(statusFilter, startDate, endDate) {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const qs = new URLSearchParams();
            if (statusFilter !== 'all') qs.append('status', statusFilter);
            if (startDate) qs.append('startDate', getLocalDateString(startDate));
            if (endDate) qs.append('endDate', getLocalDateString(endDate));
            const res = await fetch(`${API_BASE_URL}/doctor/appointments?${qs}`);
            const raw = await res.text();
            let data;
            try { data = JSON.parse(raw); } catch { throw new Error('Invalid JSON: ' + raw); }
            if (!res.ok || !data.success || !Array.isArray(data.appointments)) {
                setAppointments([]);
                setError((data.message || 'Failed to load appointments.') + '\nRaw response: ' + raw);
                return;
            }
            setAppointments(data.appointments);
        } catch (e) {
            setAppointments([]);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [statusFilter, startDate, endDate]);

    useEffect(() => { load(); }, [load]);
    return { appointments, loading, error, reload: load, setAppointments };
}

function DoctorDashboard({ onClose }) {
    const today = new Date();
    const [statusFilter, setStatusFilter] = useState('all');
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);

    const { appointments, loading, error, setAppointments } = useAppointments(statusFilter, startDate, endDate);

    const confirmAppointment = useCallback(async (apt) => {
        const id = apt._id || apt.bookingId;
        if (!id) return alert('Missing appointment ID');
        try {
            const res = await fetch(`${API_BASE_URL}/${id}/confirm`, { method: 'PATCH' });
            const raw = await res.text();
            let data;
            try { data = JSON.parse(raw); } catch { throw new Error('Bad JSON while confirming: ' + raw); }
            if (!res.ok) return alert(data.message || 'Failed to confirm');
            setAppointments(list => list.map(a => (a._id === id || a.bookingId === id)
                ? { ...a, status: 'confirmed', paymentStatus: 'verified' }
                : a));
            if (apt.patientPhone) {
                const message = `Appointment booked successfully for ${apt.patientName} on ${apt.date ? new Date(apt.date).toLocaleDateString() : ''} at ${apt.time || ''}.`;
                Promise.all([
                    fetch(`${API_BASE_URL}/notify/whatsapp`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: apt.patientPhone, message })
                    }),
                    fetch(`${API_BASE_URL}/notify/sms`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: apt.patientPhone, message })
                    })
                ]).catch(e => console.warn('Notification error', e));
            }
        } catch (e) {
            console.error(e);
            alert('Error confirming appointment: ' + e.message);
        }
    }, [setAppointments]);

    return (
        <div className="doctor-dashboard-modal">
            <div className="dashboard-header">
                <h2>Doctor Dashboard</h2>
                <button className="close-btn" onClick={onClose} type="button">X</button>
            </div>
            <div className="dashboard-filters">
                <div className="filter-group">
                    <label htmlFor="statusFilter">Status:</label>
                    <select id="statusFilter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="all">All</option>
                        <option value="booked">Booked</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
                <div className="date-picker-container">
                    <label>From:</label>
                    <DatePicker
                        selected={startDate}
                        onChange={d => setStartDate(d)}
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
                        onChange={d => setEndDate(d)}
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
            {error && <div className="error-message" role="alert">{error}</div>}
            {loading ? (
                <LoadingSpinner />
            ) : appointments.length === 0 ? (
                <div className="no-appointments">No appointments found for the selected criteria.</div>
            ) : (
                <div className="appointments-list">
                    {appointments.map(apt => {
                        const id = apt._id || apt.bookingId;
                        const paymentStatus = apt.paymentStatus || 'not_provided';
                        const showConfirm = apt.consultType === 'online' && apt.status === 'booked' && paymentStatus === 'pending_verification';
                        return (
                            <div key={id} className="appointment-card compact">
                                <div className="card-header">
                                    <div className="title">
                                        <span className="patient-name">{apt.patientName || 'Unknown'}</span>
                                        <span className="meta">{apt.gender ? apt.gender.charAt(0).toUpperCase() + apt.gender.slice(1) : ''}{apt.age ? ` • ${apt.age}` : ''}</span>
                                    </div>
                                    <div className="badges">
                                        <span className={`status-badge ${apt.status}`}>{(apt.status || 'BOOKED').toUpperCase()}</span>
                                        <span className="time-badge">{apt.date ? new Date(apt.date).toLocaleDateString() : '-'} • {apt.time || '-'}</span>
                                        {apt.consultType === 'online' && (
                                            <span className={`payment-badge ${paymentStatus}`}>{paymentStatus.replace('_', ' ')}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="card-body">
                                    <div className="info"><label>Phone</label><span>{apt.patientPhone || '-'}</span></div>
                                    <div className="info"><label>Consult</label><span>{apt.consultType || '-'}</span></div>
                                    <div className="info"><label>Booking ID</label><span>{id}</span></div>
                                    {apt.paymentReference && <div className="info"><label>Pay Ref</label><span>{apt.paymentReference}</span></div>}
                                    {apt.createdAt && <div className="info"><label>Booked At</label><span>{new Date(apt.createdAt).toLocaleDateString()} {new Date(apt.createdAt).toLocaleTimeString()}</span></div>}
                                </div>
                                {showConfirm && (
                                    <div className="card-actions">
                                        <button className="confirm-btn" type="button" onClick={() => confirmAppointment(apt)}>Confirm</button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

DoctorDashboard.propTypes = {
    onClose: PropTypes.func.isRequired,
};

export default DoctorDashboard;