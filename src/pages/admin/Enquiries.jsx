import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  PhoneCall, 
  MessageCircle, 
  Mail, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Search, 
  RefreshCw, 
  Trash2, 
  Tag, 
  FileText,
  User,
  ShieldCheck,
  AlertCircle,
  Eye,
  X,
  Send,
  MessageSquare,
  Edit3
} from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/ui';
import './admin-orders.css';

const STATUS_TABS = ['All', 'Pending', 'Contacted', 'Resolved', 'Rejected'];

export default function Enquiries() {
  const { user, notify } = useApp();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusTab, setStatusTab] = useState('All');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [notesInput, setNotesInput] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const notifyRef = useRef(notify);
  notifyRef.current = notify;

  const isSuperUser = user?.role === 'SUPER_ADMIN' || user?.staffRole === 'SUPER_ADMIN';
  const assignedCategoryIds = Array.isArray(user?.assignedCategoryIds) ? user.assignedCategoryIds : [];
  const isCategoryScoped = !isSuperUser && (user?.staffRole === 'CATEGORY_ADMIN' || assignedCategoryIds.length > 0);

  const fetchEnquiries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 20 };
      if (statusTab !== 'All') {
        params.status = statusTab.toUpperCase();
      }
      if (search.trim()) {
        params.search = search.trim();
      }
      const res = await adminService.getEnquiries(params);
      setItems(res.data || []);
      setMeta(res.meta || { total: res.data?.length || 0, totalPages: 1 });
    } catch (err) {
      console.error('Fetch enquiries error:', err);
      setError(err.message || 'Failed to load inquiries. The server may still be deploying, please retry.');
    } finally {
      setLoading(false);
    }
  }, [page, statusTab, search]);

  useEffect(() => {
    fetchEnquiries();
  }, [fetchEnquiries]);

  const handleStatusChange = async (id, nextStatus) => {
    setUpdatingId(id);
    try {
      await adminService.updateEnquiryStatus(id, { status: nextStatus });
      setItems(curr => curr.map(item => item.id === id ? { ...item, status: nextStatus } : item));
      if (selectedEnquiry && selectedEnquiry.id === id) {
        setSelectedEnquiry(prev => ({ ...prev, status: nextStatus }));
      }
      notifyRef.current?.(`Inquiry status updated to ${nextStatus}`, 'success');
    } catch (err) {
      notifyRef.current?.(err.message || 'Failed to update status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedEnquiry) return;
    setSavingNotes(true);
    try {
      await adminService.updateEnquiryStatus(selectedEnquiry.id, { adminNotes: notesInput });
      setItems(curr => curr.map(item => item.id === selectedEnquiry.id ? { ...item, adminNotes: notesInput } : item));
      setSelectedEnquiry(prev => ({ ...prev, adminNotes: notesInput }));
      notifyRef.current?.('Staff notes saved successfully', 'success');
    } catch (err) {
      notifyRef.current?.(err.message || 'Failed to save notes', 'error');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer inquiry?')) return;
    try {
      await adminService.deleteEnquiry(id);
      setItems(curr => curr.filter(item => item.id !== id));
      if (selectedEnquiry?.id === id) {
        setSelectedEnquiry(null);
      }
      notifyRef.current?.('Inquiry deleted successfully', 'success');
    } catch (err) {
      notifyRef.current?.(err.message || 'Failed to delete inquiry', 'error');
    }
  };

  const openDetailModal = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setNotesInput(enquiry.adminNotes || '');
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'PENDING':
        return { background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' };
      case 'CONTACTED':
        return { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' };
      case 'RESOLVED':
        return { background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' };
      case 'REJECTED':
        return { background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' };
      default:
        return { background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' };
    }
  };

  return (
    <div className="admin-page" style={{ padding: '24px 20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Title & Refresh */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: '#ea580c' }}>📞</span> Customer Inquiries & Contact Requests
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13.5px', color: '#64748b' }}>
            Direct customer customization requests, quotation queries, and inquiries submitted for products.
          </p>
        </div>

        <button 
          onClick={fetchEnquiries} 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '6px', 
            background: '#fff', 
            border: '1.5px solid #e2e8f0', 
            padding: '8px 14px', 
            borderRadius: '10px', 
            fontSize: '13px', 
            fontWeight: 700, 
            color: '#334155', 
            cursor: 'pointer' 
          }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {/* Category Scoped Isolation Notice */}
      {isCategoryScoped && (
        <div style={{ background: '#f5f3ff', border: '1.5px solid #ddd6fe', borderRadius: '12px', padding: '12px 16px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#5b21b6' }}>
          <ShieldCheck size={20} style={{ color: '#7c3aed', flexShrink: 0 }} />
          <span><b>Isolated Category View:</b> Showing customer inquiries strictly for products belonging to your assigned category.</span>
        </div>
      )}

      {/* Filter Tabs & Search Bar Row (Identical to Orders screen) */}
      <div className="orders-filter-row">
        <div className="tabs admin-tabs" style={{ margin: 0 }}>
          {STATUS_TABS.map(value => (
            <button
              type="button"
              className={statusTab === value ? 'active' : ''}
              onClick={() => { setStatusTab(value); setPage(1); }}
              key={value}
            >
              {value}
            </button>
          ))}
        </div>

        <div className="orders-search-input-wrap">
          <Search size={16} style={{ color: '#94a3b8', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search customer, mobile, product…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button 
              type="button" 
              onClick={() => setSearch('')} 
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* INQUIRIES TABLE CARD */}
      <div className="admin-card table-card" style={{ background: '#fff', borderRadius: '14px', border: '1.5px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
        <div className="table-wrap">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                {['Customer Details', 'Product Requested', 'Inquiry Message', 'Staff Notes', 'Received', 'Status', 'Action'].map(label => (
                  <th key={label} style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* SKELETON LOADING (Clean, professional placeholder rows - NO SPINNER) */}
              {loading && !items.length ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={`inq-skel-${idx}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div className="r2c-skeleton-box" style={{ width: '130px', height: '16px', borderRadius: '4px', marginBottom: '6px' }} />
                      <div className="r2c-skeleton-box" style={{ width: '100px', height: '12px', borderRadius: '4px' }} />
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="r2c-skeleton-box" style={{ width: '42px', height: '42px', borderRadius: '8px', flexShrink: 0 }} />
                        <div>
                          <div className="r2c-skeleton-box" style={{ width: '160px', height: '14px', borderRadius: '4px', marginBottom: '6px' }} />
                          <div className="r2c-skeleton-box" style={{ width: '70px', height: '12px', borderRadius: '4px' }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div className="r2c-skeleton-box" style={{ width: '180px', height: '14px', borderRadius: '4px' }} />
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div className="r2c-skeleton-box" style={{ width: '120px', height: '14px', borderRadius: '4px' }} />
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div className="r2c-skeleton-box" style={{ width: '90px', height: '13px', borderRadius: '4px' }} />
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div className="r2c-skeleton-box" style={{ width: '85px', height: '24px', borderRadius: '12px' }} />
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div className="r2c-skeleton-box" style={{ width: '34px', height: '34px', borderRadius: '50%' }} />
                    </td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '48px 20px' }}>
                    <AlertCircle size={32} style={{ color: '#ef4444', margin: '0 auto 8px' }} />
                    <p style={{ color: '#dc2626', fontWeight: 600, fontSize: '13.5px', margin: '0 0 12px' }}>{error}</p>
                    <button 
                      onClick={fetchEnquiries}
                      style={{ padding: '7px 16px', borderRadius: '8px', border: '1.5px solid #cbd5e1', background: '#fff', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Retry Loading
                    </button>
                  </td>
                </tr>
              ) : !items.length ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f8fafc', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                      <PhoneCall size={22} />
                    </div>
                    <div style={{ color: '#0f172a', fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>
                      No Customer Inquiries Found
                    </div>
                    <div style={{ color: '#64748b', fontSize: '13px' }}>
                      {statusTab !== 'All' ? `No requests matching "${statusTab}".` : 'When customers request custom quotes or contact for products, they will appear here.'}
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const cleanPhone = String(item.phone || '').replace(/\D/g, '');
                  const productImg = item.product?.images?.[0]?.url || 'https://placehold.co/100?text=Product';
                  const whatsappUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(`Hello ${item.name}, regarding your inquiry about ${item.product?.name || 'our product'} on R2Cart:`)}`;

                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}>
                      {/* 1. Customer Details */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>
                          {item.name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                          <span style={{ fontSize: '12.5px', color: '#334155', fontWeight: 600 }}>📞 {item.phone}</span>
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Chat on WhatsApp"
                            style={{ display: 'inline-flex', alignItems: 'center', color: '#25d366' }}
                          >
                            <MessageCircle size={15} />
                          </a>
                          <a
                            href={`tel:${cleanPhone}`}
                            title="Direct Call"
                            style={{ display: 'inline-flex', alignItems: 'center', color: '#0284c7' }}
                          >
                            <PhoneCall size={14} />
                          </a>
                        </div>
                        {item.email && (
                          <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                            ✉️ {item.email}
                          </div>
                        )}
                      </td>

                      {/* 2. Product Requested */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        {item.product ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img
                              src={productImg}
                              alt={item.product.name}
                              style={{ width: '42px', height: '42px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e2e8f0', flexShrink: 0 }}
                            />
                            <div>
                              <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {item.product.name}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                <span style={{ fontSize: '12px', fontWeight: 800, color: '#059669' }}>
                                  ₹{Number(item.product.price || 0).toFixed(2)}
                                </span>
                                {item.product.category?.name && (
                                  <span style={{ fontSize: '10.5px', fontWeight: 700, background: '#ede9fe', color: '#6d28d9', padding: '1px 6px', borderRadius: '4px' }}>
                                    {item.product.category.name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#94a3b8' }}>General Product Inquiry</span>
                        )}
                      </td>

                      {/* 3. Inquiry Message */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', maxWidth: '240px' }}>
                        {item.message ? (
                          <div style={{
                            fontSize: '12.5px',
                            color: '#334155',
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            padding: '6px 10px',
                            maxHeight: '48px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            lineHeight: 1.35
                          }}>
                            "{item.message}"
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>Requested callback</span>
                        )}
                      </td>

                      {/* 4. Staff Discussion Notes */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', maxWidth: '180px' }}>
                        {item.adminNotes ? (
                          <div style={{ fontSize: '12px', color: '#0369a1', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '6px', padding: '5px 8px', lineHeight: 1.3 }}>
                            {item.adminNotes}
                          </div>
                        ) : (
                          <span style={{ fontSize: '11.5px', color: '#94a3b8', fontStyle: 'italic' }}>None</span>
                        )}
                      </td>

                      {/* 5. Date & Time */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#1e293b' }}>
                          {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>
                          {new Date(item.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* 6. Status Pill Select */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <select
                          value={item.status}
                          disabled={updatingId === item.id}
                          onChange={(e) => handleStatusChange(item.id, e.target.value)}
                          style={{
                            ...getStatusBadgeStyle(item.status),
                            padding: '5px 10px',
                            borderRadius: '20px',
                            fontSize: '11.5px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            outline: 'none',
                            textTransform: 'uppercase'
                          }}
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="CONTACTED">CONTACTED</option>
                          <option value="RESOLVED">RESOLVED</option>
                          <option value="REJECTED">REJECTED</option>
                        </select>
                      </td>

                      {/* 7. Action Button */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => openDetailModal(item)}
                            title="View full details and edit staff notes"
                            style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '50%',
                              border: '1.5px solid #e2e8f0',
                              background: '#fff',
                              color: '#334155',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            title="Delete inquiry"
                            style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '50%',
                              border: '1.5px solid #fee2e2',
                              background: '#fff',
                              color: '#ef4444',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
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

      {/* Detail & Notes Modal */}
      {selectedEnquiry && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '16px',
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '540px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  Inquiry Details
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Received on {new Date(selectedEnquiry.createdAt).toLocaleString('en-IN')}
                </span>
              </div>
              <button
                onClick={() => setSelectedEnquiry(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Customer Contact Box */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
                {selectedEnquiry.name}
              </div>
              <div style={{ fontSize: '13px', color: '#334155', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>📞 {selectedEnquiry.phone}</span>
                <a
                  href={`https://wa.me/91${String(selectedEnquiry.phone || '').replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#25d366', display: 'inline-flex', alignItems: 'center', gap: '3px', textDecoration: 'none', fontWeight: 700, fontSize: '12px' }}
                >
                  <MessageCircle size={15} /> WhatsApp
                </a>
                <a
                  href={`tel:${String(selectedEnquiry.phone || '').replace(/\D/g, '')}`}
                  style={{ color: '#0284c7', display: 'inline-flex', alignItems: 'center', gap: '3px', textDecoration: 'none', fontWeight: 700, fontSize: '12px' }}
                >
                  <PhoneCall size={14} /> Call
                </a>
              </div>
              {selectedEnquiry.email && (
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  ✉️ {selectedEnquiry.email}
                </div>
              )}
            </div>

            {/* Product Box */}
            {selectedEnquiry.product && (
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <img
                  src={selectedEnquiry.product.images?.[0]?.url || 'https://placehold.co/100?text=Product'}
                  alt={selectedEnquiry.product.name}
                  style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }}
                />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{selectedEnquiry.product.name}</div>
                  <div style={{ fontSize: '12.5px', color: '#059669', fontWeight: 800, marginTop: '2px' }}>
                    ₹{Number(selectedEnquiry.product.price || 0).toFixed(2)}
                  </div>
                </div>
              </div>
            )}

            {/* Message Requirement */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                Customer Requirements / Customization Message
              </label>
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '12px', fontSize: '13px', color: '#92400e', lineHeight: 1.45 }}>
                {selectedEnquiry.message || 'No written message provided (direct quote callback requested).'}
              </div>
            </div>

            {/* Staff Notes Editor */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                Internal Staff Notes & Discussion Summary
              </label>
              <textarea
                rows={3}
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder="Record quotation, discussion summary, or customized color details..."
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '13px' }}
              />
              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={savingNotes}
                style={{ marginTop: '8px', padding: '6px 14px', borderRadius: '8px', background: '#0f172a', color: '#fff', fontSize: '12.5px', fontWeight: 700, border: 'none', cursor: 'pointer' }}
              >
                {savingNotes ? 'Saving…' : 'Save Notes'}
              </button>
            </div>

            {/* Status Change in Modal */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>Update Status:</span>
              <select
                value={selectedEnquiry.status}
                onChange={(e) => handleStatusChange(selectedEnquiry.id, e.target.value)}
                style={{
                  ...getStatusBadgeStyle(selectedEnquiry.status),
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                <option value="PENDING">PENDING</option>
                <option value="CONTACTED">CONTACTED</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
