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
      <div className="modal-content prescription-modal view-prescription-modal" role="dialog" aria-label="View Prescription">
        <div className="modal-header">
          <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.5rem' }}>📋 View Prescription</h3>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="modal-close-button" onClick={onClose} aria-label="Close">&times;</button>
          </div>
        </div>

        <div className="view-prescription-content">
          <div className="search-section">
            <label className="search-label">
              Phone Number:
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter 10-digit phone number"
              maxLength={10}
              className="search-input"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="btn btn-primary search-btn"
            >
              {loading ? '🔍 Searching...' : '🔍 Search'}
            </button>
            {searchPerformed && (
              <button
                onClick={handleReset}
                className="btn btn-secondary reset-btn"
              >
                🔄 Reset
              </button>
            )}
          </div>

          {searchPerformed && !loading && (
            <div className="results-section">
              {prescriptions.length === 0 ? (
                <div className="no-prescriptions">
                  <div className="no-prescriptions-icon">📋</div>
                  <p className="no-prescriptions-title">
                    No prescriptions found
                  </p>
                  <p className="no-prescriptions-text">
                    Make sure you entered the same number used during consultation.
                  </p>
                </div>
              ) : (
                <div className="prescriptions-list">
                  <h4 className="prescriptions-count">
                    Found {prescriptions.length} prescription{prescriptions.length !== 1 ? 's' : ''}
                  </h4>
                  {prescriptions.map((prescription) => (
                    <div key={prescription.id} className="prescription-card">
                      <div
                        ref={el => prescriptionRefs.current[prescription.id] = el}
                        className="rx-paper"
                      >
                        <div className="rx-header">
                          <div className="rx-title">{prescription.clinicName}</div>
                          {prescription.sent && (
                            <span className="sent-badge">✓ SENT</span>
                          )}
                          <div className="rx-doctor-name">{prescription.doctorName}</div>
                          <div className="rx-doctor-qualification">{prescription.doctorQualification}</div>
                          <div className="rx-sub">{prescription.clinicAddress}</div>
                          
                          <div className="rx-meta">
                            <span><strong>Name:</strong> {prescription.patientName}</span>
                            <span><strong>Age:</strong> {prescription.patientAge}</span>
                            <span><strong>Gender:</strong> {prescription.patientGender}</span>
                            <span><strong>Phone:</strong> {prescription.patientPhone}</span>
                            <span><strong>Date:</strong> {new Date(prescription.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}</span>
                          </div>
                        </div>

                        <div className="rx-symbol">℞</div>

                        <table className="rx-table">
                          <thead>
                            <tr>
                              <th style={{ width: '40%' }}>Medicine/Tablet</th>
                              <th style={{ width: '10%', textAlign: 'center' }}>Days</th>
                              <th style={{ width: '20%', textAlign: 'center' }}>M-A-N</th>
                              <th style={{ width: '30%' }}>Instructions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {prescription.items.map((item, idx) => (
                              <tr key={idx}>
                                <td style={{ fontWeight: 600, color: '#1e293b' }}>{item.medicine}</td>
                                <td style={{ textAlign: 'center', fontWeight: 600 }}>{item.days}</td>
                                <td>
                                  <div className="rx-pills">
                                    {item.pattern.split('').map((v, i) => (
                                      <span key={i} className={v === '1' ? 'on' : 'off'}>
                                        {['M', 'A', 'N'][i]}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td style={{ fontStyle: 'italic', color: '#475569' }}>{item.notes || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        <div className="rx-footer">
                          <div className="rx-sign">
                            <img src="/drsign.jpg" alt="Doctor's Signature" className="doctor-signature-img" />
                            <div className="signature-label">Doctor's Signature</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Download button below prescription */}
                      <button
                        onClick={() => handleDownload(prescription.id)}
                        disabled={downloading === prescription.id}
                        className="btn btn-primary download-btn"
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
