import {useEffect,useState} from 'react';
import {AlertCircle,AlertTriangle,CheckCircle2,Clock,Edit2,Eye,KeyRound,LoaderCircle,Lock,LogOut,Plus,RefreshCcw,Save,Search,Shield,ShieldAlert,ShieldCheck,Trash2,UserCheck,UserMinus,Users,XCircle} from 'lucide-react';
import {Button,ConfirmDialog,Modal,StatusBadge} from '../../components/ui';
import {useApp} from '../../context/AppContext';
import {adminService} from '../../services/admin.service';

const ALL_MODULES = [
  { key: 'delivery', label: 'Delivery Area Management' },
  { key: 'inventory', label: 'Smart Inventory & Expiry' },
  { key: 'orders', label: 'Orders & Packing Operations' },
  { key: 'scheduling', label: 'Order Scheduling & Store Hours' },
  { key: 'marketing', label: 'Marketing, Popups & Coupons' },
  { key: 'security', label: 'Security & Staff Management' },
  { key: 'settings', label: 'Store General Settings' }
];

const staffBlank = {
  name: '',
  email: '',
  mobile: '',
  password: '',
  staffRole: 'DELIVERY_PERSON',
  dutyStatus: 'OFF_DUTY',
  vehicleType: 'Bike',
  vehicleNumber: '',
  assignedVillageIds: [],
  permissions: {
    delivery: false,
    inventory: false,
    orders: false,
    scheduling: false,
    marketing: false,
    security: false,
    settings: false
  },
  isStaffActive: true
};

export function AdminSecurity() {
  const { notify } = useApp();
  const [tab, setTab] = useState('staff'); // 'staff' | 'audit' | 'logins'
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Staff accounts state
  const [staffList, setStaffList] = useState([]);
  const [villagesList, setVillagesList] = useState([]);
  const [editStaff, setEditStaff] = useState(null);
  const [removeStaff, setRemoveStaff] = useState(null);

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPagination, setAuditPagination] = useState({ page: 1, limit: 50, total: 0, pages: 1 });
  const [moduleFilter, setModuleFilter] = useState('');
  const [searchAudit, setSearchAudit] = useState('');
  const [viewLogDetails, setViewLogDetails] = useState(null);

  // Login history state
  const [logins, setLogins] = useState([]);
  const [loginsLoading, setLoginsLoading] = useState(false);

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
        notify('Staff account updated');
      } else {
        await adminService.createStaff(payload);
        notify('Staff account created successfully');
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
      notify(`Staff access ${nextActive ? 'activated' : 'deactivated'}`);
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
      <div className="admin-card delivery-loading">
        <LoaderCircle className="spin" /> Loading security and activity audit logs…
      </div>
    );
  }

  const activeStaffCount = staffList.filter(s => s.isStaffActive !== false).length;

  return (
    <>
      <div className="admin-title">
        <div>
          <h1>Admin Security & Activity Audit</h1>
          <p>Role-based access control (RBAC), staff account management, and permanent tamper-evident audit logs.</p>
        </div>
        <div className="row gap">
          <Button variant="ghost" onClick={() => loadData(auditPagination.page)}><RefreshCcw /> Refresh</Button>
          {tab === 'staff' && (
            <Button onClick={() => setEditStaff({ ...staffBlank })}>
              <Plus /> Add Staff Account
            </Button>
          )}
        </div>
      </div>

      {/* KPI Stats */}
      <div className="delivery-stats">
        <div className="admin-card delivery-stat">
          <i><Users /></i>
          <span>
            <small>Total Staff Members</small>
            <b>{staffList.length} accounts</b>
          </span>
        </div>
        <div className="admin-card delivery-stat">
          <i><UserCheck /></i>
          <span>
            <small>Active Privileges</small>
            <b style={{ color: '#10b981' }}>{activeStaffCount} active</b>
          </span>
        </div>
        <div className="admin-card delivery-stat">
          <i><Shield /></i>
          <span>
            <small>Total Audit Logs</small>
            <b>{auditPagination.total} recorded</b>
          </span>
        </div>
        <div className="admin-card delivery-stat">
          <i><KeyRound /></i>
          <span>
            <small>Recent Logins</small>
            <b>{logins.length} events</b>
          </span>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="admin-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}>
        <button
          type="button"
          className={`tab-btn ${tab === 'staff' ? 'active' : ''}`}
          onClick={() => setTab('staff')}
        >
          <Users size={15} />
          <span>Staff Accounts & Permissions ({staffList.length})</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${tab === 'audit' ? 'active' : ''}`}
          onClick={() => setTab('audit')}
        >
          <ShieldCheck size={15} />
          <span>Activity Audit Trail ({auditPagination.total})</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${tab === 'logins' ? 'active' : ''}`}
          onClick={() => setTab('logins')}
        >
          <KeyRound size={15} />
          <span>Login History & Access Logs</span>
        </button>
      </div>

      {/* ================= TAB 1: STAFF ACCOUNTS ================= */}
      {tab === 'staff' && (
        <div className="admin-card table-card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Assigned Role</th>
                  <th>Module Permissions</th>
                  <th>Last Login</th>
                  <th>Account Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {!staffList.length ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
                      No staff accounts found.
                    </td>
                  </tr>
                ) : (
                  staffList.map(member => (
                    <tr key={member.id}>
                      <td>
                        <b>{member.name}</b>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>{member.email} · {member.mobile || 'No phone'}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{
                            fontSize: '11px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontWeight: 700,
                            display: 'inline-block',
                            width: 'fit-content',
                            background: member.staffRole === 'SUPER_ADMIN' ? '#fee2e2' : (member.staffRole === 'DELIVERY_PERSON' ? '#dcfce7' : '#e0f2fe'),
                            color: member.staffRole === 'SUPER_ADMIN' ? '#b91c1c' : (member.staffRole === 'DELIVERY_PERSON' ? '#15803d' : '#0369a1')
                          }}>
                            {member.staffRole === 'DELIVERY_PERSON' ? 'DELIVERY STAFF' : (member.staffRole ? member.staffRole.replace(/_/g, ' ') : 'ADMIN')}
                          </span>
                          {member.staffRole === 'DELIVERY_PERSON' && (
                            <span style={{ fontSize: '10.5px', color: member.dutyStatus === 'ON_DUTY' ? '#16a34a' : '#6b7280', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: member.dutyStatus === 'ON_DUTY' ? '#16a34a' : '#9ca3af' }} />
                              {member.dutyStatus === 'ON_DUTY' ? 'On Duty' : (member.dutyStatus === 'ON_BREAK' ? 'On Break' : 'Off Duty')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        {member.staffRole === 'SUPER_ADMIN' ? (
                          <span style={{ fontSize: '12px', color: '#047857', fontWeight: 600 }}>All Modules (Full Access)</span>
                        ) : member.staffRole === 'DELIVERY_PERSON' ? (
                          <div style={{ fontSize: '12px', color: '#374151' }}>
                            <div><b>Vehicle:</b> {member.vehicleType || 'Not set'} {member.vehicleNumber ? `(${member.vehicleNumber})` : ''}</div>
                            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                              <b>Villages:</b> {member.assignedVillageIds?.length ? `${member.assignedVillageIds.length} assigned` : 'All serviceable'}
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '300px' }}>
                            {ALL_MODULES.filter(m => member.permissions?.[m.key]).map(m => (
                              <span key={m.key} style={{ fontSize: '10px', background: '#f3f4f6', color: '#374151', padding: '2px 6px', borderRadius: '4px' }}>
                                {m.label.split(' ')[0]}
                              </span>
                            ))}
                            {!ALL_MODULES.some(m => member.permissions?.[m.key]) && (
                              <span style={{ fontSize: '11px', color: '#9ca3af' }}>Standard Role Defaults</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', color: '#4b5563' }}>
                          {member.lastLoginAt ? new Date(member.lastLoginAt).toLocaleString('en-IN') : 'Never'}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={member.isStaffActive !== false ? 'Active' : 'Inactive'} />
                      </td>
                      <td>
                        <div className="row gap" style={{ gap: '6px' }}>
                          <Button
                            variant="outline"
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                            onClick={() => setEditStaff({
                              ...member,
                              password: '',
                              permissions: member.permissions || {}
                            })}
                          >
                            <Edit2 size={13} /> Edit
                          </Button>
                          {member.staffRole !== 'SUPER_ADMIN' && (
                            <>
                              <Button
                                variant="ghost"
                                style={{ padding: '4px 8px', fontSize: '12px' }}
                                onClick={() => handleToggleStaffActive(member)}
                              >
                                {member.isStaffActive !== false ? 'Deactivate' : 'Activate'}
                              </Button>
                              <Button
                                variant="ghost"
                                className="text-danger"
                                style={{ padding: '4px 8px', fontSize: '12px' }}
                                onClick={() => setRemoveStaff(member)}
                              >
                                <Trash2 size={13} />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 2: ACTIVITY AUDIT TRAIL ================= */}
      {tab === 'audit' && (
        <>
          <div className="row between" style={{ marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div className="row gap">
              <div className="admin-search-box" style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #d1d5db', borderRadius: '8px', padding: '6px 12px' }}>
                <Search size={18} style={{ color: '#9ca3af', marginRight: '8px' }} />
                <input
                  type="text"
                  placeholder="Search user, resource, action..."
                  value={searchAudit}
                  onChange={e => setSearchAudit(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && loadData(1)}
                  style={{ border: 'none', outline: 'none', width: '220px' }}
                />
              </div>
              <Button variant="ghost" onClick={() => loadData(1)}>Search</Button>
              <select
                value={moduleFilter}
                onChange={e => setModuleFilter(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff' }}
              >
                <option value="">All Modules</option>
                <option value="DELIVERY">Delivery Operations</option>
                <option value="INVENTORY">Inventory & Stock</option>
                <option value="ORDERS">Orders & Packing</option>
                <option value="SCHEDULING">Order Scheduling</option>
                <option value="MARKETING">Marketing & Promos</option>
                <option value="SECURITY">Security & Staff</option>
                <option value="SETTINGS">Store Settings</option>
                <option value="AUTH">Authentication</option>
              </select>
            </div>
            <small style={{ color: '#6b7280' }}>Permanent server audit trail</small>
          </div>

          <div className="admin-card table-card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User & Role</th>
                    <th>Module</th>
                    <th>Action</th>
                    <th>Resource Target</th>
                    <th>IP Address</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {!auditLogs.length ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
                        No audit events recorded for this selection.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map(log => (
                      <tr key={log.id}>
                        <td>
                          <span style={{ fontSize: '12px', color: '#4b5563' }}>
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
                          <b>{log.userName || 'System'}</b>
                          <div style={{ fontSize: '11px', color: '#6b7280' }}>{log.userRole}</div>
                        </td>
                        <td>
                          <span style={{
                            fontSize: '11px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontWeight: 700,
                            background: '#f3f4f6',
                            color: '#1f2937'
                          }}>
                            {log.module}
                          </span>
                        </td>
                        <td>
                          <b style={{ fontSize: '12px', color: '#166534' }}>{log.action}</b>
                        </td>
                        <td>
                          <span style={{ fontSize: '13px' }}>{log.resourceName || log.resourceId || '—'}</span>
                        </td>
                        <td>
                          <code style={{ fontSize: '11px', background: '#f9fafb', padding: '2px 4px', borderRadius: '4px' }}>
                            {log.ipAddress || 'Internal'}
                          </code>
                        </td>
                        <td>
                          {log.details ? (
                            <Button
                              variant="ghost"
                              style={{ padding: '3px 8px', fontSize: '12px' }}
                              onClick={() => setViewLogDetails(log)}
                            >
                              <Eye size={13} /> View Diff
                            </Button>
                          ) : (
                            <span style={{ color: '#9ca3af', fontSize: '12px' }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
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
        <div className="admin-card table-card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Attempted User / Email</th>
                  <th>Result</th>
                  <th>IP Address</th>
                  <th>User Agent / Browser</th>
                </tr>
              </thead>
              <tbody>
                {!logins.length ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
                      No login attempts recorded.
                    </td>
                  </tr>
                ) : (
                  logins.map(login => (
                    <tr key={login.id}>
                      <td>
                        <span style={{ fontSize: '12px', color: '#4b5563' }}>
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
                        <b>{login.userName || login.resourceName || 'Unknown'}</b>
                      </td>
                      <td>
                        {login.action === 'LOGIN_SUCCESS' ? (
                          <span style={{ background: '#ecfdf5', color: '#047857', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={13} /> SUCCESS
                          </span>
                        ) : (
                          <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <XCircle size={13} /> FAILED
                          </span>
                        )}
                      </td>
                      <td>
                        <code>{login.ipAddress || 'Internal'}</code>
                      </td>
                      <td>
                        <span style={{ fontSize: '11px', color: '#6b7280', maxWidth: '300px', display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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

      {/* Modal: Add / Edit Staff */}
      <Modal open={!!editStaff} onClose={() => !busy && setEditStaff(null)} title={editStaff?.id ? 'Edit Staff Account' : 'Create Staff Account'}>
        <form className="modal-body admin-form" onSubmit={handleSaveStaff} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-grid" style={{ gap: '16px', alignItems: 'flex-start' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '20px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>
                  Full Name <span style={{ color: '#ef4444' }}>*</span>
                </span>
              </div>
              <input
                required
                value={editStaff?.name || ''}
                onChange={e => setEditStaff(curr => ({ ...curr, name: e.target.value }))}
                placeholder="Staff member full name"
                style={{ width: '100%', height: '42px', padding: '0 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13.5px' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '20px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>
                  Email Address <span style={{ color: '#ef4444' }}>*</span>
                </span>
              </div>
              <input
                type="email"
                required
                value={editStaff?.email || ''}
                onChange={e => setEditStaff(curr => ({ ...curr, email: e.target.value }))}
                placeholder="staff@r2cart.com"
                style={{ width: '100%', height: '42px', padding: '0 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13.5px' }}
              />
            </label>
          </div>

          <div className="form-grid" style={{ gap: '16px', alignItems: 'flex-start' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '20px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>Mobile Number</span>
                <span style={{ fontSize: '11px', fontWeight: 500, color: '#6b7280' }}>(10 Digits)</span>
              </div>
              <input
                type="tel"
                maxLength="10"
                value={editStaff?.mobile || ''}
                onChange={e => setEditStaff(curr => ({ ...curr, mobile: e.target.value }))}
                placeholder="Optional"
                style={{ width: '100%', height: '42px', padding: '0 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13.5px' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '20px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>
                  Account Password {editStaff?.id ? '' : <span style={{ color: '#ef4444' }}>*</span>}
                </span>
                {editStaff?.id && (
                  <span style={{ fontSize: '11px', fontWeight: 500, color: '#6b7280' }}>(Leave blank to keep)</span>
                )}
              </div>
              <input
                type="password"
                required={!editStaff?.id}
                minLength="6"
                value={editStaff?.password || ''}
                onChange={e => setEditStaff(curr => ({ ...curr, password: e.target.value }))}
                placeholder={editStaff?.id ? '••••••••' : 'Min 6 characters'}
                style={{ width: '100%', height: '42px', padding: '0 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13.5px' }}
              />
            </label>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', minHeight: '20px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>
                Staff Role <span style={{ color: '#ef4444' }}>*</span>
              </span>
            </div>
            <select
              value={editStaff?.staffRole || 'DELIVERY_PERSON'}
              disabled={editStaff?.staffRole === 'SUPER_ADMIN'}
              onChange={e => setEditStaff(curr => ({ ...curr, staffRole: e.target.value }))}
              style={{
                width: '100%',
                height: '42px',
                padding: '0 12px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '13.5px',
                background: editStaff?.staffRole === 'SUPER_ADMIN' ? '#f1f5f9' : '#fff',
                cursor: editStaff?.staffRole === 'SUPER_ADMIN' ? 'not-allowed' : 'pointer'
              }}
            >
              {editStaff?.staffRole === 'SUPER_ADMIN' && (
                <option value="SUPER_ADMIN">★ Primary Super Admin (Platform Owner - Sole Account)</option>
              )}
              <option value="ADMIN">Administrator (Full Store Access)</option>
              <option value="DELIVERY_PERSON">Delivery Staff / Field Delivery Person</option>
              <option value="INVENTORY_MANAGER">Inventory Manager (Stock & Expiry)</option>
              <option value="ORDER_MANAGER">Order Manager (Fulfillment & Packing)</option>
              <option value="DELIVERY_MANAGER">Delivery Manager (Villages & Zones)</option>
              <option value="MARKETING_MANAGER">Marketing Manager (Promos & Coupons)</option>
              <option value="SUPPORT_STAFF">Support Staff (Customer Inquiries)</option>
            </select>
          </label>

          {editStaff?.staffRole === 'DELIVERY_PERSON' && (
            <div style={{ background: '#f0fdf4', padding: '14px', borderRadius: '10px', border: '1px solid #bbf7d0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <b style={{ fontSize: '13px', color: '#166534' }}>Delivery Staff Specific Settings:</b>
              <div className="form-grid" style={{ gap: '12px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>Vehicle Type</span>
                  <select
                    value={editStaff?.vehicleType || 'Bike'}
                    onChange={e => setEditStaff(curr => ({ ...curr, vehicleType: e.target.value }))}
                    style={{ height: '38px', borderRadius: '6px', border: '1px solid #d1d5db', padding: '0 8px', fontSize: '13px', background: '#fff' }}
                  >
                    <option value="Bike">Motorcycle / Bike</option>
                    <option value="Scooter">Scooter</option>
                    <option value="Electric Vehicle">Electric Two-Wheeler (EV)</option>
                    <option value="Van">Delivery Van / Auto</option>
                    <option value="Cycle">Bicycle</option>
                  </select>
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>Vehicle Registration Number</span>
                  <input
                    placeholder="e.g. UP-14-BT-9821"
                    value={editStaff?.vehicleNumber || ''}
                    onChange={e => setEditStaff(curr => ({ ...curr, vehicleNumber: e.target.value }))}
                    style={{ height: '38px', borderRadius: '6px', border: '1px solid #d1d5db', padding: '0 10px', fontSize: '13px', background: '#fff' }}
                  />
                </label>
              </div>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>Initial Duty Availability</span>
                <select
                  value={editStaff?.dutyStatus || 'OFF_DUTY'}
                  onChange={e => setEditStaff(curr => ({ ...curr, dutyStatus: e.target.value }))}
                  style={{ height: '38px', borderRadius: '6px', border: '1px solid #d1d5db', padding: '0 8px', fontSize: '13px', background: '#fff' }}
                >
                  <option value="ON_DUTY">On Duty (Ready to receive order assignments)</option>
                  <option value="OFF_DUTY">Off Duty (Not accepting orders)</option>
                  <option value="ON_BREAK">On Break</option>
                </select>
              </label>

              {villagesList.length > 0 && (
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
                    Assigned Serviceable Villages:
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '6px', maxHeight: '140px', overflowY: 'auto', background: '#fff', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}>
                    {villagesList.map(v => {
                      const selected = (editStaff?.assignedVillageIds || []).includes(v.id);
                      return (
                        <label key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', margin: 0 }}>
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={e => {
                              const currIds = editStaff?.assignedVillageIds || [];
                              const nextIds = e.target.checked
                                ? [...currIds, v.id]
                                : currIds.filter(id => id !== v.id);
                              setEditStaff(c => ({ ...c, assignedVillageIds: nextIds }));
                            }}
                          />
                          <span>{v.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {editStaff?.staffRole !== 'SUPER_ADMIN' && editStaff?.staffRole !== 'DELIVERY_PERSON' && (
            <div style={{ marginTop: '4px', background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <b style={{ fontSize: '13px', display: 'block', marginBottom: '10px', color: '#1e293b' }}>Granular Module Permissions:</b>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                {ALL_MODULES.map(m => (
                  <label key={m.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0, background: '#fff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(editStaff?.permissions?.[m.key])}
                      onChange={e => setEditStaff(curr => ({
                        ...curr,
                        permissions: {
                          ...(curr.permissions || {}),
                          [m.key]: e.target.checked
                        }
                      }))}
                    />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>{m.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', marginTop: '10px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() => setEditStaff(null)}
              style={{ height: '42px', padding: '0 20px', borderRadius: '8px', fontSize: '13.5px', fontWeight: 600 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={busy}
              style={{
                height: '42px',
                padding: '0 22px',
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#10b981',
                color: '#fff',
                fontSize: '13.5px',
                fontWeight: 700,
                boxShadow: '0 2px 6px rgba(16,185,129,0.3)'
              }}
            >
              {busy ? <LoaderCircle className="spin" size={16} /> : <Save size={16} />} Save Staff Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: View Audit Diff */}
      <Modal open={!!viewLogDetails} onClose={() => setViewLogDetails(null)} title="Audit Event Diff & Metadata">
        <div style={{ padding: '8px 0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px', fontSize: '13px' }}>
            <div><b>Action:</b> {viewLogDetails?.action}</div>
            <div><b>Module:</b> {viewLogDetails?.module}</div>
            <div><b>Performed By:</b> {viewLogDetails?.userName} ({viewLogDetails?.userRole})</div>
            <div><b>Timestamp:</b> {viewLogDetails?.createdAt && new Date(viewLogDetails.createdAt).toLocaleString('en-IN')}</div>
          </div>
          <b style={{ fontSize: '13px' }}>Sanitized Changes & Details:</b>
          <pre style={{
            background: '#111827',
            color: '#10b981',
            padding: '12px 16px',
            borderRadius: '8px',
            overflowX: 'auto',
            maxHeight: '260px',
            fontSize: '12px',
            marginTop: '8px',
            fontFamily: 'monospace'
          }}>
            {JSON.stringify(viewLogDetails?.details || {}, null, 2)}
          </pre>
        </div>
      </Modal>

      {/* Delete Staff Confirmation */}
      <ConfirmDialog
        open={!!removeStaff}
        onClose={() => setRemoveStaff(null)}
        onConfirm={handleDeleteStaff}
        title="Revoke Staff Access?"
        message={`“${removeStaff?.name || ''}” will be removed from store staff and downgraded to a standard customer account.`}
      />
    </>
  );
}
