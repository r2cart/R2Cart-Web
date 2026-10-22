import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Phone,
  User,
  MapPin,
  ExternalLink,
  Camera,
  X,
  Copy,
  Check
} from 'lucide-react';
import { Button, Modal, Pagination } from '../../components/ui';
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
  const [copiedId, setCopiedId] = useState(null);

  // Selected proof for review modal
  const [selectedProof, setSelectedProof] = useState(null);
  const [verificationNotes, setVerificationNotes] = useState('');

  const copyText = (text, id) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

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

  const handleOpenReview = proof => {
    setSelectedProof(proof);
    setVerificationNotes(proof.verificationNotes || '');
  };

  return (
    <div className="delivery-verifications-view" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* ================= HEADER & TOOLBAR ================= */}
      <div className="pod-queue-head">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldCheck size={18} />
            </div>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>
              Cloudinary Delivery Proof Verification Queue
            </h3>
          </div>
          <p style={{ margin: '4px 0 0 40px', fontSize: '13px', color: '#64748b' }}>
            Review photo proofs uploaded by delivery staff, verify recipient confirmation, and flag suspicious deliveries.
          </p>
        </div>

        <div className="pod-filter-bar">
          {/* Quick Status Filter Pills */}
          <div className="pod-filter-pills">
            <button
              type="button"
              className={`pod-filter-pill ${statusFilter === '' ? 'active' : ''}`}
              onClick={() => setStatusFilter('')}
            >
              All Proofs
            </button>
            <button
              type="button"
              className={`pod-filter-pill ${statusFilter === 'PENDING' ? 'active' : ''}`}
              onClick={() => setStatusFilter('PENDING')}
            >
              <Clock size={13} style={{ color: '#d97706' }} /> Pending
            </button>
            <button
              type="button"
              className={`pod-filter-pill ${statusFilter === 'VERIFIED' ? 'active' : ''}`}
              onClick={() => setStatusFilter('VERIFIED')}
            >
              <CheckCircle2 size={13} style={{ color: '#16a34a' }} /> Verified
            </button>
            <button
              type="button"
              className={`pod-filter-pill ${statusFilter === 'FLAGGED' ? 'active' : ''}`}
              onClick={() => setStatusFilter('FLAGGED')}
            >
              <ShieldAlert size={13} style={{ color: '#dc2626' }} /> Flagged
            </button>
            <button
              type="button"
              className={`pod-filter-pill ${statusFilter === 'INVESTIGATING' ? 'active' : ''}`}
              onClick={() => setStatusFilter('INVESTIGATING')}
            >
              <AlertTriangle size={13} style={{ color: '#ea580c' }} /> Investigating
            </button>
          </div>

          {/* Search Box */}
          <div className="pod-search-wrap">
            <Search size={15} style={{ color: '#94a3b8', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search order #..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadData(1)}
            />
            {searchQuery && (
              <button
                type="button"
                className="pod-search-clear"
                onClick={() => {
                  setSearchQuery('');
                  loadData(1);
                }}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Refresh Button */}
          <Button variant="outline" onClick={() => loadData(1)} disabled={loading} style={{ height: '38px', borderRadius: '9px', fontSize: '13px' }}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </Button>
        </div>
      </div>

      {/* ================= QUEUE TABLE ================= */}
      {loading ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 24px',
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          color: '#64748b'
        }}>
          <RefreshCw size={28} className="spin" style={{ color: '#10b981', margin: '0 auto 12px' }} />
          <div style={{ fontWeight: 600, fontSize: '14px', color: '#1e293b' }}>Loading delivery verification queue...</div>
          <div style={{ fontSize: '12px', marginTop: '4px' }}>Fetching latest signed proofs from Cloudinary</div>
        </div>
      ) : proofs.length === 0 ? (
        <div style={{
          background: '#ffffff',
          border: '1.5px dashed #cbd5e1',
          borderRadius: '16px',
          padding: '52px 24px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: '#ecfdf5',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px'
          }}>
            <CheckCircle2 size={30} />
          </div>
          <h4 style={{ margin: '0 0 6px', color: '#0f172a', fontSize: '16px', fontWeight: 800 }}>Queue Clean!</h4>
          <p style={{ margin: 0, color: '#64748b', fontSize: '13px', maxWidth: '380px', marginInline: 'auto' }}>
            {statusFilter
              ? `No delivery proofs found under "${statusFilter}" status filter.`
              : 'All completed order delivery proofs have been reviewed and verified.'}
          </p>
        </div>
      ) : (
        <div className="pod-table-card table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Proof Thumbnail</th>
                <th>Order #</th>
                <th>Delivery Person</th>
                <th>Customer & Address</th>
                <th>Recipient Confirmation</th>
                <th>Delivered Time</th>
                <th>Verification Status</th>
                <th style={{ textAlign: 'right' }}>Review Action</th>
              </tr>
            </thead>
            <tbody>
              {proofs.map(p => {
                const photoSrc = p.signedUrl || p.cloudinaryUrl;
                const riderInitials = (p.deliveryPerson?.name || 'Rider')
                  .split(' ')
                  .map(w => w[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();

                return (
                  <tr key={p.id}>
                    {/* Thumbnail */}
                    <td>
                      <div
                        className="pod-thumb-wrap"
                        onClick={() => handleOpenReview(p)}
                        title="Click to preview proof photo"
                      >
                        <img
                          src={photoSrc}
                          alt={`Proof for #${p.orderNumber}`}
                          onError={e => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>';
                          }}
                        />
                        <div className="pod-thumb-overlay">
                          <Eye size={16} />
                        </div>
                      </div>
                    </td>

                    {/* Order # and Amount */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="pod-code-pill">#{p.orderNumber}</span>
                        <button
                          type="button"
                          onClick={() => copyText(p.orderNumber, p.id)}
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', padding: '2px' }}
                          title="Copy Order #"
                        >
                          {copiedId === p.id ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />}
                        </button>
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#059669', fontWeight: 700, marginTop: '3px' }}>
                        Amount: {money(p.grandTotal)}
                      </div>
                    </td>

                    {/* Delivery Person */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="pod-avatar">{riderInitials}</div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '13px' }}>
                            {p.deliveryPerson?.name || 'Unassigned Rider'}
                          </div>
                          {p.deliveryPerson?.mobile && (
                            <a
                              href={`tel:${p.deliveryPerson.mobile}`}
                              style={{ fontSize: '11.5px', color: '#0284c7', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '1px' }}
                            >
                              <Phone size={10} /> {p.deliveryPerson.mobile}
                            </a>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Customer & Address */}
                    <td>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{p.customerName}</div>
                      <div style={{
                        fontSize: '11.5px',
                        color: '#64748b',
                        maxWidth: '220px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginTop: '2px'
                      }}>
                        <MapPin size={11} style={{ flexShrink: 0, color: '#059669' }} />
                        <span title={p.deliveryAddress}>{p.deliveryAddress}</span>
                      </div>
                    </td>

                    {/* Recipient Confirmation */}
                    <td>
                      <div style={{ fontSize: '12px', color: '#1e293b' }}>
                        <b>Recipient:</b> {p.recipientName || 'Self / Customer'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px', flexWrap: 'wrap' }}>
                        {p.recipientPhone && (
                          <span style={{ fontSize: '11px', color: '#64748b' }}>Phone: {p.recipientPhone}</span>
                        )}
                        {p.customerOtp ? (
                          <span className="pod-otp-badge">
                            <Check size={11} strokeWidth={2.5} /> OTP Verified
                          </span>
                        ) : (
                          <span style={{ fontSize: '10.5px', color: '#94a3b8', fontStyle: 'italic' }}>Direct Handover</span>
                        )}
                      </div>
                    </td>

                    {/* Timestamp */}
                    <td>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Clock size={12} style={{ color: '#64748b' }} />
                        {new Date(p.deliveredAt || p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}{' '}
                        {new Date(p.deliveredAt || p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    {/* Verification Status */}
                    <td>
                      <span className={`pod-status-chip ${p.verificationStatus?.toLowerCase()}`}>
                        {p.verificationStatus === 'VERIFIED' && <CheckCircle2 size={12} />}
                        {p.verificationStatus === 'FLAGGED' && <ShieldAlert size={12} />}
                        {p.verificationStatus === 'INVESTIGATING' && <AlertTriangle size={12} />}
                        {p.verificationStatus === 'PENDING' && <Clock size={12} />}
                        <span>{p.verificationStatus}</span>
                      </span>
                    </td>

                    {/* Action */}
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="pod-review-btn"
                        onClick={() => handleOpenReview(p)}
                      >
                        <Eye size={14} /> Review Proof
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination bar if multiple pages */}
          {pagination.pages > 1 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 18px',
              borderTop: '1px solid #f1f5f9',
              background: '#f8fafc'
            }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Showing page {pagination.page} of {pagination.pages} ({pagination.total} proofs total)
              </span>
              <Pagination page={pagination.page} setPage={loadData} total={pagination.pages} />
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL: 2-COLUMN SPLIT PROOF DETAIL & AUDIT ================= */}
      <Modal
        open={!!selectedProof}
        onClose={() => !busy && setSelectedProof(null)}
        title={selectedProof ? `Review Delivery Proof: #${selectedProof.orderNumber}` : 'Review Delivery Proof'}
        size="pod-review-modal"
      >
        {selectedProof && (
          <>
            <div className="pod-modal-body">
              <div className="pod-review-split">
                {/* LEFT COLUMN: Photo Viewer */}
                <div className="pod-photo-container">
                  <div className="pod-photo-top-bar">
                    <span>
                      <Camera size={13} /> Cloudinary POD Photo
                    </span>
                    <span className={`pod-status-chip ${selectedProof.verificationStatus?.toLowerCase()}`}>
                      {selectedProof.verificationStatus}
                    </span>
                  </div>

                  <div className="pod-photo-viewer">
                    <img
                      src={selectedProof.signedUrl || selectedProof.cloudinaryUrl}
                      alt={`Delivery proof for order ${selectedProof.orderNumber}`}
                      onError={e => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 24 24" fill="none" stroke="%2364748b" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>';
                      }}
                    />
                  </div>

                  <div className="pod-photo-bottom-bar">
                    <a
                      href={selectedProof.signedUrl || selectedProof.cloudinaryUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="pod-expand-link"
                    >
                      <ExternalLink size={13} /> Open Full Resolution
                    </a>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                      {selectedProof.deliveredAt ? new Date(selectedProof.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                </div>

                {/* RIGHT COLUMN: Details & Verification Notes */}
                <div className="pod-details-col">
                  {/* Order & Recipient Info Card */}
                  <div className="pod-info-card">
                    <div className="pod-info-row">
                      <div className="pod-info-item">
                        <span className="pod-info-label">Order Number</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="pod-info-val" style={{ fontFamily: 'monospace' }}>
                            #{selectedProof.orderNumber}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyText(selectedProof.orderNumber, 'order')}
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', padding: '2px' }}
                            title="Copy order number"
                          >
                            {copiedId === 'order' ? <Check size={13} style={{ color: '#10b981' }} /> : <Copy size={13} />}
                          </button>
                        </div>
                        <span className="pod-info-sub" style={{ color: '#059669', fontWeight: 700 }}>
                          Amount: {money(selectedProof.grandTotal)}
                        </span>
                      </div>

                      <div className="pod-info-item">
                        <span className="pod-info-label">Delivered At</span>
                        <span className="pod-info-val" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <Clock size={13} style={{ color: '#059669' }} />
                          {new Date(selectedProof.deliveredAt || selectedProof.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                        <span className="pod-info-sub">
                          {new Date(selectedProof.deliveredAt || selectedProof.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="pod-info-row" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                      <div className="pod-info-item">
                        <span className="pod-info-label">Delivery Staff</span>
                        <span className="pod-info-val" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <User size={13} style={{ color: '#64748b' }} />
                          {selectedProof.deliveryPerson?.name || 'Unassigned'}
                        </span>
                        {selectedProof.deliveryPerson?.mobile && (
                          <a
                            href={`tel:${selectedProof.deliveryPerson.mobile}`}
                            className="pod-info-sub"
                            style={{ color: '#0284c7', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                          >
                            <Phone size={11} /> {selectedProof.deliveryPerson.mobile}
                          </a>
                        )}
                      </div>

                      <div className="pod-info-item">
                        <span className="pod-info-label">Recipient & Customer</span>
                        <span className="pod-info-val">
                          {selectedProof.recipientName || selectedProof.customerName || 'Customer'}
                        </span>
                        {(selectedProof.recipientPhone || selectedProof.customerMobile) && (
                          <span className="pod-info-sub">
                            Phone: {selectedProof.recipientPhone || selectedProof.customerMobile}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Address Box */}
                    <div className="pod-address-box">
                      <MapPin size={16} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '2px' }}>
                          Delivery Destination
                        </div>
                        <div>{selectedProof.deliveryAddress}</div>
                      </div>
                    </div>

                    {/* Cloudinary Asset ID */}
                    {selectedProof.cloudinaryPublicId && (
                      <div style={{
                        fontSize: '11px',
                        background: '#f1f5f9',
                        padding: '7px 10px',
                        borderRadius: '6px',
                        color: '#475569',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px'
                      }}>
                        <span style={{ fontWeight: 600, flexShrink: 0 }}>Asset ID:</span>
                        <code style={{ fontSize: '10.5px', color: '#0f172a', wordBreak: 'break-all' }}>
                          {selectedProof.cloudinaryPublicId}
                        </code>
                        <button
                          type="button"
                          onClick={() => copyText(selectedProof.cloudinaryPublicId, 'asset')}
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', padding: '2px', flexShrink: 0 }}
                          title="Copy Cloudinary Asset ID"
                        >
                          {copiedId === 'asset' ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />}
                        </button>
                      </div>
                    )}

                    {/* Delivery Rider Note if present */}
                    {selectedProof.notes && (
                      <div style={{ fontSize: '12px', background: '#f8fafc', borderLeft: '3px solid #3b82f6', padding: '6px 10px', color: '#1e293b' }}>
                        <b>Rider Note:</b> “{selectedProof.notes}”
                      </div>
                    )}
                  </div>

                  {/* Previous Review Note if exists */}
                  {selectedProof.verificationNotes && (
                    <div style={{ background: '#fffbeb', padding: '10px 12px', borderRadius: '8px', border: '1px solid #fde68a', fontSize: '12.5px', color: '#92400e', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '2px', color: '#d97706' }} />
                      <div>
                        <b style={{ display: 'block', marginBottom: '2px' }}>Previous Review Note:</b>
                        <span>{selectedProof.verificationNotes}</span>
                      </div>
                    </div>
                  )}

                  {/* Review Notes Form */}
                  <div className="pod-notes-form">
                    <label htmlFor="pod-audit-notes">
                      <span>Reviewer Verification Notes</span>
                      <span style={{ fontSize: '11px', fontWeight: 500, color: '#94a3b8' }}>Optional audit trail</span>
                    </label>
                    <textarea
                      id="pod-audit-notes"
                      rows="3"
                      placeholder="Add internal audit findings, delivery confirmation remarks, or reason for flagging..."
                      value={verificationNotes}
                      onChange={e => setVerificationNotes(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Pinned Bottom Modal Footer */}
            <div className="pod-modal-foot">
              <div className="pod-foot-left">
                <Button
                  type="button"
                  disabled={busy}
                  onClick={() => handleUpdateStatus(selectedProof.id, 'FLAGGED')}
                  style={{
                    background: '#ef4444',
                    color: '#ffffff',
                    border: 'none',
                    height: '38px',
                    padding: '0 14px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <ShieldAlert size={15} /> Flag Suspicious
                </Button>

                <Button
                  type="button"
                  disabled={busy}
                  onClick={() => handleUpdateStatus(selectedProof.id, 'INVESTIGATING')}
                  style={{
                    background: '#f59e0b',
                    color: '#ffffff',
                    border: 'none',
                    height: '38px',
                    padding: '0 14px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <AlertTriangle size={15} /> Investigate
                </Button>
              </div>

              <div className="pod-foot-right">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => setSelectedProof(null)}
                  style={{ height: '38px', padding: '0 16px', fontSize: '13px' }}
                >
                  Close
                </Button>

                <Button
                  type="button"
                  disabled={busy}
                  onClick={() => handleUpdateStatus(selectedProof.id, 'VERIFIED')}
                  style={{
                    background: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    height: '38px',
                    padding: '0 20px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                    cursor: 'pointer'
                  }}
                >
                  <CheckCircle2 size={16} /> Approve & Verify
                </Button>
              </div>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
