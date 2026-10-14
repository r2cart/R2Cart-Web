import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  Edit2,
  Eye,
  Globe,
  Info,
  LoaderCircle,
  MapPin,
  Package,
  Plus,
  RefreshCcw,
  Save,
  Search,
  Sparkles,
  Sun,
  Trash2,
  Truck,
  X
} from 'lucide-react';
import { Button, ConfirmDialog, Modal, StatusBadge } from '../../components/ui';
import { useApp } from '../../context/AppContext';
import { adminService } from '../../services/admin.service';

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const slotBlank = {
  label: '',
  startTime: '07:00',
  endTime: '10:00',
  maxOrders: '20',
  cutoffMinutes: '60',
  position: '1',
  status: 'ACTIVE'
};

const seasonalBlank = {
  name: '',
  startDate: '',
  endDate: '',
  openingTime: '08:00',
  closingTime: '20:00',
  priority: '2',
  status: 'ACTIVE'
};

const specialDayBlank = {
  date: '',
  name: '',
  openingTime: '06:00',
  closingTime: '23:00',
  isClosed: false,
  reason: ''
};

export function AdminScheduling() {
  const { notify } = useApp();
  const [tab, setTab] = useState('hours'); // 'hours' | 'seasonal' | 'special' | 'slots' | 'scheduled' | 'preview'
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Store Hours & Weekly Schedule
  const [openingTime, setOpeningTime] = useState('07:00');
  const [closingTime, setClosingTime] = useState('21:00');
  const [prepTimeMinutes, setPrepTimeMinutes] = useState('30');
  const [advanceBookingDays, setAdvanceBookingDays] = useState('4');
  const [sameDayCutoffMinutes, setSameDayCutoffMinutes] = useState('60');
  const [allowAfterHoursScheduledOrders, setAllowAfterHoursScheduledOrders] = useState(true);
  const [isSchedulingEnabled, setIsSchedulingEnabled] = useState(true);
  const [weekdayHours, setWeekdayHours] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);

  // Seasonal Schedules
  const [seasonalList, setSeasonalList] = useState([]);
  const [editSeasonal, setEditSeasonal] = useState(null);
  const [removeSeasonal, setRemoveSeasonal] = useState(null);

  // Special Day Schedules
  const [specialDayList, setSpecialDayList] = useState([]);
  const [editSpecialDay, setEditSpecialDay] = useState(null);
  const [removeSpecialDay, setRemoveSpecialDay] = useState(null);

  // Delivery Slots
  const [slotsList, setSlotsList] = useState([]);
  const [editSlot, setEditSlot] = useState(null);
  const [removeSlot, setRemoveSlot] = useState(null);

  // Scheduled Orders
  const [scheduledOrders, setScheduledOrders] = useState([]);
  const [filterDate, setFilterDate] = useState('');

  // Effective Status & Village Preview
  const [previewResult, setPreviewResult] = useState(null);
  const [previewDate, setPreviewDate] = useState('');
  const [previewTime, setPreviewTime] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  // Village selector for preview
  const [villagesList, setVillagesList] = useState([]);
  const [selectedVillageTarget, setSelectedVillageTarget] = useState('');
  const [villageSearch, setVillageSearch] = useState('');
  const [villagePreviewData, setVillagePreviewData] = useState(null);
  const [villagePreviewLoading, setVillagePreviewLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [scheduleData, seasons, specials, villages] = await Promise.all([
        adminService.getStoreSchedule(),
        adminService.getSeasonalSchedules().catch(() => []),
        adminService.getSpecialDays().catch(() => []),
        adminService.getVillages().catch(() => [])
      ]);

      setOpeningTime(scheduleData.openingTime || '07:00');
      setClosingTime(scheduleData.closingTime || '21:00');
      setPrepTimeMinutes(String(scheduleData.prepTimeMinutes || 30));
      setAdvanceBookingDays(String(scheduleData.advanceBookingDays || 4));
      setSameDayCutoffMinutes(String(scheduleData.sameDayCutoffMinutes || 60));
      setAllowAfterHoursScheduledOrders(scheduleData.allowAfterHoursScheduledOrders ?? true);
      setIsSchedulingEnabled(scheduleData.isSchedulingEnabled ?? true);
      setWeekdayHours(scheduleData.weekdayHours || {});
      setSlotsList(scheduleData.slots || []);
      setSeasonalList(seasons || []);
      setSpecialDayList(specials || []);
      setVillagesList(villages || []);
      setPreviewResult(scheduleData.effectiveStatus || null);
      setLastUpdated(scheduleData.lastUpdated || null);

      if (villages && villages.length > 0 && !selectedVillageTarget) {
        setSelectedVillageTarget(villages[0].id);
      }

      // Load scheduled orders
      const ordersRes = await adminService.getScheduledOrders({ date: filterDate });
      setScheduledOrders(ordersRes.orders || []);
    } catch (err) {
      setError(err.message || 'Failed to load scheduling configuration');
      notify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterDate]);

  // Load village preview whenever selectedVillageTarget changes
  useEffect(() => {
    if (selectedVillageTarget) {
      setVillagePreviewLoading(true);
      adminService.getVillagePreview({ villageId: selectedVillageTarget, date: previewDate, time: previewTime })
        .then(data => setVillagePreviewData(data))
        .catch(() => setVillagePreviewData(null))
        .finally(() => setVillagePreviewLoading(false));
    }
  }, [selectedVillageTarget, previewDate, previewTime]);

  const runPreviewSimulation = async () => {
    setPreviewLoading(true);
    try {
      const result = await adminService.getOperationsPreview({
        date: previewDate || undefined,
        time: previewTime || undefined
      });
      setPreviewResult(result);
      if (selectedVillageTarget) {
        const vResult = await adminService.getVillagePreview({
          villageId: selectedVillageTarget,
          date: previewDate || undefined,
          time: previewTime || undefined
        });
        setVillagePreviewData(vResult);
      }
      notify('Simulation preview updated');
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setPreviewLoading(false);
    }
  };

  const resetPreviewSimulation = async () => {
    setPreviewDate('');
    setPreviewTime('');
    setPreviewLoading(true);
    try {
      const result = await adminService.getOperationsPreview({});
      setPreviewResult(result);
      if (selectedVillageTarget) {
        const vResult = await adminService.getVillagePreview({ villageId: selectedVillageTarget });
        setVillagePreviewData(vResult);
      }
      notify('Reset to current Asia/Kolkata live status');
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setPreviewLoading(false);
    }
  };

  // Save Store Hours & Rules
  const handleSaveHours = async e => {
    e.preventDefault();
    setBusy(true);
    try {
      await adminService.updateStoreHours({
        openingTime,
        closingTime,
        prepTimeMinutes: Number(prepTimeMinutes),
        advanceBookingDays: Number(advanceBookingDays),
        sameDayCutoffMinutes: Number(sameDayCutoffMinutes),
        allowAfterHoursScheduledOrders,
        isSchedulingEnabled,
        weekdayHours
      });
      notify('Store operating hours & rules saved successfully');
      await loadData();
      window.dispatchEvent(new Event('grocify:settings-updated'));
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  // Seasonal Save & Delete
  const handleSaveSeasonal = async e => {
    e.preventDefault();
    setBusy(true);
    try {
      await adminService.saveSeasonalSchedule(editSeasonal);
      notify('Seasonal operating schedule saved');
      setEditSeasonal(null);
      await loadData();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteSeasonal = async () => {
    if (!removeSeasonal) return;
    try {
      await adminService.deleteSeasonalSchedule(removeSeasonal.id);
      setSeasonalList(curr => curr.filter(s => s.id !== removeSeasonal.id));
      setRemoveSeasonal(null);
      notify('Seasonal schedule removed');
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  // Special Day Save & Delete
  const handleSaveSpecialDay = async e => {
    e.preventDefault();
    setBusy(true);
    try {
      await adminService.saveSpecialDay(editSpecialDay);
      notify('Special date schedule saved');
      setEditSpecialDay(null);
      await loadData();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteSpecialDay = async () => {
    if (!removeSpecialDay) return;
    try {
      await adminService.deleteSpecialDay(removeSpecialDay.id);
      setSpecialDayList(curr => curr.filter(s => s.id !== removeSpecialDay.id));
      setRemoveSpecialDay(null);
      notify('Special date schedule removed');
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  // Slot Handlers
  const handleSaveSlot = async e => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        label: editSlot.label,
        startTime: editSlot.startTime,
        endTime: editSlot.endTime,
        maxOrders: Number(editSlot.maxOrders),
        cutoffMinutes: Number(editSlot.cutoffMinutes),
        position: Number(editSlot.position || 0),
        status: editSlot.status || 'ACTIVE'
      };

      if (editSlot.id) {
        await adminService.updateDeliverySlot(editSlot.id, payload);
        notify('Delivery time slot updated');
      } else {
        await adminService.createDeliverySlot(payload);
        notify('Delivery time slot created');
      }
      setEditSlot(null);
      await loadData();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleToggleSlotStatus = async slot => {
    try {
      const nextStatus = slot.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await adminService.updateDeliverySlotStatus(slot.id, nextStatus);
      setSlotsList(curr => curr.map(s => (s.id === slot.id ? { ...s, status: nextStatus } : s)));
      notify(`Slot ${nextStatus === 'ACTIVE' ? 'activated' : 'disabled'}`);
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleDeleteSlot = async () => {
    if (!removeSlot) return;
    try {
      await adminService.deleteDeliverySlot(removeSlot.id);
      setSlotsList(curr => curr.filter(s => s.id !== removeSlot.id));
      setRemoveSlot(null);
      notify('Delivery slot removed');
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const filteredVillages = villagesList.filter(v =>
    v.name.toLowerCase().includes(villageSearch.toLowerCase()) ||
    (v.pincode && v.pincode.includes(villageSearch))
  );

  return (
    <div className="admin-page">
      <div className="admin-title">
        <div>
          <h1>Store Operations & Scheduling</h1>
          <p>Configure regular business hours, weekly operating days, seasonal & festival schedules, delivery slots, and live status preview.</p>
        </div>
        <div className="row gap">
          <Button variant="outline" onClick={loadData} disabled={loading || busy}>
            <RefreshCcw size={15} className={loading ? 'spin' : ''} /> Refresh
          </Button>
          <Button
            variant={tab === 'preview' ? 'primary' : 'outline'}
            onClick={() => setTab('preview')}
          >
            <Compass size={15} /> Effective Status & Preview
          </Button>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="admin-tabs" style={{ marginBottom: '24px' }}>
        <button
          type="button"
          className={tab === 'hours' ? 'active' : ''}
          onClick={() => setTab('hours')}
        >
          <Clock size={16} />
          <span>Operating Hours & Weekly</span>
        </button>

        <button
          type="button"
          className={tab === 'seasonal' ? 'active' : ''}
          onClick={() => setTab('seasonal')}
        >
          <Sun size={16} />
          <span>Seasonal Schedules ({seasonalList.length})</span>
        </button>

        <button
          type="button"
          className={tab === 'special' ? 'active' : ''}
          onClick={() => setTab('special')}
        >
          <Calendar size={16} />
          <span>Special Dates & Festivals ({specialDayList.length})</span>
        </button>

        <button
          type="button"
          className={tab === 'slots' ? 'active' : ''}
          onClick={() => setTab('slots')}
        >
          <CalendarClock size={16} />
          <span>Delivery Slots & Capacity ({slotsList.length})</span>
        </button>

        <button
          type="button"
          className={tab === 'scheduled' ? 'active' : ''}
          onClick={() => setTab('scheduled')}
        >
          <Package size={16} />
          <span>Upcoming Scheduled Orders ({scheduledOrders.length})</span>
        </button>

        <button
          type="button"
          className={tab === 'preview' ? 'active' : ''}
          onClick={() => setTab('preview')}
          style={{ fontWeight: 800, color: 'var(--green)' }}
        >
          <Eye size={16} />
          <span>Effective Status & Village Preview</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OPERATING HOURS & WEEKLY SCHEDULE */}
      {/* ========================================================================= */}
      {tab === 'hours' && (
        <form onSubmit={handleSaveHours} className="form-grid" style={{ gap: '24px' }}>
          {/* General Operating Hours */}
          <div className="admin-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <Clock size={20} style={{ color: 'var(--green)' }} />
              <div>
                <h3 style={{ margin: 0, fontSize: '16px' }}>Default Daily Operating Hours</h3>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>
                  Baseline hours in Asia/Kolkata timezone (Default: 07:00 AM – 09:00 PM). Used when no seasonal or special date rule overrides.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <label>
                <b>Default Opening Time *</b>
                <input
                  required
                  type="time"
                  value={openingTime}
                  onChange={e => setOpeningTime(e.target.value)}
                />
              </label>

              <label>
                <b>Default Closing Time *</b>
                <input
                  required
                  type="time"
                  value={closingTime}
                  onChange={e => setClosingTime(e.target.value)}
                />
              </label>

              <label>
                <b>Minimum Order Prep Time (Minutes)</b>
                <input
                  type="number"
                  min="5"
                  max="180"
                  value={prepTimeMinutes}
                  onChange={e => setPrepTimeMinutes(e.target.value)}
                />
                <small style={{ color: 'var(--muted)' }}>Lead time required to pack before dispatch</small>
              </label>
            </div>
          </div>

          {/* After-Hours Scheduled Ordering Rules */}
          <div className="admin-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <CalendarClock size={20} style={{ color: 'var(--green)' }} />
              <div>
                <h3 style={{ margin: 0, fontSize: '16px' }}>After-Hours & Advance Scheduled Ordering Rules</h3>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>
                  Outside operating hours (e.g. 9 PM – 7 AM), immediate delivery is disabled while customers can place scheduled orders.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              <label className="switch-row" style={{ padding: '12px', border: '1px solid var(--line)', borderRadius: '10px' }}>
                <span>
                  <b>Allow After-Hours Scheduled Ordering</b>
                  <small style={{ display: 'block', color: 'var(--muted)', marginTop: '2px' }}>
                    When store is closed, customers can still place scheduled orders for upcoming delivery slots.
                  </small>
                </span>
                <input
                  type="checkbox"
                  checked={allowAfterHoursScheduledOrders}
                  onChange={e => setAllowAfterHoursScheduledOrders(e.target.checked)}
                />
                <i />
              </label>

              <label className="switch-row" style={{ padding: '12px', border: '1px solid var(--line)', borderRadius: '10px' }}>
                <span>
                  <b>Enable Scheduled Delivery System</b>
                  <small style={{ display: 'block', color: 'var(--muted)', marginTop: '2px' }}>
                    Master switch enabling customer delivery slot selection across the store.
                  </small>
                </span>
                <input
                  type="checkbox"
                  checked={isSchedulingEnabled}
                  onChange={e => setIsSchedulingEnabled(e.target.checked)}
                />
                <i />
              </label>

              <label>
                <b>Advance Booking Window (Days)</b>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={advanceBookingDays}
                  onChange={e => setAdvanceBookingDays(e.target.value)}
                />
                <small style={{ color: 'var(--muted)' }}>How many days in advance customers can book slots (default: 4)</small>
              </label>

              <label>
                <b>Same-Day Slot Cutoff (Minutes Before Slot Start)</b>
                <input
                  type="number"
                  min="0"
                  max="240"
                  value={sameDayCutoffMinutes}
                  onChange={e => setSameDayCutoffMinutes(e.target.value)}
                />
                <small style={{ color: 'var(--muted)' }}>Slots close booking N minutes before start (default: 60 mins)</small>
              </label>
            </div>
          </div>

          {/* Weekday Operating Schedule */}
          <div className="admin-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Calendar size={20} style={{ color: 'var(--green)' }} />
              <div>
                <h3 style={{ margin: 0, fontSize: '16px' }}>Weekday-Specific Operating Hours</h3>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>
                  Override individual weekdays with distinct opening/closing times or mark specific days closed.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {DAYS_OF_WEEK.map(day => {
                const dayConf = weekdayHours[day] || { open: openingTime, close: closingTime, isOpen: true };
                const isOpen = dayConf.isOpen !== false;

                const updateDay = (field, val) => {
                  setWeekdayHours(curr => ({
                    ...curr,
                    [day]: {
                      ...(curr[day] || { open: openingTime, close: closingTime, isOpen: true }),
                      [field]: val
                    }
                  }));
                };

                return (
                  <div
                    key={day}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: '1px solid var(--line)',
                      background: isOpen ? 'transparent' : 'rgba(239, 68, 68, 0.05)'
                    }}
                  >
                    <div style={{ minWidth: '140px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="checkbox"
                        checked={isOpen}
                        onChange={e => updateDay('isOpen', e.target.checked)}
                        id={`check-${day}`}
                      />
                      <label htmlFor={`check-${day}`} style={{ fontWeight: 700, textTransform: 'capitalize', cursor: 'pointer' }}>
                        {day}
                      </label>
                    </div>

                    {isOpen ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Opens:</span>
                        <input
                          type="time"
                          value={dayConf.open || openingTime}
                          onChange={e => updateDay('open', e.target.value)}
                          style={{ width: '130px', padding: '6px 10px' }}
                        />
                        <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Closes:</span>
                        <input
                          type="time"
                          value={dayConf.close || closingTime}
                          onChange={e => updateDay('close', e.target.value)}
                          style={{ width: '130px', padding: '6px 10px' }}
                        />
                      </div>
                    ) : (
                      <span style={{ color: '#ef4444', fontSize: '13px', fontWeight: 600 }}>
                        Store Closed on {day.charAt(0).toUpperCase() + day.slice(1)}s
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <Button type="submit" disabled={busy}>
              {busy ? <LoaderCircle className="spin" size={16} /> : <Save size={16} />}
              Save Store Operations Hours & Rules
            </Button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SEASONAL SCHEDULES */}
      {/* ========================================================================= */}
      {tab === 'seasonal' && (
        <div className="admin-card">
          <div className="between" style={{ marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Seasonal Operating Schedules</h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>
                Configure recurring seasonal hours (e.g. Winter 8 AM – 8 PM, Summer 6 AM – 10 PM, Monsoon). Takes Priority 3 over weekly hours.
              </p>
            </div>
            <Button onClick={() => setEditSeasonal({ ...seasonalBlank })}>
              <Plus size={15} /> Add Seasonal Schedule
            </Button>
          </div>

          {seasonalList.length === 0 ? (
            <p style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
              No seasonal schedules created. Store operates on regular weekly hours year-round.
            </p>
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Season Name</th>
                    <th>Date Range</th>
                    <th>Operating Hours</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {seasonalList.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 700 }}>{s.name}</td>
                      <td>{s.startDate} to {s.endDate}</td>
                      <td>{s.openingTime} – {s.closingTime}</td>
                      <td>Level {s.priority || 1}</td>
                      <td><StatusBadge status={s.status} /></td>
                      <td>
                        <div className="row gap">
                          <Button size="sm" variant="ghost" onClick={() => setEditSeasonal(s)}>
                            <Edit2 size={14} />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-danger" onClick={() => setRemoveSeasonal(s)}>
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SPECIAL DATES & FESTIVALS */}
      {/* ========================================================================= */}
      {tab === 'special' && (
        <div className="admin-card">
          <div className="between" style={{ marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Date-Specific Special & Festival Schedules</h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>
                Configure special hours for specific calendar dates (e.g. Diwali 6 AM – 11 PM, Chhath Puja, Independence Day). Takes Priority 2 over seasonal and weekly rules.
              </p>
            </div>
            <Button onClick={() => setEditSpecialDay({ ...specialDayBlank })}>
              <Plus size={15} /> Add Special Date Schedule
            </Button>
          </div>

          {specialDayList.length === 0 ? (
            <p style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
              No special date schedules configured.
            </p>
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Occasion / Name</th>
                    <th>Operating Hours</th>
                    <th>Store Status</th>
                    <th>Reason / Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {specialDayList.map(sd => (
                    <tr key={sd.id || sd.date}>
                      <td style={{ fontWeight: 700 }}>{sd.date}</td>
                      <td>{sd.name}</td>
                      <td>{sd.isClosed ? '—' : `${sd.openingTime} – ${sd.closingTime}`}</td>
                      <td>
                        <StatusBadge status={sd.isClosed ? 'INACTIVE' : 'ACTIVE'} />
                      </td>
                      <td style={{ color: 'var(--muted)', fontSize: '12px' }}>{sd.reason || 'Special operating schedule'}</td>
                      <td>
                        <div className="row gap">
                          <Button size="sm" variant="ghost" onClick={() => setEditSpecialDay(sd)}>
                            <Edit2 size={14} />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-danger" onClick={() => setRemoveSpecialDay(sd)}>
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: DELIVERY SLOTS & CAPACITY */}
      {/* ========================================================================= */}
      {tab === 'slots' && (
        <div className="admin-card">
          <div className="between" style={{ marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Delivery Time Slots & Capacity Management</h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>
                Set up customer delivery slots, slot duration, max concurrent orders per slot, and booking cutoff limits.
              </p>
            </div>
            <Button onClick={() => setEditSlot({ ...slotBlank })}>
              <Plus size={15} /> Add Delivery Slot
            </Button>
          </div>

          {slotsList.length === 0 ? (
            <p style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
              No delivery slots configured.
            </p>
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Slot Label</th>
                    <th>Timing Window</th>
                    <th>Max Orders Capacity</th>
                    <th>Cutoff Before Start</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {slotsList.map(slot => (
                    <tr key={slot.id}>
                      <td style={{ fontWeight: 700 }}>{slot.label}</td>
                      <td>{slot.startTime} – {slot.endTime}</td>
                      <td><b>{slot.maxOrders} orders</b></td>
                      <td>{slot.cutoffMinutes} mins</td>
                      <td>
                        <StatusBadge status={slot.status} />
                      </td>
                      <td>
                        <div className="row gap">
                          <Button size="sm" variant="ghost" onClick={() => handleToggleSlotStatus(slot)}>
                            {slot.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditSlot(slot)}>
                            <Edit2 size={14} />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-danger" onClick={() => setRemoveSlot(slot)}>
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: UPCOMING SCHEDULED ORDERS */}
      {/* ========================================================================= */}
      {tab === 'scheduled' && (
        <div className="admin-card">
          <div className="between" style={{ marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Upcoming Scheduled Deliveries</h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>
                Manage scheduled orders separately from immediate orders.
              </p>
            </div>
            <div className="row gap">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <span>Filter by Date:</span>
                <input
                  type="date"
                  value={filterDate}
                  onChange={e => setFilterDate(e.target.value)}
                  style={{ padding: '6px 10px' }}
                />
              </label>
              {filterDate && (
                <Button size="sm" variant="ghost" onClick={() => setFilterDate('')}>
                  Clear
                </Button>
              )}
            </div>
          </div>

          {scheduledOrders.length === 0 ? (
            <p style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
              No scheduled orders found {filterDate ? `for ${filterDate}` : 'in the queue'}.
            </p>
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Delivery Date</th>
                    <th>Delivery Slot</th>
                    <th>Items</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduledOrders.map(o => (
                    <tr key={o.id}>
                      <td style={{ fontWeight: 700 }}>#{o.orderNumber}</td>
                      <td>
                        <b>{o.user?.name || o.addressSnapshot?.name || 'Customer'}</b>
                        <small style={{ display: 'block', color: 'var(--muted)' }}>{o.user?.mobile || o.addressSnapshot?.mobile}</small>
                      </td>
                      <td style={{ fontWeight: 600 }}>{o.deliveryDate}</td>
                      <td>
                        <span style={{ padding: '3px 8px', borderRadius: '4px', background: '#e0f2fe', color: '#0369a1', fontSize: '12px', fontWeight: 600 }}>
                          {o.deliverySlot}
                        </span>
                      </td>
                      <td>{o.items?.length || 0} items</td>
                      <td><b>₹{o.grandTotal}</b></td>
                      <td><StatusBadge status={o.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: EFFECTIVE STORE STATUS & VILLAGE DELIVERY PREVIEW (SECTION 9) */}
      {/* ========================================================================= */}
      {tab === 'preview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* SIMULATION CONTROLS */}
          <div className="admin-card" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.95) 100%)', border: '1px solid var(--green)', borderRadius: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Sparkles size={24} style={{ color: 'var(--green)' }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', color: '#f8fafc' }}>
                    Live Rule Precedence & Future Date/Time Simulator
                  </h3>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>
                    Test and verify exactly how store operating rules, emergency pauses, and village overrides evaluate for any given date and time.
                  </p>
                </div>
              </div>

              <div className="row gap">
                <Button size="sm" variant="ghost" onClick={resetPreviewSimulation} disabled={previewLoading}>
                  Reset to Live (Now)
                </Button>
                <Button size="sm" onClick={runPreviewSimulation} disabled={previewLoading}>
                  {previewLoading ? <LoaderCircle className="spin" size={14} /> : <Eye size={14} />} Run Simulation
                </Button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              <label>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc' }}>Simulate Target Date</span>
                <input
                  type="date"
                  value={previewDate}
                  onChange={e => setPreviewDate(e.target.value)}
                  style={{ background: '#0f172a', color: '#fff', border: '1px solid #334155' }}
                />
              </label>

              <label>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc' }}>Simulate Target Time</span>
                <input
                  type="time"
                  value={previewTime}
                  onChange={e => setPreviewTime(e.target.value)}
                  style={{ background: '#0f172a', color: '#fff', border: '1px solid #334155' }}
                />
              </label>

              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  {previewResult?.isTargetingFuture
                    ? `⚠️ Previewing future simulated conditions on ${previewResult.targetDate} at ${previewResult.targetTime}`
                    : '🟢 Showing live real-time conditions (Asia/Kolkata)'}
                </span>
              </div>
            </div>
          </div>

          {/* DASHBOARD 1: EFFECTIVE STORE STATUS */}
          <div className="admin-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Clock size={20} style={{ color: 'var(--green)' }} />
              <div>
                <h3 style={{ margin: 0, fontSize: '16px' }}>Effective Store Status Dashboard</h3>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>
                  Evaluated using Asia/Kolkata deterministic priority: Emergency &gt; Special Date &gt; Seasonal &gt; Weekly &gt; Global Default.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--line)', background: 'rgba(255,255,255,0.02)' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '1px' }}>Current Store Status</span>
                <h2 style={{ margin: '6px 0 0', fontSize: '20px', color: previewResult?.isOpenNow ? '#10b981' : '#ef4444' }}>
                  {previewResult?.status || 'OPEN'}
                </h2>
                <small style={{ color: 'var(--muted)', display: 'block', marginTop: '4px' }}>
                  {previewResult?.statusReason}
                </small>
              </div>

              <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--line)', background: 'rgba(255,255,255,0.02)' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '1px' }}>Effective Operating Hours</span>
                <h2 style={{ margin: '6px 0 0', fontSize: '18px', color: '#f8fafc' }}>
                  {previewResult?.effectiveHours?.openFormatted} – {previewResult?.effectiveHours?.closeFormatted}
                </h2>
                <small style={{ color: 'var(--muted)', display: 'block', marginTop: '4px' }}>
                  {previewResult?.effectiveHours?.isClosedDay ? 'Closed all day' : 'Asia/Kolkata Time'}
                </small>
              </div>

              <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--line)', background: 'rgba(255,255,255,0.02)' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '1px' }}>Active Governing Rule</span>
                <div style={{ margin: '6px 0 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 800,
                      background: previewResult?.ruleSource === 'EMERGENCY' ? '#ef444422' : previewResult?.ruleSource === 'SPECIAL_DATE' ? '#38bdf822' : previewResult?.ruleSource === 'SEASONAL' ? '#f59e0b22' : '#10b98122',
                      color: previewResult?.ruleSource === 'EMERGENCY' ? '#ef4444' : previewResult?.ruleSource === 'SPECIAL_DATE' ? '#38bdf8' : previewResult?.ruleSource === 'SEASONAL' ? '#f59e0b' : '#10b981'
                    }}
                  >
                    {previewResult?.ruleSource}
                  </span>
                </div>
                <small style={{ color: 'var(--muted)', display: 'block', marginTop: '6px' }}>
                  {previewResult?.ruleDetails}
                </small>
              </div>

              <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--line)', background: 'rgba(255,255,255,0.02)' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '1px' }}>Ordering Availability</span>
                <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
                  <span>
                    Immediate Delivery: <b>{previewResult?.allowImmediateOrders ? '🟢 ALLOWED' : '🔴 BLOCKED'}</b>
                  </span>
                  <span>
                    Scheduled Delivery: <b>{previewResult?.allowScheduledOrders ? '🟢 ALLOWED' : '🔴 BLOCKED'}</b>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* DASHBOARD 2: VILLAGE DELIVERY PREVIEW WITH CONFIG SOURCE INDICATORS */}
          <div className="admin-card">
            <div className="between" style={{ marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MapPin size={20} style={{ color: 'var(--green)' }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px' }}>Village Delivery Rules Preview</h3>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>
                    Search and select any village to preview applied delivery fees, min orders, COD availability, and exact configuration source badges.
                  </p>
                </div>
              </div>

              {/* SEARCHABLE VILLAGE SELECTOR */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '280px' }}>
                <select
                  value={selectedVillageTarget}
                  onChange={e => setSelectedVillageTarget(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px' }}
                >
                  <option value="">-- Choose Village to Preview --</option>
                  {villagesList.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.overrideMode === 'PARTIAL' ? 'Mode B: Partial Override' : 'Mode A: Complete Override'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {villagePreviewLoading ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <LoaderCircle className="spin" size={24} style={{ color: 'var(--green)', margin: '0 auto' }} />
                <p style={{ color: 'var(--muted)', marginTop: '8px' }}>Resolving effective village rules...</p>
              </div>
            ) : !villagePreviewData ? (
              <p style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
                Select a village above to preview its effective delivery rules and source indicators.
              </p>
            ) : (
              <div>
                {/* Village Summary Bar */}
                <div
                  style={{
                    padding: '14px 18px',
                    borderRadius: '10px',
                    background: villagePreviewData.isServiceable ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                    border: `1px solid ${villagePreviewData.isServiceable ? '#10b981' : '#ef4444'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    marginBottom: '20px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <b style={{ fontSize: '16px' }}>{villagePreviewData.villageName}</b>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: villagePreviewData.overrideMode === 'PARTIAL' ? '#e0f2fe' : '#fef3c7',
                          color: villagePreviewData.overrideMode === 'PARTIAL' ? '#0369a1' : '#b45309'
                        }}
                      >
                        {villagePreviewData.overrideMode === 'PARTIAL' ? 'Mode B: Partial Field Override' : 'Mode A: Complete Village Override'}
                      </span>
                    </div>
                    <small style={{ color: 'var(--muted)' }}>
                      Serviceability: {villagePreviewData.isServiceable ? 'Serviceable' : 'Unavailable'} ({villagePreviewData.unserviceableReason || 'Active'})
                    </small>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 700,
                        background: villagePreviewData.isServiceable ? '#10b981' : '#ef4444',
                        color: '#fff'
                      }}
                    >
                      {villagePreviewData.isServiceable ? 'DELIVERY OPEN' : 'DELIVERY PAUSED'}
                    </span>
                  </div>
                </div>

                {/* Grid of Effective Settings with Source Indicators */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  {/* Delivery Fee */}
                  <div style={{ padding: '14px', borderRadius: '10px', border: '1px solid var(--line)', background: 'rgba(255,255,255,0.02)' }}>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--muted)' }}>Delivery Charge</span>
                    <h3 style={{ margin: '6px 0 4px', fontSize: '18px' }}>₹{villagePreviewData.deliveryFee}</h3>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: villagePreviewData.sourceIndicators?.deliveryFee === 'VILLAGE_OVERRIDE' ? '#fef3c7' : '#e2e8f0',
                        color: villagePreviewData.sourceIndicators?.deliveryFee === 'VILLAGE_OVERRIDE' ? '#b45309' : '#475569'
                      }}
                    >
                      {villagePreviewData.sourceIndicators?.deliveryFee === 'VILLAGE_OVERRIDE' ? 'Village Override' : 'Global Default'}
                    </span>
                  </div>

                  {/* Min Order */}
                  <div style={{ padding: '14px', borderRadius: '10px', border: '1px solid var(--line)', background: 'rgba(255,255,255,0.02)' }}>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--muted)' }}>Minimum Order</span>
                    <h3 style={{ margin: '6px 0 4px', fontSize: '18px' }}>₹{villagePreviewData.minimumOrder}</h3>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: villagePreviewData.sourceIndicators?.minimumOrder === 'VILLAGE_OVERRIDE' ? '#fef3c7' : '#e2e8f0',
                        color: villagePreviewData.sourceIndicators?.minimumOrder === 'VILLAGE_OVERRIDE' ? '#b45309' : '#475569'
                      }}
                    >
                      {villagePreviewData.sourceIndicators?.minimumOrder === 'VILLAGE_OVERRIDE' ? 'Village Override' : 'Global Default'}
                    </span>
                  </div>

                  {/* Free Threshold */}
                  <div style={{ padding: '14px', borderRadius: '10px', border: '1px solid var(--line)', background: 'rgba(255,255,255,0.02)' }}>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--muted)' }}>Free Delivery Above</span>
                    <h3 style={{ margin: '6px 0 4px', fontSize: '18px' }}>₹{villagePreviewData.freeDeliveryThreshold}</h3>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: villagePreviewData.sourceIndicators?.freeDeliveryThreshold === 'VILLAGE_OVERRIDE' ? '#fef3c7' : '#e2e8f0',
                        color: villagePreviewData.sourceIndicators?.freeDeliveryThreshold === 'VILLAGE_OVERRIDE' ? '#b45309' : '#475569'
                      }}
                    >
                      {villagePreviewData.sourceIndicators?.freeDeliveryThreshold === 'VILLAGE_OVERRIDE' ? 'Village Override' : 'Global Default'}
                    </span>
                  </div>

                  {/* Estimated Delivery Time */}
                  <div style={{ padding: '14px', borderRadius: '10px', border: '1px solid var(--line)', background: 'rgba(255,255,255,0.02)' }}>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--muted)' }}>Estimated Delivery</span>
                    <h3 style={{ margin: '6px 0 4px', fontSize: '18px' }}>{villagePreviewData.estimatedDelivery}</h3>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: villagePreviewData.sourceIndicators?.estimatedDelivery === 'VILLAGE_OVERRIDE' ? '#fef3c7' : '#e2e8f0',
                        color: villagePreviewData.sourceIndicators?.estimatedDelivery === 'VILLAGE_OVERRIDE' ? '#b45309' : '#475569'
                      }}
                    >
                      {villagePreviewData.sourceIndicators?.estimatedDelivery === 'VILLAGE_OVERRIDE' ? 'Village Override' : 'Global Default'}
                    </span>
                  </div>

                  {/* COD Availability */}
                  <div style={{ padding: '14px', borderRadius: '10px', border: '1px solid var(--line)', background: 'rgba(255,255,255,0.02)' }}>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--muted)' }}>Cash on Delivery</span>
                    <h3 style={{ margin: '6px 0 4px', fontSize: '18px', color: villagePreviewData.allowCod ? '#10b981' : '#ef4444' }}>
                      {villagePreviewData.allowCod ? 'Allowed' : 'Disabled'}
                    </h3>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: villagePreviewData.sourceIndicators?.allowCod === 'VILLAGE_OVERRIDE' ? '#fef3c7' : '#e2e8f0',
                        color: villagePreviewData.sourceIndicators?.allowCod === 'VILLAGE_OVERRIDE' ? '#b45309' : '#475569'
                      }}
                    >
                      {villagePreviewData.sourceIndicators?.allowCod === 'VILLAGE_OVERRIDE' ? 'Village Override' : 'Global Default'}
                    </span>
                  </div>

                  {/* Service Radius */}
                  <div style={{ padding: '14px', borderRadius: '10px', border: '1px solid var(--line)', background: 'rgba(255,255,255,0.02)' }}>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--muted)' }}>Service Radius Boundary</span>
                    <h3 style={{ margin: '6px 0 4px', fontSize: '18px' }}>{villagePreviewData.radiusKm} km</h3>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: villagePreviewData.sourceIndicators?.radiusKm === 'VILLAGE_OVERRIDE' ? '#fef3c7' : '#e2e8f0',
                        color: villagePreviewData.sourceIndicators?.radiusKm === 'VILLAGE_OVERRIDE' ? '#b45309' : '#475569'
                      }}
                    >
                      {villagePreviewData.sourceIndicators?.radiusKm === 'VILLAGE_OVERRIDE' ? 'Village Override' : 'Global Default'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* EDIT SEASONAL MODAL */}
      <Modal open={Boolean(editSeasonal)} onClose={() => setEditSeasonal(null)} title={editSeasonal?.id ? 'Edit Seasonal Schedule' : 'Create Seasonal Schedule'}>
        {editSeasonal && (
          <form onSubmit={handleSaveSeasonal} className="modal-body form-grid">
            <label>
              <b>Season Name *</b>
              <input
                required
                value={editSeasonal.name}
                onChange={e => setEditSeasonal({ ...editSeasonal, name: e.target.value })}
                placeholder="e.g. Winter Schedule"
              />
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <label>
                <b>Start Date *</b>
                <input
                  required
                  type="date"
                  value={editSeasonal.startDate}
                  onChange={e => setEditSeasonal({ ...editSeasonal, startDate: e.target.value })}
                />
              </label>

              <label>
                <b>End Date *</b>
                <input
                  required
                  type="date"
                  value={editSeasonal.endDate}
                  onChange={e => setEditSeasonal({ ...editSeasonal, endDate: e.target.value })}
                />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <label>
                <b>Opening Time *</b>
                <input
                  required
                  type="time"
                  value={editSeasonal.openingTime}
                  onChange={e => setEditSeasonal({ ...editSeasonal, openingTime: e.target.value })}
                />
              </label>

              <label>
                <b>Closing Time *</b>
                <input
                  required
                  type="time"
                  value={editSeasonal.closingTime}
                  onChange={e => setEditSeasonal({ ...editSeasonal, closingTime: e.target.value })}
                />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <label>
                <b>Priority Level</b>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={editSeasonal.priority}
                  onChange={e => setEditSeasonal({ ...editSeasonal, priority: e.target.value })}
                />
              </label>

              <label>
                <b>Status</b>
                <select
                  value={editSeasonal.status}
                  onChange={e => setEditSeasonal({ ...editSeasonal, status: e.target.value })}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </label>
            </div>

            <div className="row end gap" style={{ marginTop: '12px' }}>
              <Button type="button" variant="ghost" onClick={() => setEditSeasonal(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                Save Seasonal Schedule
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* EDIT SPECIAL DAY MODAL */}
      <Modal open={Boolean(editSpecialDay)} onClose={() => setEditSpecialDay(null)} title={editSpecialDay?.id ? 'Edit Special Date Schedule' : 'Create Special Date Schedule'}>
        {editSpecialDay && (
          <form onSubmit={handleSaveSpecialDay} className="modal-body form-grid">
            <label>
              <b>Calendar Date *</b>
              <input
                required
                type="date"
                value={editSpecialDay.date}
                onChange={e => setEditSpecialDay({ ...editSpecialDay, date: e.target.value })}
              />
            </label>

            <label>
              <b>Occasion / Special Schedule Name *</b>
              <input
                required
                value={editSpecialDay.name}
                onChange={e => setEditSpecialDay({ ...editSpecialDay, name: e.target.value })}
                placeholder="e.g. Diwali Extended Hours / Independence Day"
              />
            </label>

            <label className="switch-row" style={{ padding: '8px 12px', border: '1px solid var(--line)', borderRadius: '8px' }}>
              <span>
                <b>Store Completely Closed on this Date</b>
                <small style={{ display: 'block', color: 'var(--muted)' }}>No immediate deliveries will take place.</small>
              </span>
              <input
                type="checkbox"
                checked={editSpecialDay.isClosed}
                onChange={e => setEditSpecialDay({ ...editSpecialDay, isClosed: e.target.checked })}
              />
              <i />
            </label>

            {!editSpecialDay.isClosed && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label>
                  <b>Opening Time *</b>
                  <input
                    required
                    type="time"
                    value={editSpecialDay.openingTime}
                    onChange={e => setEditSpecialDay({ ...editSpecialDay, openingTime: e.target.value })}
                  />
                </label>

                <label>
                  <b>Closing Time *</b>
                  <input
                    required
                    type="time"
                    value={editSpecialDay.closingTime}
                    onChange={e => setEditSpecialDay({ ...editSpecialDay, closingTime: e.target.value })}
                  />
                </label>
              </div>
            )}

            <label>
              <b>Reason / Notes</b>
              <input
                value={editSpecialDay.reason || ''}
                onChange={e => setEditSpecialDay({ ...editSpecialDay, reason: e.target.value })}
                placeholder="e.g. Festival peak demand extension"
              />
            </label>

            <div className="row end gap" style={{ marginTop: '12px' }}>
              <Button type="button" variant="ghost" onClick={() => setEditSpecialDay(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                Save Special Date Schedule
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* EDIT DELIVERY SLOT MODAL */}
      <Modal open={Boolean(editSlot)} onClose={() => setEditSlot(null)} title={editSlot?.id ? 'Edit Delivery Slot' : 'Create Delivery Slot'}>
        {editSlot && (
          <form onSubmit={handleSaveSlot} className="modal-body form-grid">
            <label>
              <b>Slot Label *</b>
              <input
                required
                value={editSlot.label}
                onChange={e => setEditSlot({ ...editSlot, label: e.target.value })}
                placeholder="e.g. Morning Slot (07:00 AM – 10:00 AM)"
              />
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <label>
                <b>Start Time (HH:MM) *</b>
                <input
                  required
                  type="time"
                  value={editSlot.startTime}
                  onChange={e => setEditSlot({ ...editSlot, startTime: e.target.value })}
                />
              </label>

              <label>
                <b>End Time (HH:MM) *</b>
                <input
                  required
                  type="time"
                  value={editSlot.endTime}
                  onChange={e => setEditSlot({ ...editSlot, endTime: e.target.value })}
                />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <label>
                <b>Max Orders Capacity *</b>
                <input
                  required
                  type="number"
                  min="1"
                  max="500"
                  value={editSlot.maxOrders}
                  onChange={e => setEditSlot({ ...editSlot, maxOrders: e.target.value })}
                />
                <small style={{ color: 'var(--muted)' }}>Slots close when this limit is booked</small>
              </label>

              <label>
                <b>Cutoff Minutes Before Start *</b>
                <input
                  required
                  type="number"
                  min="0"
                  max="360"
                  value={editSlot.cutoffMinutes}
                  onChange={e => setEditSlot({ ...editSlot, cutoffMinutes: e.target.value })}
                />
                <small style={{ color: 'var(--muted)' }}>Close booking N mins before start</small>
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <label>
                <b>Display Position / Sequence</b>
                <input
                  type="number"
                  value={editSlot.position || 1}
                  onChange={e => setEditSlot({ ...editSlot, position: e.target.value })}
                />
              </label>

              <label>
                <b>Status</b>
                <select
                  value={editSlot.status}
                  onChange={e => setEditSlot({ ...editSlot, status: e.target.value })}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </label>
            </div>

            <div className="row end gap" style={{ marginTop: '12px' }}>
              <Button type="button" variant="ghost" onClick={() => setEditSlot(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                Save Delivery Slot
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* CONFIRM DELETE DIALOGS */}
      <ConfirmDialog
        open={Boolean(removeSeasonal)}
        onClose={() => setRemoveSeasonal(null)}
        onConfirm={handleDeleteSeasonal}
        title="Delete Seasonal Schedule?"
        message={`Are you sure you want to remove seasonal schedule "${removeSeasonal?.name}"? Store will revert to weekly operating rules.`}
      />

      <ConfirmDialog
        open={Boolean(removeSpecialDay)}
        onClose={() => setRemoveSpecialDay(null)}
        onConfirm={handleDeleteSpecialDay}
        title="Delete Special Date Schedule?"
        message={`Are you sure you want to remove special date "${removeSpecialDay?.date}" (${removeSpecialDay?.name})?`}
      />

      <ConfirmDialog
        open={Boolean(removeSlot)}
        onClose={() => setRemoveSlot(null)}
        onConfirm={handleDeleteSlot}
        title="Delete Delivery Slot?"
        message={`Are you sure you want to delete delivery slot "${removeSlot?.label}"? Existing booked orders will not be lost.`}
      />
    </div>
  );
}
