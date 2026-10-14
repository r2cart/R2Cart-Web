import React, { useState } from 'react';
import { AlertOctagon, CheckCircle2, Clock, Calendar, ShieldAlert, Sparkles, X, Plus } from 'lucide-react';
import { Button } from '../ui';
import { adminService } from '../../services/admin.service';

const PAUSE_REASONS = [
  'Heavy Rain & Waterlogging in Hathua Delivery Area',
  'Peak Order Surge — Temporary Store Rush Hour Pause',
  'Night Hours Pause — Dark Store Restocking in Progress',
  'Dark Store Technical & Inventory Audit',
  'Severe Weather / Local Road Advisory'
];

export function EmergencyPauseManager({ storeSettings, onUpdated, notify }) {
  const pause = storeSettings?.policies?.emergencyPause || {};
  const isCurrentlyPaused = Boolean(pause.isPaused);

  const [isPaused, setIsPaused] = useState(isCurrentlyPaused);
  const [reason, setReason] = useState(pause.reason || PAUSE_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [message, setMessage] = useState(pause.message || '');
  const [resumesAt, setResumesAt] = useState(pause.resumesAt ? new Date(pause.resumesAt).toISOString().slice(0, 16) : '');
  const [holidayDates, setHolidayDates] = useState(Array.isArray(pause.holidayDates) ? pause.holidayDates : []);
  const [newHoliday, setNewHoliday] = useState('');
  const [saving, setSaving] = useState(false);

  const setResumesInMinutes = (mins) => {
    const target = new Date(Date.now() + mins * 60 * 1000);
    // Format to YYYY-MM-DDTHH:mm
    const tzOffset = target.getTimezoneOffset() * 60000;
    const localISOTime = new Date(target.getTime() - tzOffset).toISOString().slice(0, 16);
    setResumesAt(localISOTime);
  };

  const addHoliday = () => {
    if (!newHoliday) return;
    if (holidayDates.includes(newHoliday)) {
      notify('This date is already marked as a store holiday', 'error');
      return;
    }
    setHolidayDates(prev => [...prev, newHoliday].sort());
    setNewHoliday('');
  };

  const removeHoliday = (date) => {
    setHolidayDates(prev => prev.filter(d => d !== date));
  };

  const handleSave = async (overridePausedState) => {
    const activePaused = overridePausedState !== undefined ? overridePausedState : isPaused;
    setSaving(true);
    try {
      const selectedReason = reason === 'custom' ? customReason.trim() : reason;
      const defaultMsg = activePaused
        ? `Store is temporarily closed for new orders due to ${selectedReason || 'high demand'}. Please check back shortly.`
        : '';
      const payload = {
        isPaused: activePaused,
        reason: selectedReason || null,
        message: message.trim() || (activePaused ? defaultMsg : null),
        resumesAt: resumesAt ? new Date(resumesAt).toISOString() : null,
        holidayDates
      };
      const res = await adminService.setEmergencyPause(payload);
      if (overridePausedState !== undefined) {
        setIsPaused(overridePausedState);
      }
      if (onUpdated) onUpdated(res);
      window.dispatchEvent(new Event('grocify:settings-updated'));
      notify(activePaused ? '🚨 Store orders PAUSED. Customers cannot place new orders.' : '🟢 Store orders RESUMED successfully.');
    } catch (err) {
      notify(err.message || 'Failed to update store pause status', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-card" style={{ border: isCurrentlyPaused ? '2px solid #ef4444' : '1px solid rgba(255,255,255,0.1)', background: isCurrentlyPaused ? 'linear-gradient(180deg, rgba(239, 68, 68, 0.08) 0%, rgba(15, 23, 42, 0.95) 100%)' : undefined, borderRadius: '14px', marginBottom: '24px' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: isCurrentlyPaused ? '#ef4444' : '#10b981',
            color: '#fff',
            boxShadow: isCurrentlyPaused ? '0 0 20px rgba(239, 68, 68, 0.5)' : '0 0 20px rgba(16, 185, 129, 0.35)'
          }}>
            {isCurrentlyPaused ? <AlertOctagon size={24} /> : <CheckCircle2 size={24} />}
          </span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', color: '#f8fafc' }}>
                Emergency Store Pause Switch & Holidays
              </h3>
              <span style={{
                fontSize: '11px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '6px',
                background: isCurrentlyPaused ? '#ef4444' : '#10b981',
                color: '#fff',
                letterSpacing: '0.5px'
              }}>
                {isCurrentlyPaused ? 'STORE PAUSED' : 'ONLINE & ACCEPTING'}
              </span>
            </div>
            <p style={{ margin: '3px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>
              Instantly toggle taking new customer orders during heavy rain, kitchen rush, or scheduled holidays.
            </p>
          </div>
        </div>

        {/* Quick Instant Toggle */}
        <div>
          {isCurrentlyPaused ? (
            <Button
              variant="primary"
              disabled={saving}
              onClick={() => handleSave(false)}
              style={{ background: '#10b981', borderColor: '#10b981', fontWeight: 700 }}
            >
              <CheckCircle2 size={16} />
              <span>Resume Store Ordering Now</span>
            </Button>
          ) : (
            <Button
              variant="primary"
              disabled={saving}
              onClick={() => handleSave(true)}
              style={{ background: '#ef4444', borderColor: '#ef4444', fontWeight: 700 }}
            >
              <AlertOctagon size={16} />
              <span>Pause Orders Immediately</span>
            </Button>
          )}
        </div>
      </div>

      {/* Emergency Settings Controls */}
      <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {/* Left Column: Reasons & Timing */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '8px' }}>
            1. Reason for Pause (Select or Custom):
          </label>
          <select
            value={reason}
            onChange={e => setReason(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '13px', marginBottom: '8px' }}
          >
            {PAUSE_REASONS.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
            <option value="custom">Other / Custom Reason…</option>
          </select>

          {reason === 'custom' && (
            <input
              type="text"
              placeholder="Enter custom reason..."
              value={customReason}
              onChange={e => setCustomReason(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '13px', marginBottom: '12px' }}
            />
          )}

          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#cbd5e1', margin: '14px 0 8px' }}>
            2. Expected Resumption Time:
          </label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
            <button type="button" className="btn btn-outline" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={() => setResumesInMinutes(30)}>+30 Mins</button>
            <button type="button" className="btn btn-outline" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={() => setResumesInMinutes(60)}>+1 Hour</button>
            <button type="button" className="btn btn-outline" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={() => setResumesInMinutes(120)}>+2 Hours</button>
            <button type="button" className="btn btn-outline" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={() => setResumesAt('')}>Clear Time</button>
          </div>
          <input
            type="datetime-local"
            value={resumesAt}
            onChange={e => setResumesAt(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '13px' }}
          />

          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#cbd5e1', margin: '14px 0 8px' }}>
            3. Customer Announcement Message (Shown in Header & Checkout):
          </label>
          <textarea
            rows="2"
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="e.g. Due to heavy waterlogging, deliveries in Hathua are temporarily paused. We expect to resume in 45 minutes."
            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '13px' }}
          />
        </div>

        {/* Right Column: Store Holidays Management */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '8px' }}>
            4. Store Holiday & Closed Dates (Disables Scheduled Delivery):
          </label>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 10px 0' }}>
            Customers will not be allowed to choose scheduled delivery slots on these dates.
          </p>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input
              type="date"
              value={newHoliday}
              onChange={e => setNewHoliday(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '13px' }}
            />
            <Button type="button" variant="outline" onClick={addHoliday} disabled={!newHoliday}>
              <Plus size={16} /> Add Holiday
            </Button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', minHeight: '40px', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
            {holidayDates.length === 0 ? (
              <span style={{ fontSize: '12px', color: '#64748b' }}>No upcoming holidays configured.</span>
            ) : (
              holidayDates.map(dateStr => (
                <span
                  key={dateStr}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#1e293b',
                    border: '1px solid rgba(255,255,255,0.15)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#f8fafc'
                  }}
                >
                  <Calendar size={13} color="#f59e0b" />
                  <b>{dateStr}</b>
                  <button
                    type="button"
                    onClick={() => removeHoliday(dateStr)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 2px' }}
                  >
                    <X size={14} />
                  </button>
                </span>
              ))
            )}
          </div>

          {/* Live Preview of Storefront Banner */}
          <div style={{ marginTop: '16px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '12px' }}>
            <span style={{ fontSize: '10px', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>
              Customer View Live Preview
            </span>
            <p style={{ margin: 0, fontSize: '12px', color: '#f8fafc', lineHeight: 1.4 }}>
              🚨 <b>Store Notice:</b> {message || `Store is temporarily closed for new orders due to ${reason === 'custom' ? customReason || 'maintenance' : reason}.`}
              {resumesAt && <span> Resumes at: <b>{new Date(resumesAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</b></span>}
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div style={{ marginTop: '18px', display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <Button
          type="button"
          variant="primary"
          disabled={saving}
          onClick={() => handleSave()}
          style={{ background: isPaused ? '#ef4444' : '#10b981', borderColor: isPaused ? '#ef4444' : '#10b981' }}
        >
          {saving ? 'Saving...' : `Save Pause & Holiday Configuration`}
        </Button>
      </div>
    </div>
  );
}
