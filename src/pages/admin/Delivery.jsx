import { useEffect, useState } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import {AlertCircle,Building,Clock3,Edit2,Eye,Globe,LoaderCircle,MapPin,PauseCircle,PlayCircle,Plus,RefreshCcw,Save,Search,Settings,Sliders,Trash2,Truck} from 'lucide-react';
import {Button,ConfirmDialog,Modal,StatusBadge} from '../../components/ui';
import {useApp} from '../../context/AppContext';
import {adminService} from '../../services/admin.service';
import { DeliveryAssignmentsView } from './DeliveryAssignments';
import { DeliveryVerificationsView } from './DeliveryVerifications';
import { CodSettlementsView } from './CodSettlements';

const villageBlank = {
  name: '',
  pincode: '',
  overrideMode: 'COMPLETE',
  deliveryFee: '',
  minimumOrder: '',
  freeDeliveryThreshold: '',
  radiusKm: '5.0',
  allowCod: true,
  allowScheduled: true,
  estimatedMinutes: '30',
  deliveryHours: '',
  schedule: '',
  notes: '',
  isPaused: false,
  status: 'ACTIVE',
  areaId: ''
};

const zoneBlank = {
  name: '',
  localities: [],
  radiusKm: '5.0',
  minimumOrder: '',
  deliveryFee: '',
  freeDeliveryThreshold: '',
  estimatedMinutes: '30',
  status: 'ACTIVE'
};

const money = value => `₹${Number(value || 0).toLocaleString('en-IN')}`;

export function AdminDelivery() {
  const { notify } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const getInitialTab = () => {
    const urlTab = searchParams.get('tab');
    if (urlTab && ['villages', 'areas', 'assignments', 'verifications', 'settlements', 'config'].includes(urlTab)) {
      return urlTab;
    }
    if (location.pathname.includes('/delivery/assignments')) return 'assignments';
    if (location.pathname.includes('/delivery/verifications')) return 'verifications';
    if (location.pathname.includes('/delivery/cod-settlements')) return 'settlements';
    return 'villages';
  };

  const [tab, setTab] = useState(getInitialTab);

  // Sync tab with URL search parameter if changed externally
  useEffect(() => {
    const currentParam = searchParams.get('tab');
    if (currentParam && currentParam !== tab && ['villages', 'areas', 'assignments', 'verifications', 'settlements', 'config'].includes(currentParam)) {
      setTab(currentParam);
    }
  }, [searchParams]);

  const handleTabSwitch = (newTab) => {
    setTab(newTab);
    setSearchParams(prev => {
      const nextParams = new URLSearchParams(prev);
      nextParams.set('tab', newTab);
      return nextParams;
    }, { replace: true });
  };
  const [villagesList, setVillagesList] = useState([]);
  const [areasList, setAreasList] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Village edit/remove states
  const [editVillage, setEditVillage] = useState(null);
  const [removeVillage, setRemoveVillage] = useState(null);
  const [pauseVillageTarget, setPauseVillageTarget] = useState(null);
  const [pauseReason, setPauseReason] = useState('');

  // Village Live Rules Preview modal
  const [previewVillageTarget, setPreviewVillageTarget] = useState(null);
  const [villagePreviewData, setVillagePreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const handleOpenVillagePreview = async village => {
    setPreviewVillageTarget(village);
    setPreviewLoading(true);
    try {
      const data = await adminService.getVillagePreview({ villageId: village.id });
      setVillagePreviewData(data);
    } catch (err) {
      notify(err.message || 'Failed to resolve effective village rules', 'error');
    } finally {
      setPreviewLoading(false);
    }
  };

  // Area edit/remove states
  const [editArea, setEditArea] = useState(null);
  const [removeArea, setRemoveArea] = useState(null);
  const [localityDraft, setLocalityDraft] = useState('');

  // Filters & search
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [error, setError] = useState('');

  // Extract all localities from active Delivery Zones for autocomplete & suggestions
  const allZoneLocalities = areasList.flatMap(area => {
    const locs = Array.isArray(area.localities) ? area.localities : [];
    return locs.map(loc => {
      const locName = typeof loc === 'string' ? loc.trim() : (loc?.name || '').trim();
      return {
        name: locName,
        zoneName: area.name,
        zoneId: area.id,
        radiusKm: area.radiusKm,
        deliveryFee: area.deliveryFee,
        minimumOrder: area.minimumOrder,
        freeDeliveryThreshold: area.freeDeliveryThreshold,
        estimatedMinutes: area.estimatedMinutes
      };
    }).filter(l => Boolean(l.name));
  });

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [vData, aData, cData] = await Promise.all([
        adminService.getVillages(),
        adminService.getDeliveryAreas(),
        adminService.getDeliveryConfig()
      ]);
      setVillagesList(vData || []);
      setAreasList((aData || []).map(a => ({
        ...a,
        localities: a.localities || a.pincodes || []
      })));
      setConfig(cData);
    } catch (err) {
      setError(err.message || 'Failed to load delivery configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const publishUpdate = () => {
    window.dispatchEvent(new Event('grocify:delivery-updated'));
    window.dispatchEvent(new Event('grocify:settings-updated'));
  };

  // Village Handlers
  const handleSaveVillage = async e => {
    e.preventDefault();
    setBusy(true);
    try {
      const isPartial = editVillage.overrideMode === 'PARTIAL';
      const parseNumOrNull = val => {
        if (val === '' || val === null || val === undefined) return isPartial ? null : 0;
        return Number(val);
      };

      const payload = {
        ...editVillage,
        overrideMode: editVillage.overrideMode || 'COMPLETE',
        deliveryFee: parseNumOrNull(editVillage.deliveryFee),
        minimumOrder: parseNumOrNull(editVillage.minimumOrder),
        freeDeliveryThreshold: parseNumOrNull(editVillage.freeDeliveryThreshold),
        radiusKm: editVillage.radiusKm ? Number(editVillage.radiusKm) : 5.0,
        allowCod: editVillage.allowCod !== false,
        allowScheduled: editVillage.allowScheduled !== false,
        estimatedMinutes: editVillage.estimatedMinutes ? Number(editVillage.estimatedMinutes) : 30,
        deliveryHours: editVillage.deliveryHours ? String(editVillage.deliveryHours).trim() : null,
        areaId: editVillage.areaId || null
      };

      if (editVillage.id) {
        await adminService.updateVillage(editVillage.id, payload);
        notify('Delivery village updated successfully');
      } else {
        await adminService.createVillage(payload);
        notify('Delivery village added successfully');
      }
      setEditVillage(null);
      await loadData();
      publishUpdate();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleToggleVillageStatus = async village => {
    try {
      const nextStatus = village.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await adminService.updateVillageStatus(village.id, nextStatus);
      setVillagesList(current => current.map(v => (v.id === village.id ? { ...v, status: nextStatus } : v)));
      publishUpdate();
      notify(`Village ${nextStatus === 'ACTIVE' ? 'enabled' : 'disabled'}`);
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleConfirmPauseVillage = async () => {
    if (!pauseVillageTarget) return;
    try {
      const isPaused = !pauseVillageTarget.isPaused;
      await adminService.pauseVillage(pauseVillageTarget.id, isPaused, pauseReason);
      setVillagesList(current => current.map(v => (v.id === pauseVillageTarget.id ? { ...v, isPaused } : v)));
      setPauseVillageTarget(null);
      setPauseReason('');
      publishUpdate();
      notify(isPaused ? `Orders paused for ${pauseVillageTarget.name}` : `Orders resumed for ${pauseVillageTarget.name}`);
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleDeleteVillage = async () => {
    if (!removeVillage) return;
    try {
      await adminService.deleteVillage(removeVillage.id);
      setVillagesList(current => current.filter(v => v.id !== removeVillage.id));
      setRemoveVillage(null);
      publishUpdate();
      notify('Village removed permanently');
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  // Area Handlers
  const handleSaveArea = async e => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        ...editArea,
        radiusKm: editArea.radiusKm ? Number(editArea.radiusKm) : 5.0,
        minimumOrder: Number(editArea.minimumOrder),
        deliveryFee: Number(editArea.deliveryFee),
        freeDeliveryThreshold: Number(editArea.freeDeliveryThreshold),
        estimatedMinutes: Number(editArea.estimatedMinutes)
      };

      if (editArea.id) {
        await adminService.updateDeliveryArea(editArea.id, payload);
        notify('Delivery zone updated');
      } else {
        await adminService.createDeliveryArea(payload);
        notify('Delivery zone created');
      }
      setEditArea(null);
      await loadData();
      publishUpdate();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteArea = async () => {
    if (!removeArea) return;
    try {
      await adminService.deleteDeliveryArea(removeArea.id);
      setAreasList(current => current.filter(a => a.id !== removeArea.id));
      setRemoveArea(null);
      publishUpdate();
      notify('Delivery zone deleted');
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  // Global Config Handler
  const handleSaveConfig = async e => {
    e.preventDefault();
    setBusy(true);
    try {
      const form = Object.fromEntries(new FormData(e.currentTarget));
      const payload = {
        globalDeliveryRadius: Number(form.globalDeliveryRadius),
        minimumOrder: Number(form.minimumOrder),
        deliveryFee: Number(form.deliveryFee),
        freeDeliveryThreshold: Number(form.freeDeliveryThreshold),
        estimatedDelivery: form.estimatedDelivery,
        allowCod: form.allowCod === 'on',
        allowScheduled: form.allowScheduled === 'on'
      };
      const updated = await adminService.updateDeliveryConfig(payload);
      setConfig(updated);
      publishUpdate();
      notify('Global delivery configuration saved');
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  // Filters
  const filteredVillages = villagesList.filter(v => {
    const matchesQuery = query === '' ||
      v.name.toLowerCase().includes(query.toLowerCase()) ||
      (v.pincode && v.pincode.includes(query));

    if (!matchesQuery) return false;
    if (statusFilter === 'ACTIVE') return v.status === 'ACTIVE' && !v.isPaused;
    if (statusFilter === 'INACTIVE') return v.status === 'INACTIVE';
    if (statusFilter === 'PAUSED') return v.isPaused;
    return true;
  });

  const activeVillagesCount = villagesList.filter(v => v.status === 'ACTIVE' && !v.isPaused).length;
  const pausedVillagesCount = villagesList.filter(v => v.isPaused).length;

  if (error) {
    return (
      <div className="admin-card bulk-error">
        <p role="alert">{error}</p>
        <Button variant="outline" onClick={loadData}>Try again</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-card delivery-loading">
        <LoaderCircle className="spin" /> Loading delivery area configuration…
      </div>
    );
  }

  return (
    <>
      <div className="admin-title">
        <div>
          <h1>Delivery Area Management</h1>
          <p>Configure village-wise delivery charges, availability schedules, paused villages, and global 5km radius rules.</p>
        </div>
        <div className="row gap">
          <Button variant="ghost" onClick={loadData}><RefreshCcw /> Refresh</Button>
          {tab === 'villages' && (
            <Button onClick={() => setEditVillage({
              ...villageBlank,
              deliveryFee: config?.deliveryFee || '30',
              minimumOrder: config?.minimumOrder || '150',
              freeDeliveryThreshold: config?.freeDeliveryThreshold || '500',
              radiusKm: config?.globalDeliveryRadius || '5.0'
            })}>
              <Plus /> Add Village
            </Button>
          )}
          {tab === 'areas' && (
            <Button onClick={() => setEditArea({
              ...zoneBlank,
              deliveryFee: config?.deliveryFee || '30',
              minimumOrder: config?.minimumOrder || '150',
              freeDeliveryThreshold: config?.freeDeliveryThreshold || '500'
            })}>
              <Plus /> Add Delivery Zone
            </Button>
          )}
        </div>
      </div>

      {/* KPI Stats */}
      <div className="delivery-stats">
        <div className="admin-card delivery-stat">
          <i><Truck /></i>
          <span>
            <small>Active Villages</small>
            <b>{activeVillagesCount} / {villagesList.length}</b>
          </span>
        </div>
        <div className="admin-card delivery-stat">
          <i><PauseCircle /></i>
          <span>
            <small>Temporarily Paused</small>
            <b>{pausedVillagesCount}</b>
          </span>
        </div>
        <div className="admin-card delivery-stat">
          <i><Globe /></i>
          <span>
            <small>Global Radius</small>
            <b>{config?.globalDeliveryRadius || 5.0} km</b>
          </span>
        </div>
        <div className="admin-card delivery-stat">
          <i><Clock3 /></i>
          <span>
            <small>Default ETA</small>
            <b>{config?.estimatedDelivery || '15–30 min'}</b>
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="admin-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}>
        <button
          type="button"
          className={`tab-btn ${tab === 'villages' ? 'active' : ''}`}
          onClick={() => handleTabSwitch('villages')}
        >
          <MapPin size={15} />
          <span>Delivery Villages ({villagesList.length})</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${tab === 'areas' ? 'active' : ''}`}
          onClick={() => handleTabSwitch('areas')}
        >
          <Building size={15} />
          <span>Delivery Zones ({areasList.length})</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${tab === 'assignments' ? 'active' : ''}`}
          onClick={() => handleTabSwitch('assignments')}
        >
          <Truck size={15} />
          <span>Order Assignments</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${tab === 'verifications' ? 'active' : ''}`}
          onClick={() => handleTabSwitch('verifications')}
        >
          <Eye size={15} />
          <span>POD Verifications</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${tab === 'settlements' ? 'active' : ''}`}
          onClick={() => handleTabSwitch('settlements')}
        >
          <Sliders size={15} />
          <span>COD Settlements</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${tab === 'config' ? 'active' : ''}`}
          onClick={() => handleTabSwitch('config')}
        >
          <Settings size={15} />
          <span>Global Settings</span>
        </button>
      </div>

      {/* ================= TAB 1: VILLAGES ================= */}
      {tab === 'villages' && (
        <>
          <div className="row between" style={{ marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div className="row gap" style={{ alignItems: 'center' }}>
              <div className="admin-search-box">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search village name or PIN..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  style={{ width: '220px' }}
                />
              </div>
              <select
                className="admin-filter-select"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active & Taking Orders</option>
                <option value="PAUSED">Temporarily Paused</option>
                <option value="INACTIVE">Inactive / Disabled</option>
              </select>
            </div>
            <small style={{ color: '#6b7280' }}>Showing {filteredVillages.length} of {villagesList.length} villages</small>
          </div>

          {!filteredVillages.length ? (
            <div className="admin-card delivery-empty">
              <MapPin />
              <h3>No delivery villages match your filter</h3>
              <p>Add a village name and set custom delivery fees, minimum order amounts, and schedules.</p>
              <Button onClick={() => setEditVillage({ ...villageBlank })}><Plus /> Add First Village</Button>
            </div>
          ) : (
            <div className="delivery-zone-grid">
              {filteredVillages.map(v => (
                <article className="admin-card delivery-zone" key={v.id} style={{ borderLeft: v.isPaused ? '4px solid #f59e0b' : v.status === 'ACTIVE' ? '4px solid #10b981' : '4px solid #9ca3af' }}>
                  <div className="delivery-zone-head">
                    <i><MapPin /></i>
                    <div>
                      <h3>{v.name}</h3>
                      <small>
                        {v.pincode ? `PIN: ${v.pincode} · ` : ''}
                        {v.area?.name ? `Zone: ${v.area.name}` : 'Independent Village'}
                      </small>
                    </div>
                    <div className="row gap" style={{ gap: '6px' }}>
                      <span
                        style={{
                          background: v.overrideMode === 'PARTIAL' ? '#e0f2fe' : '#fef3c7',
                          color: v.overrideMode === 'PARTIAL' ? '#0369a1' : '#b45309',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700
                        }}
                      >
                        {v.overrideMode === 'PARTIAL' ? 'Mode B: Partial' : 'Mode A: Complete'}
                      </span>
                      {v.isPaused && (
                        <span style={{ background: '#fef3c7', color: '#b45309', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                          PAUSED
                        </span>
                      )}
                      <StatusBadge status={v.status === 'ACTIVE' ? 'Active' : 'Inactive'} />
                    </div>
                  </div>

                  {v.schedule && (
                    <div style={{ background: '#f0fdf4', color: '#166534', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock3 size={14} /> Schedule: <b>{v.schedule}</b>
                    </div>
                  )}

                  {v.notes && (
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: '8px 0 0' }}>{v.notes}</p>
                  )}

                  <div className="delivery-rule-grid" style={{ marginTop: '12px' }}>
                    <span><small>Delivery Fee</small><b>{money(v.deliveryFee)}</b></span>
                    <span><small>Min Order</small><b>{money(v.minimumOrder)}</b></span>
                    <span><small>Free Above</small><b>{money(v.freeDeliveryThreshold)}</b></span>
                    <span><small>Radius</small><b>{v.radiusKm || 5.0} km</b></span>
                  </div>

                  <div className="village-action-toolbar">
                    <div className="village-action-group">
                      <button
                        type="button"
                        className="v-action-btn v-btn-primary"
                        onClick={() => handleOpenVillagePreview(v)}
                        title="Preview delivery rules"
                      >
                        <Eye size={13} />
                        <span>Preview Rules</span>
                      </button>
                      <button
                        type="button"
                        className="v-action-btn v-btn-secondary"
                        onClick={() => setEditVillage({ ...v })}
                        title="Edit village details"
                      >
                        <Edit2 size={13} />
                        <span>Edit</span>
                      </button>
                    </div>

                    <div className="village-action-group">
                      <button
                        type="button"
                        className={`v-action-btn ${v.isPaused ? 'v-btn-resume' : 'v-btn-pause'}`}
                        onClick={() => {
                          setPauseVillageTarget(v);
                          setPauseReason('');
                        }}
                        title={v.isPaused ? 'Resume deliveries' : 'Temporarily pause deliveries'}
                      >
                        {v.isPaused ? <PlayCircle size={13} /> : <PauseCircle size={13} />}
                        <span>{v.isPaused ? 'Resume' : 'Pause'}</span>
                      </button>
                      <button
                        type="button"
                        className={`v-action-btn ${v.status === 'ACTIVE' ? 'v-btn-disable' : 'v-btn-enable'}`}
                        onClick={() => handleToggleVillageStatus(v)}
                        title={v.status === 'ACTIVE' ? 'Disable village' : 'Enable village'}
                      >
                        {v.status === 'ACTIVE' ? <PauseCircle size={13} /> : <PlayCircle size={13} />}
                        <span>{v.status === 'ACTIVE' ? 'Disable' : 'Enable'}</span>
                      </button>
                      <button
                        type="button"
                        className="v-action-btn v-btn-delete"
                        onClick={() => setRemoveVillage(v)}
                        title="Delete village"
                        aria-label="Delete village"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {/* ================= TAB 2: ZONES / LOCALITIES ================= */}
      {tab === 'areas' && (
        <>
          {!areasList.length ? (
            <div className="admin-card delivery-empty">
              <MapPin />
              <h3>No delivery zones configured</h3>
              <p>Delivery zones allow you to group multiple localities under unified delivery rules.</p>
              <Button onClick={() => setEditArea({ ...zoneBlank })}><Plus /> Add Delivery Zone</Button>
            </div>
          ) : (
            <div className="delivery-zone-grid">
              {areasList.map(zone => (
                <article className="admin-card delivery-zone" key={zone.id}>
                  <div className="delivery-zone-head">
                    <i><MapPin /></i>
                    <div>
                      <h3>{zone.name}</h3>
                      <small>{(zone.localities || []).length} serviceable localities</small>
                    </div>
                    <StatusBadge status={zone.status === 'ACTIVE' ? 'Active' : 'Inactive'} />
                  </div>

                  <div className="delivery-locality-preview">
                    {(zone.localities || []).slice(0, 6).map(loc => <span key={loc}>{loc}</span>)}
                    {(zone.localities || []).length > 6 && <span>+{(zone.localities || []).length - 6} more</span>}
                  </div>

                  <div className="delivery-rule-grid">
                    <span><small>Radius</small><b>{zone.radiusKm ? `${zone.radiusKm} km` : 'Area based'}</b></span>
                    <span><small>Min Order</small><b>{money(zone.minimumOrder)}</b></span>
                    <span><small>Delivery Fee</small><b>{money(zone.deliveryFee)}</b></span>
                    <span><small>Free Above</small><b>{money(zone.freeDeliveryThreshold)}</b></span>
                    <span><small>ETA</small><b>{zone.estimatedMinutes} min</b></span>
                  </div>

                  <div className="village-action-toolbar">
                    <div className="village-action-group">
                      <button
                        type="button"
                        className="v-action-btn v-btn-secondary"
                        onClick={() => setEditArea({ ...zone })}
                        title="Edit delivery zone"
                      >
                        <Edit2 size={13} />
                        <span>Edit Zone</span>
                      </button>
                    </div>
                    <div className="village-action-group">
                      <button
                        type="button"
                        className="v-action-btn v-btn-delete"
                        onClick={() => setRemoveArea(zone)}
                        title="Delete delivery zone"
                        aria-label="Delete delivery zone"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {/* ================= TAB 3: GLOBAL CONFIG ================= */}
      {tab === 'config' && config && (
        <form
          className="admin-card"
          onSubmit={handleSaveConfig}
          style={{
            maxWidth: '840px',
            padding: '28px',
            borderRadius: '16px',
            background: '#fff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 16px -2px rgba(0,0,0,0.04)'
          }}
        >
          {/* Section Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', paddingBottom: '20px', borderBottom: '1px solid #e2e8f0', marginBottom: '24px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(16,185,129,0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Globe size={22} />
            </div>
            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>Global Delivery & Radius Settings</h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
                Configures default delivery pricing, maximum serviceable radius, and fallback rules applied across customer checkout sessions when specific village rules do not override.
              </p>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '20px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>Global Delivery Radius</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '1px 6px', borderRadius: '4px' }}>km</span>
              </div>
              <input
                required
                min="0.5"
                step="0.5"
                type="number"
                name="globalDeliveryRadius"
                defaultValue={config.globalDeliveryRadius}
                style={{ height: '42px', padding: '0 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', width: '100%', boxSizing: 'border-box' }}
              />
              <small style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Default radius for delivery coverage (e.g. 5.0 km)</small>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '20px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>Default Delivery Fee</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '1px 6px', borderRadius: '4px' }}>₹ INR</span>
              </div>
              <input
                required
                min="0"
                type="number"
                name="deliveryFee"
                defaultValue={config.deliveryFee}
                style={{ height: '42px', padding: '0 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', width: '100%', boxSizing: 'border-box' }}
              />
              <small style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Standard fee charged when order is below free threshold</small>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '20px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>Default Minimum Order</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '1px 6px', borderRadius: '4px' }}>₹ INR</span>
              </div>
              <input
                required
                min="0"
                type="number"
                name="minimumOrder"
                defaultValue={config.minimumOrder}
                style={{ height: '42px', padding: '0 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', width: '100%', boxSizing: 'border-box' }}
              />
              <small style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Minimum basket total required to place a delivery order</small>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '20px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>Free Delivery Above</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '1px 6px', borderRadius: '4px' }}>₹ INR</span>
              </div>
              <input
                required
                min="0"
                type="number"
                name="freeDeliveryThreshold"
                defaultValue={config.freeDeliveryThreshold}
                style={{ height: '42px', padding: '0 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', width: '100%', boxSizing: 'border-box' }}
              />
              <small style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Cart total above which delivery fee becomes free (₹0)</small>
            </label>
          </div>

          {/* Full Width Field: Estimated Delivery Window */}
          <div style={{ marginTop: '20px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '20px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>Estimated Delivery Window (ETA)</span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Customer Storefront Display</span>
              </div>
              <input
                required
                name="estimatedDelivery"
                defaultValue={config.estimatedDelivery}
                placeholder="Example: 15–30 minutes"
                style={{ height: '42px', padding: '0 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', width: '100%', boxSizing: 'border-box' }}
              />
              <small style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Shown on customer checkout page, banner, and delivery badge (e.g. 15–30 minutes)</small>
            </label>
          </div>

          {/* Global Payment & Scheduling Toggles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginTop: '22px' }}>
            <div style={{ padding: '14px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <b style={{ display: 'block', fontSize: '13.5px', color: '#1e293b' }}>Cash on Delivery (COD)</b>
                <small style={{ fontSize: '11.5px', color: '#64748b' }}>Allow customers to pay cash at doorstep by default</small>
              </div>
              <label className="switch-row" style={{ margin: 0, padding: 0, border: 'none', cursor: 'pointer' }}>
                <input type="checkbox" name="allowCod" defaultChecked={config.allowCod ?? true} />
                <i />
              </label>
            </div>

            <div style={{ padding: '14px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <b style={{ display: 'block', fontSize: '13.5px', color: '#1e293b' }}>Scheduled Slot Orders</b>
                <small style={{ fontSize: '11.5px', color: '#64748b' }}>Allow customers to select future delivery dates & slots</small>
              </div>
              <label className="switch-row" style={{ margin: 0, padding: 0, border: 'none', cursor: 'pointer' }}>
                <input type="checkbox" name="allowScheduled" defaultChecked={config.allowScheduled ?? true} />
                <i />
              </label>
            </div>
          </div>

          {/* Action Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '28px', paddingTop: '18px', borderTop: '1px solid #e2e8f0' }}>
            <Button
              disabled={busy}
              style={{
                height: '42px',
                padding: '0 22px',
                borderRadius: '8px',
                background: '#10b981',
                color: '#fff',
                fontSize: '13.5px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 6px rgba(16,185,129,0.25)'
              }}
            >
              {busy ? <LoaderCircle className="spin" size={16} /> : <Save size={16} />} Save Global Settings
            </Button>
          </div>
        </form>
      )}

      {/* ================= TAB 4: ORDER ASSIGNMENTS & DISPATCH ================= */}
      {tab === 'assignments' && (
        <div style={{ marginTop: '8px' }}>
          <DeliveryAssignmentsView />
        </div>
      )}

      {/* ================= TAB 5: POD CLOUDINARY VERIFICATION QUEUE ================= */}
      {tab === 'verifications' && (
        <div style={{ marginTop: '8px' }}>
          <DeliveryVerificationsView />
        </div>
      )}

      {/* ================= TAB 6: COD CASH SETTLEMENTS ================= */}
      {tab === 'settlements' && (
        <div style={{ marginTop: '8px' }}>
          <CodSettlementsView />
        </div>
      )}

      {/* Modal: Add / Edit Village */}
      <Modal open={!!editVillage} onClose={() => !busy && setEditVillage(null)} title={editVillage?.id ? 'Edit Delivery Village' : 'Add Delivery Village'} size="location-modal">
        <form className="modal-body delivery-zone-form" onSubmit={handleSaveVillage}>
          <div className="form-grid">
            <div className="full">
              <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', marginBottom: '6px' }}>
                Village Name *
              </label>
              <input
                required
                list="zone-village-suggestions"
                value={editVillage?.name || ''}
                onChange={e => {
                  const val = e.target.value;
                  const matchedLoc = allZoneLocalities.find(l => l.name.toLowerCase() === val.trim().toLowerCase());
                  setEditVillage(curr => ({
                    ...curr,
                    name: val,
                    areaId: matchedLoc?.zoneId || curr?.areaId || ''
                  }));
                }}
                placeholder="Type village name or select from suggested localities below..."
              />
              <datalist id="zone-village-suggestions">
                {allZoneLocalities.map((item, idx) => (
                  <option key={`${item.name}-${idx}`} value={item.name}>
                    Zone: {item.zoneName}
                  </option>
                ))}
              </datalist>

              {/* Suggestions chips from configured delivery zones */}
              {allZoneLocalities.length > 0 && (
                <div style={{
                  marginTop: '10px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.05)',
                  border: '1px solid rgba(16, 185, 129, 0.2)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#047857', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <MapPin size={14} />
                      Localities in Delivery Zones ({areasList.map(a => a.name).join(', ')}):
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Click to select & auto-fill zone rules</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    maxHeight: '120px',
                    overflowY: 'auto',
                    padding: '2px'
                  }}>
                    {allZoneLocalities.map((item, idx) => {
                      const isCurrent = (editVillage?.name || '').trim().toLowerCase() === item.name.toLowerCase();
                      const isConfigured = !editVillage?.id && villagesList.some(v => v.name.toLowerCase() === item.name.toLowerCase());
                      return (
                        <button
                          key={`${item.name}-${idx}`}
                          type="button"
                          onClick={() => {
                            setEditVillage(curr => ({
                              ...curr,
                              name: item.name,
                              areaId: item.zoneId || curr?.areaId || '',
                              radiusKm: item.radiusKm ? String(item.radiusKm) : (curr?.radiusKm || '5.0'),
                              deliveryFee: item.deliveryFee !== null && item.deliveryFee !== undefined ? String(item.deliveryFee) : (curr?.deliveryFee ?? ''),
                              minimumOrder: item.minimumOrder !== null && item.minimumOrder !== undefined ? String(item.minimumOrder) : (curr?.minimumOrder ?? ''),
                              freeDeliveryThreshold: item.freeDeliveryThreshold !== null && item.freeDeliveryThreshold !== undefined ? String(item.freeDeliveryThreshold) : (curr?.freeDeliveryThreshold ?? ''),
                              estimatedMinutes: item.estimatedMinutes ? String(item.estimatedMinutes) : (curr?.estimatedMinutes || '30')
                            }));
                          }}
                          style={{
                            fontSize: '12px',
                            padding: '4px 9px',
                            borderRadius: '6px',
                            border: isCurrent ? '1.5px solid #059669' : '1px solid #cbd5e1',
                            background: isCurrent ? '#059669' : '#ffffff',
                            color: isCurrent ? '#ffffff' : '#334155',
                            fontWeight: isCurrent ? 700 : 500,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.15s ease'
                          }}
                          title={isConfigured ? `${item.name} is already configured in villages` : `Auto-fill details from ${item.zoneName}`}
                        >
                          {item.name}
                          {isConfigured && <span style={{ fontSize: '10px', opacity: 0.7 }}>(saved)</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Override Mode Selection */}
            <div className="full" style={{ padding: '12px', border: '1px solid var(--line)', borderRadius: '10px', background: 'rgba(255,255,255,0.02)' }}>
              <b style={{ fontSize: '13px', display: 'block', marginBottom: '8px' }}>Delivery Configuration Override Mode *</b>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px', border: '1px solid var(--line)', borderRadius: '8px', cursor: 'pointer', background: editVillage?.overrideMode !== 'PARTIAL' ? 'rgba(16, 185, 129, 0.08)' : 'transparent' }}>
                  <input
                    type="radio"
                    name="overrideMode"
                    checked={editVillage?.overrideMode !== 'PARTIAL'}
                    onChange={() => setEditVillage(curr => ({ ...curr, overrideMode: 'COMPLETE' }))}
                  />
                  <span>
                    <b>Mode A: Complete Village Override</b>
                    <small style={{ display: 'block', color: 'var(--muted)', fontSize: '11px', marginTop: '2px' }}>
                      All settings for this village come from this custom configuration. Global defaults will not overwrite.
                    </small>
                  </span>
                </label>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px', border: '1px solid var(--line)', borderRadius: '8px', cursor: 'pointer', background: editVillage?.overrideMode === 'PARTIAL' ? 'rgba(16, 185, 129, 0.08)' : 'transparent' }}>
                  <input
                    type="radio"
                    name="overrideMode"
                    checked={editVillage?.overrideMode === 'PARTIAL'}
                    onChange={() => setEditVillage(curr => ({ ...curr, overrideMode: 'PARTIAL' }))}
                  />
                  <span>
                    <b>Mode B: Individual Field Override</b>
                    <small style={{ display: 'block', color: 'var(--muted)', fontSize: '11px', marginTop: '2px' }}>
                      Only specified fields override; non-overridden fields seamlessly inherit global defaults.
                    </small>
                  </span>
                </label>
              </div>
            </div>

            <label>
              Postal PIN Code
              <input
                value={editVillage?.pincode || ''}
                onChange={e => setEditVillage(curr => ({ ...curr, pincode: e.target.value }))}
                placeholder="Optional (e.g., 841436)"
              />
            </label>
            <label>
              Radius from Hub (km)
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={editVillage?.radiusKm || '5.0'}
                onChange={e => setEditVillage(curr => ({ ...curr, radiusKm: e.target.value }))}
              />
            </label>
            <label>
              Delivery Fee (₹)
              <input
                required={editVillage?.overrideMode !== 'PARTIAL'}
                min="0"
                type="number"
                value={editVillage?.deliveryFee ?? ''}
                onChange={e => setEditVillage(curr => ({ ...curr, deliveryFee: e.target.value }))}
                placeholder={editVillage?.overrideMode === 'PARTIAL' ? 'Inherit global default' : '0'}
              />
            </label>
            <label>
              Minimum Order (₹)
              <input
                required={editVillage?.overrideMode !== 'PARTIAL'}
                min="0"
                type="number"
                value={editVillage?.minimumOrder ?? ''}
                onChange={e => setEditVillage(curr => ({ ...curr, minimumOrder: e.target.value }))}
                placeholder={editVillage?.overrideMode === 'PARTIAL' ? 'Inherit global default' : '0'}
              />
            </label>
            <label>
              Free Delivery Above (₹)
              <input
                required={editVillage?.overrideMode !== 'PARTIAL'}
                min="0"
                type="number"
                value={editVillage?.freeDeliveryThreshold ?? ''}
                onChange={e => setEditVillage(curr => ({ ...curr, freeDeliveryThreshold: e.target.value }))}
                placeholder={editVillage?.overrideMode === 'PARTIAL' ? 'Inherit global default' : '0'}
              />
            </label>
            <label>
              Custom Estimated ETA (Minutes)
              <input
                type="number"
                min="5"
                max="180"
                value={editVillage?.estimatedMinutes || '30'}
                onChange={e => setEditVillage(curr => ({ ...curr, estimatedMinutes: e.target.value }))}
                placeholder="e.g. 25"
              />
            </label>

            <label className="switch-row" style={{ padding: '8px 12px', border: '1px solid var(--line)', borderRadius: '8px' }}>
              <span>
                <b>Cash on Delivery (COD)</b>
                <small style={{ display: 'block', color: 'var(--muted)' }}>Enable COD in this village</small>
              </span>
              <input
                type="checkbox"
                checked={editVillage?.allowCod !== false}
                onChange={e => setEditVillage(curr => ({ ...curr, allowCod: e.target.checked }))}
              />
              <i />
            </label>

            <label className="switch-row" style={{ padding: '8px 12px', border: '1px solid var(--line)', borderRadius: '8px' }}>
              <span>
                <b>Scheduled Deliveries</b>
                <small style={{ display: 'block', color: 'var(--muted)' }}>Allow slot scheduling</small>
              </span>
              <input
                type="checkbox"
                checked={editVillage?.allowScheduled !== false}
                onChange={e => setEditVillage(curr => ({ ...curr, allowScheduled: e.target.checked }))}
              />
              <i />
            </label>

            <label>
              Parent Delivery Zone
              <select
                value={editVillage?.areaId || ''}
                onChange={e => setEditVillage(curr => ({ ...curr, areaId: e.target.value }))}
              >
                <option value="">-- None (Independent Village) --</option>
                {areasList.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </label>

            <label>
              Custom Delivery Hours (Optional)
              <input
                value={editVillage?.deliveryHours || ''}
                onChange={e => setEditVillage(curr => ({ ...curr, deliveryHours: e.target.value }))}
                placeholder="e.g. 08:00 - 18:00"
              />
            </label>

            <label className="full">
              Availability Schedule (Optional)
              <input
                value={editVillage?.schedule || ''}
                onChange={e => setEditVillage(curr => ({ ...curr, schedule: e.target.value }))}
                placeholder="Example: 08:00 - 20:00 (Daily) or Mon, Wed, Fri only"
              />
            </label>
            <label className="full">
              Delivery Notes / Landmark
              <input
                value={editVillage?.notes || ''}
                onChange={e => setEditVillage(curr => ({ ...curr, notes: e.target.value }))}
                placeholder="Internal instructions or delivery landmark note"
              />
            </label>
            <label>
              Status
              <select
                value={editVillage?.status || 'ACTIVE'}
                onChange={e => setEditVillage(curr => ({ ...curr, status: e.target.value }))}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </label>
          </div>
          <div className="form-actions" style={{ marginTop: '20px' }}>
            <Button type="button" variant="ghost" disabled={busy} onClick={() => setEditVillage(null)}>Cancel</Button>
            <Button disabled={busy}>
              {busy ? <LoaderCircle className="spin" /> : <Save />} Save Village
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Pause / Resume Village Confirmation */}
      <Modal open={!!pauseVillageTarget} onClose={() => setPauseVillageTarget(null)} title={pauseVillageTarget?.isPaused ? 'Resume Village Orders' : 'Temporarily Pause Orders'}>
        <div style={{ padding: '8px 0' }}>
          <p style={{ marginBottom: '14px', lineHeight: 1.5 }}>
            {pauseVillageTarget?.isPaused
              ? `Do you want to resume order placement for "${pauseVillageTarget?.name}"? Customers from this village will immediately be able to checkout again.`
              : `Temporarily pausing "${pauseVillageTarget?.name}" will prevent new customer checkouts from this village while keeping confirmed orders intact.`}
          </p>
          {!pauseVillageTarget?.isPaused && (
            <label style={{ display: 'block', marginTop: '12px' }}>
              Reason for pausing (optional):
              <input
                type="text"
                placeholder="e.g. Heavy rain, road repair, rider shortage"
                value={pauseReason}
                onChange={e => setPauseReason(e.target.value)}
                style={{ width: '100%', marginTop: '6px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db' }}
              />
            </label>
          )}
          <div className="row gap" style={{ marginTop: '20px', justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setPauseVillageTarget(null)}>Cancel</Button>
            <Button variant={pauseVillageTarget?.isPaused ? 'primary' : 'warning'} onClick={handleConfirmPauseVillage}>
              {pauseVillageTarget?.isPaused ? 'Resume Orders' : 'Pause Orders'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Add / Edit Area */}
      <Modal open={!!editArea} onClose={() => !busy && setEditArea(null)} title={editArea?.id ? 'Edit Delivery Zone' : 'Add Delivery Zone'} size="location-modal">
        <form className="modal-body delivery-zone-form" onSubmit={handleSaveArea}>
          <div className="form-grid">
            <label className="full">
              Zone Name
              <input
                required
                value={editArea?.name || ''}
                onChange={e => setEditArea(curr => ({ ...curr, name: e.target.value }))}
                placeholder="Example: Hathua Main Zone"
              />
            </label>
            <label>
              Radius (km)
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={editArea?.radiusKm || '5.0'}
                onChange={e => setEditArea(curr => ({ ...curr, radiusKm: e.target.value }))}
              />
            </label>
            <label>
              Estimated Delivery (mins)
              <input
                required
                min="1"
                type="number"
                value={editArea?.estimatedMinutes || '30'}
                onChange={e => setEditArea(curr => ({ ...curr, estimatedMinutes: e.target.value }))}
              />
            </label>
            <label>
              Delivery Fee (₹)
              <input
                required
                min="0"
                type="number"
                value={editArea?.deliveryFee ?? ''}
                onChange={e => setEditArea(curr => ({ ...curr, deliveryFee: e.target.value }))}
              />
            </label>
            <label>
              Minimum Order (₹)
              <input
                required
                min="0"
                type="number"
                value={editArea?.minimumOrder ?? ''}
                onChange={e => setEditArea(curr => ({ ...curr, minimumOrder: e.target.value }))}
              />
            </label>
            <label>
              Free Delivery Above (₹)
              <input
                required
                min="0"
                type="number"
                value={editArea?.freeDeliveryThreshold ?? ''}
                onChange={e => setEditArea(curr => ({ ...curr, freeDeliveryThreshold: e.target.value }))}
              />
            </label>
          </div>

          <div className="locality-selector" style={{ marginTop: '16px' }}>
            <div className="between">
              <b>Covered Localities in Zone ({(editArea?.localities || []).length})</b>
            </div>
            <div className="locality-admin-add" style={{ marginTop: '8px' }}>
              <label>
                New Locality
                <input
                  value={localityDraft}
                  maxLength="100"
                  onChange={e => setLocalityDraft(e.target.value)}
                  placeholder="Enter locality / mohalla name"
                />
              </label>
              <Button
                type="button"
                variant="outline"
                disabled={!localityDraft.trim()}
                onClick={() => {
                  const name = localityDraft.trim();
                  if (!name) return;
                  setEditArea(curr => ({
                    ...curr,
                    localities: [...new Set([...(curr.localities || []), name])]
                  }));
                  setLocalityDraft('');
                }}
              >
                Add
              </Button>
            </div>
            <div className="locality-check-grid" style={{ marginTop: '10px' }}>
              {(editArea?.localities || []).map(loc => (
                <span
                  key={loc}
                  style={{
                    background: '#e0f2fe',
                    color: '#0369a1',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {loc}
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0284c7', fontWeight: 'bold' }}
                    onClick={() => setEditArea(curr => ({
                      ...curr,
                      localities: curr.localities.filter(l => l !== loc)
                    }))}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="form-actions" style={{ marginTop: '20px' }}>
            <Button type="button" variant="ghost" disabled={busy} onClick={() => setEditArea(null)}>Cancel</Button>
            <Button disabled={busy}>
              {busy ? <LoaderCircle className="spin" /> : <Save />} Save Zone
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialogs */}
      <ConfirmDialog
        open={!!removeVillage}
        onClose={() => setRemoveVillage(null)}
        onConfirm={handleDeleteVillage}
        title="Delete Delivery Village?"
        itemName={removeVillage?.name}
        itemType="Village"
        message={`Are you sure you want to delete delivery village “${removeVillage?.name || ''}”? Its custom delivery charges will be permanently removed.`}
        warningNote="Active routing rules and specific fee configurations for this village will be cleared."
        confirmText="Delete Village"
        cancelText="Cancel"
      />
      <ConfirmDialog
        open={!!removeArea}
        onClose={() => setRemoveArea(null)}
        onConfirm={handleDeleteArea}
        title="Delete Delivery Zone?"
        itemName={removeArea?.name}
        itemType="Zone"
        message={`Are you sure you want to delete delivery zone “${removeArea?.name || ''}”? All grouped localities under this zone will be permanently removed.`}
        warningNote="Localities mapped to this zone will need to be reassigned to continue taking orders."
        confirmText="Delete Zone"
        cancelText="Cancel"
      />

      {/* Village Live Rules Preview Modal */}
      <Modal open={Boolean(previewVillageTarget)} onClose={() => setPreviewVillageTarget(null)} title={`Live Effective Rules: ${previewVillageTarget?.name || 'Village'}`}>
        <div className="modal-body" style={{ minWidth: '320px' }}>
          {previewLoading ? (
            <div style={{ padding: '30px', textAlign: 'center' }}>
              <LoaderCircle className="spin" size={24} style={{ color: 'var(--green)', margin: '0 auto' }} />
              <p style={{ color: 'var(--muted)', marginTop: '8px' }}>Resolving effective rules...</p>
            </div>
          ) : !villagePreviewData ? (
            <p style={{ padding: '16px', color: 'var(--muted)' }}>Unable to resolve rules for this village.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--line)' }}>
                <div className="between">
                  <b>Applied Mode:</b>
                  <span style={{ fontSize: '12px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', background: villagePreviewData.overrideMode === 'PARTIAL' ? '#e0f2fe' : '#fef3c7', color: villagePreviewData.overrideMode === 'PARTIAL' ? '#0369a1' : '#b45309' }}>
                    {villagePreviewData.overrideMode === 'PARTIAL' ? 'Mode B: Partial Override' : 'Mode A: Complete Override'}
                  </span>
                </div>
                <div className="between" style={{ marginTop: '8px' }}>
                  <span>Serviceability:</span>
                  <b>{villagePreviewData.isServiceable ? '🟢 Serviceable' : '🔴 Delivery Paused'}</b>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                  <small style={{ color: 'var(--muted)', display: 'block' }}>Delivery Fee</small>
                  <b>₹{villagePreviewData.deliveryFee}</b>
                  <span style={{ fontSize: '10px', display: 'block', color: 'var(--muted)', marginTop: '2px' }}>
                    Source: {villagePreviewData.sourceIndicators?.deliveryFee}
                  </span>
                </div>

                <div style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                  <small style={{ color: 'var(--muted)', display: 'block' }}>Minimum Order</small>
                  <b>₹{villagePreviewData.minimumOrder}</b>
                  <span style={{ fontSize: '10px', display: 'block', color: 'var(--muted)', marginTop: '2px' }}>
                    Source: {villagePreviewData.sourceIndicators?.minimumOrder}
                  </span>
                </div>

                <div style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                  <small style={{ color: 'var(--muted)', display: 'block' }}>Free Delivery Above</small>
                  <b>₹{villagePreviewData.freeDeliveryThreshold}</b>
                  <span style={{ fontSize: '10px', display: 'block', color: 'var(--muted)', marginTop: '2px' }}>
                    Source: {villagePreviewData.sourceIndicators?.freeDeliveryThreshold}
                  </span>
                </div>

                <div style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                  <small style={{ color: 'var(--muted)', display: 'block' }}>Service Radius</small>
                  <b>{villagePreviewData.radiusKm} km</b>
                  <span style={{ fontSize: '10px', display: 'block', color: 'var(--muted)', marginTop: '2px' }}>
                    Source: {villagePreviewData.sourceIndicators?.radiusKm}
                  </span>
                </div>

                <div style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                  <small style={{ color: 'var(--muted)', display: 'block' }}>Cash on Delivery</small>
                  <b style={{ color: villagePreviewData.allowCod ? '#10b981' : '#ef4444' }}>
                    {villagePreviewData.allowCod ? 'Allowed' : 'Disabled'}
                  </b>
                  <span style={{ fontSize: '10px', display: 'block', color: 'var(--muted)', marginTop: '2px' }}>
                    Source: {villagePreviewData.sourceIndicators?.allowCod}
                  </span>
                </div>

                <div style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                  <small style={{ color: 'var(--muted)', display: 'block' }}>Estimated ETA</small>
                  <b>{villagePreviewData.estimatedDelivery}</b>
                  <span style={{ fontSize: '10px', display: 'block', color: 'var(--muted)', marginTop: '2px' }}>
                    Source: {villagePreviewData.sourceIndicators?.estimatedDelivery}
                  </span>
                </div>
              </div>

              <div className="row end" style={{ marginTop: '8px' }}>
                <Button variant="ghost" onClick={() => setPreviewVillageTarget(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
