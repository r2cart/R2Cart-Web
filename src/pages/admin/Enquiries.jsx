import React, { useState, useEffect, useCallback } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { useApp } from '../../context/AppContext';
import { Button, StatusBadge } from '../../components/ui';

export default function Enquiries() {
  const { user, notify } = useApp();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [updatingId, setUpdatingId] = useState(null);
  const [editingNotesId, setEditingNotesId] = useState(null);
  const [tempNotes, setTempNotes] = useState('');

  const isSuperUser = user?.role === 'SUPER_ADMIN' || user?.staffRole === 'SUPER_ADMIN';
  const assignedCategoryIds = Array.isArray(user?.assignedCategoryIds) ? user.assignedCategoryIds : [];
  const isCategoryScoped = !isSuperUser && (user?.staffRole === 'CATEGORY_ADMIN' || assignedCategoryIds.length > 0);

  const fetchEnquiries = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      if (search.trim()) params.search = search.trim();
      const res = await adminService.getEnquiries(params);
      setItems(res.data || []);
      setMeta(res.meta || { total: res.data?.length || 0, totalPages: 1 });
    } catch (err) {
      notify(err.message || 'Failed to load customer inquiries', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search, notify]);

  useEffect(() => {
    fetchEnquiries();
  }, [fetchEnquiries]);

  const handleStatusChange = async (id, nextStatus) => {
    setUpdatingId(id);
    try {
      await adminService.updateEnquiryStatus(id, { status: nextStatus });
      setItems(curr => curr.map(item => item.id === id ? { ...item, status: nextStatus } : item));
      notify(`Inquiry marked as ${nextStatus}`);
    } catch (err) {
      notify(err.message || 'Failed to update status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveNotes = async (id) => {
    setUpdatingId(id);
    try {
      await adminService.updateEnquiryStatus(id, { adminNotes: tempNotes });
      setItems(curr => curr.map(item => item.id === id ? { ...item, adminNotes: tempNotes } : item));
      notify('Staff notes saved');
      setEditingNotesId(null);
    } catch (err) {
      notify(err.message || 'Failed to save notes', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer inquiry?')) return;
    try {
      await adminService.deleteEnquiry(id);
      setItems(curr => curr.filter(item => item.id !== id));
      notify('Inquiry deleted successfully');
    } catch (err) {
      notify(err.message || 'Failed to delete inquiry', 'error');
    }
  };

  return (
    <div className="admin-page" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📞</span> Customer Inquiries & Contact Requests
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
            Direct customer requests, quotations, and custom orders submitted for products.
          </p>
        </div>

        <Button onClick={fetchEnquiries} variant="secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
        </Button>
      </div>

      {/* Category Scoped Isolation Notice */}
      {isCategoryScoped && (
        <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#5b21b6' }}>
          <ShieldCheck size={18} style={{ color: '#7c3aed', flexShrink: 0 }} />
          <span><b>Isolated Category View:</b> Showing customer inquiries strictly for products in your assigned category.</span>
        </div>
      )}

      {/* Filters Bar */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', flex: 1 }}>
          <div style={{ position: 'relative', minWidth: '240px', flex: '1 1 240px' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search customer name, phone, email, or product..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '7px 10px 7px 32px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['', 'PENDING', 'CONTACTED', 'RESOLVED', 'REJECTED'].map(st => (
              <button
                key={st}
                onClick={() => { setStatusFilter(st); setPage(1); }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: statusFilter === st ? '1px solid #2563eb' : '1px solid #e2e8f0',
                  background: statusFilter === st ? '#eff6ff' : '#fff',
                  color: statusFilter === st ? '#1d4ed8' : '#475569'
                }}
              >
                {st === '' ? 'All Inquiries' : st}
              </button>
            ))}
          </div>
        </div>

        <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 600 }}>
          Total: {meta.total} requests
        </span>
      </div>

      {/* Inquiries List */}
      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748b' }}>
          <RefreshCw size={24} className="spin" style={{ margin: '0 auto 10px' }} />
          <div>Loading inquiries...</div>
        </div>
      ) : items.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '60px 20px', textAlign: 'center' }}>
          <AlertCircle size={36} style={{ color: '#94a3b8', margin: '0 auto 10px' }} />
          <h3 style={{ margin: '0 0 6px', fontSize: '16px', color: '#1e293b' }}>No Customer Inquiries Found</h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
            {statusFilter ? `No requests matching status "${statusFilter}"` : 'When customers request custom orders or quotes, they will appear here.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {items.map(item => {
            const productImg = item.product?.images?.[0]?.url || 'https://placehold.co/100?text=Product';
            const cleanPhone = String(item.phone || '').replace(/\D/g, '');
            const whatsappUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(`Hello ${item.name}, regarding your inquiry about ${item.product?.name || 'our product'} on R2Cart:`)}`;

            return (
              <div 
                key={item.id}
                style={{ 
                  background: '#fff', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '10px', 
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                }}
              >
                {/* Top Row: Customer Info + Status & Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                      <User size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>{item.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '2px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '12.5px', color: '#334155', fontWeight: 600 }}>📞 {item.phone}</span>
                        {item.email && <span style={{ fontSize: '12px', color: '#64748b' }}>✉️ {item.email}</span>}
                        <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                          <Clock size={11} style={{ display: 'inline', marginRight: '3px' }} />
                          {new Date(item.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Status Dropdown */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {/* Instant WhatsApp Button */}
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        background: '#25d366',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: 700,
                        textDecoration: 'none'
                      }}
                    >
                      <MessageCircle size={14} /> WhatsApp
                    </a>

                    {/* Instant Call Button */}
                    <a
                      href={`tel:${cleanPhone}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        background: '#f1f5f9',
                        color: '#334155',
                        border: '1px solid #cbd5e1',
                        fontSize: '12px',
                        fontWeight: 700,
                        textDecoration: 'none'
                      }}
                    >
                      <PhoneCall size={14} /> Call
                    </a>

                    {/* Status Select */}
                    <select
                      value={item.status}
                      disabled={updatingId === item.id}
                      onChange={e => handleStatusChange(item.id, e.target.value)}
                      style={{
                        padding: '6px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 700,
                        border: '1px solid #cbd5e1',
                        background: 
                          item.status === 'PENDING' ? '#fff7ed' : 
                          item.status === 'CONTACTED' ? '#eff6ff' : 
                          item.status === 'RESOLVED' ? '#f0fdf4' : '#fef2f2',
                        color: 
                          item.status === 'PENDING' ? '#c2410c' : 
                          item.status === 'CONTACTED' ? '#1d4ed8' : 
                          item.status === 'RESOLVED' ? '#15803d' : '#b91c1c'
                      }}
                    >
                      <option value="PENDING">⏳ PENDING</option>
                      <option value="CONTACTED">💬 CONTACTED</option>
                      <option value="RESOLVED">✅ RESOLVED</option>
                      <option value="REJECTED">❌ REJECTED</option>
                    </select>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(item.id)}
                      title="Delete inquiry"
                      style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Middle Row: Product Card */}
                {item.product && (
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img 
                      src={productImg} 
                      alt={item.product.name} 
                      style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }} 
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#1e293b' }}>{item.product.name}</span>
                        {item.product.category?.name && (
                          <span style={{ fontSize: '10.5px', fontWeight: 700, background: '#ede9fe', color: '#6d28d9', padding: '1px 6px', borderRadius: '4px' }}>
                            {item.product.category.name}
                          </span>
                        )}
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#047857' }}>
                          ₹{Number(item.product.price || 0).toFixed(2)}
                        </span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                        Unit: {item.product.unit || 'Standard'} • Scope: {item.product.deliveryScope || 'Local'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Customer Message / Requirements */}
                {item.message && (
                  <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '6px', padding: '10px 12px', fontSize: '12.5px', color: '#92400e' }}>
                    <b style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', marginBottom: '2px', color: '#b45309' }}>Customer Requirements / Note:</b>
                    {item.message}
                  </div>
                )}

                {/* Admin Staff Discussion Notes */}
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  {editingNotesId === item.id ? (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <textarea
                        value={tempNotes}
                        onChange={e => setTempNotes(e.target.value)}
                        placeholder="Add staff notes (e.g. Quoted ₹2800 for 14-inch clock on WhatsApp, customer requested blue crystals)..."
                        style={{ width: '100%', height: '60px', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                      />
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Button size="sm" onClick={() => handleSaveNotes(item.id)} disabled={updatingId === item.id}>Save Notes</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingNotesId(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', color: item.adminNotes ? '#334155' : '#94a3b8', fontStyle: item.adminNotes ? 'normal' : 'italic' }}>
                        <b>Staff Notes:</b> {item.adminNotes || 'No internal notes added yet.'}
                      </span>
                      <button
                        onClick={() => { setEditingNotesId(item.id); setTempNotes(item.adminNotes || ''); }}
                        style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        {item.adminNotes ? 'Edit Notes' : '+ Add Notes'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
