import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import DatePicker from 'react-datepicker';
import { getLocalDateString, API_BASE_URL } from '../api/bookingApi';
import LoadingSpinner from './LoadingSpinner';
import VideoCall from './VideoCall';
import 'react-datepicker/dist/react-datepicker.css';
import '../styles/DoctorDashboard.css';
import EditAvailabilityModal from './EditAvailabilityModal';
import PrescriptionModal from './PrescriptionModal.jsx';
import DoctorReviewSection from './DoctorReviewSection';

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
    const [activeVideoCall, setActiveVideoCall] = useState(null);
    const [editAvailabilityOpen, setEditAvailabilityOpen] = useState(false);
    const [prescriptionOpen, setPrescriptionOpen] = useState(false);
    const [showReviews, setShowReviews] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);

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

    // Check if video call button should be enabled (5 minutes before appointment)
    const canJoinCall = useCallback((apt) => {
        if (apt.consultType !== 'online') return false;
        if (!apt.date || !apt.time) return false;
        
        try {
            // Parse appointment date and time
            const [day, month, year] = apt.date.split('/');
            const [hours, minutes] = apt.time.split(':');
            const appointmentTime = new Date(year, month - 1, day, hours, minutes);
            
            // Get current time
            const now = new Date();
            
            // Calculate time difference in minutes
            const timeDiff = (appointmentTime - now) / (1000 * 60);
            
            // Enable button 5 minutes before until 30 minutes after appointment
            return timeDiff <= 5 && timeDiff >= -30;
        } catch (e) {
            console.error('Error parsing appointment time:', e);
            return false;
        }
    }, []);

    const joinVideoCall = useCallback((apt) => {
        setActiveVideoCall(apt);
    }, []);

    const closeVideoCall = useCallback(() => {
        setActiveVideoCall(null);
    }, []);

    const openPrescriptionForPatient = useCallback((apt) => {
        setSelectedPatient({
            name: apt.patientName || '',
            age: apt.age || '',
            gender: apt.gender || '',
            phone: apt.patientPhone || ''
        });
        setPrescriptionOpen(true);
    }, []);

    const closePrescription = useCallback(() => {
        setPrescriptionOpen(false);
        setSelectedPatient(null);
    }, []);

    return (
        <div className="doctor-dashboard-modal">
            <div className="dashboard-header">
                <h2>Doctor Dashboard</h2>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button className={`prescription-btn${!showReviews ? ' active' : ''}`} type="button" onClick={() => { setShowReviews(false); setSelectedPatient(null); setPrescriptionOpen(true); }}>
                        <i className="fas fa-prescription"></i> Prescription
                    </button>
                    <button className={`review-btn${showReviews ? ' active' : ''}`} type="button" onClick={() => { setShowReviews(true); setPrescriptionOpen(false); }}>
                        <i className="fas fa-star"></i> Reviews
                    </button>
                    <button className="confirm-btn" type="button" onClick={() => setEditAvailabilityOpen(true)}>Edit Availability</button>
                    <button className="close-btn" onClick={onClose} type="button">X</button>
                </div>
            </div>
            {!showReviews && (
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
                <div className="booking-count">
                    <span className="count-label">Total Bookings:</span>
                    <span className="count-number">{appointments.length}</span>
                </div>
            </div>
            )}
            {!showReviews && (
                <>
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
                            const showJoinCall = apt.consultType === 'online' && canJoinCall(apt);
                            return (
                                <div key={id} className="appointment-card compact">
                                    <div className="card-header">
                                        <div className="title">
                                            <span className="patient-name">{apt.patientName || 'Unknown'}</span>
                                            <span className="meta">{apt.gender ? apt.gender.charAt(0).toUpperCase() + apt.gender.slice(1) : ''}{apt.age ? ` • ${apt.age}` : ''}</span>
                                        </div>
                                        <div className="badges">
                                            <span className="time-badge-large">{apt.time || '-'}</span>
                                            <span className="date-badge">{apt.date ? new Date(apt.date).toLocaleDateString() : '-'}</span>
                                        </div>
                                    </div>
                                    <div className="card-body">
                                        <div className="info"><label>Phone</label><span>{apt.patientPhone || '-'}</span></div>
                                        <div className="info"><label>Consult</label><span>{apt.consultType || '-'}</span></div>
                                        {apt.paymentReference && <div className="info"><label>Pay Ref</label><span>{apt.paymentReference}</span></div>}
                                        {apt.createdAt && <div className="info"><label>Booked At</label><span>{new Date(apt.createdAt).toLocaleDateString()} {new Date(apt.createdAt).toLocaleTimeString()}</span></div>}
                                    </div>
                                    <div className="card-actions">
                                        {showConfirm && (
                                            <button className="confirm-btn" type="button" onClick={() => confirmAppointment(apt)}>Confirm</button>
                                        )}
                                        {showJoinCall && (
                                            <button className="join-call-btn" type="button" onClick={() => joinVideoCall(apt)}>
                                                <i className="fas fa-video"></i> Join Video Call
                                            </button>
                                        )}
                                        <button 
                                            className="prescription-btn" 
                                            type="button" 
                                            onClick={() => openPrescriptionForPatient(apt)}
                                            title="Write Prescription"
                                        >
                                            <i className="fas fa-prescription"></i> Prescription
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                </>
            )}
            {showReviews && (
                <DoctorReviewSection />
            )}
            {activeVideoCall && (
                <VideoCall
                    bookingId={activeVideoCall._id || activeVideoCall.bookingId}
                    patientName={activeVideoCall.patientName}
                    doctorName="Dr K Madhusudana"
                    onClose={closeVideoCall}
                />
            )}
            <EditAvailabilityModal isOpen={editAvailabilityOpen} onClose={() => setEditAvailabilityOpen(false)} />
            {prescriptionOpen && !showReviews && (
                <PrescriptionModal 
                    isOpen={prescriptionOpen} 
                    onClose={closePrescription}
                    patientData={selectedPatient}
                />
            )}
        </div>
    );
}

DoctorDashboard.propTypes = {
    onClose: PropTypes.func.isRequired,
};

export default DoctorDashboard;