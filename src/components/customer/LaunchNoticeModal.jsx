import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Clock, MapPin, Sparkles, X, CheckCircle, ArrowRight, AlertTriangle } from 'lucide-react';
import { BRAND } from '../../config/brand';

export default function LaunchNoticeModal({ open: controlledOpen, onDismiss }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  useEffect(() => {
    if (isControlled) return;
    try {
      const dismissed = localStorage.getItem('r2cart_launch_notice_dismissed_v4');
      if (!dismissed) {
        const timer = setTimeout(() => setInternalOpen(true), 500);
        return () => clearTimeout(timer);
      }
    } catch {
      setInternalOpen(true);
    }
  }, [isControlled]);

  useEffect(() => {
    if (!open) return;
    setTimeLeft(5);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [open]);

  const handleDismiss = useCallback(() => {
    if (timeLeft > 0) return;
    if (!isControlled) {
      setInternalOpen(false);
    }
    try {
      localStorage.setItem('r2cart_launch_notice_dismissed_v4', 'true');
    } catch {}
    onDismiss?.();
  }, [timeLeft, isControlled, onDismiss]);

  useEffect(() => {
    if (!open) return;
    document.body.classList.add('modal-open');
    const onKey = (e) => {
      if (e.key === 'Escape' && timeLeft === 0) {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('modal-open');
      window.removeEventListener('keydown', onKey);
    };
  }, [open, timeLeft, handleDismiss]);

  if (!open) return null;

  return createPortal(
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: 'rgba(5, 20, 14, 0.85)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px',
        animation: 'fadeIn 0.25s ease-out'
      }}
      onClick={handleDismiss}
    >
      <div
        className="launch-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="launch-notice-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          maxWidth: '560px',
          width: '100%',
          maxHeight: '94vh',
          overflowY: 'auto',
          boxShadow: '0 30px 80px -15px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.25)',
          position: 'relative',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          scrollbarWidth: 'thin'
        }}
      >
        {/* Luxury Emerald Hero Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #022c22 0%, #064e3b 50%, #059669 100%)',
            padding: '24px 22px 20px',
            color: '#ffffff',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Subtle decorative circles */}
          <div
            style={{
              position: 'absolute',
              top: '-40px',
              right: '-40px',
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(16, 185, 129, 0.35) 0%, transparent 70%)',
              pointerEvents: 'none'
            }}
          />

          {/* Top Bar: Kicker + Skip Countdown / Close */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.16)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                padding: '4px 12px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.6px',
                textTransform: 'uppercase',
                color: '#fef08a'
              }}
            >
              <Sparkles size={13} color="#fef08a" />
              OFFICIAL NOTICE · R2CART HATHUA
            </span>

            {/* Timer Badge / Close Button */}
            {timeLeft > 0 ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#fef08a',
                  padding: '3px 10px',
                  borderRadius: '16px',
                  fontSize: '11.5px',
                  fontWeight: 800
                }}
              >
                <span>Skip in {timeLeft}s</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleDismiss}
                aria-label="Close notice"
                style={{
                  background: 'rgba(255, 255, 255, 0.25)',
                  border: 'none',
                  color: '#ffffff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                <X size={17} />
              </button>
            )}
          </div>

          <h2
            id="launch-notice-title"
            style={{
              margin: '0 0 4px',
              fontSize: '22px',
              fontWeight: 800,
              lineHeight: 1.3,
              letterSpacing: '-0.3px',
              color: '#ffffff',
              fontFamily: "'Manrope', 'Noto Sans Devanagari', sans-serif"
            }}
          >
            🚀 10 नवम्बर से 10-मिनट डिलीवरी शुरू!
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: '#a7f3d0', fontWeight: 600, lineHeight: 1.4 }}>
            10-Minute Grocery Delivery Starts 10th Nov in Hathua
          </p>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '18px 20px 22px' }}>
          {/* Key Timeline Badges (1 Nov & 10 Nov & Hathua) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              marginBottom: '16px'
            }}
          >
            {/* 1 Nov: Real Prices Live */}
            <div
              style={{
                background: '#fffbeb',
                border: '1.5px solid #fef3c7',
                borderRadius: '12px',
                padding: '10px 8px',
                textAlign: 'center'
              }}
            >
              <div style={{ color: '#d97706', fontSize: '11px', fontWeight: 800, marginBottom: '2px' }}>
                📅 1 NOV 2026
              </div>
              <strong style={{ color: '#92400e', fontSize: '12px', display: 'block', fontWeight: 800, lineHeight: 1.25 }}>
                असली कीमतें लाइव
              </strong>
              <small style={{ color: '#b45309', fontSize: '10px', display: 'block', marginTop: '2px' }}>
                Real Prices Live
              </small>
            </div>

            {/* 10 Nov: 10-Min Delivery */}
            <div
              style={{
                background: '#f0fdf4',
                border: '1.5px solid #bbf7d0',
                borderRadius: '12px',
                padding: '10px 8px',
                textAlign: 'center'
              }}
            >
              <div style={{ color: '#059669', fontSize: '11px', fontWeight: 800, marginBottom: '2px' }}>
                🚀 10 NOV 2026
              </div>
              <strong style={{ color: '#14532d', fontSize: '12px', display: 'block', fontWeight: 800, lineHeight: 1.25 }}>
                10-मिनट डिलीवरी
              </strong>
              <small style={{ color: '#15803d', fontSize: '10px', display: 'block', marginTop: '2px' }}>
                Delivery Starts
              </small>
            </div>

            {/* Area: Hathua Only */}
            <div
              style={{
                background: '#f8fafc',
                border: '1.5px solid #e2e8f0',
                borderRadius: '12px',
                padding: '10px 8px',
                textAlign: 'center'
              }}
            >
              <div style={{ color: '#475569', fontSize: '11px', fontWeight: 800, marginBottom: '2px' }}>
                📍 केवल हथुआ
              </div>
              <strong style={{ color: '#0f172a', fontSize: '12px', display: 'block', fontWeight: 800, lineHeight: 1.25 }}>
                Hathua Zone
              </strong>
              <small style={{ color: '#64748b', fontSize: '10px', display: 'block', marginTop: '2px' }}>
                Exclusive Launch
              </small>
            </div>
          </div>

          {/* Bilingual Dual Notice Callout Card */}
          <div
            style={{
              background: '#fffdf5',
              border: '1.5px solid #fde68a',
              borderRadius: '16px',
              padding: '16px 18px',
              marginBottom: '16px',
              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.08)'
            }}
          >
            {/* Hindi Notice */}
            <div style={{ marginBottom: '14px', borderBottom: '1px dashed #fcd34d', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <span style={{ fontSize: '15px' }}>🇮🇳</span>
                <strong style={{ fontSize: '13px', color: '#92400e', fontWeight: 800 }}>
                  ज़रूरी सूचना (हिंदी में):
                </strong>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: '12.5px',
                  lineHeight: 1.6,
                  color: '#78350f',
                  fontFamily: "'Noto Sans Devanagari', sans-serif"
                }}
              >
                <b>नमस्ते ग्राहक बंधु!</b> {BRAND.name} पर आपका स्वागत है। अभी वेबसाइट पर दिख रहे सभी प्रोडक्ट्स और कीमतें केवल <b>टेस्टिंग और डेमो</b> के लिए हैं — <b>ये असली कीमतें नहीं हैं</b>।
                <br />
                👉 <b>1 नवम्बर 2026</b> से स्टोर के सभी प्रोडक्ट्स की वास्तविक व सही कीमतें लाइव दिखेंगी।
                <br />
                👉 <b>10 नवम्बर 2026</b> से हथुआ में 10-मिनट सुपरफास्ट डोरस्टेप डिलीवरी सेवा शुरू होगी।
              </p>
            </div>

            {/* English Notice */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <span style={{ fontSize: '15px' }}>🇬🇧</span>
                <strong style={{ fontSize: '12.5px', color: '#92400e', fontWeight: 800 }}>
                  Important Notice (in English):
                </strong>
              </div>
              <p style={{ margin: 0, fontSize: '12px', lineHeight: 1.55, color: '#78350f' }}>
                <b>Welcome to {BRAND.name}!</b> All products and prices currently displayed on the website are for <b>demonstration and testing purposes only</b> — these are not real final prices.
                <br />
                👉 <b>1st November 2026:</b> Real, accurate store prices & fresh inventory will be live.
                <br />
                👉 <b>10th November 2026:</b> Official 10-minute doorstep grocery delivery starts across Hathua.
              </p>
            </div>
          </div>

          {/* Quick Points */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#334155' }}>
              <CheckCircle size={15} color="#10b981" style={{ flexShrink: 0 }} />
              <span>
                <b>20+ श्रेणियां / Categories:</b> सब्जियां, फल, किराना, स्नैक्स, डेयरी, आटा, दाल व तेल।
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#334155' }}>
              <Clock size={15} color="#10b981" style={{ flexShrink: 0 }} />
              <span>
                <b>10-मिनट डिलीवरी / Fast Delivery:</b> 10 नवम्बर से सीधे आपके घर तक 10-15 मिनट में।
              </span>
            </div>
          </div>

          {/* Action / Skip Button with 5s countdown */}
          <button
            type="button"
            disabled={timeLeft > 0}
            onClick={handleDismiss}
            style={{
              width: '100%',
              padding: '13px 20px',
              background: timeLeft > 0 ? '#94a3b8' : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '14px',
              fontSize: '13.5px',
              fontWeight: 800,
              cursor: timeLeft > 0 ? 'not-allowed' : 'pointer',
              boxShadow: timeLeft > 0 ? 'none' : '0 6px 18px rgba(16, 185, 129, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.25s ease',
              fontFamily: "'Manrope', 'Noto Sans Devanagari', sans-serif"
            }}
          >
            {timeLeft > 0 ? (
              <span>⏳ कृपया सूचना पढ़ें · {timeLeft}s में स्किप करें (Skip in {timeLeft}s)</span>
            ) : (
              <>
                <span>समझ गए · स्टोर देखें (Got It · Enter Store)</span>
                <ArrowRight size={16} strokeWidth={2.4} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
