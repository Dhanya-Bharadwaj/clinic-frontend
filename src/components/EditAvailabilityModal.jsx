import React, { useEffect, useMemo, useState } from 'react';
import DatePicker from 'react-datepicker';
import { getLocalDateString } from '../api/bookingApi';
import { getAvailabilityOverride, upsertAvailabilityOverride, deleteAvailabilityOverride, getDefaultSlots, getActualAvailableSlots } from '../api/availabilityApi';
import '../styles/BookingModal.css';

const normalizeTime = (s) => {
  if (!s) return '';
  const m = String(s).match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return '';
  let hh = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return '';
  return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
};

export default function EditAvailabilityModal({ isOpen, onClose }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [consultType, setConsultType] = useState('offline');
  const [available, setAvailable] = useState(true); // toggle ON means available; OFF means closed
  const [editingSlots, setEditingSlots] = useState([]); // current override slots being edited
  const [defaultSlots, setDefaultSlots] = useState([]); // baseline slots for date/type (no overrides, no bookings)
  const [actualSlots, setActualSlots] = useState([]); // actual patient-facing slots (with overrides and bookings)
  const [newTime, setNewTime] = useState(''); // for adding a time via input
  const [applyMode, setApplyMode] = useState('once'); // 'once' or 'always'
  const [dirty, setDirty] = useState(false);
  const formattedDate = useMemo(() => getLocalDateString(selectedDate), [selectedDate]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        setLoading(true);
        setMessage('');
        const [override, baseline, actual] = await Promise.all([
          getAvailabilityOverride(formattedDate, consultType),
          getDefaultSlots(formattedDate, consultType),
          getActualAvailableSlots(formattedDate, consultType),
        ]);
        if (!override) {
          setAvailable(true);
          setEditingSlots([]);
        } else {
          setAvailable(!override.closed);
          setEditingSlots(Array.isArray(override.slots) ? override.slots : []);
        }
        setDefaultSlots(Array.isArray(baseline) ? baseline : []);
        setActualSlots(Array.isArray(actual) ? actual : []);
        setNewTime('');
        setDirty(false);
      } catch (e) {
        setMessage(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen, formattedDate, consultType]);

  const handleSave = async () => {
    try {
      setLoading(true);
      const sortedSlots = [...editingSlots].sort();
      const payload = { date: formattedDate, consultType, closed: !available, applyMode };
      if (available && sortedSlots.length > 0) {
        payload.slots = sortedSlots;
      }
      const result = await upsertAvailabilityOverride(payload);
      setMessage(result.message || 'Saved successfully');
      setDirty(false);
      
      // Refresh slots to show the updated state
      const [baseline, actual] = await Promise.all([
        getDefaultSlots(formattedDate, consultType),
        getActualAvailableSlots(formattedDate, consultType),
      ]);
      setDefaultSlots(Array.isArray(baseline) ? baseline : []);
      setActualSlots(Array.isArray(actual) ? actual : []);
    } catch (e) {
      setMessage(e.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Remove override and revert to default schedule?')) return;
    try {
      setLoading(true);
      await deleteAvailabilityOverride(formattedDate, consultType);
      setMessage('Override removed. Using default schedule.');
      setEditingSlots([]);
      setAvailable(true);
      setNewTime('');
      setDirty(false);
    } catch (e) {
      setMessage(e.message || 'Failed to delete override');
    } finally {
      setLoading(false);
    }
  };

  const removeSlot = (t) => {
    setEditingSlots((prev) => {
      const next = prev.filter(s => s !== t);
      if (next.length !== prev.length) setDirty(true);
      return next;
    });
  };

  const addSlot = () => {
    const norm = normalizeTime(newTime);
    if (!norm) {
      setMessage('Please enter a valid time in HH:MM (24h)');
      return;
    }
    setEditingSlots((prev) => {
      if (prev.includes(norm)) return prev;
      const next = [...prev, norm].sort();
      return next;
    });
    setDirty(true);
    setNewTime('');
  };

  const useDefaultAsOverride = () => {
    setEditingSlots([...defaultSlots].sort());
    setDirty(true);
  };

  const clearOverrideSlots = () => {
    setEditingSlots([]);
    setDirty(true);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target.classList.contains('modal-backdrop')) onClose(); }}>
      <div className="modal-content" role="dialog" aria-label="Edit Availability" style={{ maxWidth: '650px' }}>
        <div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.3rem' }}>
            <span style={{ fontSize: '1.2rem' }}>⚙️</span>
            Edit Availability
          </h3>
          <button className="modal-close-button" onClick={onClose}>&times;</button>
        </div>

        <div className="consult-type-step" style={{ paddingTop: 0, paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#475569', margin: 0 }}>Type:</h4>
            <div className="consult-type-radio-group" style={{ margin: 0 }}>
              <label className={`consult-type-radio${consultType === 'offline' ? ' selected' : ''}`} style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
                <input type="radio" name="ctype" value="offline" checked={consultType === 'offline'} onChange={() => { setConsultType('offline'); setDirty(false); }} />
                <span className="custom-radio"></span>
                🏥 Offline
              </label>
              <label className={`consult-type-radio${consultType === 'online' ? ' selected' : ''}`} style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
                <input type="radio" name="ctype" value="online" checked={consultType === 'online'} onChange={() => { setConsultType('online'); setDirty(false); }} />
                <span className="custom-radio"></span>
                💻 Online
              </label>
            </div>
          </div>
        </div>

        <div className="consult-mode-step" style={{ paddingTop: '12px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
          <h4 style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '10px' }}>Date:</h4>
          <div className="date-picker-container">
            <DatePicker
              selected={selectedDate}
              onChange={(d) => { setSelectedDate(d); setDirty(false); }}
              inline
              dateFormat="dd/MM/yyyy"
            />
          </div>
        </div>

        <div className="appointment-form" style={{ paddingTop: '12px' }}>
          <h4 style={{ fontSize: '1rem', marginBottom: '12px', color: '#1e293b' }}>Availability Settings</h4>
          
          {/* Apply Mode Selection - Compact */}
          <div style={{ marginBottom: '16px', padding: '12px 14px', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <label style={{ fontWeight: 600, fontSize: '0.9rem', color: '#475569', margin: 0, whiteSpace: 'nowrap' }}>
                Apply to:
              </label>
              <div style={{ display: 'inline-flex', background: '#fff', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '3px' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  cursor: 'pointer', 
                  padding: '6px 12px', 
                  background: applyMode === 'once' ? '#3b82f6' : 'transparent', 
                  color: applyMode === 'once' ? '#fff' : '#64748b', 
                  borderRadius: '4px', 
                  fontWeight: 500,
                  fontSize: '0.85rem',
                  transition: 'all 0.2s',
                  userSelect: 'none'
                }}>
                  <input 
                    type="radio" 
                    name="applyMode" 
                    value="once" 
                    checked={applyMode === 'once'} 
                    onChange={() => { setApplyMode('once'); setDirty(true); }}
                    style={{ display: 'none' }}
                  />
                  This date only
                </label>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  cursor: consultType === 'online' ? 'not-allowed' : 'pointer', 
                  padding: '6px 12px', 
                  background: applyMode === 'always' && consultType === 'offline' ? '#3b82f6' : 'transparent', 
                  color: applyMode === 'always' && consultType === 'offline' ? '#fff' : '#64748b', 
                  borderRadius: '4px', 
                  fontWeight: 500,
                  fontSize: '0.85rem',
                  transition: 'all 0.2s',
                  opacity: consultType === 'online' ? 0.4 : 1,
                  userSelect: 'none'
                }}>
                  <input 
                    type="radio" 
                    name="applyMode" 
                    value="always" 
                    checked={applyMode === 'always'} 
                    onChange={() => { setApplyMode('always'); setDirty(true); }}
                    disabled={consultType === 'online'}
                    style={{ display: 'none' }}
                  />
                  Always
                </label>
              </div>
            </div>
            {applyMode === 'once' && (
              <p style={{ marginTop: '8px', marginBottom: 0, fontSize: '0.8rem', color: '#64748b', lineHeight: '1.3' }}>
                💡 One-time override for {formattedDate} only
              </p>
            )}
            {applyMode === 'always' && consultType === 'offline' && (
              <p style={{ marginTop: '8px', marginBottom: 0, fontSize: '0.8rem', color: '#64748b', lineHeight: '1.3' }}>
                � Updates permanent default schedule
              </p>
            )}
            {consultType === 'online' && (
              <p style={{ marginTop: '8px', marginBottom: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.3', fontStyle: 'italic' }}>
                ℹ️ Online schedules are day-specific
              </p>
            )}
          </div>
          
          {/* Status Toggle - Compact */}
          <div style={{ marginBottom: '16px', padding: '12px 14px', background: '#fafafa', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontWeight: 600, fontSize: '0.9rem', color: '#475569', margin: 0 }}>Clinic Status:</label>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>Closed</span>
                <div style={{ position: 'relative', width: '42px', height: '22px', background: available ? '#10b981' : '#d1d5db', borderRadius: '11px', transition: 'background 0.2s', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={available} 
                    onChange={(e) => { setAvailable(e.target.checked); setDirty(true); }}
                    style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                  />
                  <span style={{ position: 'absolute', top: '2px', left: available ? '22px' : '2px', width: '18px', height: '18px', background: '#fff', borderRadius: '50%', transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}></span>
                </div>
                <span style={{ fontSize: '0.85rem', color: available ? '#10b981' : '#64748b', fontWeight: 600 }}>{available ? 'Open' : 'Closed'}</span>
              </label>
            </div>
          </div>

          {/* Current Patient-Facing Slots - Compact */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b', marginBottom: '8px', display: 'block' }}>
              📅 Available to Patients
            </label>
            <div style={{ padding: '10px 12px', background: '#fff', borderRadius: '6px', border: '1px solid #e0f2fe', minHeight: '48px' }}>
              {loading ? (
                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Loading...</span>
              ) : actualSlots.length === 0 ? (
                <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic' }}>No slots available</span>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {actualSlots.map((t) => (
                    <span 
                      key={`actual-${t}`} 
                      style={{ 
                        padding: '4px 10px', 
                        borderRadius: '4px', 
                        fontSize: '0.8rem', 
                        background: '#dbeafe', 
                        border: '1px solid #93c5fd', 
                        color: '#1e40af',
                        fontWeight: 500
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Default Schedule Reference - Compact */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#64748b', marginBottom: '6px', display: 'block' }}>
              Default Schedule
            </label>
            <div style={{ padding: '8px 10px', background: '#fafafa', borderRadius: '6px', border: '1px solid #e5e7eb', minHeight: '40px' }}>
              {defaultSlots.length === 0 ? (
                <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>No default slots</span>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {defaultSlots.map((t) => (
                    <span 
                      key={`def-${t}`} 
                      style={{ 
                        padding: '3px 8px', 
                        borderRadius: '3px', 
                        fontSize: '0.75rem', 
                        background: '#f1f5f9', 
                        border: '1px solid #cbd5e1', 
                        color: '#64748b'
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Override Editor - Compact */}
          <div style={{ marginTop: '16px', opacity: available ? 1 : 0.5, pointerEvents: available ? 'auto' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <label style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a', margin: 0 }}>
                {applyMode === 'always' ? '🔄 New Default' : '✏️ Custom Slots'}
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button 
                  type="button" 
                  className="secondary-button" 
                  onClick={useDefaultAsOverride} 
                  disabled={!defaultSlots.length}
                  style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                >
                  Copy
                </button>
                <button 
                  type="button" 
                  className="secondary-button" 
                  onClick={clearOverrideSlots}
                  style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                >
                  Clear
                </button>
              </div>
            </div>

            <div style={{ padding: '10px 12px', background: applyMode === 'always' ? '#f0fdf4' : '#fefce8', borderRadius: '6px', border: applyMode === 'always' ? '1px solid #86efac' : '1px solid #fde047', minHeight: '50px' }}>
              {editingSlots.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '8px' }}>
                  <span style={{ color: applyMode === 'always' ? '#065f46' : '#a16207', fontSize: '0.8rem', fontStyle: 'italic' }}>
                    {applyMode === 'always' ? 'Add times for new default' : 'Using default schedule'}
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {editingSlots.sort().map((t) => (
                    <span 
                      key={`ov-${t}`} 
                      style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: 6, 
                        padding: '5px 10px', 
                        borderRadius: 4, 
                        background: applyMode === 'always' ? '#d1fae5' : '#fef3c7', 
                        border: applyMode === 'always' ? '1px solid #10b981' : '1px solid #fbbf24', 
                        color: applyMode === 'always' ? '#065f46' : '#92400e', 
                        fontSize: '0.8rem',
                        fontWeight: 500
                      }}
                    >
                      {t}
                      <button 
                        type="button" 
                        onClick={() => removeSlot(t)} 
                        aria-label={`Remove ${t}`} 
                        style={{ 
                          border: 'none', 
                          background: 'transparent', 
                          color: applyMode === 'always' ? '#065f46' : '#92400e', 
                          cursor: 'pointer', 
                          fontWeight: 700,
                          fontSize: '1rem',
                          lineHeight: 1,
                          padding: 0,
                          marginLeft: '2px'
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Add New Time - Inline */}
            <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input 
                type="time" 
                step={300} 
                value={newTime} 
                onChange={(e) => setNewTime(e.target.value)}
                style={{ 
                  padding: '6px 10px', 
                  borderRadius: '4px', 
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  flex: 1,
                  maxWidth: '140px'
                }}
              />
              <button 
                type="button" 
                className="secondary-button" 
                onClick={addSlot}
                style={{ 
                  background: '#0ea5e9', 
                  color: '#fff', 
                  border: 'none',
                  fontWeight: 600,
                  padding: '6px 14px',
                  fontSize: '0.85rem'
                }}
              >
                + Add
              </button>
            </div>
          </div>
        </div>

        {message && <p className="modal-message info" style={{ textAlign: 'left', marginTop: '12px', padding: '10px', background: '#f0f9ff', border: '1px solid #0ea5e9', borderRadius: '6px', color: '#0369a1', fontSize: '0.85rem' }}>{message}</p>}

        <div className="modal-actions" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
          <button 
            type="button" 
            className="cancel-button" 
            onClick={handleDelete} 
            disabled={loading}
            style={{ background: '#f1f5f9', color: '#475569', fontWeight: 500, fontSize: '0.85rem', padding: '8px 14px' }}
          >
            Remove Override
          </button>
          <button 
            type="button" 
            onClick={handleSave} 
            disabled={loading || !dirty}
            style={{ 
              background: dirty ? (applyMode === 'always' ? '#10b981' : '#3b82f6') : '#cbd5e1', 
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.85rem',
              padding: '8px 20px',
              boxShadow: dirty ? '0 2px 8px rgba(59, 130, 246, 0.3)' : 'none'
            }}
          >
            {loading ? '⏳ Saving...' : '💾 Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
