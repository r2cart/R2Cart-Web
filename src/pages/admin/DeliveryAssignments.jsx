import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Truck,
  UserCheck,
  RefreshCw,
  Search,
  Filter,
  Clock,
  MapPin,
  Phone,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  UserPlus,
  ChevronDown,
  User,
  FileText
} from 'lucide-react';
import { Button, Modal, StatusBadge } from '../../components/ui';
import { useApp } from '../../context/AppContext';
import { adminService } from '../../services/admin.service';

const money = val => `₹${Number(val || 0).toLocaleString('en-IN')}`;

const formatDateTime = (val) => {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

export function DeliveryAssignmentsView() {
  const { notify } = useApp();
  const [searchParams] = useSearchParams();
  const preselectedOrderNum = searchParams.get('orderNumber');
  const preselectedOrderId = searchParams.get('orderId');

  const [subTab, setSubTab] = useState('unassigned'); // 'unassigned' | 'assignments' | 'staff'
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [unassignedOrders, setUnassignedOrders] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 1 });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [staffFilter, setStaffFilter] = useState('');

  // Modals
  const [assignModalOrder, setAssignModalOrder] = useState(null);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');

  const [reassignModalTarget, setReassignModalTarget] = useState(null);
  const [newStaffId, setNewStaffId] = useState('');
  const [reassignReason, setReassignReason] = useState('Staff workload balancing');
  const [reassignNotes, setReassignNotes] = useState('');

  // Auto-open assign modal if redirected from order details page
  useEffect(() => {
    if (!preselectedOrderNum && !preselectedOrderId) return;
    if (assignModalOrder) return;

    if (unassignedOrders.length > 0) {
      const match = unassignedOrders.find(o =>
        (preselectedOrderId && (o.id === preselectedOrderId || o.orderId === preselectedOrderId)) ||
        (preselectedOrderNum && o.orderNumber === preselectedOrderNum)
      );
      if (match) {
        setAssignModalOrder(match);
        setSubTab('unassigned');
        return;
      }
    }

    // Fallback: If not in current unassigned list, fetch directly
    if (!loading && preselectedOrderId && !assignModalOrder) {
      adminService.order(preselectedOrderId)
        .then(ord => {
          if (ord) {
            setAssignModalOrder({
              id: ord.id,
              orderId: ord.id,
              orderNumber: ord.orderNumber,
              customerName: ord.user?.name || ord.shippingAddress?.name || 'Customer',
              customerPhone: ord.user?.mobile || ord.shippingAddress?.phone || '—',
              total: ord.total,
              paymentMethod: ord.paymentMethod,
              paymentStatus: ord.paymentStatus,
              villageId: ord.villageId,
              villageName: ord.village?.name || ord.shippingAddress?.village || 'General Area',
              itemCount: ord.items?.reduce((sum, i) => sum + (i.quantity || 1), 0) || ord.items?.length || 0,
              addressLine: [ord.shippingAddress?.addressLine1, ord.shippingAddress?.addressLine2, ord.shippingAddress?.city, ord.shippingAddress?.state].filter(Boolean).join(', ')
            });
            setSubTab('unassigned');
          }
        })
        .catch(() => {});
    }
  }, [unassignedOrders, loading, preselectedOrderNum, preselectedOrderId, assignModalOrder]);

  const loadData = async (page = 1) => {
    setLoading(true);
    try {
      const [uData, aData, sData] = await Promise.all([
        adminService.getUnassignedOrders({ search: searchQuery }),
        adminService.getDeliveryAssignments({
          page,
          limit: 50,
          search: searchQuery,
          status: statusFilter,
          deliveryPersonId: staffFilter
        }),
        adminService.getDeliveryStaff()
      ]);
      setUnassignedOrders(uData || []);
      setAssignments(aData.assignments || []);
      setPagination(aData.pagination || { page: 1, limit: 50, total: 0, pages: 1 });
      setStaffList(sData || []);
    } catch (err) {
      notify(err.message || 'Failed to load delivery data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(1);
  }, [subTab, statusFilter, staffFilter]);

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStaffId) {
      notify('Please select an active ON DUTY delivery person', 'error');
      return;
    }
    const chosenStaff = staffList.find(s => s.id === selectedStaffId);
    if (!chosenStaff || chosenStaff.dutyStatus !== 'ON_DUTY') {
      const reason = chosenStaff?.dutyStatus === 'ON_BREAK' ? 'is currently ON BREAK' : 'is currently OFF DUTY';
      notify(`Cannot assign order: ${chosenStaff?.name || 'Selected driver'} ${reason}. Only ON DUTY drivers can receive orders.`, 'error');
      return;
    }
    setBusy(true);
    try {
      await adminService.assignDeliveryOrder({
        orderId: assignModalOrder.id,
        deliveryPersonId: selectedStaffId,
        notes: assignNotes
      });
      notify(`Order ${assignModalOrder.orderNumber} successfully assigned to ${chosenStaff.name}!`);
      setAssignModalOrder(null);
      setSelectedStaffId('');
      setAssignNotes('');
      await loadData(pagination.page);
    } catch (err) {
      notify(err.message || 'Failed to assign order', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleReassignSubmit = async (e) => {
    e.preventDefault();
    if (!newStaffId) {
      notify('Please select the new delivery person', 'error');
      return;
    }
    const chosenStaff = staffList.find(s => s.id === newStaffId);
    if (!chosenStaff || chosenStaff.dutyStatus !== 'ON_DUTY') {
      const reason = chosenStaff?.dutyStatus === 'ON_BREAK' ? 'is currently ON BREAK' : 'is currently OFF DUTY';
      notify(`Cannot reassign order: ${chosenStaff?.name || 'Target driver'} ${reason}. Target driver must be ON DUTY.`, 'error');
      return;
    }
    setBusy(true);
    try {
      await adminService.reassignDeliveryOrder({
        orderId: reassignModalTarget.orderId,
        newDeliveryPersonId: newStaffId,
        reason: reassignReason,
        notes: reassignNotes
      });
      notify(`Order ${reassignModalTarget.orderNumber} reassigned to ${chosenStaff.name} successfully!`);
      setReassignModalTarget(null);
      setNewStaffId('');
      setReassignNotes('');
      await loadData(pagination.page);
    } catch (err) {
      notify(err.message || 'Failed to reassign order', 'error');
    } finally {
      setBusy(false);
    }
  };

  // Smart ranking for staff recommendations
  const recommendedStaff = useMemo(() => {
    if (!staffList || staffList.length === 0) return [];

    const orderVillageId = assignModalOrder?.villageId;

    const checkVillageMatch = (s) => {
      if (!orderVillageId) return true;
      const vIds = Array.isArray(s.assignedVillageIds) ? s.assignedVillageIds : [];
      return vIds.length === 0 || vIds.includes(orderVillageId);
    };

    // Priority: ON_DUTY (1) > ON_BREAK (2) > OFF_DUTY (3)
    const dutyPriority = { ON_DUTY: 1, ON_BREAK: 2, OFF_DUTY: 3 };

    return [...staffList].sort((a, b) => {
      const aMatch = checkVillageMatch(a);
      const bMatch = checkVillageMatch(b);
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;

      const aDuty = dutyPriority[a.dutyStatus] || 4;
      const bDuty = dutyPriority[b.dutyStatus] || 4;
      if (aDuty !== bDuty) return aDuty - bDuty;

      const aCount = a.activeAssignmentsCount || 0;
      const bCount = b.activeAssignmentsCount || 0;
      if (aCount !== bCount) return aCount - bCount;

      return (a.name || '').localeCompare(b.name || '');
    });
  }, [staffList, assignModalOrder]);

  const onDutyStaffCount = useMemo(() => {
    return recommendedStaff.filter(s => s.dutyStatus === 'ON_DUTY').length;
  }, [recommendedStaff]);

  const onBreakStaffCount = useMemo(() => {
    return recommendedStaff.filter(s => s.dutyStatus === 'ON_BREAK').length;
  }, [recommendedStaff]);

  // Pre-select top available ON_DUTY driver when modal opens if not selected
  useEffect(() => {
    if (assignModalOrder && recommendedStaff.length > 0 && !selectedStaffId) {
      const topDuty = recommendedStaff.find(s => s.dutyStatus === 'ON_DUTY');
      if (topDuty) {
        setSelectedStaffId(topDuty.id);
      }
    }
  }, [assignModalOrder, recommendedStaff, selectedStaffId]);

  const selectedStaffObj = staffList.find(s => s.id === selectedStaffId);
  const isSelectedStaffOnDuty = selectedStaffObj?.dutyStatus === 'ON_DUTY';

  const newStaffObj = staffList.find(s => s.id === newStaffId);
  const isNewStaffOnDuty = newStaffObj?.dutyStatus === 'ON_DUTY';

  return (
    <div className="delivery-assignments-view" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Sub-navigation tabs */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setSubTab('unassigned')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '13.5px',
            fontWeight: 700,
            cursor: 'pointer',
            background: subTab === 'unassigned' ? '#166534' : '#f1f5f9',
            color: subTab === 'unassigned' ? '#fff' : '#475569',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Truck size={16} /> Unassigned Orders Queue
          <span style={{
            background: subTab === 'unassigned' ? '#15803d' : '#e2e8f0',
            color: subTab === 'unassigned' ? '#fff' : '#1e293b',
            padding: '2px 7px',
            borderRadius: '12px',
            fontSize: '11px'
          }}>
            {unassignedOrders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('assignments')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '13.5px',
            fontWeight: 700,
            cursor: 'pointer',
            background: subTab === 'assignments' ? '#166534' : '#f1f5f9',
            color: subTab === 'assignments' ? '#fff' : '#475569',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Clock size={16} /> Active & Past Assignments
        </button>

        <button
          type="button"
          onClick={() => setSubTab('staff')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '13.5px',
            fontWeight: 700,
            cursor: 'pointer',
            background: subTab === 'staff' ? '#166534' : '#f1f5f9',
            color: subTab === 'staff' ? '#fff' : '#475569',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <UserCheck size={16} /> Delivery Staff Availability ({staffList.length})
        </button>
      </div>

      {/* ================= 1. UNASSIGNED ORDERS QUEUE ================= */}
      {subTab === 'unassigned' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
                Orders Waiting for Delivery Staff Assignment
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                Assign confirmed & packing orders to available delivery persons based on village coverage and workload.
              </p>
            </div>
            <Button variant="outline" onClick={() => loadData(1)} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh Queue
            </Button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading unassigned orders...</div>
          ) : unassignedOrders.length === 0 ? (
            <div style={{
              background: '#f8fafc',
              border: '1px dashed #cbd5e1',
              borderRadius: '12px',
              padding: '48px 24px',
              textAlign: 'center'
            }}>
              <CheckCircle2 size={40} style={{ color: '#16a34a', margin: '0 auto 12px' }} />
              <h4 style={{ margin: '0 0 6px', color: '#1e293b' }}>All Orders Assigned!</h4>
              <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
                There are currently no confirmed or packing orders waiting for delivery assignment.
              </p>
            </div>
          ) : (
            <div className="table-wrapper" style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer & Contact</th>
                    <th>Delivery Address & Village</th>
                    <th>Amount & COD</th>
                    <th>Items</th>
                    <th>Slot / Time</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {unassignedOrders.map(order => (
                    <tr key={order.id}>
                      <td>
                        <b>{order.orderNumber}</b>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{order.customerName}</div>
                        <div style={{ fontSize: '12px', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Phone size={12} /> {order.customerMobile || 'No phone'}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#047857', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={13} /> {order.villageName || order.area || 'General Area'}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#64748b', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {order.addressLine}
                        </div>
                      </td>
                      <td>
                        <b style={{ color: '#0f172a' }}>{money(order.grandTotal)}</b>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: order.paymentMethod === 'COD' ? '#b45309' : '#047857' }}>
                          {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Prepaid (Online)'}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155' }}>
                          {order.itemCount} items
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px', color: '#334155', fontWeight: 500 }}>
                          {order.deliverySlot || 'Standard Delivery'}
                        </div>
                        {order.deliveryDate && (
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{order.deliveryDate}</div>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Button
                          onClick={() => {
                            setAssignModalOrder(order);
                            setSelectedStaffId('');
                            setAssignNotes('');
                          }}
                          style={{
                            background: '#166534',
                            color: '#fff',
                            fontSize: '12.5px',
                            fontWeight: 700,
                            padding: '6px 14px',
                            borderRadius: '7px'
                          }}
                        >
                          <UserPlus size={14} style={{ marginRight: '6px' }} /> Assign Staff
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ================= 2. ALL ASSIGNMENTS LIST ================= */}
      {subTab === 'assignments' && (
        <div>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="admin-search-box" style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #d1d5db', borderRadius: '8px', padding: '6px 12px' }}>
              <Search size={16} style={{ color: '#9ca3af', marginRight: '8px' }} />
              <input
                type="text"
                placeholder="Search order #..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && loadData(1)}
                style={{ border: 'none', outline: 'none', width: '180px' }}
              />
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', fontSize: '13px' }}
            >
              <option value="">All Assignment Statuses</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="ACCEPTED">ACCEPTED</option>
              <option value="PICKED_UP">PICKED UP</option>
              <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
              <option value="DELIVERY_PROOF_PENDING">PROOF PENDING</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="DELIVERY_FAILED">FAILED</option>
            </select>

            <select
              value={staffFilter}
              onChange={e => setStaffFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', fontSize: '13px' }}
            >
              <option value="">All Delivery Staff</option>
              {staffList.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.dutyStatus || 'OFF_DUTY'})</option>
              ))}
            </select>

            <Button variant="ghost" onClick={() => loadData(1)}>Filter</Button>
          </div>

          <div className="table-wrapper" style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Assigned Staff</th>
                  <th>Delivery Status</th>
                  <th>Customer & Village</th>
                  <th>Amount / COD</th>
                  <th>Timeline</th>
                  <th>Proof Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: '30px' }}>Loading assignments...</td></tr>
                ) : assignments.length === 0 ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>No delivery assignments found matching criteria.</td></tr>
                ) : (
                  assignments.map(a => (
                    <tr key={a.id}>
                      <td>
                        <b>{a.orderNumber}</b>
                        <div style={{ fontSize: '11px', color: a.isCurrent ? '#16a34a' : '#94a3b8' }}>
                          {a.isCurrent ? '● Active assignment' : '○ Historic/Reassigned'}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{a.deliveryPerson?.name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          {a.deliveryPerson?.mobile} {a.deliveryPerson?.vehicleType ? `· ${a.deliveryPerson?.vehicleType}` : ''}
                        </div>
                      </td>
                      <td>
                        <span style={{
                          fontSize: '11px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontWeight: 700,
                          background:
                            a.status === 'DELIVERED' ? '#dcfce7' :
                            a.status === 'DELIVERY_FAILED' ? '#fee2e2' :
                            a.status === 'OUT_FOR_DELIVERY' ? '#cffafe' :
                            a.status === 'DELIVERY_PROOF_PENDING' ? '#fef3c7' : '#f1f5f9',
                          color:
                            a.status === 'DELIVERED' ? '#15803d' :
                            a.status === 'DELIVERY_FAILED' ? '#b91c1c' :
                            a.status === 'OUT_FOR_DELIVERY' ? '#0891b2' :
                            a.status === 'DELIVERY_PROOF_PENDING' ? '#b45309' : '#475569'
                        }}>
                          {a.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '12.5px', fontWeight: 600 }}>{a.customerName}</div>
                        <div style={{ fontSize: '11px', color: '#047857' }}>{a.villageName || a.area || 'General Area'}</div>
                      </td>
                      <td>
                        <b>{money(a.grandTotal)}</b>
                        {a.codCollection && (
                          <div style={{ fontSize: '11px', color: a.codCollection.settlementStatus === 'SETTLED' ? '#16a34a' : '#b45309' }}>
                            COD: {money(a.codCollection.collectedAmount)} ({a.codCollection.settlementStatus})
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          Assigned: {formatDateTime(a.assignedAt)}
                        </div>
                        {a.deliveredAt && (
                          <div style={{ fontSize: '11.5px', color: '#15803d', fontWeight: 700, marginTop: '2px' }}>
                            ✓ Delivered: {formatDateTime(a.deliveredAt)}
                          </div>
                        )}
                        {a.failedAt && (
                          <div style={{ fontSize: '11px', color: '#b91c1c', fontWeight: 600, marginTop: '2px' }}>
                            Failed: {a.failureReason}
                          </div>
                        )}
                      </td>
                      <td>
                        {a.proofs?.length > 0 ? (
                          <a
                            href={a.proofs[0].signedUrl || a.proofs[0].cloudinaryUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              fontSize: '11.5px',
                              color: '#0284c7',
                              fontWeight: 600,
                              textDecoration: 'underline'
                            }}
                          >
                            View Photo ({a.proofs[0].verificationStatus})
                          </a>
                        ) : (
                          <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>No proof yet</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {a.isCurrent && a.status !== 'DELIVERED' && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              setReassignModalTarget(a);
                              setNewStaffId('');
                              setReassignReason('Staff workload balancing');
                              setReassignNotes('');
                            }}
                            style={{ fontSize: '12px', padding: '4px 10px' }}
                          >
                            Reassign
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= 3. STAFF WORKLOAD & AVAILABILITY ================= */}
      {subTab === 'staff' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {staffList.map(staff => (
            <div
              key={staff.id}
              style={{
                background: '#fff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <h4 style={{ margin: 0, fontSize: '15px', color: '#1e293b' }}>{staff.name}</h4>
                    {staff.deliveryStaffId && (
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        background: '#ecfdf5',
                        color: '#065f46',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        border: '1px solid #a7f3d0'
                      }}>
                        {staff.deliveryStaffId}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    {staff.deliveryStaffId ? `${staff.deliveryStaffId} · ` : ''}{staff.mobile || staff.email}
                  </div>
                </div>
                <span style={{
                  fontSize: '11px',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  background: staff.dutyStatus === 'ON_DUTY' ? '#dcfce7' : (staff.dutyStatus === 'ON_BREAK' ? '#fef3c7' : '#f1f5f9'),
                  color: staff.dutyStatus === 'ON_DUTY' ? '#15803d' : (staff.dutyStatus === 'ON_BREAK' ? '#b45309' : '#64748b')
                }}>
                  {staff.dutyStatus === 'ON_DUTY' ? '● ON DUTY' : (staff.dutyStatus === 'ON_BREAK' ? '⏸ ON BREAK' : '○ OFF DUTY')}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Active Orders</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
                    {staff.activeAssignmentsCount || 0}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Delivered Today</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#166534' }}>
                    {staff.completedAssignmentsCount || 0}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Vehicle</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                    {staff.vehicleType || 'Not set'} {staff.vehicleNumber ? `(${staff.vehicleNumber})` : ''}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Pending COD</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#b45309' }}>
                    {money(staff.pendingCodAmount)}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                <b>Covered Villages:</b> {Array.isArray(staff.assignedVillageIds) && staff.assignedVillageIds.length > 0 ? `${staff.assignedVillageIds.length} assigned` : 'All store areas'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= MODAL: ASSIGN ORDER ================= */}
      <Modal
        open={!!assignModalOrder}
        onClose={() => !busy && setAssignModalOrder(null)}
        size="assign-order-modal"
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>Assign Delivery Partner</span>
            <span style={{
              fontSize: '12px',
              fontFamily: 'monospace',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '6px',
              background: '#f1f5f9',
              color: '#334155',
              border: '1px solid #e2e8f0'
            }}>
              #{assignModalOrder?.orderNumber}
            </span>
          </div>
        }
      >
        {assignModalOrder && (
          <div className="modal-body" style={{ padding: '22px 24px 26px' }}>
            <form onSubmit={handleAssignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Order Info Card */}
              <div style={{
                background: 'linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%)',
                padding: '16px 18px',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {/* Customer & Total Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: '#e0f2fe',
                      color: '#0369a1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '16px'
                    }}>
                      {assignModalOrder.customerName?.charAt(0)?.toUpperCase() || 'C'}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                        {assignModalOrder.customerName || 'Customer'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                        <Phone size={12} style={{ color: '#0284c7' }} />
                        <span>{assignModalOrder.customerMobile || 'No contact phone'}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '17px', fontWeight: 800, color: '#15803d' }}>
                      {money(assignModalOrder.grandTotal)}
                    </div>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: assignModalOrder.paymentMethod === 'COD' ? '#fef3c7' : '#ecfdf5',
                      color: assignModalOrder.paymentMethod === 'COD' ? '#b45309' : '#047857',
                      display: 'inline-block',
                      marginTop: '3px'
                    }}>
                      {assignModalOrder.paymentMethod === 'COD' ? '💵 Cash on Delivery' : '💳 Prepaid'}
                    </span>
                  </div>
                </div>

                {/* Subtle Divider */}
                <div style={{ height: '1px', background: '#e2e8f0' }} />

                {/* Village & Address Row */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: '#ecfdf5',
                      color: '#065f46',
                      border: '1px solid #a7f3d0'
                    }}>
                      <MapPin size={12} />
                      {assignModalOrder.villageName || assignModalOrder.area || 'General Area'}
                    </span>
                    {assignModalOrder.itemCount && (
                      <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 500 }}>
                        · {assignModalOrder.itemCount} items
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#334155', lineHeight: '1.45', wordBreak: 'break-word' }}>
                    {assignModalOrder.addressLine || 'Address not provided'}
                  </div>
                </div>
              </div>

              {/* On Duty Alert Banner */}
              {onDutyStaffCount === 0 && (
                <div style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  fontSize: '12.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <AlertCircle size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700 }}>No Delivery Drivers are ON DUTY</div>
                    <div style={{ fontSize: '11.5px', color: '#b91c1c', marginTop: '2px' }}>
                      Orders cannot be assigned while drivers are on break or off duty. Delivery partner must turn "On Duty" in their mobile delivery portal first.
                    </div>
                  </div>
                </div>
              )}

              {/* Delivery Person Selection */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                    <UserCheck size={16} style={{ color: '#16a34a' }} />
                    <span>Select Delivery Person</span>
                    <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <span style={{
                    fontSize: '11.5px',
                    fontWeight: 600,
                    color: recommendedStaff.length === 0 ? '#ef4444' : (onDutyStaffCount > 0 ? '#15803d' : '#b45309')
                  }}>
                    {recommendedStaff.length === 0
                      ? '0 drivers registered'
                      : `${recommendedStaff.length} driver${recommendedStaff.length === 1 ? '' : 's'} (${onDutyStaffCount} on duty${onBreakStaffCount > 0 ? `, ${onBreakStaffCount} on break` : ''})`}
                  </span>
                </div>

                <div style={{ position: 'relative' }}>
                  <select
                    required
                    value={selectedStaffId}
                    onChange={e => setSelectedStaffId(e.target.value)}
                    style={{
                      width: '100%',
                      height: '46px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      padding: '0 38px 0 14px',
                      fontSize: '13.5px',
                      fontWeight: 500,
                      color: selectedStaffId ? '#0f172a' : '#64748b',
                      background: '#ffffff',
                      cursor: 'pointer',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      outline: 'none',
                      transition: 'all 0.15s ease',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = '#16a34a';
                      e.target.style.boxShadow = '0 0 0 3px rgba(22, 163, 74, 0.15)';
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = '#cbd5e1';
                      e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)';
                    }}
                  >
                    <option value="">-- Choose available delivery staff --</option>
                    {recommendedStaff.map(s => {
                      const isDuty = s.dutyStatus === 'ON_DUTY';
                      const isBreak = s.dutyStatus === 'ON_BREAK';
                      const activeCount = s.activeAssignmentsCount || 0;
                      const vIds = Array.isArray(s.assignedVillageIds) ? s.assignedVillageIds : [];
                      const matchesVillage = !assignModalOrder?.villageId || vIds.length === 0 || vIds.includes(assignModalOrder.villageId);

                      const statusEmoji = isDuty ? '🟢' : isBreak ? '⏸️' : '⚪';
                      const statusLabel = isDuty ? 'ON DUTY' : isBreak ? 'ON BREAK' : 'OFF DUTY';
                      const areaLabel = !matchesVillage ? ' · ⚠️ Outside Primary Area' : (vIds.length === 0 ? ' · All Areas' : '');

                      return (
                        <option
                          key={s.id}
                          value={s.id}
                          disabled={!isDuty}
                          style={{
                            color: isDuty ? '#0f172a' : '#94a3b8',
                            backgroundColor: isDuty ? '#ffffff' : '#f8fafc'
                          }}
                        >
                          {statusEmoji} {s.deliveryStaffId ? `[${s.deliveryStaffId}] ` : ''}{s.name} ({statusLabel}){!isDuty ? ` - CANNOT ASSIGN (${statusLabel})` : ''}{areaLabel} · {activeCount} active · {s.vehicleType || 'Bike'}
                        </option>
                      );
                    })}
                  </select>
                  <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b' }}>
                    <ChevronDown size={18} />
                  </div>
                </div>

                <small style={{ fontSize: '11.5px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  💡 Ranked by village coverage, on-duty availability, and lowest active workload.
                </small>
              </div>

              {/* Assignment Notes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                  <FileText size={15} style={{ color: '#64748b' }} />
                  <span>Assignment Notes / Instructions</span>
                  <span style={{ fontSize: '11px', fontWeight: 500, color: '#94a3b8' }}>(Optional)</span>
                </label>
                <textarea
                  rows="3"
                  placeholder="e.g. Ring doorbell twice, deliver before 5 PM, customer requested calling before arriving..."
                  value={assignNotes}
                  onChange={e => setAssignNotes(e.target.value)}
                  style={{
                    width: '100%',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    padding: '10px 14px',
                    fontSize: '13px',
                    color: '#0f172a',
                    background: '#ffffff',
                    outline: 'none',
                    transition: 'all 0.15s ease',
                    resize: 'vertical',
                    minHeight: '76px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = '#16a34a';
                    e.target.style.boxShadow = '0 0 0 3px rgba(22, 163, 74, 0.15)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = '#cbd5e1';
                    e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)';
                  }}
                />
                <small style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                  Notes will be visible to the delivery staff on their mobile portal screen.
                </small>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '12px',
                paddingTop: '16px',
                borderTop: '1px solid #f1f5f9'
              }}>
                <button
                  type="button"
                  onClick={() => setAssignModalOrder(null)}
                  disabled={busy}
                  style={{
                    height: '42px',
                    padding: '0 20px',
                    borderRadius: '10px',
                    border: '1.5px solid #e2e8f0',
                    background: '#ffffff',
                    color: '#475569',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseOut={e => e.currentTarget.style.background = '#ffffff'}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy || !selectedStaffId || !isSelectedStaffOnDuty}
                  style={{
                    height: '42px',
                    padding: '0 24px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                    color: '#ffffff',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    cursor: busy || !selectedStaffId || !isSelectedStaffOnDuty ? 'not-allowed' : 'pointer',
                    opacity: busy || !selectedStaffId || !isSelectedStaffOnDuty ? 0.6 : 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(22, 163, 74, 0.25)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Truck size={16} />
                  <span>{busy ? 'Assigning...' : 'Confirm Assignment'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* ================= MODAL: REASSIGN ORDER ================= */}
      <Modal
        open={!!reassignModalTarget}
        onClose={() => !busy && setReassignModalTarget(null)}
        size="assign-order-modal"
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>Reassign Delivery Staff</span>
            <span style={{
              fontSize: '12px',
              fontFamily: 'monospace',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '6px',
              background: '#fee2e2',
              color: '#b91c1c',
              border: '1px solid #fecaca'
            }}>
              #{reassignModalTarget?.orderNumber}
            </span>
          </div>
        }
      >
        {reassignModalTarget && (
          <div className="modal-body" style={{ padding: '22px 24px 26px' }}>
            <form onSubmit={handleReassignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Current assignment banner */}
              <div style={{
                background: '#fef2f2',
                padding: '14px 16px',
                borderRadius: '12px',
                border: '1px solid #fecaca',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <div style={{ color: '#991b1b', fontWeight: 700, fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldAlert size={18} style={{ color: '#dc2626' }} />
                  <span>Currently Assigned To: {reassignModalTarget.deliveryPerson?.name}</span>
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: '#7f1d1d', lineHeight: '1.4' }}>
                  Reassigning will record an audit trail entry, update staff workloads, and notify the new driver on their portal.
                </p>
              </div>

              {/* New Staff Selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                  <UserPlus size={16} style={{ color: '#dc2626' }} />
                  <span>New Delivery Person</span>
                  <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    required
                    value={newStaffId}
                    onChange={e => setNewStaffId(e.target.value)}
                    style={{
                      width: '100%',
                      height: '46px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      padding: '0 38px 0 14px',
                      fontSize: '13.5px',
                      fontWeight: 500,
                      color: newStaffId ? '#0f172a' : '#64748b',
                      background: '#ffffff',
                      cursor: 'pointer',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      outline: 'none',
                      transition: 'all 0.15s ease',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = '#dc2626';
                      e.target.style.boxShadow = '0 0 0 3px rgba(220, 38, 38, 0.15)';
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = '#cbd5e1';
                      e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)';
                    }}
                  >
                    <option value="">-- Choose new delivery staff member --</option>
                    {staffList
                      .filter(s => s.id !== reassignModalTarget.deliveryPerson?.id)
                      .map(s => {
                        const isDuty = s.dutyStatus === 'ON_DUTY';
                        const isBreak = s.dutyStatus === 'ON_BREAK';
                        const statusEmoji = isDuty ? '🟢' : isBreak ? '⏸️' : '⚪';
                        const statusLabel = isDuty ? 'ON DUTY' : isBreak ? 'ON BREAK' : 'OFF DUTY';
                        return (
                          <option
                            key={s.id}
                            value={s.id}
                            disabled={!isDuty}
                            style={{
                              color: isDuty ? '#0f172a' : '#94a3b8',
                              backgroundColor: isDuty ? '#ffffff' : '#f8fafc'
                            }}
                          >
                            {statusEmoji} {s.deliveryStaffId ? `[${s.deliveryStaffId}] ` : ''}{s.name} ({statusLabel}){!isDuty ? ` - CANNOT ASSIGN (${statusLabel})` : ''} · {s.activeAssignmentsCount || 0} active
                          </option>
                        );
                      })}
                  </select>
                  <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b' }}>
                    <ChevronDown size={18} />
                  </div>
                </div>
              </div>

              {/* Reason Selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                  <AlertCircle size={16} style={{ color: '#d97706' }} />
                  <span>Reassignment Reason</span>
                  <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={reassignReason}
                    onChange={e => setReassignReason(e.target.value)}
                    style={{
                      width: '100%',
                      height: '46px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      padding: '0 38px 0 14px',
                      fontSize: '13.5px',
                      fontWeight: 500,
                      color: '#0f172a',
                      background: '#ffffff',
                      cursor: 'pointer',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      outline: 'none',
                      transition: 'all 0.15s ease',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = '#dc2626';
                      e.target.style.boxShadow = '0 0 0 3px rgba(220, 38, 38, 0.15)';
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = '#cbd5e1';
                      e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)';
                    }}
                  >
                    <option value="Staff workload balancing">Staff workload balancing</option>
                    <option value="Staff vehicle breakdown">Staff vehicle breakdown</option>
                    <option value="Staff off duty / emergency">Staff off duty / emergency</option>
                    <option value="Delivery delayed by current staff">Delivery delayed by current staff</option>
                    <option value="Customer requested rescheduling">Customer requested rescheduling</option>
                    <option value="Other administrative reason">Other administrative reason</option>
                  </select>
                  <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b' }}>
                    <ChevronDown size={18} />
                  </div>
                </div>
              </div>

              {/* Additional Notes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                  <FileText size={15} style={{ color: '#64748b' }} />
                  <span>Additional Notes</span>
                  <span style={{ fontSize: '11px', fontWeight: 500, color: '#94a3b8' }}>(Optional)</span>
                </label>
                <textarea
                  rows="2"
                  placeholder="Optional details for audit trail..."
                  value={reassignNotes}
                  onChange={e => setReassignNotes(e.target.value)}
                  style={{
                    width: '100%',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    padding: '10px 14px',
                    fontSize: '13px',
                    color: '#0f172a',
                    background: '#ffffff',
                    outline: 'none',
                    transition: 'all 0.15s ease',
                    resize: 'vertical',
                    minHeight: '68px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = '#dc2626';
                    e.target.style.boxShadow = '0 0 0 3px rgba(220, 38, 38, 0.15)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = '#cbd5e1';
                    e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)';
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '12px',
                paddingTop: '16px',
                borderTop: '1px solid #f1f5f9'
              }}>
                <button
                  type="button"
                  onClick={() => setReassignModalTarget(null)}
                  disabled={busy}
                  style={{
                    height: '42px',
                    padding: '0 20px',
                    borderRadius: '10px',
                    border: '1.5px solid #e2e8f0',
                    background: '#ffffff',
                    color: '#475569',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseOut={e => e.currentTarget.style.background = '#ffffff'}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy || !newStaffId || !isNewStaffOnDuty}
                  style={{
                    height: '42px',
                    padding: '0 24px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                    color: '#ffffff',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    cursor: busy || !newStaffId || !isNewStaffOnDuty ? 'not-allowed' : 'pointer',
                    opacity: busy || !newStaffId || !isNewStaffOnDuty ? 0.6 : 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(220, 38, 38, 0.25)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Truck size={16} />
                  <span>{busy ? 'Reassigning...' : 'Confirm Reassignment'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
}
