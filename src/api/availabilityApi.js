import { API_BASE_URL } from './bookingApi';

// Get override for a specific date and consultType
export const getAvailabilityOverride = async (date, consultType) => {
  const qs = new URLSearchParams({ date, consultType });
  const res = await fetch(`${API_BASE_URL}/availability/override?${qs.toString()}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch override');
  return data.override || null;
};

// Create/update override for a specific date/consultType
export const upsertAvailabilityOverride = async ({ date, consultType, closed, slots, applyMode = 'once' }) => {
  const res = await fetch(`${API_BASE_URL}/availability/override`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date, consultType, closed, slots, applyMode }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to save override');
  return data;
};

// Remove override (revert to default schedule)
export const deleteAvailabilityOverride = async (date, consultType) => {
  const qs = new URLSearchParams({ date, consultType });
  const res = await fetch(`${API_BASE_URL}/availability/override?${qs.toString()}`, { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to delete override');
  return true;
};

// Get the default (non-overridden, non-booked) slots for a date/type
export const getDefaultSlots = async (date, consultType) => {
  const qs = new URLSearchParams({ date, consultType });
  const res = await fetch(`${API_BASE_URL}/availability/default-slots?${qs.toString()}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch default slots');
  return data.slots || [];
};

// Get the actual available slots (with overrides and bookings applied) for a date/type
// This is what patients see when booking
export const getActualAvailableSlots = async (date, consultType) => {
  const qs = new URLSearchParams({ date, consultType });
  const res = await fetch(`${API_BASE_URL}/slots?${qs.toString()}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch available slots');
  return data.availableSlots || [];
};
