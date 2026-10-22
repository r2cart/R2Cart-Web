import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Edit2,
  Eye,
  KeyRound,
  LoaderCircle,
  Lock,
  Plus,
  RefreshCcw,
  Save,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserMinus,
  Users,
  Sliders,
  Crown,
  EyeOff,
  Copy,
  Check,
  FileCode,
  XCircle
} from 'lucide-react';
import { Button, ConfirmDialog, Modal, StatusBadge } from '../../components/ui';
import { useApp } from '../../context/AppContext';
import { adminService } from '../../services/admin.service';
import { SYSTEM_PERMISSIONS, PERMISSION_GROUPS } from '../../utils/permissions';

const PERMISSION_PRESETS = [
  {
    name: 'Least Privilege (View Only)',
    badge: 'Safest',
    perms: {
      'products.view': true,
      'inventory.view': true,
      'orders.view': true,
      'customers.view_limited': true,
      'delivery.view': true,
      'reports.view_basic': true
    }
  },
  {
    name: 'Order Fulfillment & Packing',
    badge: 'Operations',
    perms: {
      'orders.view': true,
      'orders.update_status': true,
      'orders.cancel': true,
      'delivery.view': true,
      'delivery.assign': true,
      'inventory.view': true,
      'customers.view_limited': true
    }
  },
  {
    name: 'Catalog & Inventory Specialist',
    badge: 'Products',
    perms: {
      'products.view': true,
      'products.create': true,
      'products.edit': true,
      'products.update_stock': true,
      'inventory.view': true,
      'inventory.manage': true,
      'categories.manage': true,
      'banners.manage': true
    }
  },
  {
    name: 'Full Store Admin (All Permissions)',
    badge: 'Complete',
    perms: Object.keys(SYSTEM_PERMISSIONS).reduce((acc, k) => ({ ...acc, [k]: true }), {})
  }
];

const staffBlank = {
  name: '',
  email: '',
  mobile: '',
  password: '',
  staffRole: 'ADMIN',
  dutyStatus: 'OFF_DUTY',
  vehicleType: 'Bike',
  vehicleNumber: '',
  assignedVillageIds: [],
  permissions: {},
  isStaffActive: true
};

export function AdminSecurity() {
  const { notify } = useApp();
  const [tab, setTab] = useState('staff'); // 'staff' | 'audit' | 'logins'
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Staff accounts state
  const [staffList, setStaffList] = useState([]);
  const [searchStaff, setSearchStaff] = useState('');
  const [staffRoleFilter, setStaffRoleFilter] = useState('');
  const [villagesList, setVillagesList] = useState([]);
  const [editStaff, setEditStaff] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [removeStaff, setRemoveStaff] = useState(null);
  const [confirmToggleActive, setConfirmToggleActive] = useState(null);

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPagination, setAuditPagination] = useState({ page: 1, limit: 50, total: 0, pages: 1 });
  const [moduleFilter, setModuleFilter] = useState('');
  const [searchAudit, setSearchAudit] = useState('');
  const [viewLogDetails, setViewLogDetails] = useState(null);
  const [copiedDiff, setCopiedDiff] = useState(false);

  const handleCopyDiff = () => {
    if (!viewLogDetails?.details) return;
    navigator.clipboard.writeText(JSON.stringify(viewLogDetails.details, null, 2));
    setCopiedDiff(true);
    setTimeout(() => setCopiedDiff(false), 2000);
  };

  const getActionTone = (action = '') => {
    const act = String(action).toUpperCase();
    if (act.includes('SUCCESS') || act.includes('CREATE') || act.includes('SETTLE')) return 'success';
    if (act.includes('FAIL') || act.includes('DELETE') || act.includes('REVOKE') || act.includes('DEACTIVATE')) return 'danger';
    return 'info';
  };

  // Login history state
  const [logins, setLogins] = useState([]);

  const loadData = async (auditPage = 1) => {
    setLoading(true);
    try {
      const [sData, aData, lData, vData] = await Promise.all([
        adminService.getStaff(),
        adminService.getAuditLogs({
          page: auditPage,
          limit: 50,
          module: moduleFilter,
          search: searchAudit
        }),
        adminService.getLoginHistory({ limit: 50 }),
        adminService.getVillages().catch(() => [])
      ]);
      setStaffList(sData || []);
      setAuditLogs(aData.logs || []);
      setAuditPagination(aData.pagination || { page: 1, limit: 50, total: 0, pages: 1 });
      setLogins(lData.logins || []);
      setVillagesList(vData || []);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(1);
  }, [moduleFilter]);

  // Handle staff save
  const handleSaveStaff = async e => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        name: editStaff.name.trim(),
        email: editStaff.email.trim().toLowerCase(),
        mobile: editStaff.mobile ? editStaff.mobile.replace(/\D/g, '') : null,
        staffRole: editStaff.staffRole,
        permissions: editStaff.permissions || {},
        assignedVillageIds: editStaff.assignedVillageIds || [],
        vehicleType: editStaff.vehicleType || null,
        vehicleNumber: editStaff.vehicleNumber ? editStaff.vehicleNumber.trim() : null,
        dutyStatus: editStaff.dutyStatus || 'OFF_DUTY',
        ...(editStaff.password && { password: editStaff.password.trim() }),
        isStaffActive: editStaff.isStaffActive !== false
      };

      if (editStaff.id) {
        await adminService.updateStaff(editStaff.id, payload);
        notify('Admin account and permissions updated');
      } else {
        await adminService.createStaff(payload);
        notify('New Admin account created successfully');
      }
      setEditStaff(null);
      await loadData(auditPagination.page);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleToggleStaffActive = async member => {
    try {
      const nextActive = !member.isStaffActive;
      await adminService.updateStaff(member.id, { isStaffActive: nextActive });
      setStaffList(curr => curr.map(s => (s.id === member.id ? { ...s, isStaffActive: nextActive } : s)));
      notify(`Account access ${nextActive ? 'activated' : 'deactivated successfully'}`);
      setConfirmToggleActive(null);
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleDeleteStaff = async () => {
    if (!removeStaff) return;
    try {
      await adminService.deleteStaff(removeStaff.id);
      setStaffList(curr => curr.filter(s => s.id !== removeStaff.id));
      setRemoveStaff(null);
      notify('Staff privileges removed');
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="admin-card delivery-loading" style={{ padding: '60px', textAlign: 'center' }}>
        <LoaderCircle className="spin" size={32} style={{ margin: '0 auto 12px' }} />
        <p>Loading security configuration and tamper-evident audit logs…</p>
      </div>
    );
  }

  const activeStaffCount = staffList.filter(s => s.isStaffActive !== false).length;

  const filteredStaffList = staffList.filter(member => {
    if (staffRoleFilter && member.staffRole !== staffRoleFilter) {
      return false;
    }
    if (searchStaff.trim()) {
      const q = searchStaff.trim().toLowerCase();
      const matchName = member.name?.toLowerCase().includes(q);
      const matchEmail = member.email?.toLowerCase().includes(q);
      const matchMobile = member.mobile?.includes(q);
      const matchStaffId = member.deliveryStaffId?.toLowerCase().includes(q);
      return matchName || matchEmail || matchMobile || matchStaffId;
    }
    return true;
  });

  return (
    <div className="security-page-wrap">
      {/* Modern Hero Banner */}
      <div className="security-hero-banner">
        <div className="security-hero-content">
          <div className="security-hero-pill">
            <ShieldCheck size={13} />
            <span>Role-Based Access Control</span>
          </div>
          <h1 className="security-hero-title">Security & Staff Management</h1>
          <p className="security-hero-desc">
            Enforce least-privilege policies, provision granular permissions for platform staff, and audit tamper-proof administrative actions across R2Cart.
          </p>
        </div>
        <div className="security-hero-actions">
          <button
            type="button"
            className="security-btn-refresh"
            onClick={() => loadData(auditPagination.page)}
            title="Refresh accounts & logs"
          >
            <RefreshCcw size={15} />
            <span>Refresh</span>
          </button>
          {tab === 'staff' && (
            <button
              type="button"
              className="security-btn-create"
              onClick={() => setEditStaff({ ...staffBlank })}
            >
              <Plus size={16} />
              <span>New Staff Account</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="security-stats-grid">
        <div className="security-stat-card">
          <div className="security-stat-icon-wrap emerald">
            <Users size={22} />
          </div>
          <div className="security-stat-info">
            <span className="security-stat-label">Total Staff Accounts</span>
            <span className="security-stat-value">{staffList.length}</span>
            <span className="security-stat-sub">Provisioned accounts</span>
          </div>
        </div>

        <div className="security-stat-card">
          <div className="security-stat-icon-wrap green">
            <UserCheck size={22} />
          </div>
          <div className="security-stat-info">
            <span className="security-stat-label">Active Privileges</span>
            <span className="security-stat-value" style={{ color: '#059669' }}>
              {activeStaffCount} Active
            </span>
            <span className="security-stat-sub">Authorized callers</span>
          </div>
        </div>

        <div className="security-stat-card">
          <div className="security-stat-icon-wrap cyan">
            <ShieldCheck size={22} />
          </div>
          <div className="security-stat-info">
            <span className="security-stat-label">Audit Trail Records</span>
            <span className="security-stat-value">{auditPagination.total}</span>
            <span className="security-stat-sub">Tamper-evident logs</span>
          </div>
        </div>

        <div className="security-stat-card">
          <div className="security-stat-icon-wrap purple">
            <KeyRound size={22} />
          </div>
          <div className="security-stat-info">
            <span className="security-stat-label">Security Sessions</span>
            <span className="security-stat-value">{logins.length}</span>
            <span className="security-stat-sub">Logged access events</span>
          </div>
        </div>
      </div>

      {/* Segmented Navigation Tabs */}
      <div className="security-tabs-bar">
        <button
          type="button"
          className={`security-tab-item ${tab === 'staff' ? 'active' : ''}`}
          onClick={() => setTab('staff')}
        >
          <Users size={15} />
          <span>Admin & Staff Accounts</span>
          <span className="security-tab-counter">{staffList.length}</span>
        </button>
        <button
          type="button"
          className={`security-tab-item ${tab === 'audit' ? 'active' : ''}`}
          onClick={() => setTab('audit')}
        >
          <ShieldCheck size={15} />
          <span>Activity Audit Trail</span>
          <span className="security-tab-counter">{auditPagination.total}</span>
        </button>
        <button
          type="button"
          className={`security-tab-item ${tab === 'logins' ? 'active' : ''}`}
          onClick={() => setTab('logins')}
        >
          <KeyRound size={15} />
          <span>Login History & Access Logs</span>
          <span className="security-tab-counter">{logins.length}</span>
        </button>
      </div>

      {/* ================= TAB 1: STAFF ACCOUNTS ================= */}
      {tab === 'staff' && (
        <>
          <div className="security-filter-strip">
            <div className="security-filter-left">
              <div className="security-search-wrap">
                <Search size={16} style={{ color: '#94a3b8', flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Search name, email, phone or Staff ID..."
                  value={searchStaff}
                  onChange={e => setSearchStaff(e.target.value)}
                />
                {searchStaff && (
                  <button
                    type="button"
                    onClick={() => setSearchStaff('')}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
                  >
                    ✕
                  </button>
                )}
              </div>
              <select
                className="security-select-filter"
                value={staffRoleFilter}
                onChange={e => setStaffRoleFilter(e.target.value)}
              >
                <option value="">All Roles ({staffList.length})</option>
                <option value="SUPER_ADMIN">Super Admin (Platform Owner)</option>
                <option value="ADMIN">Staff Administrators</option>
                <option value="DELIVERY_PERSON">Delivery Staff</option>
                <option value="INVENTORY_MANAGER">Inventory Managers</option>
                <option value="ORDER_MANAGER">Order Managers</option>
                <option value="DELIVERY_MANAGER">Delivery Managers</option>
                <option value="MARKETING_MANAGER">Marketing Managers</option>
                <option value="SUPPORT_STAFF">Support Staff</option>
              </select>
              {(searchStaff || staffRoleFilter) && (
                <button
                  type="button"
                  className="security-clear-btn"
                  onClick={() => {
                    setSearchStaff('');
                    setStaffRoleFilter('');
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
              Showing {filteredStaffList.length} of {staffList.length} accounts
            </span>
          </div>

          <div className="security-table-container">
            <div className="security-table-wrap">
              <table className="security-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: '220px' }}>Account Holder</th>
                    <th style={{ minWidth: '150px' }}>Role & Duty</th>
                    <th style={{ minWidth: '240px' }}>Granted Permissions</th>
                    <th style={{ minWidth: '150px' }}>Last Login</th>
                    <th style={{ minWidth: '110px' }}>Status</th>
                    <th className="col-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!filteredStaffList.length ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                        {searchStaff || staffRoleFilter ? 'No staff accounts matching your filter criteria.' : 'No staff accounts found.'}
                      </td>
                    </tr>
                  ) : (
                    filteredStaffList.map(member => {
                      const isSuper = member.staffRole === 'SUPER_ADMIN' || member.role === 'SUPER_ADMIN';
                      const grantedKeys = Object.entries(member.permissions || {})
                        .filter(([k, v]) => Boolean(v) && k !== 'all')
                        .map(([k]) => k);

                      const initials = (member.name || 'Admin')
                        .trim()
                        .split(/\s+/)
                        .map(x => x[0])
                        .filter(Boolean)
                        .join('')
                        .slice(0, 2)
                        .toUpperCase() || 'AD';

                      const avatarClass = isSuper ? 'super-admin' : member.staffRole === 'DELIVERY_PERSON' ? 'delivery' : 'admin';

                      return (
                        <tr key={member.id}>
                          <td>
                            <div className="member-cell-wrap">
                              <div className={`member-avatar ${avatarClass}`}>
                                {initials}
                              </div>
                              <div className="member-info-col">
                                <div className="member-name-row">
                                  <span className="member-name">{member.name}</span>
                                  {isSuper && (
                                    <span className="badge-owner">OWNER</span>
                                  )}
                                  {member.deliveryStaffId && (
                                    <span className="badge-delivery-id">{member.deliveryStaffId}</span>
                                  )}
                                </div>
                                <div className="member-meta-row">
                                  <span>{member.email}</span>
                                  {member.mobile && <span>• {member.mobile}</span>}
                                </div>
                                <div className="member-joined-date">
                                  Joined: {new Date(member.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <span className={`role-badge-pill ${isSuper ? 'super' : member.staffRole === 'DELIVERY_PERSON' ? 'delivery' : 'admin'}`}>
                                {isSuper ? '★ SUPER ADMIN' : member.staffRole ? member.staffRole.replace(/_/g, ' ') : 'ADMIN'}
                              </span>
                              {member.staffRole === 'DELIVERY_PERSON' && (
                                <span className={`duty-status-indicator ${member.dutyStatus === 'ON_DUTY' ? 'on-duty' : 'off-duty'}`}>
                                  <span className={`dot-indicator ${member.dutyStatus === 'ON_DUTY' ? 'green' : 'gray'}`} />
                                  {member.dutyStatus === 'ON_DUTY' ? 'On Duty' : member.dutyStatus === 'ON_BREAK' ? 'On Break' : 'Off Duty'}
                                </span>
                              )}
                            </div>
                          </td>

                          <td>
                            {isSuper ? (
                              <div className="perms-authority-full">
                                <CheckCircle2 size={14} />
                                <span>Full Authority (All Permissions)</span>
                              </div>
                            ) : member.staffRole === 'DELIVERY_PERSON' ? (
                              <div style={{ fontSize: '12px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <div><b>Vehicle:</b> {member.vehicleType || 'Bike'} {member.vehicleNumber ? `(${member.vehicleNumber})` : ''}</div>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>
                                  <b>Villages:</b> {member.assignedVillageIds?.length ? `${member.assignedVillageIds.length} assigned` : 'All serviceable'}
                                </div>
                              </div>
                            ) : (
                              <div className="perms-cell-box">
                                <div className="perms-meter-head">
                                  <span className={`perms-meter-num ${grantedKeys.length ? 'granted' : 'zero'}`}>
                                    {grantedKeys.length} of {Object.keys(SYSTEM_PERMISSIONS).length}
                                  </span>
                                  <span style={{ fontSize: '11px', color: '#64748b' }}>permissions granted</span>
                                </div>
                                <div className="perms-bar-track">
                                  <div
                                    className="perms-bar-fill"
                                    style={{ width: `${(grantedKeys.length / Object.keys(SYSTEM_PERMISSIONS).length) * 100}%` }}
                                  />
                                </div>
                                <div className="perms-chips-row">
                                  {grantedKeys.slice(0, 3).map(k => (
                                    <span key={k} className="perm-chip">
                                      {SYSTEM_PERMISSIONS[k]?.label || k}
                                    </span>
                                  ))}
                                  {grantedKeys.length > 3 && (
                                    <span
                                      className="perm-chip more"
                                      title={grantedKeys.slice(3).map(k => SYSTEM_PERMISSIONS[k]?.label || k).join(', ')}
                                    >
                                      +{grantedKeys.length - 3} more
                                    </span>
                                  )}
                                  {!grantedKeys.length && (
                                    <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                                      No permissions assigned (Least Privilege)
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </td>

                          <td>
                            <div className="login-cell-col">
                              {member.lastLoginAt ? (
                                <>
                                  <span className="login-time-text">
                                    {new Date(member.lastLoginAt).toLocaleString('en-IN', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                  {member.lastLoginIp && (
                                    <span className="login-ip-tag">IP: {member.lastLoginIp}</span>
                                  )}
                                </>
                              ) : (
                                <span className="login-never">Never logged in</span>
                              )}
                            </div>
                          </td>

                          <td>
                            <span className={`status-pill-badge ${member.isStaffActive !== false ? 'active' : 'inactive'}`}>
                              <span className="status-pulse-dot" />
                              <span>{member.isStaffActive !== false ? 'Active' : 'Inactive'}</span>
                            </span>
                          </td>

                          <td className="col-actions">
                            <div className="security-actions-wrap">
                              <button
                                type="button"
                                className="security-action-btn-main"
                                onClick={() =>
                                  setEditStaff({
                                    ...member,
                                    password: '',
                                    permissions: member.permissions || {}
                                  })
                                }
                                title={isSuper ? 'View Account Details' : 'Edit Staff & Permissions'}
                              >
                                <Edit2 size={12} />
                                <span>{isSuper ? 'View' : 'Edit'}</span>
                              </button>
                              {!isSuper && (
                                <>
                                  <button
                                    type="button"
                                    className={`security-icon-btn ${member.isStaffActive !== false ? 'toggle-deactivate' : 'toggle-activate'}`}
                                    onClick={() => setConfirmToggleActive(member)}
                                    title={member.isStaffActive !== false ? 'Deactivate Account Privileges' : 'Activate Account Privileges'}
                                  >
                                    {member.isStaffActive !== false ? <UserMinus size={14} /> : <UserCheck size={14} />}
                                  </button>
                                  <button
                                    type="button"
                                    className="security-icon-btn delete"
                                    onClick={() => setRemoveStaff(member)}
                                    title="Revoke Staff Account"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ================= TAB 2: ACTIVITY AUDIT TRAIL ================= */}
      {tab === 'audit' && (
        <>
          <div className="security-filter-strip">
            <div className="security-filter-left">
              <div className="security-search-wrap">
                <Search size={16} style={{ color: '#94a3b8', flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Search user, resource, action..."
                  value={searchAudit}
                  onChange={e => setSearchAudit(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && loadData(1)}
                />
              </div>
              <select
                className="security-select-filter"
                value={moduleFilter}
                onChange={e => setModuleFilter(e.target.value)}
              >
                <option value="">All Audit Modules</option>
                <option value="SECURITY">Security & Staff Management</option>
                <option value="PRODUCTS">Products & Price Changes</option>
                <option value="INVENTORY">Inventory & Stock Changes</option>
                <option value="ORDERS">Orders & Cancellations</option>
                <option value="SETTINGS">Store Settings & Emergency</option>
                <option value="DELIVERY">Delivery Operations</option>
                <option value="AUTH">Authentication Events</option>
              </select>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
              Showing {auditLogs.length} of {auditPagination.total} logged events
            </span>
          </div>

          <div className="security-table-container">
            <div className="security-table-wrap">
              <table className="security-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: '150px' }}>Timestamp (IST)</th>
                    <th style={{ minWidth: '140px' }}>Actor / Staff</th>
                    <th style={{ minWidth: '110px' }}>Module</th>
                    <th style={{ minWidth: '140px' }}>Action</th>
                    <th style={{ minWidth: '160px' }}>Target Resource</th>
                    <th style={{ minWidth: '110px' }}>IP Address</th>
                    <th className="col-actions">Details & Diffs</th>
                  </tr>
                </thead>
                <tbody>
                  {!auditLogs.length ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                        No audit records found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map(log => (
                      <tr key={log.id}>
                        <td>
                          <span style={{ fontSize: '12px', color: '#334155', fontWeight: 600 }}>
                            {new Date(log.createdAt).toLocaleString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{log.userName || 'System'}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{log.userRole}</div>
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: '10.5px',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              fontWeight: 800,
                              background: '#f1f5f9',
                              color: '#334155',
                              border: '1px solid #e2e8f0'
                            }}
                          >
                            {log.module}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '12px', fontWeight: 800, color: '#047857' }}>
                            {log.action}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '12.5px', color: '#334155' }}>{log.resourceName || log.resourceId || '—'}</span>
                        </td>
                        <td>
                          <span className="login-ip-tag">{log.ipAddress || 'Internal'}</span>
                        </td>
                        <td className="col-actions">
                          {log.details ? (
                            <button
                              type="button"
                              className="security-action-btn-main"
                              onClick={() => setViewLogDetails(log)}
                            >
                              <Eye size={13} />
                              <span>View Diff</span>
                            </button>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '12px' }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {auditPagination.pages > 1 && (
              <div className="pagination" style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '16px' }}>
                <Button
                  variant="outline"
                  disabled={auditPagination.page <= 1}
                  onClick={() => loadData(auditPagination.page - 1)}
                >
                  Previous
                </Button>
                <span style={{ display: 'flex', alignItems: 'center', fontSize: '13px', color: '#4b5563' }}>
                  Page {auditPagination.page} of {auditPagination.pages}
                </span>
                <Button
                  variant="outline"
                  disabled={auditPagination.page >= auditPagination.pages}
                  onClick={() => loadData(auditPagination.page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ================= TAB 3: LOGIN HISTORY ================= */}
      {tab === 'logins' && (
        <div className="security-table-container">
          <div className="security-table-wrap">
            <table className="security-table">
              <thead>
                <tr>
                  <th style={{ minWidth: '160px' }}>Timestamp</th>
                  <th style={{ minWidth: '180px' }}>Attempted User / Email</th>
                  <th style={{ minWidth: '120px' }}>Result</th>
                  <th style={{ minWidth: '120px' }}>IP Address</th>
                  <th style={{ minWidth: '220px' }}>User Agent / Browser</th>
                </tr>
              </thead>
              <tbody>
                {!logins.length ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      No login attempts recorded.
                    </td>
                  </tr>
                ) : (
                  logins.map(login => (
                    <tr key={login.id}>
                      <td>
                        <span style={{ fontSize: '12px', color: '#334155', fontWeight: 600 }}>
                          {new Date(login.createdAt).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>
                          {login.userName || login.resourceName || 'Unknown'}
                        </div>
                      </td>
                      <td>
                        {login.action === 'LOGIN_SUCCESS' ? (
                          <span className="status-pill-badge active">
                            <CheckCircle2 size={13} />
                            <span>SUCCESS</span>
                          </span>
                        ) : (
                          <span
                            style={{
                              background: '#fee2e2',
                              color: '#b91c1c',
                              border: '1px solid #fecaca',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 800,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <XCircle size={13} /> FAILED
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="login-ip-tag">{login.ipAddress || 'Internal'}</span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: '11.5px',
                            color: '#64748b',
                            maxWidth: '320px',
                            display: 'inline-block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                          title={login.userAgent}
                        >
                          {login.userAgent || 'Web browser'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* ================= MODAL: CREATE / EDIT ADMIN & STAFF ================= */}
      <Modal
        open={!!editStaff}
        onClose={() => {
          if (!busy) {
            setEditStaff(null);
            setShowPassword(false);
          }
        }}
        size={`admin-account-modal ${editStaff?.staffRole !== 'SUPER_ADMIN' && editStaff?.staffRole !== 'DELIVERY_PERSON' ? 'with-permissions' : ''}`}
        title={
          editStaff?.staffRole === 'SUPER_ADMIN' ? (
            <div className="admin-modal-title-row">
              <div className="admin-modal-icon-badge owner">
                <Crown size={20} />
              </div>
              <div>
                <div className="admin-modal-title-text">Super Admin Account Details (Owner)</div>
                <div className="admin-modal-subtitle-text">Master Platform Owner · Full Unrestricted Control</div>
              </div>
            </div>
          ) : (
            <div className="admin-modal-title-row">
              <div className="admin-modal-icon-badge staff">
                <ShieldCheck size={20} />
              </div>
              <div>
                <div className="admin-modal-title-text">
                  {editStaff?.id ? 'Edit Admin / Staff Account' : 'Create New Admin / Staff Account'}
                </div>
                <div className="admin-modal-subtitle-text">Role-Based Access Control & Permissions</div>
              </div>
            </div>
          )
        }
      >
        <form onSubmit={handleSaveStaff}>
          <div className="modal-body admin-form">
            {/* Super Admin Prestigious Owner Security Card Banner */}
            {editStaff?.staffRole === 'SUPER_ADMIN' && (
              <div className="superadmin-owner-card">
                <div className="superadmin-owner-top">
                  <div className="superadmin-owner-badge">
                    <Crown size={13} />
                    <span>PLATFORM OWNER ACCOUNT</span>
                  </div>
                  <span className="superadmin-lock-tag">
                    <Lock size={11} /> Unrestricted Access
                  </span>
                </div>
                <div className="superadmin-owner-desc">
                  The Super Admin possesses full authorized root control over R2Cart operations, database records, and financial settlements. Roles and core access permissions cannot be altered or restricted.
                </div>
              </div>
            )}

            {/* Row 1: Full Name & Email Address */}
            <div className="form-grid" style={{ gap: '14px', alignItems: 'flex-start' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div className="admin-field-label-row">
                  <span className="admin-field-title">
                    Full Name <span className="admin-field-req">*</span>
                  </span>
                </div>
                <input
                  required
                  value={editStaff?.name || ''}
                  onChange={e => setEditStaff(curr => ({ ...curr, name: e.target.value }))}
                  placeholder="e.g. Platform Super Admin"
                  className="admin-input-control"
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div className="admin-field-label-row">
                  <span className="admin-field-title">
                    Email Address <span className="admin-field-req">*</span>
                  </span>
                  {editStaff?.staffRole === 'SUPER_ADMIN' && (
                    <span className="admin-field-badge locked">
                      <Lock size={10} style={{ display: 'inline', marginRight: '3px' }} />
                      Primary Master ID
                    </span>
                  )}
                </div>
                <input
                  type="email"
                  required
                  disabled={editStaff?.staffRole === 'SUPER_ADMIN'}
                  value={editStaff?.email || ''}
                  onChange={e => setEditStaff(curr => ({ ...curr, email: e.target.value }))}
                  placeholder="staff@r2cart.com"
                  className="admin-input-control"
                />
              </label>
            </div>

            {/* Row 2: Mobile Number & Password */}
            <div className="form-grid" style={{ gap: '14px', alignItems: 'flex-start' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div className="admin-field-label-row">
                  <span className="admin-field-title">Mobile Number</span>
                  <span className="admin-field-badge">10 Digits</span>
                </div>
                <div className="admin-input-group">
                  <span className="admin-input-prefix-box">+91</span>
                  <input
                    type="tel"
                    maxLength="10"
                    value={editStaff?.mobile || ''}
                    onChange={e => setEditStaff(curr => ({ ...curr, mobile: e.target.value.replace(/\D/g, '') }))}
                    placeholder="9876543210"
                    className="admin-input-control with-prefix"
                  />
                </div>
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div className="admin-field-label-row">
                  <span className="admin-field-title">
                    Account Password {!editStaff?.id && <span className="admin-field-req">*</span>}
                  </span>
                  {editStaff?.id && (
                    <span className="admin-field-badge">Leave blank to keep current</span>
                  )}
                </div>
                <div className="admin-input-group">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required={!editStaff?.id}
                    minLength="6"
                    value={editStaff?.password || ''}
                    onChange={e => setEditStaff(curr => ({ ...curr, password: e.target.value }))}
                    placeholder={editStaff?.id ? '••••••••' : 'Min 6 characters'}
                    className="admin-input-control with-action"
                  />
                  <button
                    type="button"
                    className="admin-input-toggle-btn"
                    onClick={() => setShowPassword(v => !v)}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex="-1"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>
            </div>

            {/* Role Display: Readonly badge for Super Admin or Dropdown for other roles */}
            {editStaff?.staffRole === 'SUPER_ADMIN' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div className="admin-field-label-row">
                  <span className="admin-field-title">Account Staff Role</span>
                  <span className="admin-field-badge locked">Permanent Owner</span>
                </div>
                <div className="superadmin-role-display">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '9px',
                      background: '#fef3c7',
                      color: '#b45309',
                      border: '1px solid #fde68a',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0
                    }}>
                      <Crown size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a' }}>
                        ★ Primary Super Admin (Platform Owner)
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>
                        Master administrator with root authorization across R2Cart
                      </div>
                    </div>
                  </div>
                  <span className="superadmin-role-badge-tag">
                    <CheckCircle2 size={12} /> Root Access
                  </span>
                </div>
              </div>
            ) : (
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div className="admin-field-label-row">
                  <span className="admin-field-title">
                    Account Staff Role <span className="admin-field-req">*</span>
                  </span>
                </div>
                <select
                  value={editStaff?.staffRole || 'ADMIN'}
                  onChange={e => setEditStaff(curr => ({ ...curr, staffRole: e.target.value }))}
                  className="admin-select-control"
                >
                  <option value="ADMIN">Staff Administrator (Granular Role-Based Permissions)</option>
                  <option value="DELIVERY_PERSON">Delivery Staff (Field Delivery Partner)</option>
                  <option value="INVENTORY_MANAGER">Inventory Manager (Stock & Expiry Specialist)</option>
                  <option value="ORDER_MANAGER">Order Manager (Fulfillment & Packing Specialist)</option>
                  <option value="DELIVERY_MANAGER">Delivery Manager (Dispatch & Routing Specialist)</option>
                  <option value="MARKETING_MANAGER">Marketing Manager (Promos & Coupons)</option>
                  <option value="SUPPORT_STAFF">Customer Support Staff</option>
                </select>
              </label>
            )}

          {/* Delivery Staff Specific Configuration */}
          {editStaff?.staffRole === 'DELIVERY_PERSON' && (
            <div style={{ background: '#f0fdf4', padding: '14px', borderRadius: '10px', border: '1px solid #bbf7d0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <b style={{ fontSize: '13px', color: '#166534' }}>Delivery Partner Configuration:</b>
              {editStaff?.id ? (
                <div style={{ background: '#ecfdf5', padding: '10px 14px', borderRadius: '8px', border: '1px solid #a7f3d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#047857', textTransform: 'uppercase' }}>Assigned Delivery Staff ID</span>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#065f46', marginTop: '2px' }}>
                      {editStaff.deliveryStaffId || 'Auto Assigned'}
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#059669', background: '#fff', padding: '2px 8px', borderRadius: '4px' }}>
                    Permanent
                  </span>
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: '#065f46' }}>
                  A permanent Staff ID (e.g. <b>R2D-1002</b>) will be auto-generated upon creation.
                </div>
              )}
              <div className="form-grid" style={{ gap: '12px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>Vehicle Type</span>
                  <input
                    value={editStaff?.vehicleType || 'Bike'}
                    onChange={e => setEditStaff(c => ({ ...c, vehicleType: e.target.value }))}
                    placeholder="e.g. Motorcycle, Scooter, Van"
                    style={{ height: '38px', padding: '0 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px' }}
                  />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>Vehicle Number</span>
                  <input
                    value={editStaff?.vehicleNumber || ''}
                    onChange={e => setEditStaff(c => ({ ...c, vehicleNumber: e.target.value }))}
                    placeholder="e.g. DL 01 AB 1234"
                    style={{ height: '38px', padding: '0 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px' }}
                  />
                </label>
              </div>
            </div>
          )}

          {/* Granular Role-Based Permissions Checklist */}
          {editStaff?.staffRole !== 'SUPER_ADMIN' && editStaff?.staffRole !== 'DELIVERY_PERSON' && (
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <b style={{ fontSize: '14px', color: '#0f172a' }}>Granular Access Permissions:</b>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>
                    Follows least privilege. Only explicitly enabled features and API endpoints will be accessible.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const allOn = Object.keys(SYSTEM_PERMISSIONS).reduce((acc, k) => ({ ...acc, [k]: true }), {});
                      setEditStaff(c => ({ ...c, permissions: allOn }));
                    }}
                    style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditStaff(c => ({ ...c, permissions: {} }))}
                    style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', color: '#ef4444', fontWeight: 600 }}
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Sliders size={12} /> Presets:
                </span>
                {PERMISSION_PRESETS.map(preset => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setEditStaff(c => ({ ...c, permissions: { ...preset.perms } }))}
                    style={{
                      fontSize: '11px',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      background: '#fff',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#1e293b'
                    }}
                  >
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>

              {/* Grouped Permissions Checkboxes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '4px' }}>
                {PERMISSION_GROUPS.map(group => {
                  const groupKeys = group.keys;
                  const allGroupChecked = groupKeys.every(k => Boolean(editStaff?.permissions?.[k]));

                  return (
                    <div
                      key={group.name}
                      style={{
                        background: '#fff',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        padding: '12px'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '8px',
                          borderBottom: '1px solid #f1f5f9',
                          paddingBottom: '6px'
                        }}
                      >
                        <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#1e293b' }}>
                          {group.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const nextGroupVal = !allGroupChecked;
                            const nextPerms = { ...(editStaff?.permissions || {}) };
                            groupKeys.forEach(k => {
                              nextPerms[k] = nextGroupVal;
                            });
                            setEditStaff(c => ({ ...c, permissions: nextPerms }));
                          }}
                          style={{
                            fontSize: '11px',
                            background: 'none',
                            border: 'none',
                            color: '#0284c7',
                            cursor: 'pointer',
                            fontWeight: 600,
                            padding: 0
                          }}
                        >
                          {allGroupChecked ? 'Deselect Group' : 'Select Group'}
                        </button>
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                          gap: '8px'
                        }}
                      >
                        {groupKeys.map(key => {
                          const def = SYSTEM_PERMISSIONS[key] || { label: key, description: '' };
                          const isChecked = Boolean(editStaff?.permissions?.[key]);

                          return (
                            <label
                              key={key}
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '8px',
                                cursor: 'pointer',
                                margin: 0,
                                background: isChecked ? '#f0fdf4' : '#fafafa',
                                border: isChecked ? '1px solid #bbf7d0' : '1px solid #f1f5f9',
                                padding: '8px 10px',
                                borderRadius: '6px',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={e => {
                                  const checked = e.target.checked;
                                  setEditStaff(c => ({
                                    ...c,
                                    permissions: {
                                      ...(c.permissions || {}),
                                      [key]: checked
                                    }
                                  }));
                                }}
                                style={{ marginTop: '2px' }}
                              />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>
                                    {def.label}
                                  </span>
                                  <code style={{ fontSize: '10px', color: '#64748b', background: '#f1f5f9', padding: '1px 4px', borderRadius: '3px' }}>
                                    {key}
                                  </code>
                                </div>
                                {def.description && (
                                  <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0', lineHeight: 1.3 }}>
                                    {def.description}
                                  </p>
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          </div>

          {/* Fixed Modal Action Footer */}
          <div className="modal-foot">
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() => {
                setEditStaff(null);
                setShowPassword(false);
              }}
              style={{ height: '42px', padding: '0 20px', borderRadius: '10px', fontSize: '13.5px', fontWeight: 700 }}
            >
              Cancel
            </Button>
            <button
              type="submit"
              disabled={busy}
              className="admin-modal-save-btn"
            >
              {busy ? <LoaderCircle className="spin" size={16} /> : <Save size={16} />}
              {editStaff?.staffRole === 'SUPER_ADMIN' ? 'Save Account Details' : 'Save Account & Permissions'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: View Audit Diff */}
      <Modal
        open={!!viewLogDetails}
        onClose={() => {
          setViewLogDetails(null);
          setCopiedDiff(false);
        }}
        size="audit-diff-modal"
        title={
          <div className="admin-modal-title-row">
            <div className="admin-modal-icon-badge staff" style={{ background: '#f1f5f9', color: '#0f172a', borderColor: '#e2e8f0' }}>
              <FileCode size={20} />
            </div>
            <div>
              <div className="admin-modal-title-text">Audit Event Diff & Metadata</div>
              <div className="admin-modal-subtitle-text">Cryptographically verifiable immutable audit trail</div>
            </div>
          </div>
        }
      >
        {viewLogDetails && (
          <>
            <div className="modal-body">
              {/* 4-Stat Metadata Grid */}
              <div className="audit-meta-grid">
                <div className="audit-meta-item">
                  <span className="audit-meta-label">
                    <ShieldCheck size={12} /> Recorded Action
                  </span>
                  <div className="audit-meta-value">
                    <span className={`audit-action-pill ${getActionTone(viewLogDetails.action)}`}>
                      {viewLogDetails.action || 'EVENT_LOG'}
                    </span>
                  </div>
                </div>

                <div className="audit-meta-item">
                  <span className="audit-meta-label">
                    <KeyRound size={12} /> Target Module
                  </span>
                  <div className="audit-meta-value">
                    <span style={{ fontSize: '12px', background: '#ffffff', border: '1px solid #cbd5e1', padding: '2px 8px', borderRadius: '5px', fontWeight: 700 }}>
                      {viewLogDetails.module || 'SYSTEM'}
                    </span>
                  </div>
                </div>

                <div className="audit-meta-item">
                  <span className="audit-meta-label">
                    <UserCheck size={12} /> Performed By
                  </span>
                  <div className="audit-meta-value" style={{ fontSize: '13px' }}>
                    <span>{viewLogDetails.userName || 'System / Anonymous'}</span>
                    {viewLogDetails.userRole && (
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                        ({viewLogDetails.userRole})
                      </span>
                    )}
                  </div>
                </div>

                <div className="audit-meta-item">
                  <span className="audit-meta-label">
                    <Clock size={12} /> Event Timestamp
                  </span>
                  <div className="audit-meta-value" style={{ fontSize: '12.5px', color: '#334155' }}>
                    {viewLogDetails.createdAt
                      ? new Date(viewLogDetails.createdAt).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })
                      : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Code Inspector Box */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#1e293b', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <FileCode size={14} style={{ color: '#059669' }} /> Sanitized Changes & Details
                  </span>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    JSON Payload
                  </span>
                </div>

                <div className="audit-code-box">
                  <div className="audit-code-header">
                    <div className="audit-code-dots">
                      <span className="audit-code-dot red" />
                      <span className="audit-code-dot yellow" />
                      <span className="audit-code-dot green" />
                      <span className="audit-code-filename">event_diff.json</span>
                    </div>
                    <button
                      type="button"
                      className={`audit-code-copy-btn ${copiedDiff ? 'copied' : ''}`}
                      onClick={handleCopyDiff}
                    >
                      {copiedDiff ? (
                        <>
                          <Check size={12} /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={12} /> Copy JSON
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="audit-code-pre">
                    {JSON.stringify(viewLogDetails.details || {}, null, 2)}
                  </pre>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="modal-foot">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#059669', fontWeight: 600 }}>
                <CheckCircle2 size={14} /> Immutable audit trail
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setViewLogDetails(null);
                  setCopiedDiff(false);
                }}
                style={{ height: '38px', padding: '0 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 700 }}
              >
                Close
              </Button>
            </div>
          </>
        )}
      </Modal>

      {/* Delete Staff Confirmation */}
      <ConfirmDialog
        open={!!removeStaff}
        onClose={() => setRemoveStaff(null)}
        onConfirm={handleDeleteStaff}
        title="Revoke Staff Account?"
        itemName={removeStaff?.name}
        itemType="Staff"
        message={`Are you sure you want to revoke staff access for “${removeStaff?.name || ''}”? This account will be downgraded to a standard customer account.`}
        warningNote="They will immediately lose access to all admin consoles, tools, and operational controls."
        confirmText="Revoke Access"
        cancelText="Cancel"
      />

      {/* Toggle Active Confirmation */}
      <ConfirmDialog
        open={!!confirmToggleActive}
        onClose={() => setConfirmToggleActive(null)}
        onConfirm={() => confirmToggleActive && handleToggleStaffActive(confirmToggleActive)}
        title={confirmToggleActive?.isStaffActive !== false ? 'Deactivate Account Privileges?' : 'Reactivate Account Privileges?'}
        itemName={confirmToggleActive?.name}
        itemType="Staff"
        variant={confirmToggleActive?.isStaffActive !== false ? 'warning' : 'primary'}
        message={
          confirmToggleActive?.isStaffActive !== false
            ? `Are you sure you want to deactivate “${confirmToggleActive?.name || ''}”? They will immediately be blocked from signing into the admin portal.`
            : `Reactivate account privileges for “${confirmToggleActive?.name || ''}”? They will regain access to their assigned operational permissions.`
        }
        confirmText={confirmToggleActive?.isStaffActive !== false ? 'Deactivate Privileges' : 'Reactivate Privileges'}
        cancelText="Cancel"
      />
    </div>
  );
}
