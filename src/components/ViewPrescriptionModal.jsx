import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import '../styles/Prescription.css';

export default function ViewPrescriptionModal({ isOpen, onClose }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [prescriptions, setPrescriptions] = useState([]);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(null);
  const prescriptionRefs = useRef({});

  const handleSearch = async () => {
    if (!phoneNumber || phoneNumber.length !== 10) {
      alert('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    setSearchPerformed(true);

    try {
      // Construct API URL based on environment
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
        (import.meta.env.MODE === 'production' 
          ? 'https://clinic-backend-flame.vercel.app' 
          : 'http://localhost:5001');

      const url = `${API_BASE_URL}/api/prescriptions?phone=${phoneNumber}&sent=true`;
      
      console.log('Fetching prescriptions from:', url);
      console.log('Environment mode:', import.meta.env.MODE);
      console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        mode: 'cors'
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        let errorMessage = `Server returned ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Prescriptions data received:', data);

      setPrescriptions(data.prescriptions || []);

      if (!data.prescriptions || data.prescriptions.length === 0) {
        console.log('No prescriptions found for phone:', phoneNumber);
      }

    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      console.error('Error stack:', error.stack);
      alert(`Failed to fetch prescriptions: ${error.message}\n\nPlease check:\n- Phone number is correct\n- You have prescriptions marked as "sent"\n- Internet connection is working`);
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

  const handleDownload = async (prescriptionId) => {
    try {
      setDownloading(prescriptionId);
      const element = prescriptionRefs.current[prescriptionId];
      
      if (!element) {
        alert('Prescription element not found');
        return;
      }

      // Capture the prescription as canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      // Create PDF
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add new pages if prescription is longer than one page
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Find prescription details for filename
      const prescription = prescriptions.find(p => p.id === prescriptionId);
      const filename = `Prescription_${prescription?.patientName || 'Patient'}_${new Date(prescription?.createdAt).toLocaleDateString('en-IN').replace(/\//g, '-')}.pdf`;
      
      pdf.save(filename);
      
    } catch (error) {
      console.error('Error downloading prescription:', error);
      alert('Failed to download prescription. Please try again.');
    } finally {
      setDownloading(null);
    }
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
                    <div key={prescription.id} style={{ marginBottom: '20px' }}>
                      <div
                        ref={el => prescriptionRefs.current[prescription.id] = el}
                        className="rx-paper" 
                        style={{ 
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
                      
                      {/* Download button below prescription */}
                      <div style={{ marginTop: '12px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleDownload(prescription.id)}
                          disabled={downloading === prescription.id}
                          className="btn btn-primary"
                          style={{
                            padding: '10px 24px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            opacity: downloading === prescription.id ? 0.6 : 1
                          }}
                        >
                          {downloading === prescription.id ? (
                            <>
                              <span>⏳</span>
                              <span>Downloading...</span>
                            </>
                          ) : (
                            <>
                              <span>📥</span>
                              <span>Download PDF</span>
                            </>
                          )}
                        </button>
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
