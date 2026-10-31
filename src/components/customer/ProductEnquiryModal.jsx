import React, { useState, useEffect } from 'react';
import { X, Send, PhoneCall, CheckCircle2, MessageSquare, MessageCircle } from 'lucide-react';
import { catalogService } from '../../services/catalog.service';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui';

export default function ProductEnquiryModal({ product, isOpen, onClose }) {
  const { user, notify } = useApp();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.name) setName(user.name);
      if (user.mobile) setPhone(user.mobile);
      if (user.email) setEmail(user.email);
    }
  }, [user]);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      notify('Please enter your name', 'error');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      notify('Please enter a valid 10-digit mobile number', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await catalogService.submitProductEnquiry(product.id, {
        name: name.trim(),
        phone: cleanPhone,
        email: email.trim() || undefined,
        message: message.trim() || undefined
      });
      setSuccess(true);
      notify('Inquiry submitted successfully! Our artisan will contact you shortly.', 'success');
    } catch (err) {
      notify(err.message || 'Failed to submit inquiry', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setMessage('');
    onClose();
  };

  const cleanPhone = phone.replace(/\D/g, '');
  const productImg = product.images?.[0]?.url || product.image || 'https://placehold.co/100?text=Product';

  return (
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
        maxWidth: '480px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        padding: '22px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📞</span> Request Customization & Quote
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: '#64748b' }}>
              Direct inquiry to artisan & store manager
            </p>
          </div>
          <button
            onClick={handleClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Product Preview Card */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <img
            src={productImg}
            alt={product.name}
            style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #cbd5e1' }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <b style={{ display: 'block', fontSize: '13.5px', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {product.name}
            </b>
            <span style={{ fontSize: '12px', color: '#059669', fontWeight: 700 }}>
              ₹{Number(product.price || 0).toFixed(2)}
            </span>
          </div>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '24px 10px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <CheckCircle2 size={32} />
            </div>
            <h4 style={{ margin: '0 0 6px', fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
              Inquiry Submitted!
            </h4>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
              Thank you, <b>{name}</b>! Our team will contact you at <b>{phone}</b> shortly to discuss your custom requirements, colors, and quotation.
            </p>
            <Button onClick={handleClose} style={{ width: '100%', padding: '10px' }}>
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                Your Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Priya Sharma"
                value={name}
                onChange={e => setName(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                WhatsApp / Mobile Number <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="tel"
                required
                maxLength={13}
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                Email Address (Optional)
              </label>
              <input
                type="email"
                placeholder="e.g. priya@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                Your Customization Requirements / Questions
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Need couple names (Rahul & Sneha) with 14-inch ocean waves, or specific flower colors..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>

            <Button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                padding: '11px',
                borderRadius: '8px',
                background: '#ea580c',
                color: '#fff',
                fontWeight: 700,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '4px'
              }}
            >
              <Send size={15} />
              {submitting ? 'Submitting Request...' : 'Send Custom Inquiry'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

