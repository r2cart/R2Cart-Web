import { useState, useEffect } from 'react';
import {
  DollarSign,
  Wallet,
  Receipt,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserCheck,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { Button, Modal } from '../../components/ui';
import { useApp } from '../../context/AppContext';
import { adminService } from '../../services/admin.service';

const money = val => `₹${Number(val || 0).toLocaleString('en-IN')}`;

export function CodSettlementsView() {
  const { notify } = useApp();
  const [subTab, setSubTab] = useState('handover'); // 'handover' | 'settlements' | 'collections'
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [collections, setCollections] = useState([]);
  const [summary, setSummary] = useState({ totalExpected: 0, totalCollected: 0, pendingHandoverCount: 0 });
  const [settlements, setSettlements] = useState([]);
  const [staffList, setStaffList] = useState([]);

  // Settlement Modal state
  const [settleStaff, setSettleStaff] = useState(null);
  const [staffPendingCollections, setStaffPendingCollections] = useState([]);
  const [actualSettledAmount, setActualSettledAmount] = useState('');
  const [settleNotes, setSettleNotes] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [cData, sData, stData] = await Promise.all([
        adminService.getCodCollections({ limit: 100 }),
        adminService.getCodSettlements({ limit: 50 }),
        adminService.getDeliveryStaff()
      ]);
      setCollections(cData.collections || []);
      setSummary(cData.summary || { totalExpected: 0, totalCollected: 0, pendingHandoverCount: 0 });
      setSettlements(sData.settlements || []);
      setStaffList(stData || []);
    } catch (err) {
      notify(err.message || 'Failed to load COD financial data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openSettleModal = (staff) => {
    setSettleStaff(staff);
    const pendingForStaff = collections.filter(
      c => c.deliveryPerson?.id === staff.id && c.settlementStatus === 'PENDING'
    );
    setStaffPendingCollections(pendingForStaff);
    const totalColl = pendingForStaff.reduce((acc, c) => acc + Number(c.collectedAmount), 0);
    setActualSettledAmount(String(totalColl));
    setSettleNotes('');
  };

  const handleSettleSubmit = async (e) => {
    e.preventDefault();
    if (!settleStaff) return;
    setBusy(true);
    try {
      await adminService.settleCodCollections({
        deliveryPersonId: settleStaff.id,
        settleAllPending: true,
        settledAmount: Number(actualSettledAmount),
        notes: settleNotes
      });
      notify(`Cash settlement completed successfully for ${settleStaff.name}`);
      setSettleStaff(null);
      await loadData();
    } catch (err) {
      notify(err.message || 'Settlement failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  // Group pending collections by delivery staff
  const staffWithPending = staffList.map(s => {
    const pending = collections.filter(c => c.deliveryPerson?.id === s.id && c.settlementStatus === 'PENDING');
    const totalPending = pending.reduce((acc, c) => acc + Number(c.collectedAmount), 0);
    return {
      ...s,
      pendingOrdersCount: pending.length,
      pendingCashAmount: totalPending
    };
  }).filter(s => s.pendingOrdersCount > 0);

  const totalPendingInHand = staffWithPending.reduce((acc, s) => acc + s.pendingCashAmount, 0);

  return (
    <div className="cod-settlements-view" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Overview Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Total COD Cash Collected</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#166534', marginTop: '4px' }}>
            {money(summary.totalCollected)}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            Expected: {money(summary.totalExpected)}
          </div>
        </div>

        <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #fed7aa', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#9a3412' }}>Cash Pending Handover</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#c2410c', marginTop: '4px' }}>
            {money(totalPendingInHand)}
          </div>
          <div style={{ fontSize: '11px', color: '#9a3412', marginTop: '2px' }}>
            With {staffWithPending.length} delivery personnel
          </div>
        </div>

        <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Completed Settlements</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#0369a1', marginTop: '4px' }}>
            {settlements.length} batches
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            Verified & audited by admin
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setSubTab('handover')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '13.5px',
            fontWeight: 700,
            cursor: 'pointer',
            background: subTab === 'handover' ? '#166534' : '#f1f5f9',
            color: subTab === 'handover' ? '#fff' : '#475569',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Wallet size={16} /> Cash Handover Queue ({staffWithPending.length})
        </button>

        <button
          type="button"
          onClick={() => setSubTab('settlements')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '13.5px',
            fontWeight: 700,
            cursor: 'pointer',
            background: subTab === 'settlements' ? '#166534' : '#f1f5f9',
            color: subTab === 'settlements' ? '#fff' : '#475569',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Receipt size={16} /> Settlement History Records
        </button>

        <button
          type="button"
          onClick={() => setSubTab('collections')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '13.5px',
            fontWeight: 700,
            cursor: 'pointer',
            background: subTab === 'collections' ? '#166534' : '#f1f5f9',
            color: subTab === 'collections' ? '#fff' : '#475569',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <FileText size={16} /> All Individual COD Records
        </button>
      </div>

      {/* ================= 1. PENDING CASH HANDOVER BY STAFF ================= */}
      {subTab === 'handover' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
                Delivery Staff Cash Handover Queue
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                Physical cash collected from customers during COD deliveries waiting to be handed over and reconciled.
              </p>
            </div>
            <Button variant="outline" onClick={loadData} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
            </Button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading handover queue...</div>
          ) : staffWithPending.length === 0 ? (
            <div style={{
              background: '#f8fafc',
              border: '1px dashed #cbd5e1',
              borderRadius: '12px',
              padding: '48px 24px',
              textAlign: 'center'
            }}>
              <CheckCircle2 size={40} style={{ color: '#16a34a', margin: '0 auto 12px' }} />
              <h4 style={{ margin: '0 0 6px', color: '#1e293b' }}>No Pending Cash Handover!</h4>
              <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
                All collected cash from completed deliveries has been settled and verified.
              </p>
            </div>
          ) : (
            <div className="table-wrapper" style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Staff Name & Phone</th>
                    <th>Duty Status</th>
                    <th>Pending Delivered Orders</th>
                    <th>Cash Amount to Hand Over</th>
                    <th style={{ textAlign: 'right' }}>Reconcile & Settle</th>
                  </tr>
                </thead>
                <tbody>
                  {staffWithPending.map(staff => (
                    <tr key={staff.id}>
                      <td>
                        <b style={{ fontSize: '14px', color: '#1e293b' }}>{staff.name}</b>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          {staff.mobile || staff.email}
                        </div>
                      </td>
                      <td>
                        <span style={{
                          fontSize: '11px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontWeight: 700,
                          background: staff.dutyStatus === 'ON_DUTY' ? '#dcfce7' : '#f1f5f9',
                          color: staff.dutyStatus === 'ON_DUTY' ? '#15803d' : '#64748b'
                        }}>
                          {staff.dutyStatus === 'ON_DUTY' ? '● ON DUTY' : '○ OFF DUTY'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                          {staff.pendingOrdersCount} orders
                        </span>
                      </td>
                      <td>
                        <b style={{ fontSize: '15px', color: '#b45309' }}>
                          {money(staff.pendingCashAmount)}
                        </b>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Button
                          onClick={() => openSettleModal(staff)}
                          style={{
                            background: '#166534',
                            color: '#fff',
                            fontSize: '12.5px',
                            fontWeight: 700,
                            padding: '6px 14px',
                            borderRadius: '7px'
                          }}
                        >
                          <Wallet size={14} style={{ marginRight: '6px' }} /> Settle Handover
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

      {/* ================= 2. SETTLEMENT BATCH HISTORY ================= */}
      {subTab === 'settlements' && (
        <div className="table-wrapper" style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Settlement #</th>
                <th>Delivery Staff</th>
                <th>Orders Settled</th>
                <th>Expected Amount</th>
                <th>Actual Settled</th>
                <th>Discrepancy</th>
                <th>Settled By</th>
                <th>Settlement Time</th>
              </tr>
            </thead>
            <tbody>
              {settlements.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>No settlement records found.</td></tr>
              ) : (
                settlements.map(s => (
                  <tr key={s.id}>
                    <td>
                      <b style={{ fontFamily: 'monospace', color: '#0f172a' }}>{s.settlementNumber}</b>
                    </td>
                    <td>
                      <b>{s.deliveryPerson?.name}</b>
                    </td>
                    <td>{s.totalOrders} orders</td>
                    <td>{money(s.totalExpectedAmount)}</td>
                    <td>
                      <b style={{ color: '#166534' }}>{money(s.totalSettledAmount)}</b>
                    </td>
                    <td>
                      {Number(s.discrepancyAmount) !== 0 ? (
                        <span style={{ color: '#b91c1c', fontWeight: 700 }}>
                          {money(s.discrepancyAmount)}
                        </span>
                      ) : (
                        <span style={{ color: '#16a34a', fontWeight: 600 }}>Matched (₹0)</span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: '#475569' }}>{s.settledBy?.name || 'Admin'}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        {new Date(s.settledAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}{' '}
                        {new Date(s.settledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= 3. INDIVIDUAL COD RECORDS ================= */}
      {subTab === 'collections' && (
        <div className="table-wrapper" style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Delivery Person</th>
                <th>Customer</th>
                <th>Expected COD</th>
                <th>Collected Amount</th>
                <th>Status</th>
                <th>Collected At</th>
              </tr>
            </thead>
            <tbody>
              {collections.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>No COD collection records found.</td></tr>
              ) : (
                collections.map(c => (
                  <tr key={c.id}>
                    <td><b>{c.orderNumber}</b></td>
                    <td>{c.deliveryPerson?.name}</td>
                    <td>{c.customerName}</td>
                    <td>{money(c.expectedAmount)}</td>
                    <td><b style={{ color: '#166534' }}>{money(c.collectedAmount)}</b></td>
                    <td>
                      <span style={{
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontWeight: 700,
                        background: c.settlementStatus === 'SETTLED' ? '#dcfce7' : '#fef3c7',
                        color: c.settlementStatus === 'SETTLED' ? '#15803d' : '#b45309'
                      }}>
                        {c.settlementStatus}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        {new Date(c.collectedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}{' '}
                        {new Date(c.collectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= MODAL: RECORD CASH SETTLEMENT ================= */}
      <Modal open={!!settleStaff} onClose={() => !busy && setSettleStaff(null)} title={`Settle Cash Handover: ${settleStaff?.name}`}>
        {settleStaff && (
          <form onSubmit={handleSettleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div><b>Staff Name:</b> {settleStaff.name}</div>
                <div><b>Phone:</b> {settleStaff.mobile || 'N/A'}</div>
                <div><b>Pending Orders:</b> {staffPendingCollections.length} orders</div>
                <div>
                  <b>Expected Total:</b>{' '}
                  <span style={{ color: '#166534', fontWeight: 700 }}>
                    {money(staffPendingCollections.reduce((acc, c) => acc + Number(c.collectedAmount), 0))}
                  </span>
                </div>
              </div>
            </div>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>
                Actual Physical Cash Received (₹) <span style={{ color: '#ef4444' }}>*</span>
              </span>
              <input
                type="number"
                step="0.01"
                required
                value={actualSettledAmount}
                onChange={e => setActualSettledAmount(e.target.value)}
                style={{ height: '42px', borderRadius: '8px', border: '1px solid #d1d5db', padding: '0 12px', fontSize: '15px', fontWeight: 700, color: '#166534' }}
              />
            </label>

            {Number(actualSettledAmount) !== staffPendingCollections.reduce((acc, c) => acc + Number(c.collectedAmount), 0) && (
              <div style={{ background: '#fef2f2', padding: '10px', borderRadius: '6px', border: '1px solid #fecaca', fontSize: '12px', color: '#991b1b', fontWeight: 600 }}>
                Discrepancy detected: ₹
                {Number(actualSettledAmount) - staffPendingCollections.reduce((acc, c) => acc + Number(c.collectedAmount), 0)}
              </div>
            )}

            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>Reconciliation Notes</span>
              <textarea
                rows="2"
                placeholder="Optional notes regarding cash count or denominations..."
                value={settleNotes}
                onChange={e => setSettleNotes(e.target.value)}
                style={{ borderRadius: '8px', border: '1px solid #d1d5db', padding: '8px 12px', fontSize: '13px' }}
              />
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <Button type="button" variant="ghost" onClick={() => setSettleStaff(null)} disabled={busy}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy} style={{ background: '#166534', color: '#fff', fontWeight: 700 }}>
                {busy ? 'Reconciling...' : 'Confirm Cash Received & Settle'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
