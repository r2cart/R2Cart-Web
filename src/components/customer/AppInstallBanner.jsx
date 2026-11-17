import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Star, ShieldCheck } from 'lucide-react';
import brandMark from '../../assets/r2cart-mark.svg';

export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.r2cart';

export function AppInstallTopBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if dismissed recently (e.g. within 24 hours)
    try {
      const dismissedUntil = localStorage.getItem('r2cart_app_banner_dismissed_until');
      if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
        return;
      }
    } catch {}

    // Show after slight delay for smooth page entrance
    const timer = setTimeout(() => {
      setVisible(true);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    try {
      // Dismiss for 24 hours
      const nextTime = Date.now() + 24 * 60 * 60 * 1000;
      localStorage.setItem('r2cart_app_banner_dismissed_until', String(nextTime));
    } catch {}
  };

  const handleInstallClick = () => {
    window.open(PLAY_STORE_URL, '_blank', 'noopener,noreferrer');
  };

  if (!visible) return null;

  return (
    <aside
      role="banner"
      aria-label="Install R2Cart App"
      style={{
        position: 'sticky',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        background: 'linear-gradient(90deg, #064E3B 0%, #065F46 45%, #047857 100%)',
        color: '#FFFFFF',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.18)',
        borderBottom: '1px solid rgba(167, 243, 208, 0.25)',
        animation: 'slideDown 0.35s ease-out'
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          gap: '12px'
        }}
      >
        {/* Left: App Logo & Rating Details */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              flexShrink: 0,
              padding: '4px'
            }}
          >
            <img src={brandMark} alt="R2Cart App" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <strong style={{ fontSize: '13.5px', fontWeight: 800, letterSpacing: '-0.2px', color: '#FFFFFF' }}>
                R2Cart App
              </strong>
              <span
                style={{
                  background: 'rgba(167, 243, 208, 0.22)',
                  color: '#A7F3D0',
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '12px',
                  border: '1px solid rgba(167, 243, 208, 0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
              >
                <Star size={9} fill="#FCD34D" color="#FCD34D" /> 4.9 · FREE
              </span>
            </div>
            <p
              style={{
                margin: '2px 0 0',
                fontSize: '11.5px',
                color: '#D1FAE5',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              10–15 Min Fast Delivery & Exclusive Discounts on Android App!
            </p>
          </div>
        </div>

        {/* Right: Install Action & Dismiss */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <button
            type="button"
            onClick={handleInstallClick}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#FFFFFF',
              color: '#065F46',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#ECFDF5';
              e.currentTarget.style.transform = 'scale(1.03)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#FFFFFF';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <Download size={13} strokeWidth={2.5} />
            <span>Install App</span>
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.75)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%'
            }}
            aria-label="Close install banner"
            title="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}

export function AppInstallFooterCard() {
  const handleInstallClick = () => {
    window.open(PLAY_STORE_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      style={{
        marginTop: '18px',
        padding: '14px 16px',
        borderRadius: '16px',
        backgroundColor: '#132A20',
        border: '1px solid rgba(16, 185, 129, 0.35)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        maxWidth: '360px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            backgroundColor: '#059669',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(5, 150, 105, 0.4)'
          }}
        >
          <Smartphone size={22} color="#FFFFFF" />
        </div>
        <div>
          <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.2px' }}>
            Get R2Cart Android App
          </div>
          <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px', lineHeight: 1.35 }}>
            Faster checkout, live order tracking & special app offers
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleInstallClick}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
          color: '#FFFFFF',
          border: 'none',
          padding: '10px 16px',
          borderRadius: '10px',
          fontSize: '12.5px',
          fontWeight: 800,
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
          transition: 'all 0.2s ease',
          width: '100%'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = '#047857';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'linear-gradient(135deg, #10B981 0%, #059669 100%)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <Download size={15} strokeWidth={2.5} />
        <span>Download on Google Play</span>
      </button>
    </div>
  );
}
