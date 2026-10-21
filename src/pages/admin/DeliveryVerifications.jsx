import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Phone,
  User,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { Button, Modal } from '../../components/ui';
import { useApp } from '../../context/AppContext';
import { adminService } from '../../services/admin.service';

const money = val => `₹${Number(val || 0).toLocaleString('en-IN')}`;

export function DeliveryVerificationsView() {
  const { notify } = useApp();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [proofs, setProofs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 1 });
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected proof for review modal / enlarge photo
  const [selectedProof, setSelectedProof] = useState(null);
  const [verificationNotes, setVerificationNotes] = useState('');

  const loadData = async (page = 1) => {
    setLoading(true);
    try {
      const data = await adminService.getDeliveryVerifications({
        page,
        limit: 50,
        verificationStatus: statusFilter,
        search: searchQuery
      });
      setProofs(data.proofs || []);
      setPagination(data.pagination || { page: 1, limit: 50, total: 0, pages: 1 });
    } catch (err) {
      notify(err.message || 'Failed to load delivery proofs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(1);
  }, [statusFilter]);

  const handleUpdateStatus = async (proofId, newStatus) => {
    setBusy(true);
    try {
      await adminService.verifyDeliveryProof(proofId, {
        verificationStatus: newStatus,
        notes: verificationNotes
      });
      notify(`Proof verification status updated to ${newStatus}`);
      setSelectedProof(null);
      setVerificationNotes('');
      await loadData(pagination.page);
    } catch (err) {
      notify(err.message || 'Failed to update verification status', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="delivery-verifications-view" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
            Cloudinary Delivery Proof Verification Queue
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
            Review photo proofs uploaded by delivery staff, verify recipient confirmation, and flag suspicious deliveries.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="admin-search-box" style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #d1d5db', borderRadius: '8px', padding: '6px 12px' }}>
            <Search size={16} style={{ color: '#9ca3af', marginRight: '8px' }} />
            <input
              type="text"
              placeholder="Search order #..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadData(1)}
              style={{ border: 'none', outline: 'none', width: '160px' }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', fontSize: '13px' }}
          >
            <option value="">All Proof Statuses</option>
            <option value="PENDING">PENDING REVIEW</option>
            <option value="VERIFIED">VERIFIED</option>
            <option value="FLAGGED">FLAGGED</option>
            <option value="INVESTIGATING">INVESTIGATING</option>
          </select>

          <Button variant="outline" onClick={() => loadData(1)} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading proof verification queue...</div>
      ) : proofs.length === 0 ? (
        <div style={{
          background: '#f8fafc',
          border: '1px dashed #cbd5e1',
          borderRadius: '12px',
          padding: '48px 24px',
          textAlign: 'center'
        }}>
          <CheckCircle2 size={40} style={{ color: '#16a34a', margin: '0 auto 12px' }} />
          <h4 style={{ margin: '0 0 6px', color: '#1e293b' }}>Queue Clean!</h4>
          <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
            No delivery proofs waiting for review under selected filter.
          </p>
        </div>
      ) : (
        <div className="table-wrapper" style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Proof Thumbnail</th>
                <th>Order #</th>
                <th>Delivery Person</th>
                <th>Customer & Address</th>
                <th>Recipient Confirmation</th>
                <th>Timestamp</th>
                <th>Verification Status</th>
                <th style={{ textAlign: 'right' }}>Review Action</th>
              </tr>
            </thead>
            <tbody>
              {proofs.map(p => {
                const photoSrc = p.signedUrl || p.cloudinaryUrl;
                return (
                  <tr key={p.id}>
                    <td>
                      <div
                        onClick={() => setSelectedProof(p)}
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: '1px solid #e2e8f0',
                          cursor: 'pointer',
                          position: 'relative'
                        }}
                      >
                        <img
                          src={photoSrc}
                          alt="Delivery Proof"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'rgba(0,0,0,0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: 0,
                          transition: 'opacity 0.2s',
                          color: '#fff'
                        }}
                        onMouseEnter={e => e.currentTarget.style.opacity = 1}
                        onMouseLeave={e => e.currentTarget.style.opacity = 0}
                        >
                          <Eye size={16} />
                        </div>
                      </div>
                    </td>
                    <td>
                      <b>{p.orderNumber}</b>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        Amount: {money(p.grandTotal)}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{p.deliveryPerson?.name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{p.deliveryPerson?.mobile}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '12.5px', fontWeight: 600 }}>{p.customerName}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.deliveryAddress}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px', color: '#334155' }}>
                        <b>Recipient:</b> {p.recipientName || 'Self / Customer'}
                      </div>
                      {p.recipientPhone && (
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Phone: {p.recipientPhone}</div>
                      )}
                      {p.customerOtp && (
                        <div style={{ fontSize: '11px', color: '#047857', fontWeight: 600 }}>OTP Verified: ✓</div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '11.5px', color: '#475569' }}>
                        {new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}{' '}
                        {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td>
                      <span style={{
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontWeight: 700,
                        background:
                          p.verificationStatus === 'VERIFIED' ? '#dcfce7' :
                          p.verificationStatus === 'FLAGGED' ? '#fee2e2' :
                          p.verificationStatus === 'INVESTIGATING' ? '#fef3c7' : '#f1f5f9',
                        color:
                          p.verificationStatus === 'VERIFIED' ? '#15803d' :
                          p.verificationStatus === 'FLAGGED' ? '#b91c1c' :
                          p.verificationStatus === 'INVESTIGATING' ? '#b45309' : '#475569'
                      }}>
                        {p.verificationStatus}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Button
                        variant="outline"
                        onClick={() => setSelectedProof(p)}
                        style={{ fontSize: '12px', padding: '5px 12px' }}
                      >
                        <Eye size={13} style={{ marginRight: '4px' }} /> Review Proof
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= MODAL: PROOF DETAIL & VERIFICATION ACTIONS ================= */}
      <Modal open={!!selectedProof} onClose={() => !busy && setSelectedProof(null)} title={`Review Delivery Proof: ${selectedProof?.orderNumber}`}>
        {selectedProof && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Enlarged Photo Container */}
            <div style={{
              width: '100%',
              maxHeight: '380px',
              borderRadius: '10px',
              overflow: 'hidden',
              background: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img
                src={selectedProof.signedUrl || selectedProof.cloudinaryUrl}
                alt="Delivery Proof Full"
                style={{ maxWidth: '100%', maxHeight: '380px', objectFit: 'contain' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
              <div><b>Order #:</b> {selectedProof.orderNumber}</div>
              <div><b>Delivery Staff:</b> {selectedProof.deliveryPerson?.name} ({selectedProof.deliveryPerson?.mobile})</div>
              <div><b>Customer:</b> {selectedProof.customerName}</div>
              <div><b>Customer Phone:</b> {selectedProof.customerMobile}</div>
              <div><b>Recipient Name:</b> {selectedProof.recipientName || 'Self / Customer'}</div>
              <div><b>Recipient Phone:</b> {selectedProof.recipientPhone || 'N/A'}</div>
              <div style={{ color: '#15803d', fontWeight: 600 }}>
                <b>Delivered At:</b> {new Date(selectedProof.deliveredAt || selectedProof.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
              </div>
              {selectedProof.notes && (
                <div><b>Delivery Note:</b> “{selectedProof.notes}”</div>
              )}
              <div style={{ gridColumn: 'span 2' }}><b>Address:</b> {selectedProof.deliveryAddress}</div>
              <div style={{ gridColumn: 'span 2' }}>
                <b>Cloudinary Asset ID:</b> <code style={{ fontSize: '11.5px' }}>{selectedProof.cloudinaryPublicId}</code>
              </div>
            </div>

            {selectedProof.verificationNotes && (
              <div style={{ background: '#fffbeb', padding: '10px', borderRadius: '6px', border: '1px solid #fde68a', fontSize: '12.5px', color: '#92400e' }}>
                <b>Previous Review Note:</b> {selectedProof.verificationNotes}
              </div>
            )}

            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>Reviewer Verification Notes</span>
              <textarea
                rows="2"
                placeholder="Enter audit / verification comments..."
                value={verificationNotes}
                onChange={e => setVerificationNotes(e.target.value)}
                style={{ borderRadius: '8px', border: '1px solid #d1d5db', padding: '8px 12px', fontSize: '13px' }}
              />
            </label>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <a
                href={selectedProof.signedUrl || selectedProof.cloudinaryUrl}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '12.5px', color: '#0284c7', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                Open Full Resolution <ExternalLink size={13} />
              </a>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  type="button"
                  disabled={busy}
                  onClick={() => handleUpdateStatus(selectedProof.id, 'FLAGGED')}
                  style={{ background: '#b91c1c', color: '#fff', fontSize: '12.5px', padding: '6px 14px' }}
                >
                  <ShieldAlert size={14} style={{ marginRight: '4px' }} /> Flag Suspicious
                </Button>

                <Button
                  type="button"
                  disabled={busy}
                  onClick={() => handleUpdateStatus(selectedProof.id, 'INVESTIGATING')}
                  style={{ background: '#f59e0b', color: '#fff', fontSize: '12.5px', padding: '6px 14px' }}
                >
                  Investigate
                </Button>

                <Button
                  type="button"
                  disabled={busy}
                  onClick={() => handleUpdateStatus(selectedProof.id, 'VERIFIED')}
                  style={{ background: '#166534', color: '#fff', fontSize: '12.5px', padding: '6px 16px' }}
                >
                  <CheckCircle2 size={14} style={{ marginRight: '4px' }} /> Approve & Verify
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
