import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Sparkles, X, CheckCircle, Globe } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { BRAND } from '../../config/brand';

export default function LaunchNoticeModal() {
  const [open, setOpen] = useState(false);
  const { lang, toggleLang } = useLanguage();

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem('r2cart_launch_notice_dismissed_v1');
      if (!dismissed) {
        // Show after a subtle 1-second delay so the page loads smoothly first
        const timer = setTimeout(() => setOpen(true), 900);
        return () => clearTimeout(timer);
      }
    } catch {
      setOpen(true);
    }
  }, []);

  const handleDismiss = () => {
    setOpen(false);
    try {
      localStorage.setItem('r2cart_launch_notice_dismissed_v1', 'true');
    } catch {}
  };

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
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
          maxWidth: '540px',
          width: '100%',
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.2)',
          position: 'relative',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Top Header Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #10b981 100%)',
            padding: '24px 24px 20px',
            color: '#ffffff',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Decorative glow circles */}
          <div
            style={{
              position: 'absolute',
              top: '-30px',
              right: '-30px',
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.12)',
              pointerEvents: 'none'
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                padding: '4px 12px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.4px',
                textTransform: 'uppercase'
              }}
            >
              <Sparkles size={14} color="#fef08a" />
              Grand Launch Notice · महत्वपूर्ण सूचना
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={toggleLang}
                title="Switch Language / भाषा बदलें"
                style={{
                  background: 'rgba(255, 255, 255, 0.22)',
                  border: '1px solid rgba(255, 255, 255, 0.35)',
                  color: '#ffffff',
                  borderRadius: '20px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'background 0.2s'
                }}
              >
                <Globe size={12} />
                {lang === 'hi' ? 'EN' : 'हिंदी'}
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                aria-label="Close popup"
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
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
                <X size={18} />
              </button>
            </div>
          </div>

          <h2
            id="launch-notice-title"
            style={{
              margin: '0 0 6px',
              fontSize: '22px',
              fontWeight: 800,
              lineHeight: 1.25,
              letterSpacing: '-0.3px',
              color: '#ffffff'
            }}
          >
            🚀 10 नवम्बर 2026 से डिलीवरी शुरू!
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: '#d1fae5', fontWeight: 500 }}>
            Official Delivery Operations Launch: <b>10th November 2026</b>
          </p>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px 24px' }}>
          {/* Key Date & Location Highlights */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px',
              marginBottom: '18px'
            }}
          >
            <div
              style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '12px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  background: '#dcfce7',
                  color: '#15803d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Calendar size={18} />
              </div>
              <div>
                <small style={{ color: '#166534', fontSize: '11px', display: 'block', fontWeight: 600 }}>लॉन्च तिथि / Date</small>
                <strong style={{ color: '#14532d', fontSize: '13px', fontWeight: 800 }}>10 Nov 2026</strong>
              </div>
            </div>

            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  background: '#e2e8f0',
                  color: '#334155',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <MapPin size={18} />
              </div>
              <div>
                <small style={{ color: '#475569', fontSize: '11px', display: 'block', fontWeight: 600 }}>डिलीवरी क्षेत्र / Area</small>
                <strong style={{ color: '#0f172a', fontSize: '13px', fontWeight: 800 }}>हथुआ व गोपालगंज</strong>
              </div>
            </div>
          </div>

          {/* Bilingual Explanatory Content */}
          <div
            style={{
              background: '#fefce8',
              border: '1px solid #fef08a',
              borderRadius: '14px',
              padding: '14px 16px',
              marginBottom: '16px'
            }}
          >
            <p
              style={{
                margin: '0 0 10px',
                fontSize: '13.5px',
                lineHeight: 1.55,
                color: '#854d0e',
                fontWeight: 600
              }}
            >
              🇮🇳 <b>नमस्ते ग्राहक बंधु!</b>
              <br />
              <span style={{ color: '#713f12', fontWeight: 500 }}>
                {BRAND.name} पर आपका स्वागत है। हमारी 10-मिनट सुपरफास्ट डिलीवरी सेवा <b>10 नवम्बर 2026</b> से शुरू होगी।
                अभी आप हमारे सभी प्रोडक्ट्स, फल-सब्जियां, किराना और विशेष डिस्काउंट कीमतें देख सकते हैं। कृपया डिलीवरी शुरू होने तक भ्रमित (confuse) न हों — 10 नवम्बर से सभी ऑर्डर्स आपके घर तक पहुंचाए जाएंगे।
              </span>
            </p>

            <div style={{ height: '1px', background: '#fef08a', margin: '10px 0' }} />

            <p
              style={{
                margin: 0,
                fontSize: '12.5px',
                lineHeight: 1.5,
                color: '#78350f'
              }}
            >
              🇬🇧 <b>Notice for Visitors:</b>
              <br />
              <span>
                Grocery delivery operations will officially begin on <b>10th November 2026</b>. You can explore all our fresh categories and prices right now so you can shop effortlessly once orders go live!
              </span>
            </p>
          </div>

          {/* Key Checklist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#334155' }}>
              <CheckCircle size={16} color="#10b981" />
              <span><b>20+ श्रेणियां उपलब्ध हैं:</b> किराना, फल, सब्जियां, स्नैक्स, डेयरी और ज्वेलरी।</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#334155' }}>
              <Clock size={16} color="#10b981" />
              <span><b>10 नवम्बर से सुपरफास्ट डिलीवरी:</b> ऑर्डर करने के 10-15 मिनट में आपके द्वार।</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={handleDismiss}
              style={{
                flex: 1,
                padding: '13px 20px',
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease'
              }}
            >
              समझ गए · स्टोर व प्रोडक्ट्स देखें / Browse Products
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
