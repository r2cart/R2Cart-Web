import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  Phone,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Camera,
  RefreshCw,
  LogOut,
  MapPin,
  ChevronDown,
  ChevronUp,
  Package,
  Wallet,
  ShieldCheck,
  XCircle,
  ExternalLink
} from 'lucide-react';
import { Button } from '../../components/ui';
import { useApp } from '../../context/AppContext';
import { deliveryService } from '../../services/delivery.service';
import { authService } from '../../services/auth.service';
import { DeliveryProofModal } from './DeliveryProofModal';
import { DeliveryFailureModal } from './DeliveryFailureModal';
import { BRAND } from '../../config/brand';

const money = val => `₹${Number(val || 0).toLocaleString('en-IN')}`;

export function DeliveryDashboard() {
  const navigate = useNavigate();
  const { notify } = useApp();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [codSummary, setCodSummary] = useState(null);

  // Active filter tab: 'ALL' | 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED'
  const [activeTab, setActiveTab] = useState('ALL');

  // Modals state
  const [proofModalOrder, setProofModalOrder] = useState(null);
  const [failureModalOrder, setFailureModalOrder] = useState(null);

  // Expanded items state map for order card items
  const [expandedOrders, setExpandedOrders] = useState({});

  const toggleItemsExpand = (orderId) => {
    setExpandedOrders(curr => ({ ...curr, [orderId]: !curr[orderId] }));
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [oData, pData, cData] = await Promise.all([
        deliveryService.getMyOrders({ tab: activeTab }),
        deliveryService.getMyProfile().catch(() => null),
        deliveryService.getMyCodSummary().catch(() => null)
      ]);
      setOrders(oData || []);
      if (pData) setProfile(pData);
      if (cData) setCodSummary(cData);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        navigate('/delivery/login', { replace: true });
        return;
      }
      notify(err.message || 'Failed to load assigned deliveries', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [activeTab]);

  const handleDutyChange = async (newStatus) => {
    try {
      await deliveryService.updateDutyStatus({ dutyStatus: newStatus });
      setProfile(curr => ({ ...curr, dutyStatus: newStatus }));
      notify(`Duty status updated to ${newStatus.replace('_', ' ')}`);
    } catch (err) {
      notify(err.message || 'Failed to update duty status', 'error');
    }
  };

  const handleStatusUpdate = async (assignmentId, status) => {
    try {
      await deliveryService.updateStatus(assignmentId, { status });
      notify(`Order updated to ${status.replace(/_/g, ' ')}`);
      await loadDashboardData();
    } catch (err) {
      notify(err.message || 'Failed to update status', 'error');
    }
  };

  const handleLogout = async () => {
    await authService.deliveryLogout();
    navigate('/delivery/login', { replace: true });
  };

  const currentDuty = profile?.dutyStatus || 'OFF_DUTY';

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f1f5f9',
      paddingBottom: '60px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* 1. Header Bar */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '12px 16px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{
          maxWidth: '680px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#ecfdf5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669'
            }}>
              <Truck size={20} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                {profile?.name || 'Delivery Partner'}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                {profile?.vehicleType || 'Bike'} {profile?.vehicleNumber ? `· ${profile?.vehicleNumber}` : ''}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Duty Status Switcher */}
            <select
              value={currentDuty}
              onChange={e => handleDutyChange(e.target.value)}
              style={{
                height: '34px',
                padding: '0 10px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '12px',
                fontWeight: 700,
                background: currentDuty === 'ON_DUTY' ? '#dcfce7' : (currentDuty === 'ON_BREAK' ? '#fef3c7' : '#f1f5f9'),
                color: currentDuty === 'ON_DUTY' ? '#15803d' : (currentDuty === 'ON_BREAK' ? '#b45309' : '#64748b'),
                cursor: 'pointer'
              }}
            >
              <option value="ON_DUTY">● On Duty</option>
              <option value="ON_BREAK">⏸ On Break</option>
              <option value="OFF_DUTY">○ Off Duty</option>
            </select>

            <button
              type="button"
              onClick={handleLogout}
              title="Sign Out"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: '#fff',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Content Container */}
      <main style={{ maxWidth: '680px', margin: '0 auto', padding: '16px' }}>
        {/* KPI Strip */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '10px',
          marginBottom: '16px'
        }}>
          <div style={{ background: '#fff', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Assigned</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
              {orders.length}
            </div>
          </div>

          <div style={{ background: '#fff', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Delivered Today</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#16a34a', marginTop: '2px' }}>
              {codSummary?.todayDeliveredCount ?? 0}
            </div>
          </div>

          <div style={{ background: '#fff', padding: '12px', borderRadius: '12px', border: '1px solid #fed7aa', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#9a3412', fontWeight: 600 }}>Pending COD Cash</div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#c2410c', marginTop: '2px' }}>
              {money(codSummary?.pendingHandoverAmount)}
            </div>
          </div>
        </div>

        {/* Tab Filter Strip */}
        <div style={{
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: '16px',
          WebkitOverflowScrolling: 'touch'
        }}>
          {[
            { id: 'ALL', label: 'All' },
            { id: 'PENDING', label: 'Pending' },
            { id: 'IN_TRANSIT', label: 'In Transit' },
            { id: 'DELIVERED', label: 'Delivered' },
            { id: 'FAILED', label: 'Failed' }
          ].map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              style={{
                flexShrink: 0,
                padding: '7px 14px',
                borderRadius: '20px',
                border: 'none',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
                background: activeTab === t.id ? '#059669' : '#ffffff',
                color: activeTab === t.id ? '#ffffff' : '#475569',
                boxShadow: activeTab === t.id ? '0 2px 4px rgba(5,150,105,0.2)' : '0 1px 2px rgba(0,0,0,0.04)'
              }}
            >
              {t.label}
            </button>
          ))}
          <button
            type="button"
            onClick={loadDashboardData}
            style={{
              marginLeft: 'auto',
              flexShrink: 0,
              padding: '7px 10px',
              borderRadius: '20px',
              border: '1px solid #cbd5e1',
              background: '#fff',
              color: '#475569',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
          </button>
        </div>

        {/* Orders List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            Loading deliveries...
          </div>
        ) : orders.length === 0 ? (
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px dashed #cbd5e1',
            padding: '48px 24px',
            textAlign: 'center'
          }}>
            <Package size={44} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
            <h3 style={{ margin: '0 0 6px', fontSize: '16px', color: '#1e293b' }}>
              No Orders in this view
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
              Newly assigned deliveries will appear here as soon as dispatch assigns them.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {orders.map(order => {
              const isExpanded = Boolean(expandedOrders[order.assignmentId]);
              const isCod = order.paymentMethod === 'COD';

              return (
                <div
                  key={order.assignmentId}
                  style={{
                    background: '#ffffff',
                    borderRadius: '14px',
                    border: '1px solid #e2e8f0',
                    padding: '16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  {/* Card Top Strip: Order ID & Status Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                          #{order.orderNumber}
                        </span>
                        {order.deliverySlot && (
                          <span style={{ fontSize: '11px', background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                            {order.deliverySlot}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                        Assigned: {new Date(order.assignedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <span style={{
                      fontSize: '11px',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontWeight: 800,
                      background:
                        order.status === 'DELIVERED' ? '#dcfce7' :
                        order.status === 'DELIVERY_FAILED' ? '#fee2e2' :
                        order.status === 'OUT_FOR_DELIVERY' ? '#cffafe' :
                        order.status === 'DELIVERY_PROOF_PENDING' ? '#fef3c7' :
                        order.status === 'PICKED_UP' ? '#e0e7ff' : '#f1f5f9',
                      color:
                        order.status === 'DELIVERED' ? '#15803d' :
                        order.status === 'DELIVERY_FAILED' ? '#b91c1c' :
                        order.status === 'OUT_FOR_DELIVERY' ? '#0891b2' :
                        order.status === 'DELIVERY_PROOF_PENDING' ? '#b45309' :
                        order.status === 'PICKED_UP' ? '#4338ca' : '#475569'
                    }}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Customer Information & Quick Actions */}
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
                        {order.customerName}
                      </div>

                      {order.customerPhone && (
                        <a
                          href={`tel:${order.customerPhone}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: '#059669',
                            color: '#fff',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 700,
                            textDecoration: 'none'
                          }}
                        >
                          <Phone size={13} /> Call Customer
                        </a>
                      )}
                    </div>

                    <div style={{ fontSize: '13px', color: '#334155', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                      <MapPin size={15} style={{ color: '#059669', flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <div><b>Village:</b> {order.villageName || 'Service Area'}</div>
                        <div style={{ color: '#64748b', fontSize: '12px', marginTop: '2px' }}>
                          {order.deliveryAddress}
                        </div>
                      </div>
                    </div>

                    {/* 1-Tap Google Maps Navigation */}
                    <div style={{ marginTop: '10px' }}>
                      <a
                        href={order.googleMapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: '#f0fdf4',
                          border: '1px solid #bbf7d0',
                          color: '#15803d',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 700,
                          textDecoration: 'none'
                        }}
                      >
                        <Navigation size={13} /> Navigate in Google Maps <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>

                  {/* Customer Delivery Instruction (if any) */}
                  {order.deliveryInstruction && (
                    <div style={{
                      background: '#fffbeb',
                      border: '1px solid #fef3c7',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '12px',
                      color: '#92400e'
                    }}>
                      <b>Customer Note:</b> “{order.deliveryInstruction}”
                    </div>
                  )}

                  {/* COD Collection Badge */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: isCod ? '#fef3c7' : '#ecfdf5',
                    border: `1px solid ${isCod ? '#fde68a' : '#a7f3d0'}`
                  }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 600, color: isCod ? '#92400e' : '#065f46' }}>
                      {isCod ? 'Cash on Delivery (COD)' : 'Prepaid (Paid Online)'}
                    </span>
                    <b style={{ fontSize: '14px', color: isCod ? '#b45309' : '#047857' }}>
                      {isCod ? `Collect ${money(order.codAmountToCollect || order.grandTotal)}` : 'Collect ₹0'}
                    </b>
                  </div>

                  {/* Items Toggle Dropdown */}
                  <div>
                    <button
                      type="button"
                      onClick={() => toggleItemsExpand(order.assignmentId)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: '4px 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      {order.itemCount} items in this order
                    </button>

                    {isExpanded && (
                      <div style={{
                        marginTop: '8px',
                        background: '#f8fafc',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}>
                        {(order.items || []).map(it => (
                          <div key={it.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {it.image && (
                                <img src={it.image} alt={it.name} style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'cover' }} />
                              )}
                              <span>{it.name} <span style={{ color: '#64748b' }}>({it.unit})</span></span>
                            </div>
                            <span style={{ fontWeight: 700, color: '#334155' }}>x{it.quantity}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons Based on Status Transitions */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                    {order.status === 'ASSIGNED' && (
                      <Button
                        onClick={() => handleStatusUpdate(order.assignmentId, 'ACCEPTED')}
                        style={{
                          flex: 1,
                          height: '42px',
                          background: '#059669',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '13px'
                        }}
                      >
                        <CheckCircle2 size={15} style={{ marginRight: '6px' }} /> Accept Order
                      </Button>
                    )}

                    {order.status === 'ACCEPTED' && (
                      <Button
                        onClick={() => handleStatusUpdate(order.assignmentId, 'PICKED_UP')}
                        style={{
                          flex: 1,
                          height: '42px',
                          background: '#4338ca',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '13px'
                        }}
                      >
                        <Package size={15} style={{ marginRight: '6px' }} /> Pick Up from Store
                      </Button>
                    )}

                    {order.status === 'PICKED_UP' && (
                      <Button
                        onClick={() => handleStatusUpdate(order.assignmentId, 'OUT_FOR_DELIVERY')}
                        style={{
                          flex: 1,
                          height: '42px',
                          background: '#0891b2',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '13px'
                        }}
                      >
                        <Truck size={15} style={{ marginRight: '6px' }} /> Start Route (Out for Delivery)
                      </Button>
                    )}

                    {(order.status === 'OUT_FOR_DELIVERY' || order.status === 'DELIVERY_PROOF_PENDING') && (
                      <>
                        <Button
                          onClick={() => setProofModalOrder(order)}
                          style={{
                            flex: 2,
                            height: '44px',
                            background: '#059669',
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: '13.5px'
                          }}
                        >
                          <Camera size={16} style={{ marginRight: '6px' }} />
                          {order.status === 'DELIVERY_PROOF_PENDING' ? 'Complete Delivery' : 'Upload Proof & Deliver'}
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => setFailureModalOrder(order)}
                          style={{
                            flex: 1,
                            height: '44px',
                            color: '#b91c1c',
                            borderColor: '#fca5a5',
                            fontSize: '12px'
                          }}
                        >
                          <XCircle size={14} style={{ marginRight: '4px' }} /> Delivery Failed
                        </Button>
                      </>
                    )}

                    {order.status === 'DELIVERED' && (
                      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>
                        <span>Delivered: {new Date(order.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓</span>
                        {order.proofs?.[0]?.signedUrl && (
                          <a
                            href={order.proofs[0].signedUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: '#0284c7', textDecoration: 'underline' }}
                          >
                            View Delivery Proof Photo
                          </a>
                        )}
                      </div>
                    )}

                    {order.status === 'DELIVERY_FAILED' && (
                      <div style={{ width: '100%', background: '#fef2f2', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', color: '#b91c1c' }}>
                        <b>Failure Reason:</b> {order.failureReason || 'Reported by staff'}
                        {order.failureNotes && <div>“{order.failureNotes}”</div>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Proof Modal */}
      {proofModalOrder && (
        <DeliveryProofModal
          open={Boolean(proofModalOrder)}
          order={proofModalOrder}
          onClose={() => setProofModalOrder(null)}
          onSuccess={() => {
            notify(`Order #${proofModalOrder.orderNumber} successfully delivered!`);
            loadDashboardData();
          }}
        />
      )}

      {/* Failure Modal */}
      {failureModalOrder && (
        <DeliveryFailureModal
          open={Boolean(failureModalOrder)}
          order={failureModalOrder}
          onClose={() => setFailureModalOrder(null)}
          onSuccess={() => {
            notify(`Order #${failureModalOrder.orderNumber} marked as delivery failed`);
            loadDashboardData();
          }}
        />
      )}
    </div>
  );
}
export default DeliveryDashboard;
