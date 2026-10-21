import { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  MessageSquare,
  Truck,
  User,
  Phone,
  Check,
  CheckCheck,
  RefreshCw,
  Clock,
  Sparkles
} from 'lucide-react';
import { orderService } from '../services/order.service';
import { deliveryService } from '../services/delivery.service';

const CUSTOMER_QUICK_CHIPS = [
  'Where are you currently?',
  'Please call when you reach.',
  'Leave package at the door / gate.',
  'Cash is ready.',
  'Near main road / landmark.'
];

const RIDER_QUICK_CHIPS = [
  'On the way, reaching in 5 mins.',
  'I have reached your gate / location.',
  'Please keep cash ready for COD.',
  'Please pick up my call.',
  'Delivering your order now.'
];

export function DeliveryChatModal({
  order,
  isOpen,
  onClose,
  role = 'CUSTOMER' // 'CUSTOMER' | 'DELIVERY_PERSON'
}) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [partnerInfo, setPartnerInfo] = useState(null);

  const messagesEndRef = useRef(null);
  const pollTimerRef = useRef(null);

  const orderId = order?.id || order?.orderId || order?.orderNumber;
  const isCustomer = role === 'CUSTOMER';
  const quickChips = isCustomer ? CUSTOMER_QUICK_CHIPS : RIDER_QUICK_CHIPS;

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  const loadChat = async (isSilent = false) => {
    if (!orderId) return;
    if (!isSilent) setLoading(true);
    setError(null);
    try {
      let res;
      if (isCustomer) {
        res = await orderService.getDeliveryChat(orderId);
      } else {
        res = await deliveryService.getDeliveryChat(orderId);
      }

      const data = res?.data || res;
      if (data) {
        const msgs = Array.isArray(data.messages) ? data.messages : (Array.isArray(data) ? data : []);
        setMessages(msgs);
        if (isCustomer) {
          setPartnerInfo(data.deliveryPerson || data.rider || null);
        } else {
          setPartnerInfo(data.customer || null);
        }
      }
    } catch (err) {
      console.error('Failed to load delivery chat:', err);
      if (!isSilent) {
        setError(err?.response?.data?.message || err?.message || 'Failed to load chat');
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  // Initial load when modal opens
  useEffect(() => {
    if (isOpen && orderId) {
      loadChat(false);

      // Start live polling every 3.5 seconds
      pollTimerRef.current = setInterval(() => {
        loadChat(true);
      }, 3500);

      return () => {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      };
    } else {
      setMessages([]);
      setInputMessage('');
      setPartnerInfo(null);
      setError(null);
    }
  }, [isOpen, orderId]);

  // Scroll to bottom whenever messages update
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length]);

  const handleSend = async (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || sending || !orderId) return;

    setSending(true);
    setInputMessage('');
    try {
      let res;
      if (isCustomer) {
        res = await orderService.sendDeliveryChatMessage(orderId, text);
      } else {
        res = await deliveryService.sendDeliveryChatMessage(orderId, text);
      }

      const data = res?.data || res;
      const newMsg = data?.data || data;
      if (newMsg && (newMsg.id || newMsg.message)) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        setTimeout(() => scrollToBottom(), 50);
      } else {
        // Fallback: reload chat
        await loadChat(true);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setError(err?.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  // Resolve partner display info
  const partnerName = isCustomer
    ? (partnerInfo?.name || order?.deliveryPerson?.name || 'Delivery Partner')
    : (partnerInfo?.name || order?.customerName || order?.customer || 'Customer');

  const partnerPhone = isCustomer
    ? (partnerInfo?.mobile || order?.deliveryPerson?.mobile)
    : (partnerInfo?.mobile || order?.customerPhone);

  const vehicleInfo = isCustomer
    ? [partnerInfo?.vehicleType || order?.deliveryPerson?.vehicleType, partnerInfo?.vehicleNumber || order?.deliveryPerson?.vehicleNumber]
        .filter(Boolean)
        .join(' · ')
    : null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '520px',
          height: '620px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
          animation: 'chatModalPop 0.2s ease-out'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            background: isCustomer
              ? 'linear-gradient(135deg, #065f46 0%, #047857 100%)'
              : 'linear-gradient(135deg, #0369a1 0%, #0284c7 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
                position: 'relative'
              }}
            >
              {isCustomer ? <Truck size={22} color="#ffffff" /> : <User size={22} color="#ffffff" />}
              {/* Online Indicator */}
              <span
                style={{
                  position: 'absolute',
                  bottom: '1px',
                  right: '1px',
                  width: '11px',
                  height: '11px',
                  borderRadius: '50%',
                  background: '#22c55e',
                  border: '2px solid #ffffff'
                }}
              />
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '15px',
                    fontWeight: 800,
                    color: '#ffffff',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {partnerName}
                </h3>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    background: 'rgba(255, 255, 255, 0.22)',
                    padding: '2px 7px',
                    borderRadius: '10px',
                    letterSpacing: '0.4px',
                    textTransform: 'uppercase'
                  }}
                >
                  {isCustomer ? 'Rider' : 'Customer'}
                </span>
              </div>

              <div
                style={{
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.85)',
                  marginTop: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>Order #{order?.orderNumber || orderId}</span>
                {vehicleInfo && (
                  <>
                    <span>•</span>
                    <span>{vehicleInfo}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'grid',
                placeItems: 'center',
                transition: 'background 0.2s ease'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Live Delivery Status Subheader */}
        <div
          style={{
            background: isCustomer ? '#f0fdf4' : '#f0f9ff',
            borderBottom: isCustomer ? '1px solid #bbf7d0' : '1px solid #bae6fd',
            padding: '8px 16px',
            fontSize: '11.5px',
            color: isCustomer ? '#166534' : '#0369a1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#16a34a',
                boxShadow: '0 0 0 2px rgba(34, 197, 94, 0.25)'
              }}
            />
            <span style={{ fontWeight: 600 }}>
              {isCustomer
                ? 'Live Delivery Assistant · Rider receives notifications instantly'
                : 'Live Customer Chat · Send updates regarding arrival & location'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => loadChat(true)}
            title="Refresh messages"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: isCustomer ? '#166534' : '#0369a1',
              display: 'flex',
              alignItems: 'center',
              padding: '2px'
            }}
          >
            <RefreshCw size={13} />
          </button>
        </div>

        {/* Messages Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            background: '#f8fafc'
          }}
        >
          {loading && messages.length === 0 ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                color: '#64748b'
              }}
            >
              <RefreshCw size={24} className="spin-slow" />
              <span style={{ fontSize: '13px' }}>Connecting to delivery chat...</span>
            </div>
          ) : messages.length === 0 ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '24px',
                color: '#64748b'
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: '#ecfdf5',
                  display: 'grid',
                  placeItems: 'center',
                  marginBottom: '12px',
                  color: '#059669'
                }}
              >
                <MessageSquare size={28} />
              </div>
              <h4 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>
                Start Conversation
              </h4>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b', maxWidth: '300px', lineHeight: 1.5 }}>
                {isCustomer
                  ? 'Coordinate with your rider on arrival timing, gate entry, or directions.'
                  : 'Send delivery updates, request landmark assistance, or notify customer upon arrival.'}
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isMine =
                (isCustomer && m.senderRole === 'CUSTOMER') ||
                (!isCustomer && m.senderRole === 'DELIVERY_PERSON');

              const timeStr = m.createdAt
                ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';

              return (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMine ? 'flex-end' : 'flex-start',
                    maxWidth: '82%',
                    alignSelf: isMine ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#94a3b8',
                      marginBottom: '3px',
                      padding: '0 4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>{isMine ? 'You' : m.senderName || partnerName}</span>
                    <span>•</span>
                    <span>{timeStr}</span>
                  </div>

                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: isMine
                        ? isCustomer
                          ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                          : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
                        : '#ffffff',
                      color: isMine ? '#ffffff' : '#1e293b',
                      fontSize: '13.5px',
                      lineHeight: 1.45,
                      boxShadow: isMine
                        ? '0 2px 8px rgba(0, 0, 0, 0.12)'
                        : '0 1px 3px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)',
                      wordBreak: 'break-word'
                    }}
                  >
                    {m.message}
                  </div>

                  {isMine && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        fontSize: '10.5px',
                        color: m.isRead ? '#059669' : '#94a3b8',
                        marginTop: '2px',
                        paddingRight: '4px'
                      }}
                    >
                      {m.isRead ? (
                        <>
                          <CheckCheck size={13} color="#059669" />
                          <span>Seen</span>
                        </>
                      ) : (
                        <>
                          <Check size={13} />
                          <span>Sent</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Error banner if send failed */}
        {error && (
          <div
            style={{
              padding: '6px 14px',
              background: '#fef2f2',
              borderTop: '1px solid #fee2e2',
              fontSize: '11.5px',
              color: '#b91c1c'
            }}
          >
            {error}
          </div>
        )}

        {/* Quick Chips Bar */}
        <div
          style={{
            padding: '8px 12px',
            background: '#ffffff',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            scrollbarWidth: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b', fontSize: '11px', flexShrink: 0, fontWeight: 700 }}>
            <Sparkles size={12} color="#059669" /> Quick:
          </div>
          {quickChips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              disabled={sending}
              onClick={() => handleSend(chip)}
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '4px 10px',
                fontSize: '11.5px',
                color: '#334155',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isCustomer ? '#ecfdf5' : '#f0f9ff';
                e.currentTarget.style.borderColor = isCustomer ? '#a7f3d0' : '#bae6fd';
                e.currentTarget.style.color = isCustomer ? '#059669' : '#0284c7';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.color = '#334155';
              }}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div
          style={{
            padding: '12px 16px',
            background: '#ffffff',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isCustomer
                ? `Message ${partnerName}...`
                : `Message ${partnerName}...`
            }
            maxLength={1000}
            style={{
              flex: 1,
              padding: '10px 14px',
              fontSize: '13.5px',
              borderRadius: '12px',
              border: '1.5px solid #cbd5e1',
              outline: 'none',
              transition: 'border-color 0.2s ease',
              fontFamily: 'inherit'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = isCustomer ? '#059669' : '#0284c7';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#cbd5e1';
            }}
          />

          <button
            type="button"
            disabled={!inputMessage.trim() || sending}
            onClick={() => handleSend()}
            style={{
              height: '42px',
              padding: '0 16px',
              borderRadius: '12px',
              background: isCustomer
                ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              border: 'none',
              cursor: !inputMessage.trim() || sending ? 'not-allowed' : 'pointer',
              opacity: !inputMessage.trim() || sending ? 0.6 : 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 700,
              boxShadow: !inputMessage.trim() || sending ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.15)',
              transition: 'all 0.15s ease',
              flexShrink: 0
            }}
          >
            {sending ? (
              <RefreshCw size={15} className="spin-slow" />
            ) : (
              <>
                <span>Send</span>
                <Send size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
