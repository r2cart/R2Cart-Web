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
            <img
              src={brandMark}
              alt="R2Cart App"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
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
        marginTop: '20px',
        padding: '16px 18px',
        borderRadius: '16px',
        background: 'linear-gradient(145deg, rgba(20, 36, 28, 0.85) 0%, rgba(12, 22, 17, 0.95) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
        maxWidth: '350px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.2s ease'
      }}
    >
      {/* Top Header: App Identity & Rating */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            backgroundColor: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            padding: '5px',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.15)'
          }}
        >
          <img
            src={brandMark}
            alt="R2Cart App"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.2px' }}>
              R2Cart App
            </span>
            <span
              style={{
                fontSize: '9.5px',
                fontWeight: 800,
                color: '#34D399',
                background: 'rgba(16, 185, 129, 0.16)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '1px 6px',
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px'
              }}
            >
              ★ 4.9 · FREE
            </span>
          </div>
          <p
            style={{
              margin: '3px 0 0',
              fontSize: '11px',
              color: '#94A3B8',
              lineHeight: 1.35
            }}
          >
            Live tracking, 10-min fast delivery & special app discounts
          </p>
        </div>
      </div>

      {/* Official Google Play Store Badge Button */}
      <a
        href={PLAY_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          backgroundColor: '#000000',
          color: '#FFFFFF',
          padding: '9px 18px',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.22)',
          textDecoration: 'none',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'pointer',
          width: '100%'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = '#10B981';
          e.currentTarget.style.background = '#090D12';
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.28)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.22)';
          e.currentTarget.style.background = '#000000';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.4)';
        }}
      >
        {/* Authentic 4-color Google Play Triangle Vector */}
        <svg
          viewBox="0 0 512 512"
          width="23"
          height="23"
          style={{ flexShrink: 0 }}
          aria-hidden="true"
        >
          <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1z" fill="#EA4335" />
          <path d="M47 0C44 3.2 42.3 7.8 42.3 13v486c0 5.2 1.7 9.8 4.7 13l246.7-246.7L47 0z" fill="#4285F4" />
          <path d="M385.4 337.8L104.6 499l220.7-221.3 60.1 60.1z" fill="#34A853" />
          <path d="M469.7 236.4l-84.3-48.5-50.1 50.1 50.1 50.1 84.3-48.5c15.8-9.1 15.8-24.1 0-33.2z" fill="#FBBC04" />
        </svg>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.15 }}>
          <span
            style={{
              fontSize: '8.5px',
              fontWeight: 600,
              color: '#9CA3AF',
              letterSpacing: '0.8px',
              textTransform: 'uppercase'
            }}
          >
            GET IT ON
          </span>
          <span
            style={{
              fontSize: '14.5px',
              fontWeight: 700,
              color: '#FFFFFF',
              letterSpacing: '-0.2px',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
          >
            Google Play
          </span>
        </div>
      </a>
    </div>
  );
}
