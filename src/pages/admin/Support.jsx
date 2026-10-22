import { useEffect, useState } from 'react';
import { Eye, Phone, Mail, Package, User, Clock, MessageSquare } from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { Button, Modal, StatusBadge } from '../../components/ui';
import { useApp } from '../../context/AppContext';

const AdminTitle = ({ title, text }) => (
  <div className="admin-title">
    <div>
      <h1>{title}</h1>
      <p>{text}</p>
    </div>
  </div>
);

const label = status => ({ OPEN: 'Open', PENDING: 'Pending', RESOLVED: 'Resolved' }[status] || status);
const date = value => new Date(value).toLocaleString('en-IN');

function getTicketPhone(t) {
  if (!t) return null;
  if (t.customerPhone) return t.customerPhone;
  if (t.user?.mobile) return t.user.mobile;
  const match = (t.description || '').match(/(?:Contact (?:Phone|Mobile)|Phone|Mobile):\s*([+0-9\s-]{10,15})/i);
  return match ? match[1].trim() : null;
}

export function AdminSupport() {
  const { notify } = useApp();
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState('OPEN');
  const [response, setResponse] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setTickets(await adminService.support());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const view = ticket => {
    setSelected(ticket);
    setStatus(ticket.status);
    setResponse('');
  };

  const reply = async () => {
    if (!response.trim() && status === selected.status) {
      return notify('Write a response or change the ticket status', 'error');
    }
    setSaving(true);
    try {
      await adminService.replyTicket(selected.id, {
        status,
        message: response.trim() || undefined
      });
      window.dispatchEvent(new Event('grocify:settings-updated'));
      setSelected(null);
      await load();
      notify('Response saved and ticket updated');
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const modalPhone = getTicketPhone(selected);

  return (
    <>
      <AdminTitle
        title="Support tickets"
        text="Resolve customer issues quickly, contact customers via phone, and manage tickets."
      />

      <div className="admin-card table-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Customer & Contact</th>
                <th>Issue type</th>
                <th>Subject</th>
                <th>Order</th>
                <th>Created</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8">Loading support tickets…</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="8">
                    <p role="alert">{error}</p>
                    <Button variant="outline" onClick={load}>Try again</Button>
                  </td>
                </tr>
              ) : (
                tickets.map(t => {
                  const phone = getTicketPhone(t);
                  return (
                    <tr key={t.id}>
                      <td>
                        <b style={{ color: 'var(--ink)', fontSize: '13px' }}>{t.ticketNumber}</b>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: '13px' }}>
                          {t.user?.name || 'Customer'}
                        </div>
                        {phone ? (
                          <div style={{ marginTop: '3px' }}>
                            <a
                              href={`tel:${phone}`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                color: '#047857',
                                fontWeight: 700,
                                fontSize: '11.5px',
                                textDecoration: 'none',
                                background: '#ecfdf5',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                border: '1px solid #a7f3d0'
                              }}
                              title="Click to dial customer"
                              onClick={e => e.stopPropagation()}
                            >
                              <Phone size={11} style={{ color: '#059669' }} />
                              <span>{phone}</span>
                            </a>
                          </div>
                        ) : (
                          <span style={{ display: 'inline-block', fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', marginTop: '2px' }}>
                            No phone registered
                          </span>
                        )}
                        {t.user?.email && (
                          <small
                            className="table-subtext"
                            style={{ display: 'block', color: 'var(--muted)', fontSize: '11px', marginTop: '2px' }}
                          >
                            {t.user?.email}
                          </small>
                        )}
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, fontSize: '12px' }}>{t.issueType}</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 500, fontSize: '13px' }}>{t.subject}</span>
                      </td>
                      <td>
                        {t.orderNumber ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontWeight: 700,
                              color: '#2563eb',
                              background: '#eff6ff',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              border: '1px solid #bfdbfe'
                            }}
                            title={`Order ID: ${t.orderId || ''}`}
                          >
                            <Package size={12} /> #{t.orderNumber}
                          </span>
                        ) : t.orderId ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontWeight: 600,
                              fontSize: '11px',
                              color: '#64748b',
                              background: '#f1f5f9',
                              padding: '2px 7px',
                              borderRadius: '5px',
                              border: '1px solid #e2e8f0'
                            }}
                            title={t.orderId}
                          >
                            <Package size={11} /> #{t.orderId.slice(-8).toUpperCase()}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--muted)' }}>—</span>
                        )}
                      </td>
                      <td>{date(t.createdAt)}</td>
                      <td>
                        <StatusBadge status={label(t.status)} />
                      </td>
                      <td>
                        <button
                          className="icon-btn"
                          onClick={() => view(t)}
                          aria-label={`View ${t.ticketNumber}`}
                          title="View Ticket Details & Contact Customer"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
              {!loading && !error && !tickets.length && (
                <tr>
                  <td colSpan="8">No support tickets found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={!!selected}
        onClose={() => !saving && setSelected(null)}
        title={`Support Ticket ${selected?.ticketNumber || ''}`}
        size="location-modal"
      >
        <div className="modal-body ticket-detail">
          {/* Customer Contact Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '16px 18px',
              marginBottom: '6px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <User size={13} /> Customer Details
                </div>
                <h3 style={{ margin: '4px 0 2px', fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                  {selected?.user?.name || 'Customer'}
                </h3>
                {selected?.user?.email && (
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    {selected.user.email}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                {modalPhone ? (
                  <a
                    href={`tel:${modalPhone}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#059669',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '12px',
                      padding: '7px 14px',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      boxShadow: '0 2px 4px rgba(5,150,105,0.2)'
                    }}
                    title="Direct call customer"
                  >
                    <Phone size={13} /> Call {modalPhone}
                  </a>
                ) : (
                  <span style={{ fontSize: '12px', color: '#94a3b8', background: '#ffffff', border: '1px solid #e2e8f0', padding: '6px 10px', borderRadius: '6px', fontStyle: 'italic' }}>
                    No phone registered
                  </span>
                )}

                {selected?.user?.email && (
                  <a
                    href={`mailto:${selected.user.email}?subject=Re: Support Ticket ${selected.ticketNumber} - ${encodeURIComponent(selected.subject || '')}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#ffffff',
                      color: '#1e293b',
                      border: '1px solid #cbd5e1',
                      fontWeight: 700,
                      fontSize: '12px',
                      padding: '7px 12px',
                      borderRadius: '8px',
                      textDecoration: 'none'
                    }}
                    title="Send email to customer"
                  >
                    <Mail size={13} /> Email
                  </a>
                )}
              </div>
            </div>

            {(selected?.orderNumber || selected?.orderId) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #e2e8f0', fontSize: '12.5px' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Linked Order:</span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 700,
                    color: '#2563eb',
                    background: '#eff6ff',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    border: '1px solid #bfdbfe'
                  }}
                >
                  <Package size={12} /> #{selected.orderNumber || selected.orderId}
                </span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
            <StatusBadge status={label(status)} />
            <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>
              Issue: {selected?.issueType}
            </span>
          </div>

          <h3 style={{ margin: '8px 0 0', fontSize: '16px', color: 'var(--ink)' }}>{selected?.subject}</h3>

          <div className="message-box">
            <small>CUSTOMER MESSAGE</small>
            <p style={{ whiteSpace: 'pre-wrap', margin: '4px 0 0', lineHeight: 1.6 }}>{selected?.description}</p>
          </div>

          {selected?.messages?.length > 0 && (
            <>
              <h4>Conversation History</h4>
              {selected.messages.map(message => (
                <div className="message-box" key={message.id}>
                  <small>
                    {message.isAdmin ? 'SUPPORT AGENT' : 'CUSTOMER'} · {date(message.createdAt)}
                  </small>
                  <p style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap' }}>{message.message}</p>
                </div>
              ))}
            </>
          )}

          <h4>Timeline</h4>
          <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0, lineHeight: 1.6 }}>
            ● Ticket created · {selected && date(selected.createdAt)}
            <br />
            ● Last updated · {selected && date(selected.updatedAt)}
          </p>

          <label>
            Admin response
            <textarea
              value={response}
              onChange={e => setResponse(e.target.value)}
              placeholder="Write a clear, helpful response to the customer…"
              rows={3}
            />
          </label>

          <label>
            Status
            <select value={status} onChange={e => setStatus(e.target.value)}>
              <option value="OPEN">Open</option>
              <option value="PENDING">Pending</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </label>

          <Button disabled={saving} onClick={reply}>
            {saving ? 'Saving…' : 'Send response & update status'}
          </Button>
        </div>
      </Modal>
    </>
  );
}
