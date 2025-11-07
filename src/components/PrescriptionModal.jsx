import React, { useMemo, useRef, useState, useEffect } from 'react';
import '../styles/Prescription.css';

export default function PrescriptionModal({ isOpen, onClose, patientData }) {
  const [clinicName, setClinicName] = useState('Balakrishna Clinic');
  const [doctorName, setDoctorName] = useState('Dr. K. Madhusudana');
  const [doctorQualification, setDoctorQualification] = useState('M.B.B.S | F.A.G.E   KMC No. 50635');
  const [clinicAddress, setClinicAddress] = useState('4th Cross Road, New Bank Colony, Konankunte, Bangalore - 560078');
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const [newMed, setNewMed] = useState('');
  const [newDays, setNewDays] = useState('');
  const [newPattern, setNewPattern] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Auto-fill patient data when provided
  useEffect(() => {
    if (patientData) {
      if (patientData.name) setPatientName(patientData.name);
      if (patientData.age) setPatientAge(String(patientData.age));
      if (patientData.gender) setPatientGender(patientData.gender);
      if (patientData.phone) setPatientPhone(patientData.phone);
    }
  }, [patientData]);

  const todayString = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString();
  }, []);

  const printRef = useRef(null);

  const addItem = () => {
    const med = newMed.trim();
    const days = parseInt(newDays, 10) || 0;
    const pattern = newPattern.replace(/-/g, '').trim(); // Remove dashes for storage
    const notes = newNotes.trim();
    // Accept 3-char 0/1 pattern like 101, 000, 011
    if (!med) return alert('Enter medicine/tablet name');
    if (!days || days <= 0) return alert('Enter number of days');
    if (!/^\d{3}$/.test(pattern)) return alert('Enter pattern like 1-0-1 or 1-1-1');
    setItems(prev => [...prev, { med, days, pattern, notes }]);
    setNewMed(''); setNewDays(''); setNewPattern(''); setNewNotes('');
  };

  const removeItem = (idx) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handlePatternChange = (e) => {
    let value = e.target.value.replace(/[^01-]/g, ''); // Only allow 0, 1, and -
    
    // Auto-format with dashes as user types
    if (value.length <= 5) {
      // Remove existing dashes
      const digits = value.replace(/-/g, '');
      
      // Add dashes after 1st and 2nd digit
      if (digits.length > 0) {
        value = digits[0];
        if (digits.length > 1) value += '-' + digits[1];
        if (digits.length > 2) value += '-' + digits[2];
      }
    }
    
    setNewPattern(value);
  };

  const handlePrint = () => {
    // Ensure phone number is provided before printing so patients can retrieve their Rx later
    if (!/^\d{10}$/.test(patientPhone)) {
      alert('Please enter a valid 10-digit phone number before printing.');
      return;
    }
    window.print();
  };

  const handleSave = async () => {
    // Validate required fields
    if (!patientPhone) {
      alert('Please enter patient phone number');
      return;
    }
    if (items.length === 0) {
      alert('Please add at least one medication');
      return;
    }

    // Validate phone number format
    if (!/^\d{10}$/.test(patientPhone)) {
      alert('Please enter a valid 10-digit phone number');
      return;
    }

    setSaving(true);
    setSaveMessage('');

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL 
        ? `${import.meta.env.VITE_API_BASE_URL}/api/prescriptions`
        : (import.meta.env.MODE === 'production'
          ? 'https://clinic-backend-flame.vercel.app/api/prescriptions'
          : 'http://localhost:5001/api/prescriptions');

      const baseData = {
        clinicName,
        clinicAddress,
        doctorName,
        doctorQualification,
        patientName,
        patientAge,
        patientGender,
        patientPhone,
        items: items.map(item => ({
          medicine: item.med,
          days: item.days.toString(),
          pattern: item.pattern,
          notes: item.notes
        }))
      };

      const prescriptionData = { ...baseData, sent: false };
      console.log('Saving prescription (draft):', prescriptionData);

      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(prescriptionData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save prescription');
      }

      console.log('Prescription saved successfully:', data);
      setSaveMessage('✅ Prescription saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSaveMessage(''), 3000);

    } catch (error) {
      console.error('Error saving prescription:', error);
      setSaveMessage(`❌ Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    // Validate required fields
    if (!/^\d{10}$/.test(patientPhone)) {
      alert('Please enter a valid 10-digit phone number');
      return;
    }
    if (items.length === 0) {
      alert('Please add at least one medication');
      return;
    }

    setSaving(true);
    setSaveMessage('');

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL 
        ? `${import.meta.env.VITE_API_BASE_URL}/api/prescriptions`
        : (import.meta.env.MODE === 'production'
          ? 'https://clinic-backend-flame.vercel.app/api/prescriptions'
          : 'http://localhost:5001/api/prescriptions');

      const baseData = {
        clinicName,
        clinicAddress,
        doctorName,
        doctorQualification,
        patientName,
        patientAge,
        patientGender,
        patientPhone,
        items: items.map(item => ({
          medicine: item.med,
          days: item.days.toString(),
          pattern: item.pattern,
          notes: item.notes
        }))
      };

      const payload = { ...baseData, sent: true };
      console.log('Sending prescription to patient dashboard:', payload);

      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send prescription');
      }

      setSaveMessage('✅ Prescription sent to user dashboard!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error sending prescription:', error);
      setSaveMessage(`❌ Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={(e) => { if ((e.target).classList.contains('modal-backdrop')) onClose(); }}>
      <div className="modal-content prescription-modal" role="dialog" aria-label="Prescription">
        <div className="modal-header">
          <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.5rem' }}>💊 Create Prescription</h3>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {saveMessage && (
              <span style={{ 
                fontSize: '0.85rem', 
                color: saveMessage.includes('✅') ? '#059669' : '#ef4444',
                fontWeight: 500
              }}>
                {saveMessage}
              </span>
            )}
            <button 
              className="btn btn-primary" 
              onClick={handleSend} 
              disabled={saving}
              style={{ padding: '8px 18px', fontSize: '0.9rem' }}
            >
              {saving ? '📤 Sending...' : '📤 Send'}
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={handleSave} 
              disabled={saving}
              style={{ padding: '8px 18px', fontSize: '0.9rem' }}
            >
              {saving ? '💾 Saving...' : '💾 Save'}
            </button>
            <button className="btn btn-primary" onClick={handlePrint} style={{ padding: '8px 18px', fontSize: '0.9rem' }}>
              🖨️ Print
            </button>
            <button className="modal-close-button" onClick={onClose} aria-label="Close">&times;</button>
          </div>
        </div>

        {/* Editor Panel */}
        <div className="rx-editor">
          <div className="rx-row">
            <label>Clinic Name</label>
            <input value={clinicName} onChange={(e) => setClinicName(e.target.value)} />
          </div>
          <div className="rx-row">
            <label>Doctor Name</label>
            <input value={doctorName} onChange={(e) => setDoctorName(e.target.value)} />
          </div>
          <div className="rx-row">
            <label>Qualification</label>
            <input value={doctorQualification} onChange={(e) => setDoctorQualification(e.target.value)} />
          </div>
          <div className="rx-row">
            <label>Address</label>
            <input value={clinicAddress} onChange={(e) => setClinicAddress(e.target.value)} />
          </div>
          
          <div className="rx-row">
            <label>Patient Name</label>
            <input value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="Optional" />
          </div>
          <div className="rx-row">
            <label>Age</label>
            <input value={patientAge} onChange={(e) => setPatientAge(e.target.value)} placeholder="Optional" />
          </div>
          <div className="rx-row">
            <label>Gender</label>
            <input value={patientGender} onChange={(e) => setPatientGender(e.target.value)} placeholder="Optional" />
          </div>
          <div className="rx-row">
            <label>Phone Number</label>
            <input 
              type="tel"
              value={patientPhone}
              onChange={(e) => setPatientPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10-digit phone number (required)"
              maxLength={10}
              pattern="[0-9]{10}"
            />
          </div>
          <div className="rx-row">
            <label>Date</label>
            <input value={todayString} readOnly />
          </div>

          <div className="rx-add-panel">
            <button className="secondary-button" onClick={addItem}>➕ Add</button>
            <input className="rx-med" placeholder="Medicine name" value={newMed} onChange={(e) => setNewMed(e.target.value)} />
            <input className="rx-days" type="number" min="1" step="1" placeholder="Days" value={newDays} onChange={(e) => setNewDays(e.target.value)} />
            <input className="rx-pattern" placeholder="1-0-1" value={newPattern} onChange={handlePatternChange} maxLength={5} />
            <input className="rx-notes" placeholder="After/Before food" value={newNotes} onChange={(e) => setNewNotes(e.target.value)} />
          </div>
        </div>

        {/* Preview / Print Area */}
        <div className="rx-print-wrapper">
          <div className="rx-paper print-area" ref={printRef}>
            <div className="rx-header">
              <div className="rx-title">{clinicName}</div>
              <div className="rx-doctor-name">{doctorName}</div>
              <div className="rx-doctor-qualification">{doctorQualification}</div>
              <div className="rx-sub">{clinicAddress}</div>
              <div className="rx-meta">
                <span>Patient: {patientName || '-'}</span>
                <span>Age: {patientAge || '-'}</span>
                <span>Gender: {patientGender || '-'}</span>
                <span>Phone: {patientPhone || '-'}</span>
                <span>Date: {todayString}</span>
              </div>
            </div>

            <div className="rx-symbol">℞</div>

            <table className="rx-table">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Medicine</th>
                  <th style={{ width: '8%' }}>Days</th>
                  <th style={{ width: '12%' }}>Dosage</th>
                  <th style={{ width: '40%' }}>Instructions</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: '#9aa4b2' }}>No items yet. Use Add above.</td>
                  </tr>
                ) : items.map((it, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className="rx-medline">
                        <span>{it.med}</span>
                        <button className="rx-remove" onClick={() => removeItem(idx)} aria-label="Remove">×</button>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: '600' }}>{it.days}</td>
                    <td>
                      <div className="rx-pills">
                        {it.pattern.split('').map((d, i) => (
                          <span key={i} className={d === '1' ? 'on' : 'off'}>
                            {['M','A','N'][i]}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="rx-instructions">
                        {it.notes || '-'}
                      </div>
                    </td>
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
        </div>
      </div>
    </div>
  );
}
