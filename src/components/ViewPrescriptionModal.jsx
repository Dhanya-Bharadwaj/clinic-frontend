import React, { useState } from 'react';
import '../styles/Prescription.css';

export default function ViewPrescriptionModal({ isOpen, onClose }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [prescriptions, setPrescriptions] = useState([]);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!phoneNumber || phoneNumber.length !== 10) {
      alert('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    setSearchPerformed(true);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL 
        ? `${import.meta.env.VITE_API_BASE_URL}/api/prescriptions`
        : (import.meta.env.MODE === 'production'
          ? 'https://clinic-backend-flame.vercel.app/api/prescriptions'
          : 'http://localhost:5001/api/prescriptions');

      const response = await fetch(`${API_BASE_URL}?phone=${phoneNumber}&sent=true`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch prescriptions');
      }

      console.log('Prescriptions fetched:', data);
      setPrescriptions(data.prescriptions || []);

    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      alert(`Failed to fetch prescriptions: ${error.message}`);
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPhoneNumber('');
    setPrescriptions([]);
    setSearchPerformed(false);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target.classList.contains('modal-backdrop')) onClose(); }}>
      <div className="modal-content prescription-modal" role="dialog" aria-label="View Prescription">
        <div className="modal-header">
          <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.5rem' }}>📋 View Prescription</h3>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="modal-close-button" onClick={onClose} aria-label="Close">&times;</button>
          </div>
        </div>

        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
            <label style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.95rem', minWidth: '120px' }}>
              Phone Number:
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter 10-digit phone number"
              maxLength={10}
              style={{
                flex: 1,
                padding: '10px 12px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.95rem',
              }}
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="btn btn-primary"
              style={{ padding: '10px 24px', minWidth: '100px' }}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
            {searchPerformed && (
              <button
                onClick={handleReset}
                className="btn btn-secondary"
                style={{ padding: '10px 24px' }}
              >
                Reset
              </button>
            )}
          </div>

          {searchPerformed && !loading && (
            <div>
              {prescriptions.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  background: '#f8fafc',
                  borderRadius: '12px',
                  border: '2px dashed #cbd5e1',
                  color: '#64748b',
                }}>
                  <p style={{ fontSize: '1.1rem', margin: 0 }}>
                    No prescriptions found for this phone number.
                  </p>
                  <p style={{ fontSize: '0.9rem', marginTop: '8px', color: '#94a3b8' }}>
                    Make sure you entered the same number used during consultation.
                  </p>
                </div>
              ) : (
                <div className="prescriptions-list" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  <h4 style={{ marginBottom: '15px', color: '#1e293b' }}>
                    Sent prescriptions: {prescriptions.length}
                  </h4>
                  {prescriptions.map((prescription) => (
                    <div 
                      key={prescription.id} 
                      className="rx-paper" 
                      style={{ 
                        marginBottom: '20px',
                        background: 'white',
                        border: '2px solid #cbd5e1'
                      }}
                    >
                      <div className="rx-header">
                        <h2 className="rx-clinic-name">{prescription.clinicName}</h2>
                        {prescription.sent && (
                          <span style={{
                            display: 'inline-block',
                            marginTop: '6px',
                            background: '#d1fae5',
                            color: '#065f46',
                            padding: '4px 10px',
                            borderRadius: '999px',
                            fontSize: '0.8rem',
                            fontWeight: 700
                          }}>SENT</span>
                        )}
                        <div className="rx-doctor-name">{prescription.doctorName}</div>
                        <div className="rx-doctor-qualification">{prescription.doctorQualification}</div>
                        <div className="rx-address">{prescription.clinicAddress}</div>
                        
                        <div className="rx-meta">
                          <div>
                            <strong>Name:</strong> {prescription.patientName} &nbsp;|&nbsp; 
                            <strong>Age:</strong> {prescription.patientAge} &nbsp;|&nbsp; 
                            <strong>Gender:</strong> {prescription.patientGender}
                          </div>
                          <div>
                            <strong>Phone:</strong> {prescription.patientPhone}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                            <strong>Date:</strong> {new Date(prescription.createdAt).toLocaleDateString('en-IN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="rx-symbol">℞</div>

                      <table className="rx-table">
                        <thead>
                          <tr>
                            <th>Medicine/Tablet</th>
                            <th>Days</th>
                            <th>M-A-N</th>
                            <th>Instructions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {prescription.items.map((item, idx) => (
                            <tr key={idx}>
                              <td>{item.medicine}</td>
                              <td>{item.days}</td>
                              <td>
                                <div className="rx-pills">
                                  {item.pattern.split('').map((v, i) => (
                                    <div key={i} className={`pill ${v === '1' ? 'active' : ''}`} />
                                  ))}
                                </div>
                              </td>
                              <td>{item.notes || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div className="rx-footer">
                        <div className="signature-line">Doctor's Signature</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
