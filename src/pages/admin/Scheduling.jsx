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
    <div className="scheduling-page-wrap">
      {/* Modern Hero Banner */}
      <div className="scheduling-hero-banner">
        <div className="scheduling-hero-content">
          <div className="scheduling-hero-pill">
            <CalendarClock size={13} />
            <span>Store Operations Engine</span>
          </div>
          <h1 className="scheduling-hero-title">Store Operations & Scheduling</h1>
          <p className="scheduling-hero-desc">
            Configure baseline operating hours, customize weekday schedules, set festive & seasonal timings, regulate delivery slot capacity, and simulate live rule precedence.
          </p>
        </div>
        <div className="scheduling-hero-actions">
          <button
            type="button"
            className="scheduling-btn-ghost"
            onClick={loadData}
            disabled={loading || busy}
            title="Refresh store schedules"
          >
            <RefreshCcw size={15} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            className="scheduling-btn-primary"
            onClick={() => setTab('preview')}
          >
            <Compass size={15} />
            <span>Live Status & Simulator</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="scheduling-stats-grid">
        <div className="scheduling-stat-card">
          <div className="scheduling-stat-icon-wrap emerald">
            <Clock size={22} />
          </div>
          <div className="scheduling-stat-info">
            <span className="scheduling-stat-label">Daily Operating Hours</span>
            <span className="scheduling-stat-value" style={{ fontSize: '18px' }}>
              {openingTime} – {closingTime}
            </span>
            <span className="scheduling-stat-sub">
              {isSchedulingEnabled ? '● Ordering Enabled' : '○ Ordering Paused'}
            </span>
          </div>
        </div>

        <div className="scheduling-stat-card">
          <div className="scheduling-stat-icon-wrap blue">
            <Truck size={22} />
          </div>
          <div className="scheduling-stat-info">
            <span className="scheduling-stat-label">Delivery Time Slots</span>
            <span className="scheduling-stat-value">{slotsList.length} Slots</span>
            <span className="scheduling-stat-sub">Configured capacity windows</span>
          </div>
        </div>

        <div className="scheduling-stat-card">
          <div className="scheduling-stat-icon-wrap amber">
            <Package size={22} />
          </div>
          <div className="scheduling-stat-info">
            <span className="scheduling-stat-label">Scheduled Deliveries</span>
            <span className="scheduling-stat-value">{scheduledOrders.length} Orders</span>
            <span className="scheduling-stat-sub">Upcoming slot queue</span>
          </div>
        </div>

        <div className="scheduling-stat-card">
          <div className="scheduling-stat-icon-wrap purple">
            <Sun size={22} />
          </div>
          <div className="scheduling-stat-info">
            <span className="scheduling-stat-label">Active Overrides</span>
            <span className="scheduling-stat-value">{seasonalList.length + specialDayList.length} Rules</span>
            <span className="scheduling-stat-sub">Seasonal & festival dates</span>
          </div>
        </div>
      </div>

      {/* Segmented Navigation Tabs */}
      <div className="scheduling-tabs-bar">
        <button
          type="button"
          className={`scheduling-tab-item ${tab === 'hours' ? 'active' : ''}`}
          onClick={() => setTab('hours')}
        >
          <Clock size={15} />
          <span>Operating Hours & Weekly</span>
        </button>

        <button
          type="button"
          className={`scheduling-tab-item ${tab === 'seasonal' ? 'active' : ''}`}
          onClick={() => setTab('seasonal')}
        >
          <Sun size={15} />
          <span>Seasonal Schedules</span>
          <span className="scheduling-tab-counter">{seasonalList.length}</span>
        </button>

        <button
          type="button"
          className={`scheduling-tab-item ${tab === 'special' ? 'active' : ''}`}
          onClick={() => setTab('special')}
        >
          <Calendar size={15} />
          <span>Special Dates & Festivals</span>
          <span className="scheduling-tab-counter">{specialDayList.length}</span>
        </button>

        <button
          type="button"
          className={`scheduling-tab-item ${tab === 'slots' ? 'active' : ''}`}
          onClick={() => setTab('slots')}
        >
          <CalendarClock size={15} />
          <span>Delivery Slots & Capacity</span>
          <span className="scheduling-tab-counter">{slotsList.length}</span>
        </button>

        <button
          type="button"
          className={`scheduling-tab-item ${tab === 'scheduled' ? 'active' : ''}`}
          onClick={() => setTab('scheduled')}
        >
          <Package size={15} />
          <span>Upcoming Scheduled Deliveries</span>
          <span className="scheduling-tab-counter">{scheduledOrders.length}</span>
        </button>

        <button
          type="button"
          className={`scheduling-tab-item ${tab === 'preview' ? 'active' : ''}`}
          onClick={() => setTab('preview')}
        >
          <Eye size={15} />
          <span>Live Precedence & Simulator</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OPERATING HOURS & WEEKLY SCHEDULE */}
      {/* ========================================================================= */}
      {tab === 'hours' && (
        <form onSubmit={handleSaveHours} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Card 1: Baseline Operating Hours */}
          <div className="scheduling-card">
            <div className="scheduling-card-head">
              <div className="scheduling-card-title-group">
                <div className="scheduling-card-icon">
                  <Clock size={20} />
                </div>
                <div>
                  <h3>Default Daily Operating Hours</h3>
                  <p>Baseline hours in Asia/Kolkata timezone. Applied automatically when no seasonal or holiday rule overrides.</p>
                </div>
              </div>
            </div>

            <div className="scheduling-form-grid">
              <div className="scheduling-input-box">
                <label>Opening Time *</label>
                <input
                  required
                  type="time"
                  value={openingTime}
                  onChange={e => setOpeningTime(e.target.value)}
                />
                <span className="scheduling-input-hint">Default store daily opening time</span>
              </div>

              <div className="scheduling-input-box">
                <label>Closing Time *</label>
                <input
                  required
                  type="time"
                  value={closingTime}
                  onChange={e => setClosingTime(e.target.value)}
                />
                <span className="scheduling-input-hint">Default store daily closing time</span>
              </div>

              <div className="scheduling-input-box">
                <label>Minimum Order Prep Time (Minutes)</label>
                <input
                  type="number"
                  min="5"
                  max="180"
                  value={prepTimeMinutes}
                  onChange={e => setPrepTimeMinutes(e.target.value)}
                />
                <span className="scheduling-input-hint">Required buffer to pack items before dispatch</span>
              </div>
            </div>
          </div>

          {/* Card 2: After-Hours & Scheduled Ordering Rules */}
          <div className="scheduling-card">
            <div className="scheduling-card-head">
              <div className="scheduling-card-title-group">
                <div className="scheduling-card-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                  <CalendarClock size={20} />
                </div>
                <div>
                  <h3>After-Hours & Advance Scheduled Ordering Rules</h3>
                  <p>Configure customer experience when the store is closed and set slot booking windows.</p>
                </div>
              </div>
            </div>

            <div className="scheduling-form-grid">
              <div
                className={`scheduling-toggle-card ${allowAfterHoursScheduledOrders ? 'active' : ''}`}
                onClick={() => setAllowAfterHoursScheduledOrders(!allowAfterHoursScheduledOrders)}
              >
                <div className="scheduling-toggle-info">
                  <span className="scheduling-toggle-title">Allow After-Hours Scheduled Orders</span>
                  <span className="scheduling-toggle-sub">
                    When the store is closed, customers can still place orders scheduled for upcoming delivery slots.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={allowAfterHoursScheduledOrders}
                  onChange={e => setAllowAfterHoursScheduledOrders(e.target.checked)}
                  onClick={e => e.stopPropagation()}
                  style={{ width: '18px', height: '18px', accentColor: '#10b981', cursor: 'pointer' }}
                />
              </div>

              <div
                className={`scheduling-toggle-card ${isSchedulingEnabled ? 'active' : ''}`}
                onClick={() => setIsSchedulingEnabled(!isSchedulingEnabled)}
              >
                <div className="scheduling-toggle-info">
                  <span className="scheduling-toggle-title">Enable Scheduled Delivery System</span>
                  <span className="scheduling-toggle-sub">
                    Master switch enabling customer delivery slot selection across the storefront.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isSchedulingEnabled}
                  onChange={e => setIsSchedulingEnabled(e.target.checked)}
                  onClick={e => e.stopPropagation()}
                  style={{ width: '18px', height: '18px', accentColor: '#10b981', cursor: 'pointer' }}
                />
              </div>
            </div>

            <div className="scheduling-form-grid" style={{ marginTop: '4px' }}>
              <div className="scheduling-input-box">
                <label>Advance Booking Window (Days)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={advanceBookingDays}
                  onChange={e => setAdvanceBookingDays(e.target.value)}
                />
                <span className="scheduling-input-hint">How many days in advance customers can reserve delivery slots (Default: 4 days)</span>
              </div>

              <div className="scheduling-input-box">
                <label>Same-Day Slot Cutoff (Minutes Before Slot Start)</label>
                <input
                  type="number"
                  min="0"
                  max="240"
                  value={sameDayCutoffMinutes}
                  onChange={e => setSameDayCutoffMinutes(e.target.value)}
                />
                <span className="scheduling-input-hint">Slots automatically close booking N minutes prior to start (Default: 60 mins)</span>
              </div>
            </div>
          </div>

          {/* Card 3: Weekday Operating Schedule */}
          <div className="scheduling-card">
            <div className="scheduling-card-head">
              <div className="scheduling-card-title-group">
                <div className="scheduling-card-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                  <Calendar size={20} />
                </div>
                <div>
                  <h3>Weekday-Specific Operating Schedule</h3>
                  <p>Fine-tune specific weekdays with distinct operating hours or mark certain days completely closed.</p>
                </div>
              </div>
            </div>

            <div className="weekday-schedule-list">
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
                  <div key={day} className={`weekday-row-item ${isOpen ? '' : 'closed'}`}>
                    <div className="weekday-name-box">
                      <div className="weekday-pill-tag">
                        {day.slice(0, 3)}
                      </div>
                      <span className="weekday-label">{day}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                        <input
                          type="checkbox"
                          checked={isOpen}
                          onChange={e => updateDay('isOpen', e.target.checked)}
                          style={{ width: '16px', height: '16px', accentColor: '#10b981' }}
                        />
                        <span>{isOpen ? 'Open on this day' : 'Store closed'}</span>
                      </label>

                      {isOpen ? (
                        <div className="weekday-time-inputs">
                          <div className="weekday-time-group">
                            <label>Opens:</label>
                            <input
                              type="time"
                              value={dayConf.open || openingTime}
                              onChange={e => updateDay('open', e.target.value)}
                            />
                          </div>
                          <div className="weekday-time-group">
                            <label>Closes:</label>
                            <input
                              type="time"
                              value={dayConf.close || closingTime}
                              onChange={e => updateDay('close', e.target.value)}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="weekday-closed-badge">Closed All Day</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '6px' }}>
            <button
              type="submit"
              className="scheduling-btn-primary"
              disabled={busy}
              style={{ height: '44px', padding: '0 24px', fontSize: '14px' }}
            >
              {busy ? <LoaderCircle className="spin" size={16} /> : <Save size={16} />}
              <span>Save Operating Hours & Rules</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SEASONAL SCHEDULES */}
      {/* ========================================================================= */}
      {tab === 'seasonal' && (
        <div className="scheduling-card">
          <div className="scheduling-card-head">
            <div className="scheduling-card-title-group">
              <div className="scheduling-card-icon" style={{ background: '#fef3c7', color: '#b45309' }}>
                <Sun size={20} />
              </div>
              <div>
                <h3>Seasonal Operating Schedules</h3>
                <p>Configure recurring seasonal hours (e.g. Winter 8 AM – 8 PM, Summer 6 AM – 10 PM). Takes Priority 3 over baseline weekly hours.</p>
              </div>
            </div>
            <button
              type="button"
              className="scheduling-btn-primary"
              onClick={() => setEditSeasonal({ ...seasonalBlank })}
            >
              <Plus size={15} />
              <span>Add Seasonal Schedule</span>
            </button>
          </div>

          {seasonalList.length === 0 ? (
            <div className="scheduling-empty-box">
              <div className="scheduling-empty-icon">
                <Sun size={26} />
              </div>
              <h4>No Seasonal Schedules Created</h4>
              <p>The store operates on regular weekly baseline hours year-round. Click "+ Add Seasonal Schedule" to configure seasonal timings.</p>
            </div>
          ) : (
            <div className="scheduling-table-container">
              <div className="scheduling-table-wrap">
                <table className="scheduling-table">
                  <thead>
                    <tr>
                      <th style={{ minWidth: '180px' }}>Season Name</th>
                      <th style={{ minWidth: '160px' }}>Date Range</th>
                      <th style={{ minWidth: '160px' }}>Operating Hours</th>
                      <th style={{ minWidth: '110px' }}>Priority</th>
                      <th style={{ minWidth: '110px' }}>Status</th>
                      <th className="col-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seasonalList.map(s => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 800, color: '#0f172a' }}>{s.name}</td>
                        <td style={{ color: '#475569', fontWeight: 600 }}>{s.startDate} to {s.endDate}</td>
                        <td style={{ color: '#047857', fontWeight: 700 }}>{s.openingTime} – {s.closingTime}</td>
                        <td>
                          <span style={{ fontSize: '11px', fontWeight: 800, background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                            Level {s.priority || 1}
                          </span>
                        </td>
                        <td><StatusBadge status={s.status} /></td>
                        <td className="col-actions">
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              className="security-action-btn-main"
                              onClick={() => setEditSeasonal(s)}
                            >
                              <Edit2 size={12} />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              className="security-icon-btn delete"
                              onClick={() => setRemoveSeasonal(s)}
                              title="Delete schedule"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SPECIAL DATES & FESTIVALS */}
      {/* ========================================================================= */}
      {tab === 'special' && (
        <div className="scheduling-card">
          <div className="scheduling-card-head">
            <div className="scheduling-card-title-group">
              <div className="scheduling-card-icon" style={{ background: '#fce7f3', color: '#be185d' }}>
                <Calendar size={20} />
              </div>
              <div>
                <h3>Date-Specific Special & Festival Schedules</h3>
                <p>Configure custom operating hours for holidays and festivals (e.g. Diwali, Chhath Puja, Independence Day). Takes Priority 2 over seasonal and weekly rules.</p>
              </div>
            </div>
            <button
              type="button"
              className="scheduling-btn-primary"
              onClick={() => setEditSpecialDay({ ...specialDayBlank })}
            >
              <Plus size={15} />
              <span>Add Special Date Schedule</span>
            </button>
          </div>

          {specialDayList.length === 0 ? (
            <div className="scheduling-empty-box">
              <div className="scheduling-empty-icon" style={{ background: '#fce7f3', color: '#be185d' }}>
                <Calendar size={26} />
              </div>
              <h4>No Special Date Overrides</h4>
              <p>No holiday or festival schedules configured. Click "+ Add Special Date Schedule" to customize specific dates.</p>
            </div>
          ) : (
            <div className="scheduling-table-container">
              <div className="scheduling-table-wrap">
                <table className="scheduling-table">
                  <thead>
                    <tr>
                      <th style={{ minWidth: '130px' }}>Date</th>
                      <th style={{ minWidth: '180px' }}>Occasion / Name</th>
                      <th style={{ minWidth: '160px' }}>Operating Hours</th>
                      <th style={{ minWidth: '120px' }}>Store Status</th>
                      <th style={{ minWidth: '180px' }}>Reason / Notes</th>
                      <th className="col-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {specialDayList.map(sd => (
                      <tr key={sd.id || sd.date}>
                        <td style={{ fontWeight: 800, color: '#0f172a' }}>{sd.date}</td>
                        <td style={{ fontWeight: 700 }}>{sd.name}</td>
                        <td style={{ color: sd.isClosed ? '#ef4444' : '#047857', fontWeight: 700 }}>
                          {sd.isClosed ? 'Closed All Day' : `${sd.openingTime} – ${sd.closingTime}`}
                        </td>
                        <td>
                          <StatusBadge status={sd.isClosed ? 'INACTIVE' : 'ACTIVE'} />
                        </td>
                        <td style={{ color: '#64748b', fontSize: '12px' }}>{sd.reason || 'Special operating schedule'}</td>
                        <td className="col-actions">
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              className="security-action-btn-main"
                              onClick={() => setEditSpecialDay(sd)}
                            >
                              <Edit2 size={12} />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              className="security-icon-btn delete"
                              onClick={() => setRemoveSpecialDay(sd)}
                              title="Delete schedule"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: DELIVERY SLOTS & CAPACITY */}
      {/* ========================================================================= */}
      {tab === 'slots' && (
        <div className="scheduling-card">
          <div className="scheduling-card-head">
            <div className="scheduling-card-title-group">
              <div className="scheduling-card-icon" style={{ background: '#e0e7ff', color: '#4338ca' }}>
                <CalendarClock size={20} />
              </div>
              <div>
                <h3>Delivery Time Slots & Capacity Management</h3>
                <p>Define customer delivery slots, delivery duration, maximum concurrent order capacity, and cutoff times.</p>
              </div>
            </div>
            <button
              type="button"
              className="scheduling-btn-primary"
              onClick={() => setEditSlot({ ...slotBlank })}
            >
              <Plus size={15} />
              <span>Add Delivery Slot</span>
            </button>
          </div>

          {slotsList.length === 0 ? (
            <div className="scheduling-empty-box">
              <div className="scheduling-empty-icon" style={{ background: '#e0e7ff', color: '#4338ca' }}>
                <CalendarClock size={26} />
              </div>
              <h4>No Delivery Slots Configured</h4>
              <p>Create customer delivery slots (e.g. 7 AM – 10 AM Morning Express) to enable scheduled deliveries.</p>
            </div>
          ) : (
            <div className="scheduling-table-container">
              <div className="scheduling-table-wrap">
                <table className="scheduling-table">
                  <thead>
                    <tr>
                      <th style={{ minWidth: '180px' }}>Slot Label</th>
                      <th style={{ minWidth: '160px' }}>Timing Window</th>
                      <th style={{ minWidth: '160px' }}>Capacity Limit</th>
                      <th style={{ minWidth: '140px' }}>Cutoff Window</th>
                      <th style={{ minWidth: '110px' }}>Status</th>
                      <th className="col-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slotsList.map(slot => (
                      <tr key={slot.id}>
                        <td style={{ fontWeight: 800, color: '#0f172a' }}>{slot.label}</td>
                        <td style={{ color: '#047857', fontWeight: 700 }}>{slot.startTime} – {slot.endTime}</td>
                        <td>
                          <span style={{ fontWeight: 800, color: '#0369a1', background: '#e0f2fe', padding: '3px 8px', borderRadius: '4px', fontSize: '12px' }}>
                            {slot.maxOrders} orders max
                          </span>
                        </td>
                        <td style={{ color: '#64748b' }}>{slot.cutoffMinutes} mins before start</td>
                        <td>
                          <StatusBadge status={slot.status} />
                        </td>
                        <td className="col-actions">
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              className={`security-icon-btn ${slot.status === 'ACTIVE' ? 'toggle-deactivate' : 'toggle-activate'}`}
                              onClick={() => handleToggleSlotStatus(slot)}
                              title={slot.status === 'ACTIVE' ? 'Disable Slot' : 'Enable Slot'}
                            >
                              {slot.status === 'ACTIVE' ? <X size={14} /> : <Check size={14} />}
                            </button>
                            <button
                              type="button"
                              className="security-action-btn-main"
                              onClick={() => setEditSlot(slot)}
                            >
                              <Edit2 size={12} />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              className="security-icon-btn delete"
                              onClick={() => setRemoveSlot(slot)}
                              title="Delete slot"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: UPCOMING SCHEDULED ORDERS */}
      {/* ========================================================================= */}
      {tab === 'scheduled' && (
        <div className="scheduling-card">
          <div className="scheduling-card-head">
            <div className="scheduling-card-title-group">
              <div className="scheduling-card-icon" style={{ background: '#fef3c7', color: '#b45309' }}>
                <Package size={20} />
              </div>
              <div>
                <h3>Upcoming Scheduled Deliveries Queue</h3>
                <p>Manage and inspect scheduled orders placed by customers for upcoming delivery dates and slots.</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="security-search-wrap" style={{ width: '220px' }}>
                <Calendar size={15} style={{ color: '#94a3b8' }} />
                <input
                  type="date"
                  value={filterDate}
                  onChange={e => setFilterDate(e.target.value)}
                />
              </div>
              {filterDate && (
                <button
                  type="button"
                  className="security-clear-btn"
                  onClick={() => setFilterDate('')}
                >
                  Clear Filter
                </button>
              )}
            </div>
          </div>

          {scheduledOrders.length === 0 ? (
            <div className="scheduling-empty-box">
              <div className="scheduling-empty-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                <Package size={26} />
              </div>
              <h4>No Scheduled Orders in Queue</h4>
              <p>There are no scheduled orders found {filterDate ? `for ${filterDate}` : 'in the upcoming delivery queue'}.</p>
            </div>
          ) : (
            <div className="scheduling-table-container">
              <div className="scheduling-table-wrap">
                <table className="scheduling-table">
                  <thead>
                    <tr>
                      <th style={{ minWidth: '120px' }}>Order #</th>
                      <th style={{ minWidth: '180px' }}>Customer</th>
                      <th style={{ minWidth: '140px' }}>Delivery Date</th>
                      <th style={{ minWidth: '160px' }}>Delivery Slot</th>
                      <th style={{ minWidth: '110px' }}>Items</th>
                      <th style={{ minWidth: '120px' }}>Amount</th>
                      <th style={{ minWidth: '110px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scheduledOrders.map(o => (
                      <tr key={o.id}>
                        <td style={{ fontWeight: 800, color: '#0f172a' }}>#{o.orderNumber}</td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{o.user?.name || o.addressSnapshot?.name || 'Customer'}</div>
                          <small style={{ color: '#64748b' }}>{o.user?.mobile || o.addressSnapshot?.mobile}</small>
                        </td>
                        <td style={{ fontWeight: 700, color: '#047857' }}>{o.deliveryDate}</td>
                        <td>
                          <span style={{ padding: '3px 8px', borderRadius: '4px', background: '#e0f2fe', color: '#0369a1', fontSize: '11.5px', fontWeight: 700 }}>
                            {o.deliverySlot}
                          </span>
                        </td>
                        <td>{o.items?.length || 0} items</td>
                        <td><b style={{ fontSize: '13.5px' }}>₹{o.grandTotal}</b></td>
                        <td><StatusBadge status={o.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: EFFECTIVE STORE STATUS & VILLAGE DELIVERY PREVIEW */}
      {/* ========================================================================= */}
      {tab === 'preview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* SIMULATION CONTROLS */}
          <div className="simulator-box">
            <div className="simulator-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="scheduling-card-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', color: '#0f172a', fontWeight: 800 }}>
                    Live Rule Precedence & Target Date/Time Simulator
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: '#64748b' }}>
                    Verify how store operating rules, emergency pauses, and village overrides evaluate for any given date and time.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="security-btn-refresh"
                  onClick={resetPreviewSimulation}
                  disabled={previewLoading}
                  style={{ color: '#334155 !important', background: '#f1f5f9 !important', border: '1px solid #cbd5e1 !important' }}
                >
                  <RefreshCcw size={14} />
                  <span>Reset to Live (Now)</span>
                </button>
                <button
                  type="button"
                  className="scheduling-btn-primary"
                  onClick={runPreviewSimulation}
                  disabled={previewLoading}
                >
                  {previewLoading ? <LoaderCircle className="spin" size={14} /> : <Eye size={14} />}
                  <span>Run Simulation</span>
                </button>
              </div>
            </div>

            <div className="scheduling-form-grid">
              <div className="scheduling-input-box">
                <label>Simulate Target Date</label>
                <input
                  type="date"
                  value={previewDate}
                  onChange={e => setPreviewDate(e.target.value)}
                />
              </div>

              <div className="scheduling-input-box">
                <label>Simulate Target Time</label>
                <input
                  type="time"
                  value={previewTime}
                  onChange={e => setPreviewTime(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 600, color: previewResult?.isTargetingFuture ? '#d97706' : '#059669' }}>
                  {previewResult?.isTargetingFuture
                    ? `⚠️ Previewing future simulated conditions on ${previewResult.targetDate} at ${previewResult.targetTime}`
                    : '🟢 Showing live real-time store conditions (Asia/Kolkata)'}
                </span>
              </div>
            </div>

            {/* DASHBOARD 1: EFFECTIVE STORE STATUS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px', marginTop: '4px' }}>
              <div className="simulator-metric-card">
                <span className="simulator-metric-label">Current Store Status</span>
                <h2 className="simulator-metric-val" style={{ color: previewResult?.isOpenNow ? '#10b981' : '#ef4444' }}>
                  {previewResult?.status || 'OPEN'}
                </h2>
                <small style={{ color: '#64748b', marginTop: '2px' }}>
                  {previewResult?.statusReason}
                </small>
              </div>

              <div className="simulator-metric-card">
                <span className="simulator-metric-label">Effective Operating Hours</span>
                <h2 className="simulator-metric-val" style={{ color: '#0f172a' }}>
                  {previewResult?.effectiveHours?.openFormatted} – {previewResult?.effectiveHours?.closeFormatted}
                </h2>
                <small style={{ color: '#64748b', marginTop: '2px' }}>
                  {previewResult?.effectiveHours?.isClosedDay ? 'Closed all day' : 'Asia/Kolkata Time'}
                </small>
              </div>

              <div className="simulator-metric-card">
                <span className="simulator-metric-label">Active Governing Rule</span>
                <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      background: previewResult?.ruleSource === 'EMERGENCY' ? '#fee2e2' : previewResult?.ruleSource === 'SPECIAL_DATE' ? '#e0f2fe' : previewResult?.ruleSource === 'SEASONAL' ? '#fef3c7' : '#ecfdf5',
                      color: previewResult?.ruleSource === 'EMERGENCY' ? '#b91c1c' : previewResult?.ruleSource === 'SPECIAL_DATE' ? '#0369a1' : previewResult?.ruleSource === 'SEASONAL' ? '#b45309' : '#047857'
                    }}
                  >
                    {previewResult?.ruleSource}
                  </span>
                </div>
                <small style={{ color: '#64748b', marginTop: '4px' }}>
                  {previewResult?.ruleDetails}
                </small>
              </div>

              <div className="simulator-metric-card">
                <span className="simulator-metric-label">Ordering Availability</span>
                <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
                  <span>
                    Immediate Delivery: <b style={{ color: previewResult?.allowImmediateOrders ? '#047857' : '#b91c1c' }}>{previewResult?.allowImmediateOrders ? 'ALLOWED' : 'BLOCKED'}</b>
                  </span>
                  <span>
                    Scheduled Delivery: <b style={{ color: previewResult?.allowScheduledOrders ? '#047857' : '#b91c1c' }}>{previewResult?.allowScheduledOrders ? 'ALLOWED' : 'BLOCKED'}</b>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* DASHBOARD 2: VILLAGE DELIVERY PREVIEW */}
          <div className="scheduling-card">
            <div className="scheduling-card-head">
              <div className="scheduling-card-title-group">
                <div className="scheduling-card-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
                  <MapPin size={20} />
                </div>
                <div>
                  <h3>Village Delivery Rules Simulator</h3>
                  <p>Select any serviceable village to preview delivery charges, min order, and exact configuration source badges.</p>
                </div>
              </div>

              <div style={{ minWidth: '260px' }}>
                <select
                  value={selectedVillageTarget}
                  onChange={e => setSelectedVillageTarget(e.target.value)}
                  className="security-select-filter"
                  style={{ width: '100%' }}
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
                <LoaderCircle className="spin" size={24} style={{ color: '#10b981', margin: '0 auto' }} />
                <p style={{ color: '#64748b', marginTop: '8px' }}>Resolving effective village rules...</p>
              </div>
            ) : !villagePreviewData ? (
              <div className="scheduling-empty-box" style={{ padding: '36px' }}>
                <MapPin size={28} style={{ color: '#94a3b8' }} />
                <h4>No Village Selected</h4>
                <p>Select a village above to simulate its delivery charge, free delivery threshold, and COD rules.</p>
              </div>
            ) : (
              <div>
                <div
                  style={{
                    padding: '14px 18px',
                    borderRadius: '12px',
                    background: villagePreviewData.isServiceable ? '#ecfdf5' : '#fef2f2',
                    border: `1.5px solid ${villagePreviewData.isServiceable ? '#a7f3d0' : '#fecaca'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    marginBottom: '16px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <b style={{ fontSize: '16px', color: '#0f172a' }}>{villagePreviewData.villageName}</b>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 800,
                          background: villagePreviewData.overrideMode === 'PARTIAL' ? '#e0f2fe' : '#fef3c7',
                          color: villagePreviewData.overrideMode === 'PARTIAL' ? '#0369a1' : '#b45309'
                        }}
                      >
                        {villagePreviewData.overrideMode === 'PARTIAL' ? 'Mode B: Partial Override' : 'Mode A: Complete Override'}
                      </span>
                    </div>
                    <small style={{ color: '#64748b' }}>
                      Serviceability: {villagePreviewData.isServiceable ? 'Serviceable' : 'Unavailable'} ({villagePreviewData.unserviceableReason || 'Active'})
                    </small>
                  </div>

                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 800,
                      background: villagePreviewData.isServiceable ? '#10b981' : '#ef4444',
                      color: '#fff'
                    }}
                  >
                    {villagePreviewData.isServiceable ? 'DELIVERY OPEN' : 'DELIVERY PAUSED'}
                  </span>
                </div>

                <div className="scheduling-form-grid">
                  <div className="simulator-metric-card">
                    <span className="simulator-metric-label">Delivery Charge</span>
                    <h3 style={{ margin: '4px 0', fontSize: '18px', color: '#0f172a' }}>₹{villagePreviewData.deliveryFee}</h3>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: villagePreviewData.sourceIndicators?.deliveryFee === 'VILLAGE_OVERRIDE' ? '#fef3c7' : '#e2e8f0',
                        color: villagePreviewData.sourceIndicators?.deliveryFee === 'VILLAGE_OVERRIDE' ? '#b45309' : '#475569',
                        width: 'fit-content'
                      }}
                    >
                      {villagePreviewData.sourceIndicators?.deliveryFee === 'VILLAGE_OVERRIDE' ? 'Village Override' : 'Global Default'}
                    </span>
                  </div>

                  <div className="simulator-metric-card">
                    <span className="simulator-metric-label">Minimum Order</span>
                    <h3 style={{ margin: '4px 0', fontSize: '18px', color: '#0f172a' }}>₹{villagePreviewData.minimumOrder}</h3>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: villagePreviewData.sourceIndicators?.minimumOrder === 'VILLAGE_OVERRIDE' ? '#fef3c7' : '#e2e8f0',
                        color: villagePreviewData.sourceIndicators?.minimumOrder === 'VILLAGE_OVERRIDE' ? '#b45309' : '#475569',
                        width: 'fit-content'
                      }}
                    >
                      {villagePreviewData.sourceIndicators?.minimumOrder === 'VILLAGE_OVERRIDE' ? 'Village Override' : 'Global Default'}
                    </span>
                  </div>

                  <div className="simulator-metric-card">
                    <span className="simulator-metric-label">Free Delivery Above</span>
                    <h3 style={{ margin: '4px 0', fontSize: '18px', color: '#0f172a' }}>₹{villagePreviewData.freeDeliveryThreshold}</h3>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: villagePreviewData.sourceIndicators?.freeDeliveryThreshold === 'VILLAGE_OVERRIDE' ? '#fef3c7' : '#e2e8f0',
                        color: villagePreviewData.sourceIndicators?.freeDeliveryThreshold === 'VILLAGE_OVERRIDE' ? '#b45309' : '#475569',
                        width: 'fit-content'
                      }}
                    >
                      {villagePreviewData.sourceIndicators?.freeDeliveryThreshold === 'VILLAGE_OVERRIDE' ? 'Village Override' : 'Global Default'}
                    </span>
                  </div>

                  <div className="simulator-metric-card">
                    <span className="simulator-metric-label">Estimated Delivery</span>
                    <h3 style={{ margin: '4px 0', fontSize: '18px', color: '#0f172a' }}>{villagePreviewData.estimatedDelivery}</h3>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: villagePreviewData.sourceIndicators?.estimatedDelivery === 'VILLAGE_OVERRIDE' ? '#fef3c7' : '#e2e8f0',
                        color: villagePreviewData.sourceIndicators?.estimatedDelivery === 'VILLAGE_OVERRIDE' ? '#b45309' : '#475569',
                        width: 'fit-content'
                      }}
                    >
                      {villagePreviewData.sourceIndicators?.estimatedDelivery === 'VILLAGE_OVERRIDE' ? 'Village Override' : 'Global Default'}
                    </span>
                  </div>

                  <div className="simulator-metric-card">
                    <span className="simulator-metric-label">Cash on Delivery</span>
                    <h3 style={{ margin: '4px 0', fontSize: '18px', color: villagePreviewData.allowCod ? '#10b981' : '#ef4444' }}>
                      {villagePreviewData.allowCod ? 'Allowed' : 'Disabled'}
                    </h3>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: villagePreviewData.sourceIndicators?.allowCod === 'VILLAGE_OVERRIDE' ? '#fef3c7' : '#e2e8f0',
                        color: villagePreviewData.sourceIndicators?.allowCod === 'VILLAGE_OVERRIDE' ? '#b45309' : '#475569',
                        width: 'fit-content'
                      }}
                    >
                      {villagePreviewData.sourceIndicators?.allowCod === 'VILLAGE_OVERRIDE' ? 'Village Override' : 'Global Default'}
                    </span>
                  </div>

                  <div className="simulator-metric-card">
                    <span className="simulator-metric-label">Service Radius</span>
                    <h3 style={{ margin: '4px 0', fontSize: '18px', color: '#0f172a' }}>{villagePreviewData.radiusKm} km</h3>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: villagePreviewData.sourceIndicators?.radiusKm === 'VILLAGE_OVERRIDE' ? '#fef3c7' : '#e2e8f0',
                        color: villagePreviewData.sourceIndicators?.radiusKm === 'VILLAGE_OVERRIDE' ? '#b45309' : '#475569',
                        width: 'fit-content'
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
