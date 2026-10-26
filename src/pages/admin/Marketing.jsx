import {useEffect, useState} from 'react';
import {AlertCircle,BarChart3,Calendar,CheckCircle2,Clock,Coins,Copy,Edit2,Eye,Image as ImageIcon,Layers,LoaderCircle,Megaphone,MousePointerClick,PauseCircle,Percent,PlayCircle,Plus,RefreshCcw,Save,Sliders,Sparkles,Tag,Ticket,Trash2} from 'lucide-react';
import {Button,ConfirmDialog,Modal,StatusBadge} from '../../components/ui';
import {useApp} from '../../context/AppContext';
import {adminService} from '../../services/admin.service';

const campaignBlank = {
  name: '',
  type: 'FESTIVAL',
  title: '',
  subtitle: '',
  badge: '',
  content: '',
  imageUrl: '',
  linkUrl: '/coupons',
  ctaText: '',
  metadata: {
    ctaText: '',
    couponCode: ''
  },
  bgColor: '#10b981',
  textColor: '#ffffff',
  startsAt: new Date().toISOString().slice(0, 10),
  expiresAt: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  status: 'ACTIVE'
};

const couponBlank = {
  code: '',
  type: 'PERCENTAGE',
  discount: '',
  minimumOrder: '200',
  maximumDiscount: '100',
  usageLimit: '',
  perUserLimit: '1',
  isFirstOrderOnly: false,
  campaignName: '',
  description: '',
  startsAt: new Date().toISOString().slice(0, 10),
  expiresAt: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  status: 'ACTIVE'
};

let cachedCampaigns = null;
let cachedCoupons = null;
let cachedCouponUsages = null;
let cachedPerfReport = null;
let lastMarketingFetch = 0;

function MarketingSkeleton() {
  return (
    <div>
      <div className="admin-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
        <div>
          <div className="r2c-skeleton-box" style={{ width: 340, height: 32, borderRadius: 8, marginBottom: 10 }} />
          <div className="r2c-skeleton-box" style={{ width: 480, height: 16, borderRadius: 6 }} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div className="r2c-skeleton-box" style={{ width: 100, height: 38, borderRadius: 10 }} />
          <div className="r2c-skeleton-box" style={{ width: 140, height: 38, borderRadius: 10 }} />
        </div>
      </div>

      <div className="tabs admin-tabs" style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[170, 160, 150, 180].map((w, i) => (
          <div key={i} className="r2c-skeleton-box" style={{ width: `${w}px`, height: 42, borderRadius: 10, flexShrink: 0 }} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="admin-card" style={{ padding: 22, borderRadius: 16, border: '1px solid #e2e8f0', background: '#fff' }}>
            <div className="r2c-skeleton-box" style={{ width: '60%', height: 20, borderRadius: 6, marginBottom: 10 }} />
            <div className="r2c-skeleton-box" style={{ width: '85%', height: 14, borderRadius: 4, marginBottom: 20 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="r2c-skeleton-box" style={{ width: 70, height: 26, borderRadius: 14 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <div className="r2c-skeleton-box" style={{ width: 32, height: 32, borderRadius: 8 }} />
                <div className="r2c-skeleton-box" style={{ width: 32, height: 32, borderRadius: 8 }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminMarketing() {
  const { notify, categories = [] } = useApp();
  const [tab, setTab] = useState('campaigns'); // 'campaigns' | 'popups' | 'coupons' | 'reports'
  const [loading, setLoading] = useState(() => !cachedCampaigns);
  const [busy, setBusy] = useState(false);

  // Campaigns state
  const [campaignsList, setCampaignsList] = useState(() => cachedCampaigns || []);
  const [editCampaign, setEditCampaign] = useState(null);
  const [removeCampaign, setRemoveCampaign] = useState(null);

  // Coupons state
  const [couponsList, setCouponsList] = useState(() => cachedCoupons || []);
  const [couponUsages, setCouponUsages] = useState(() => cachedCouponUsages || []);
  const [editCoupon, setEditCoupon] = useState(null);
  const [removeCoupon, setRemoveCoupon] = useState(null);

  // Performance state
  const [perfReport, setPerfReport] = useState(() => cachedPerfReport || null);

  const loadData = async (silent = false) => {
    if (!silent && !cachedCampaigns) setLoading(true);
    try {
      const [cData, coupData, usagesData, pData] = await Promise.all([
        adminService.getCampaigns(),
        adminService.coupons(),
        adminService.getCouponUsages(),
        adminService.getMarketingPerformance()
      ]);
      cachedCampaigns = cData || [];
      cachedCoupons = coupData || [];
      cachedCouponUsages = usagesData?.usages || [];
      cachedPerfReport = pData || null;
      lastMarketingFetch = Date.now();
      setCampaignsList(cachedCampaigns);
      setCouponsList(cachedCoupons);
      setCouponUsages(cachedCouponUsages);
      setPerfReport(cachedPerfReport);
    } catch (err) {
      if (!cachedCampaigns) notify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (cachedCampaigns) {
      setLoading(false);
      if (Date.now() - lastMarketingFetch > 60000) {
        loadData(true);
      }
    } else {
      loadData(false);
    }
  }, []);

  // Campaign Handlers
  const handleSaveCampaign = async e => {
    e.preventDefault();
    setBusy(true);
    try {
      const cta = (editCampaign.ctaText || editCampaign.metadata?.ctaText || '').trim();
      const code = (editCampaign.metadata?.couponCode || '').trim();
      const payload = {
        ...editCampaign,
        content: editCampaign.subtitle || editCampaign.content || editCampaign.title,
        metadata: {
          ...(editCampaign.metadata || {}),
          ctaText: cta || null,
          couponCode: code || null
        },
        startsAt: new Date(editCampaign.startsAt).toISOString(),
        expiresAt: new Date(new Date(editCampaign.expiresAt).setHours(23, 59, 59)).toISOString()
      };

      if (editCampaign.id) {
        await adminService.updateCampaign(editCampaign.id, payload);
        notify('Promotional campaign updated');
      } else {
        await adminService.createCampaign(payload);
        notify('Promotional campaign launched');
      }
      try {
        Object.keys(sessionStorage).forEach(k => {
          if (k.startsWith('r2cart-dismissed-') || k.startsWith('r2cart-dismiss-')) {
            sessionStorage.removeItem(k);
          }
        });
        window.dispatchEvent(new CustomEvent('r2cart:marketing-updated'));
      } catch (_) {}
      setEditCampaign(null);
      await loadData();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleToggleCampaignStatus = async c => {
    try {
      const nextStatus = c.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await adminService.updateCampaignStatus(c.id, nextStatus);
      setCampaignsList(curr => curr.map(item => item.id === c.id ? { ...item, status: nextStatus } : item));
      try {
        Object.keys(sessionStorage).forEach(k => {
          if (k.startsWith('r2cart-dismissed-') || k.startsWith('r2cart-dismiss-')) {
            sessionStorage.removeItem(k);
          }
        });
        window.dispatchEvent(new CustomEvent('r2cart:marketing-updated'));
      } catch (_) {}
      notify(`Campaign ${nextStatus === 'ACTIVE' ? 'activated' : 'paused'}`);
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleDeleteCampaign = async () => {
    if (!removeCampaign) return;
    try {
      await adminService.deleteCampaign(removeCampaign.id);
      setCampaignsList(curr => curr.filter(item => item.id !== removeCampaign.id));
      setRemoveCampaign(null);
      notify('Campaign deleted');
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  // Coupon Handlers
  const handleSaveCoupon = async e => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        ...editCoupon,
        code: editCoupon.code.trim().toUpperCase(),
        discount: Number(editCoupon.discount),
        minimumOrder: Number(editCoupon.minimumOrder),
        maximumDiscount: editCoupon.maximumDiscount ? Number(editCoupon.maximumDiscount) : null,
        usageLimit: editCoupon.usageLimit !== '' && editCoupon.usageLimit !== null && editCoupon.usageLimit !== undefined ? Number(editCoupon.usageLimit) : null,
        perUserLimit: Number(editCoupon.perUserLimit || 1),
        isFirstOrderOnly: Boolean(editCoupon.isFirstOrderOnly),
        status: editCoupon.status || 'ACTIVE',
        startsAt: new Date(editCoupon.startsAt).toISOString(),
        expiresAt: new Date(new Date(editCoupon.expiresAt).setHours(23, 59, 59)).toISOString()
      };

      if (editCoupon.id) {
        await adminService.updateCoupon(editCoupon.id, payload);
        notify('Coupon updated successfully');
      } else {
        await adminService.createCoupon(payload);
        notify('Coupon created successfully');
      }
      setEditCoupon(null);
      await loadData();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleToggleCouponStatus = async c => {
    try {
      const nextStatus = c.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await adminService.updateCouponStatus(c.id, nextStatus);
      setCouponsList(curr => curr.map(item => item.id === c.id ? { ...item, status: nextStatus } : item));
      notify(`Coupon ${c.code} ${nextStatus === 'ACTIVE' ? 'activated' : 'deactivated'}`);
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleDeleteCoupon = async () => {
    if (!removeCoupon) return;
    try {
      await adminService.deleteCoupon(removeCoupon.id);
      setCouponsList(curr => curr.filter(c => c.id !== removeCoupon.id));
      setRemoveCoupon(null);
      notify('Coupon removed');
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  if (loading && !campaignsList.length && !couponsList.length) {
    return <MarketingSkeleton />;
  }

  const popupsAndBanners = campaignsList.filter(c => ['POPUP', 'ANNOUNCEMENT_BAR'].includes(c.type));
  const generalCampaigns = campaignsList.filter(c => !['POPUP', 'ANNOUNCEMENT_BAR'].includes(c.type));

  return (
    <>
      <div className="admin-title">
        <div>
          <h1>Marketing & Promotion Management</h1>
          <p>Launch festival offers, homepage popups, announcement bars, first-order discounts, and track campaign ROI.</p>
        </div>
        <div className="row gap">
          <Button variant="ghost" onClick={loadData}><RefreshCcw /> Refresh</Button>
          {tab === 'campaigns' && (
            <Button onClick={() => setEditCampaign({ ...campaignBlank })}>
              <Plus /> Create Campaign
            </Button>
          )}
          {tab === 'popups' && (
            <Button onClick={() => setEditCampaign({ ...campaignBlank, type: 'POPUP' })}>
              <Plus /> Add Popup / Bar
            </Button>
          )}
          {tab === 'coupons' && (
            <Button onClick={() => setEditCoupon({ ...couponBlank })}>
              <Plus /> Create Coupon
            </Button>
          )}
        </div>
      </div>

      {/* KPI Stats */}
      {perfReport && (
        <div className="delivery-stats">
          <div className="admin-card delivery-stat">
            <i><Megaphone /></i>
            <span>
              <small>Active Campaigns</small>
              <b>{perfReport.activeCampaigns} / {perfReport.totalCampaigns}</b>
            </span>
          </div>
          <div className="admin-card delivery-stat">
            <i><Ticket /></i>
            <span>
              <small>Total Redemptions</small>
              <b>{perfReport.totalRedemptions} times</b>
            </span>
          </div>
          <div className="admin-card delivery-stat">
            <i><Sparkles /></i>
            <span>
              <small>Discount Distributed</small>
              <b>₹{Number(perfReport.totalDiscountGiven).toLocaleString('en-IN')}</b>
            </span>
          </div>
          <div className="admin-card delivery-stat">
            <i><BarChart3 /></i>
            <span>
              <small>Coupon-Assisted Sales</small>
              <b>₹{Number(perfReport.totalCouponSales).toLocaleString('en-IN')}</b>
            </span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="admin-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}>
        <button
          type="button"
          className={`tab-btn ${tab === 'campaigns' ? 'active' : ''}`}
          onClick={() => setTab('campaigns')}
        >
          <Megaphone size={15} />
          <span>Campaigns & Festival Offers ({generalCampaigns.length})</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${tab === 'popups' ? 'active' : ''}`}
          onClick={() => setTab('popups')}
        >
          <Sparkles size={15} />
          <span>Popups & Announcement Bars ({popupsAndBanners.length})</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${tab === 'coupons' ? 'active' : ''}`}
          onClick={() => setTab('coupons')}
        >
          <Ticket size={15} />
          <span>Coupons & First-Order Offers ({couponsList.length})</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${tab === 'reports' ? 'active' : ''}`}
          onClick={() => setTab('reports')}
        >
          <BarChart3 size={15} />
          <span>Campaign Analytics & Usages</span>
        </button>
      </div>

      {/* ================= TAB 1: CAMPAIGNS & FESTIVAL OFFERS ================= */}
      {tab === 'campaigns' && (
        <>
          {!generalCampaigns.length ? (
            <div className="admin-card delivery-empty">
              <Megaphone />
              <h3>No promotional campaigns configured</h3>
              <p>Schedule festival sales, seasonal discounts, and special event deals.</p>
              <Button onClick={() => setEditCampaign({ ...campaignBlank })}><Plus /> Launch First Campaign</Button>
            </div>
          ) : (
            <div className="delivery-zone-grid">
              {generalCampaigns.map(c => (
                <article className="admin-card delivery-zone" key={c.id}>
                  <div className="delivery-zone-head">
                    <i><Sparkles /></i>
                    <div>
                      <h3>{c.title}</h3>
                      <small>{c.type} · {c.name}</small>
                    </div>
                    <StatusBadge status={c.status === 'ACTIVE' ? 'Active' : 'Inactive'} />
                  </div>

                  {c.badge && (
                    <span style={{ display: 'inline-block', background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, marginTop: '8px' }}>
                      {c.badge}
                    </span>
                  )}

                  {c.subtitle && <p style={{ fontSize: '13px', color: '#4b5563', margin: '8px 0' }}>{c.subtitle}</p>}

                  <div className="delivery-rule-grid" style={{ marginTop: '12px' }}>
                    <span><small>Starts</small><b>{new Date(c.startsAt).toLocaleDateString('en-IN')}</b></span>
                    <span><small>Expires</small><b>{new Date(c.expiresAt).toLocaleDateString('en-IN')}</b></span>
                    <span><small>Views</small><b>{c.viewCount}</b></span>
                    <span><small>Clicks</small><b>{c.clickCount}</b></span>
                  </div>

                  <div className="delivery-zone-actions" style={{ marginTop: '14px' }}>
                    <Button variant="outline" onClick={() => setEditCampaign({
                      ...c,
                      ctaText: c.metadata?.ctaText || c.ctaText || '',
                      startsAt: c.startsAt.slice(0, 10),
                      expiresAt: c.expiresAt.slice(0, 10)
                    })}>
                      <Edit2 /> Edit
                    </Button>
                    <Button variant="ghost" onClick={() => handleToggleCampaignStatus(c)}>
                      {c.status === 'ACTIVE' ? <PauseCircle /> : <PlayCircle />}
                      {c.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                    </Button>
                    <Button variant="ghost" className="text-danger" onClick={() => setRemoveCampaign(c)}>
                      <Trash2 />
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {/* ================= TAB 2: POPUPS & ANNOUNCEMENTS ================= */}
      {tab === 'popups' && (
        <>
          <div className="row between" style={{ marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0 }}>Homepage Popups & Sticky Announcement Bars</h3>
              <small style={{ color: '#6b7280' }}>Display urgent updates or high-converting promotional modals to customers.</small>
            </div>
            <div className="row gap">
              <Button onClick={() => setEditCampaign({
                ...campaignBlank,
                name: 'Express Delivery Announcement',
                type: 'ANNOUNCEMENT_BAR',
                title: 'Free delivery on all orders above ₹499 this week!',
                badge: 'LIMITED TIME',
                linkUrl: '#details',
                ctaText: 'Learn More →',
                metadata: { ctaText: 'Learn More →' }
              })}>
                <Plus /> Add Announcement Bar
              </Button>
              <Button onClick={() => setEditCampaign({
                ...campaignBlank,
                name: 'Welcome Grocery Popup',
                type: 'POPUP',
                title: 'Welcome to R2Cart! Get 20% off your first grocery order.',
                subtitle: 'Enjoy fresh farm produce, dairy, and pantry essentials delivered in 15-30 minutes.',
                badge: 'WELCOME20',
                linkUrl: '/coupons',
                ctaText: 'Claim Offer Now',
                metadata: { ctaText: 'Claim Offer Now', couponCode: 'WELCOME20' }
              })}>
                <Plus /> Add Promotional Popup
              </Button>
            </div>
          </div>

          {!popupsAndBanners.length ? (
            <div className="admin-card delivery-empty">
              <Sparkles />
              <h3>No popups or announcement bars configured</h3>
              <p>Create an announcement bar at the top of the header or a welcome discount popup modal.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              {popupsAndBanners.map(p => (
                <div
                  key={p.id}
                  className="admin-card"
                  style={{
                    borderTop: p.type === 'ANNOUNCEMENT_BAR' ? `5px solid ${p.bgColor || '#10b981'}` : '5px solid #8b5cf6'
                  }}
                >
                  <div className="row between">
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', background: p.type === 'ANNOUNCEMENT_BAR' ? '#e0f2fe' : '#f3e8ff', color: p.type === 'ANNOUNCEMENT_BAR' ? '#0369a1' : '#6b21a8' }}>
                      {p.type === 'ANNOUNCEMENT_BAR' ? 'TOP ANNOUNCEMENT BAR' : 'PROMOTIONAL POPUP MODAL'}
                    </span>
                    <StatusBadge status={p.status === 'ACTIVE' ? 'Active' : 'Inactive'} />
                  </div>

                  <h3 style={{ margin: '10px 0 4px', fontSize: '16px' }}>{p.title}</h3>
                  {p.content && <p style={{ fontSize: '13px', color: '#4b5563', margin: '4px 0 10px' }}>{p.content}</p>}

                  {p.type === 'ANNOUNCEMENT_BAR' && (
                    <div style={{ background: p.bgColor || '#10b981', color: p.textColor || '#fff', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, textAlign: 'center', margin: '10px 0' }}>
                      Preview: {p.title}
                    </div>
                  )}

                  <div className="delivery-rule-grid" style={{ marginTop: '10px' }}>
                    <span><small>Starts</small><b>{new Date(p.startsAt).toLocaleDateString('en-IN')}</b></span>
                    <span><small>Expires</small><b>{new Date(p.expiresAt).toLocaleDateString('en-IN')}</b></span>
                    <span><small>Views</small><b>{p.viewCount}</b></span>
                    <span><small>Clicks</small><b>{p.clickCount}</b></span>
                  </div>

                  <div className="row gap" style={{ marginTop: '14px', justifyContent: 'flex-end' }}>
                    <Button variant="outline" onClick={() => setEditCampaign({
                      ...p,
                      ctaText: p.metadata?.ctaText || p.ctaText || '',
                      startsAt: p.startsAt.slice(0, 10),
                      expiresAt: p.expiresAt.slice(0, 10)
                    })}>
                      <Edit2 size={14} /> Edit
                    </Button>
                    <Button variant="ghost" onClick={() => handleToggleCampaignStatus(p)}>
                      {p.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                    </Button>
                    <Button variant="ghost" className="text-danger" onClick={() => setRemoveCampaign(p)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ================= TAB 3: COUPONS ================= */}
      {tab === 'coupons' && (
        <div className="admin-card table-card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Coupon Code</th>
                  <th>Discount</th>
                  <th>Min Order</th>
                  <th>Max Cap</th>
                  <th>First-Order Only</th>
                  <th>Usage (Used/Limit)</th>
                  <th>Valid Until</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {!couponsList.length ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
                      No discount coupons found. Click "Create Coupon" to add one.
                    </td>
                  </tr>
                ) : (
                  couponsList.map(c => (
                    <tr key={c.id}>
                      <td>
                        <b style={{ letterSpacing: '0.5px', color: '#166534', background: '#f0fdf4', padding: '3px 8px', borderRadius: '6px' }}>
                          {c.code}
                        </b>
                        {c.campaignName && <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>{c.campaignName}</div>}
                      </td>
                      <td>
                        <b>{c.type === 'PERCENTAGE' ? `${c.discount}% OFF` : `₹${c.discount} FLAT`}</b>
                      </td>
                      <td>₹{c.minimumOrder}</td>
                      <td>{c.maximumDiscount ? `₹${c.maximumDiscount}` : 'No cap'}</td>
                      <td>
                        {c.isFirstOrderOnly ? (
                          <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                            1ST ORDER ONLY
                          </span>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>All Orders</span>
                        )}
                      </td>
                      <td>
                        <b>{c.usageCount || 0}</b> / {c.usageLimit || '∞'}
                        {c.usageLimit && c.usageCount >= c.usageLimit && (
                          <div style={{ fontSize: '10px', color: '#b91c1c', fontWeight: 800, textTransform: 'uppercase', marginTop: '2px' }}>
                            Limit Exhausted
                          </div>
                        )}
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>Max {c.perUserLimit || 1}/user</div>
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', color: '#4b5563' }}>
                          {new Date(c.expiresAt).toLocaleDateString('en-IN')}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleToggleCouponStatus(c)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            border: c.status === 'ACTIVE' ? '1px solid #86efac' : '1px solid #cbd5e1',
                            background: c.status === 'ACTIVE' ? '#dcfce7' : '#f1f5f9',
                            color: c.status === 'ACTIVE' ? '#15803d' : '#64748b',
                            transition: 'all 0.15s ease'
                          }}
                          title={`Click to ${c.status === 'ACTIVE' ? 'deactivate' : 'activate'} coupon`}
                        >
                          <span
                            style={{
                              width: '7px',
                              height: '7px',
                              borderRadius: '50%',
                              background: c.status === 'ACTIVE' ? '#16a34a' : '#94a3b8'
                            }}
                          />
                          {c.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td>
                        <div className="row gap" style={{ gap: '6px' }}>
                          <Button variant="outline" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => setEditCoupon({
                            ...c,
                            usageLimit: c.usageLimit ?? '',
                            status: c.status || 'ACTIVE',
                            startsAt: c.startsAt.slice(0, 10),
                            expiresAt: c.expiresAt.slice(0, 10)
                          })}>
                            <Edit2 size={13} />
                          </Button>
                          <Button variant="ghost" className="text-danger" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => setRemoveCoupon(c)}>
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 4: CAMPAIGN ANALYTICS & USAGE TRAIL ================= */}
      {tab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {perfReport?.topCoupons?.length > 0 && (
            <div className="admin-card">
              <h3>Top 5 Redeemed Coupon Codes</h3>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px' }}>
                {perfReport.topCoupons.map((item, idx) => (
                  <div key={item.code} style={{ flex: 1, minWidth: '140px', background: '#f9fafb', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    <small style={{ color: '#6b7280' }}>#{idx + 1} Most Popular</small>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#166534', marginTop: '4px' }}>{item.code}</div>
                    <div style={{ fontSize: '13px', color: '#374151', marginTop: '2px' }}>{item.count} redemptions</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="admin-card table-card">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
              <h3 style={{ margin: 0 }}>Recent Coupon Redemptions ({couponUsages.length})</h3>
              <small style={{ color: '#6b7280' }}>Server-side authenticated coupon usage records</small>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Redemption Date</th>
                    <th>Coupon</th>
                    <th>Customer Name</th>
                    <th>Customer Mobile</th>
                    <th>Order #</th>
                    <th>Discount Given</th>
                    <th>Payable Total</th>
                  </tr>
                </thead>
                <tbody>
                  {!couponUsages.length ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
                        No coupon redemptions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    couponUsages.map(u => (
                      <tr key={u.id}>
                        <td>
                          <span style={{ fontSize: '12px', color: '#4b5563' }}>
                            {new Date(u.usedAt).toLocaleString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </td>
                        <td>
                          <b style={{ color: '#166534' }}>{u.coupon?.code || 'COUPON'}</b>
                        </td>
                        <td><b>{u.user?.name || 'Customer'}</b></td>
                        <td>{u.user?.mobile || 'N/A'}</td>
                        <td><b>#{u.order?.orderNumber}</b></td>
                        <td>
                          <span style={{ color: '#10b981', fontWeight: 700 }}>
                            -₹{Number(u.order?.couponDiscount || 0).toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td>₹{Number(u.order?.grandTotal || 0).toLocaleString('en-IN')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add / Edit Campaign */}
      <Modal open={!!editCampaign} onClose={() => !busy && setEditCampaign(null)} title={editCampaign?.id ? 'Edit Marketing Campaign' : 'Create Marketing Campaign'} size="campaign-modal">
        <style>{`
          .campaign-modal {
            width: min(740px, 96vw) !important;
            border-radius: 20px !important;
            overflow: hidden !important;
            box-shadow: 0 25px 60px rgba(0, 0, 0, 0.22) !important;
          }
          .campaign-modal .modal-head {
            padding: 16px 22px !important;
            background: #ffffff !important;
            border-bottom: 1px solid #f1f5f9 !important;
          }
          .campaign-modal .modal-head h3 {
            font-size: 17px !important;
            font-weight: 800 !important;
            color: #0f172a !important;
          }
          .campaign-modal .modal-body {
            padding: 18px 22px 22px !important;
            max-height: calc(88vh - 70px) !important;
            overflow-y: auto !important;
            scrollbar-width: thin !important;
          }
          .campaign-card-section {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            padding: 16px;
            margin-bottom: 16px;
          }
          .campaign-card-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
          }
          .campaign-card-head b {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            color: #475569;
            font-weight: 800;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .campaign-preset-pill {
            padding: 4px 10px;
            font-size: 11px;
            font-weight: 700;
            border-radius: 6px;
            border: 1px solid #cbd5e1;
            cursor: pointer;
            transition: all 0.15s ease;
          }
          .campaign-preset-pill:hover {
            border-color: #94a3b8;
            background: #f1f5f9;
          }
        `}</style>
        <form className="modal-body admin-form" onSubmit={handleSaveCampaign}>
          {/* Card 1: Identity & Copy */}
          <div className="campaign-card-section">
            <div className="campaign-card-head">
              <b><Megaphone size={14} /> 1. Campaign Identity & Headlines</b>
              <span style={{
                fontSize: '11px',
                fontWeight: 800,
                padding: '2px 10px',
                borderRadius: '20px',
                background: editCampaign?.type === 'ANNOUNCEMENT_BAR' ? '#dcfce7' : editCampaign?.type === 'POPUP' ? '#f3e8ff' : '#fef3c7',
                color: editCampaign?.type === 'ANNOUNCEMENT_BAR' ? '#15803d' : editCampaign?.type === 'POPUP' ? '#6b21a8' : '#b45309'
              }}>
                {editCampaign?.type === 'ANNOUNCEMENT_BAR' ? 'TOP STICKY BAR' : editCampaign?.type === 'POPUP' ? 'CENTER POPUP MODAL' : 'FESTIVAL BANNER'}
              </span>
            </div>

            <div className="form-grid">
              <label>
                Internal Campaign Name *
                <input
                  required
                  value={editCampaign?.name || ''}
                  onChange={e => setEditCampaign(curr => ({ ...curr, name: e.target.value }))}
                  placeholder="e.g. Free Delivery Alert, Diwali Sale"
                />
              </label>
              <label>
                Campaign Type *
                <select
                  value={editCampaign?.type || 'FESTIVAL'}
                  onChange={e => setEditCampaign(curr => ({
                    ...curr,
                    type: e.target.value,
                    linkUrl: curr.linkUrl || (e.target.value === 'ANNOUNCEMENT_BAR' ? '#details' : '/coupons')
                  }))}
                >
                  <option value="ANNOUNCEMENT_BAR">Top Announcement Bar</option>
                  <option value="POPUP">Homepage Promotional Popup</option>
                  <option value="FESTIVAL">Festival Offer</option>
                  <option value="DISCOUNT_DEAL">Discount Deal Banner</option>
                </select>
              </label>
            </div>

            <div className="form-grid" style={{ marginTop: '10px' }}>
              <label>
                Public Headline / Title *
                <input
                  required
                  value={editCampaign?.title || ''}
                  onChange={e => setEditCampaign(curr => ({ ...curr, title: e.target.value }))}
                  placeholder="Headline displayed to customers"
                />
              </label>
              <label>
                Badge Text (e.g. SPECIAL OFFER, 50% OFF)
                <input
                  value={editCampaign?.badge || ''}
                  onChange={e => setEditCampaign(curr => ({ ...curr, badge: e.target.value }))}
                  placeholder="Optional promo tag"
                />
              </label>
            </div>

            <label style={{ marginTop: '10px' }}>
              Subtitle / Offer Details
              <textarea
                rows="2"
                value={editCampaign?.subtitle || ''}
                onChange={e => setEditCampaign(curr => ({ ...curr, subtitle: e.target.value }))}
                placeholder="Supporting description or terms (e.g. Valid on all orders above ₹99)"
              />
            </label>
          </div>

          {/* Card 2: Interactivity & Destination */}
          <div className="campaign-card-section">
            <div className="campaign-card-head">
              <b><MousePointerClick size={14} /> 2. Button Action & Destination Link</b>
            </div>

            <div className="form-grid">
              <label>
                Action Button / CTA Label
                <input
                  value={editCampaign?.ctaText || editCampaign?.metadata?.ctaText || ''}
                  onChange={e => setEditCampaign(curr => ({
                    ...curr,
                    ctaText: e.target.value,
                    metadata: { ...(curr.metadata || {}), ctaText: e.target.value }
                  }))}
                  placeholder={
                    editCampaign?.type === 'ANNOUNCEMENT_BAR' ? 'e.g. Learn More → or View Details' :
                    editCampaign?.type === 'POPUP' ? 'e.g. Claim Offer Now or Grab 20% Off' :
                    'e.g. Shop Festive Deals →'
                  }
                />
              </label>
              <label>
                Auto-Copy Coupon Code (Optional)
                <input
                  value={editCampaign?.metadata?.couponCode || ''}
                  onChange={e => setEditCampaign(curr => ({
                    ...curr,
                    metadata: { ...(curr.metadata || {}), couponCode: e.target.value.trim().toUpperCase() }
                  }))}
                  placeholder="e.g. EXPRESS99 or WELCOME20"
                />
              </label>
            </div>

            <div style={{ marginTop: '12px' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', marginBottom: '6px' }}>
                Destination Link (Where should customer go when clicking button?) *
                <input
                  required
                  value={editCampaign?.linkUrl || ''}
                  onChange={e => setEditCampaign(curr => ({ ...curr, linkUrl: e.target.value }))}
                  placeholder="e.g. /coupons, /category/dairy, or #details"
                  style={{ marginTop: '4px' }}
                />
              </label>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Quick Presets:</span>
                <button
                  type="button"
                  className="campaign-preset-pill"
                  style={{ background: editCampaign?.linkUrl === '/coupons' ? '#e0f2fe' : '#ffffff', borderColor: editCampaign?.linkUrl === '/coupons' ? '#0284c7' : '#cbd5e1' }}
                  onClick={() => setEditCampaign(curr => ({ ...curr, linkUrl: '/coupons' }))}
                >
                  🎟️ /coupons (Offers)
                </button>
                <button
                  type="button"
                  className="campaign-preset-pill"
                  style={{ background: editCampaign?.linkUrl === '/cart' ? '#e0f2fe' : '#ffffff', borderColor: editCampaign?.linkUrl === '/cart' ? '#0284c7' : '#cbd5e1' }}
                  onClick={() => setEditCampaign(curr => ({ ...curr, linkUrl: '/cart' }))}
                >
                  🛒 /cart (Basket)
                </button>
                <button
                  type="button"
                  className="campaign-preset-pill"
                  style={{ background: editCampaign?.linkUrl === '/category/all' ? '#e0f2fe' : '#ffffff', borderColor: editCampaign?.linkUrl === '/category/all' ? '#0284c7' : '#cbd5e1' }}
                  onClick={() => setEditCampaign(curr => ({ ...curr, linkUrl: '/category/all' }))}
                >
                  🛍️ /category/all (Groceries)
                </button>
                <button
                  type="button"
                  className="campaign-preset-pill"
                  style={{ background: editCampaign?.linkUrl === '#details' ? '#e0f2fe' : '#ffffff', borderColor: editCampaign?.linkUrl === '#details' ? '#0284c7' : '#cbd5e1' }}
                  onClick={() => setEditCampaign(curr => ({ ...curr, linkUrl: '#details' }))}
                >
                  ℹ️ #details (Info Popup)
                </button>
              </div>

              {categories.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <select
                    style={{ fontSize: '12px', padding: '7px 10px', width: '100%', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff' }}
                    value={editCampaign?.linkUrl?.startsWith('/category/') ? editCampaign.linkUrl : ''}
                    onChange={e => {
                      if (e.target.value) setEditCampaign(curr => ({ ...curr, linkUrl: e.target.value }));
                    }}
                  >
                    <option value="">-- Or Choose Specific Store Category as Destination --</option>
                    {categories.map(cat => (
                      <option key={cat.id || cat.slug} value={`/category/${cat.slug}`}>
                        📁 {cat.name} (/category/{cat.slug})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <small style={{ color: '#64748b', fontSize: '11px', marginTop: '6px', display: 'block' }}>
                💡 Tip: Choose <code>#details</code> if you want a terms/info popup to open without navigating away from the current page.
              </small>
            </div>
          </div>

          {/* Card 3: Visual Appearance & Schedule */}
          <div className="campaign-card-section">
            <div className="campaign-card-head">
              <b><Sliders size={14} /> 3. Visual Styling & Schedule</b>
            </div>

            {editCampaign?.type === 'ANNOUNCEMENT_BAR' && (
              <div style={{ marginBottom: '14px' }}>
                <div className="form-grid">
                  <label>
                    Background Color
                    <input
                      type="color"
                      value={editCampaign?.bgColor || '#10b981'}
                      onChange={e => setEditCampaign(curr => ({ ...curr, bgColor: e.target.value }))}
                      style={{ height: '38px', padding: '2px 4px', cursor: 'pointer' }}
                    />
                  </label>
                  <label>
                    Text Color
                    <input
                      type="color"
                      value={editCampaign?.textColor || '#ffffff'}
                      onChange={e => setEditCampaign(curr => ({ ...curr, textColor: e.target.value }))}
                      style={{ height: '38px', padding: '2px 4px', cursor: 'pointer' }}
                    />
                  </label>
                </div>

                <div style={{ marginTop: '10px' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Live Strip Preview:</span>
                  <div style={{
                    background: editCampaign?.bgColor || '#10b981',
                    color: editCampaign?.textColor || '#ffffff',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '4px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                  }}>
                    {editCampaign?.badge && (
                      <span style={{ background: 'rgba(255,255,255,0.25)', padding: '2px 7px', borderRadius: '4px', fontSize: '10px', fontWeight: 800 }}>
                        {editCampaign.badge}
                      </span>
                    )}
                    <span>{editCampaign?.title || 'Announcement Title'}</span>
                    <span style={{ background: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.4)', padding: '2px 7px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>
                      {editCampaign?.ctaText || editCampaign?.metadata?.ctaText || 'Learn More →'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {editCampaign?.type !== 'ANNOUNCEMENT_BAR' && (
              <label style={{ marginBottom: '14px' }}>
                Banner / Modal Image URL
                <input
                  value={editCampaign?.imageUrl || ''}
                  onChange={e => setEditCampaign(curr => ({ ...curr, imageUrl: e.target.value }))}
                  placeholder="https://..."
                />
              </label>
            )}

            <div className="form-grid">
              <label>
                Campaign Starts On *
                <input
                  type="date"
                  required
                  value={editCampaign?.startsAt || ''}
                  onChange={e => setEditCampaign(curr => ({ ...curr, startsAt: e.target.value }))}
                />
              </label>
              <label>
                Campaign Expires On *
                <input
                  type="date"
                  required
                  value={editCampaign?.expiresAt || ''}
                  onChange={e => setEditCampaign(curr => ({ ...curr, expiresAt: e.target.value }))}
                />
              </label>
            </div>
          </div>

          <div className="row end gap" style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
            <Button type="button" variant="ghost" disabled={busy} onClick={() => setEditCampaign(null)}>Cancel</Button>
            <Button disabled={busy} style={{ minWidth: '140px' }}>
              {busy ? <LoaderCircle className="spin" size={16} /> : <Save size={16} />} Save Campaign
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add / Edit Coupon */}
      <Modal open={!!editCoupon} onClose={() => !busy && setEditCoupon(null)} title={editCoupon?.id ? 'Edit Coupon' : 'Create Promotional Coupon'} size="coupon-modal">
        <style>{`
          .coupon-modal {
            width: min(620px, 96vw) !important;
            border-radius: 18px !important;
            overflow: hidden !important;
            box-shadow: 0 25px 60px rgba(0, 0, 0, 0.2) !important;
          }
          .coupon-modal .modal-head {
            padding: 18px 24px;
            background: #ffffff;
            border-bottom: 1px solid #f1f5f9;
          }
          .coupon-modal .modal-head h3 {
            font-size: 17px;
            font-weight: 800;
            color: #0f172a;
          }
          .coupon-modal-form {
            padding: 20px 24px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            max-height: calc(88vh - 75px);
            overflow-y: auto;
            box-sizing: border-box;
          }
          .coupon-modal-form::-webkit-scrollbar {
            width: 6px;
          }
          .coupon-modal-form::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
          }
          .coupon-live-ticket {
            background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
            border: 1.5px dashed #a7f3d0;
            border-radius: 14px;
            padding: 14px 18px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 14px;
            box-shadow: 0 2px 8px rgba(16, 185, 129, 0.08);
          }
          .coupon-ticket-main {
            display: flex;
            flex-direction: column;
            gap: 4px;
            min-width: 0;
            flex: 1;
          }
          .coupon-ticket-header {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
          }
          .coupon-ticket-code {
            font-family: 'JetBrains Mono', 'Fira Code', monospace;
            font-size: 14px;
            font-weight: 900;
            letter-spacing: 0.8px;
            color: #065f46;
            background: #d1fae5;
            padding: 2px 9px;
            border-radius: 6px;
            border: 1px solid #a7f3d0;
            display: inline-flex;
            align-items: center;
            gap: 5px;
          }
          .coupon-ticket-discount {
            font-size: 15px;
            font-weight: 800;
            color: #047857;
          }
          .coupon-ticket-details {
            font-size: 11.5px;
            color: #065f46;
            display: flex;
            gap: 8px;
            align-items: center;
            flex-wrap: wrap;
          }
          .coupon-ticket-side {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 6px;
            flex-shrink: 0;
          }
          .coupon-ticket-badge {
            font-size: 11px;
            font-weight: 800;
            padding: 3px 9px;
            border-radius: 20px;
            display: inline-flex;
            align-items: center;
            gap: 5px;
          }
          .coupon-ticket-badge.active {
            background: #dcfce7;
            color: #15803d;
            border: 1px solid #86efac;
          }
          .coupon-ticket-badge.inactive {
            background: #fee2e2;
            color: #b91c1c;
            border: 1px solid #fca5a5;
          }
          .coupon-form-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 14px 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .coupon-form-card-title {
            font-size: 11.5px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #64748b;
            display: flex;
            align-items: center;
            gap: 6px;
            margin: 0;
          }
          .coupon-field-group {
            display: flex;
            flex-direction: column;
            gap: 5px;
          }
          .coupon-field-label {
            font-size: 12px;
            font-weight: 700;
            color: #334155;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .coupon-text-input {
            height: 38px;
            padding: 0 12px;
            border-radius: 8px;
            border: 1.5px solid #cbd5e1;
            background: #ffffff;
            font-size: 13.5px;
            color: #0f172a;
            transition: all 0.15s ease;
            width: 100%;
            box-sizing: border-box;
          }
          .coupon-text-input:focus {
            border-color: #059669;
            box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.12);
            outline: none;
          }
          .coupon-hint-text {
            font-size: 11px;
            color: #64748b;
            margin: 0;
            line-height: 1.35;
          }
          .coupon-type-pills {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px;
            background: #f1f5f9;
            padding: 3px;
            border-radius: 8px;
          }
          .coupon-type-btn {
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            border: none;
            background: transparent;
            color: #475569;
            font-size: 12px;
            font-weight: 700;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.15s ease;
          }
          .coupon-type-btn.active {
            background: #ffffff;
            color: #059669;
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
          }
          .coupon-status-pills {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px;
          }
          .coupon-status-pill-btn {
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 800;
            cursor: pointer;
            transition: all 0.15s ease;
            border: 1.5px solid #cbd5e1;
            background: #f8fafc;
            color: #64748b;
          }
          .coupon-status-pill-btn.active-choice {
            background: #dcfce7;
            border-color: #86efac;
            color: #15803d;
            box-shadow: 0 1px 3px rgba(22, 163, 74, 0.15);
          }
          .coupon-status-pill-btn.inactive-choice {
            background: #fee2e2;
            border-color: #fca5a5;
            color: #b91c1c;
            box-shadow: 0 1px 3px rgba(220, 38, 38, 0.15);
          }
          .coupon-first-order-toggle {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 12px 14px;
            border-radius: 10px;
            background: #fffbeb;
            border: 1px solid #fde68a;
            cursor: pointer;
            transition: all 0.15s ease;
          }
          .coupon-first-order-toggle:hover {
            background: #fef3c7;
          }
          .coupon-ios-switch {
            width: 38px;
            height: 22px;
            border-radius: 20px;
            position: relative;
            transition: all 0.2s ease;
            flex-shrink: 0;
          }
          .coupon-ios-dot {
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: #ffffff;
            position: absolute;
            top: 2px;
            transition: all 0.2s ease;
            box-shadow: 0 1px 3px rgba(0,0,0,0.25);
          }
          .coupon-form-footer {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 10px;
            padding-top: 10px;
            border-top: 1px solid #f1f5f9;
          }
        `}</style>

        <form className="coupon-modal-form" onSubmit={handleSaveCoupon}>
          {/* Live Preview Voucher Badge */}
          <div className="coupon-live-ticket">
            <div className="coupon-ticket-main">
              <div className="coupon-ticket-header">
                <span className="coupon-ticket-code">
                  <Ticket size={14} />
                  <span>{editCoupon?.code || 'COUPONCODE'}</span>
                </span>
                <span className="coupon-ticket-discount">
                  {editCoupon?.type === 'PERCENTAGE'
                    ? `${editCoupon?.discount || 0}% OFF`
                    : `₹${editCoupon?.discount || 0} FLAT OFF`}
                </span>
              </div>
              <div className="coupon-ticket-details">
                <span>Min Order: <b>₹{editCoupon?.minimumOrder || 0}</b></span>
                {editCoupon?.type === 'PERCENTAGE' && editCoupon?.maximumDiscount && (
                  <span>· Max Cap: <b>₹{editCoupon.maximumDiscount}</b></span>
                )}
                <span>· Uses: <b>{editCoupon?.usageLimit ? `${editCoupon.usageLimit} max` : 'Unlimited ∞'}</b></span>
              </div>
            </div>
            <div className="coupon-ticket-side">
              <span className={`coupon-ticket-badge ${editCoupon?.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: editCoupon?.status === 'ACTIVE' ? '#16a34a' : '#dc2626' }} />
                {editCoupon?.status === 'ACTIVE' ? 'Active' : 'Inactive'}
              </span>
              {editCoupon?.isFirstOrderOnly && (
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#92400e', background: '#fef3c7', padding: '1px 6px', borderRadius: '4px' }}>
                  1st Order Only
                </span>
              )}
            </div>
          </div>

          {/* Section 1: Discount & Rules */}
          <div className="coupon-form-card">
            <h4 className="coupon-form-card-title">
              <Tag size={13} color="#059669" /> Discount Value & Code
            </h4>

            <div className="form-grid">
              <div className="coupon-field-group">
                <label className="coupon-field-label">Coupon Code *</label>
                <input
                  required
                  className="coupon-text-input"
                  style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.6px' }}
                  value={editCoupon?.code || ''}
                  onChange={e => setEditCoupon(curr => ({ ...curr, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g. FRESH50, SAVE10"
                />
              </div>

              <div className="coupon-field-group">
                <label className="coupon-field-label">Discount Type *</label>
                <div className="coupon-type-pills">
                  <button
                    type="button"
                    className={`coupon-type-btn ${editCoupon?.type === 'PERCENTAGE' ? 'active' : ''}`}
                    onClick={() => setEditCoupon(curr => ({ ...curr, type: 'PERCENTAGE' }))}
                  >
                    <Percent size={13} /> Percentage (%)
                  </button>
                  <button
                    type="button"
                    className={`coupon-type-btn ${editCoupon?.type === 'FIXED' ? 'active' : ''}`}
                    onClick={() => setEditCoupon(curr => ({ ...curr, type: 'FIXED' }))}
                  >
                    <Coins size={13} /> Fixed Amount (₹)
                  </button>
                </div>
              </div>
            </div>

            <div className="form-grid">
              <div className="coupon-field-group">
                <label className="coupon-field-label">
                  Discount Value ({editCoupon?.type === 'PERCENTAGE' ? '%' : '₹'}) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  className="coupon-text-input"
                  value={editCoupon?.discount ?? ''}
                  onChange={e => setEditCoupon(curr => ({ ...curr, discount: e.target.value }))}
                  placeholder={editCoupon?.type === 'PERCENTAGE' ? 'e.g. 20 (%)' : 'e.g. 50 (₹)'}
                />
              </div>

              <div className="coupon-field-group">
                <label className="coupon-field-label">Minimum Order Required (₹) *</label>
                <input
                  type="number"
                  min="0"
                  required
                  className="coupon-text-input"
                  value={editCoupon?.minimumOrder ?? ''}
                  onChange={e => setEditCoupon(curr => ({ ...curr, minimumOrder: e.target.value }))}
                  placeholder="e.g. 99"
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="coupon-field-group">
                <label className="coupon-field-label">
                  Maximum Discount Cap (₹)
                  <small style={{ fontWeight: 400, color: '#64748b' }}>Optional</small>
                </label>
                <input
                  type="number"
                  min="0"
                  className="coupon-text-input"
                  value={editCoupon?.maximumDiscount ?? ''}
                  onChange={e => setEditCoupon(curr => ({ ...curr, maximumDiscount: e.target.value }))}
                  placeholder={editCoupon?.type === 'PERCENTAGE' ? 'e.g. 100 max cap' : 'N/A for fixed discounts'}
                />
                <p className="coupon-hint-text">Leave empty for no upper limit on discount.</p>
              </div>

              <div className="coupon-field-group">
                <label className="coupon-field-label">Per-Customer Usage Limit *</label>
                <input
                  type="number"
                  min="1"
                  required
                  className="coupon-text-input"
                  value={editCoupon?.perUserLimit || '1'}
                  onChange={e => setEditCoupon(curr => ({ ...curr, perUserLimit: e.target.value }))}
                  placeholder="1"
                />
                <p className="coupon-hint-text">Maximum times a single customer can redeem (Default: 1).</p>
              </div>
            </div>
          </div>

          {/* Section 2: Usage Limit & Manual Status */}
          <div className="coupon-form-card">
            <h4 className="coupon-form-card-title">
              <Sliders size={13} color="#059669" /> Usage Limits & Status Control
            </h4>

            <div className="form-grid">
              <div className="coupon-field-group">
                <label className="coupon-field-label">
                  Total Usage Limit (Overall)
                  <small style={{ fontWeight: 400, color: '#64748b' }}>All Customers</small>
                </label>
                <input
                  type="number"
                  min="1"
                  className="coupon-text-input"
                  value={editCoupon?.usageLimit ?? ''}
                  onChange={e => setEditCoupon(curr => ({ ...curr, usageLimit: e.target.value }))}
                  placeholder="e.g. 10 (Leave blank for Unlimited ∞)"
                />
                <p className="coupon-hint-text">
                  Total kitne log avail kar sakte hain. Limit reach hote hi coupon <b>automatically Inactive</b> ho jayega.
                </p>
              </div>

              <div className="coupon-field-group">
                <label className="coupon-field-label">Manual Status Override *</label>
                <div className="coupon-status-pills">
                  <button
                    type="button"
                    className={`coupon-status-pill-btn ${editCoupon?.status === 'ACTIVE' ? 'active-choice' : ''}`}
                    onClick={() => setEditCoupon(curr => ({ ...curr, status: 'ACTIVE' }))}
                  >
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: editCoupon?.status === 'ACTIVE' ? '#16a34a' : '#94a3b8' }} />
                    Active (Live)
                  </button>
                  <button
                    type="button"
                    className={`coupon-status-pill-btn ${editCoupon?.status === 'INACTIVE' ? 'inactive-choice' : ''}`}
                    onClick={() => setEditCoupon(curr => ({ ...curr, status: 'INACTIVE' }))}
                  >
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: editCoupon?.status === 'INACTIVE' ? '#dc2626' : '#94a3b8' }} />
                    Inactive (Paused)
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#b45309', background: '#fffbeb', padding: '5px 8px', borderRadius: '6px', border: '1px solid #fef3c7', marginTop: '2px' }}>
                  <AlertCircle size={12} style={{ flexShrink: 0 }} />
                  <span><b>Priority Rule:</b> Inactive status overrides expiry date completely.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Eligibility & Dates */}
          <div className="coupon-form-card">
            <h4 className="coupon-form-card-title">
              <Calendar size={13} color="#059669" /> Eligibility & Validity Dates
            </h4>

            {/* First-Order Only Toggle Card */}
            <div
              className="coupon-first-order-toggle"
              onClick={() => setEditCoupon(curr => ({ ...curr, isFirstOrderOnly: !curr.isFirstOrderOnly }))}
              role="button"
              tabIndex={0}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#fef3c7', color: '#92400e', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <Sparkles size={15} />
                </div>
                <div>
                  <b style={{ fontSize: '12.5px', color: '#92400e', display: 'block' }}>First-Order Only Discount</b>
                  <span style={{ fontSize: '11px', color: '#b45309', display: 'block' }}>
                    Strictly validated on backend: only customers with 0 completed orders can redeem.
                  </span>
                </div>
              </div>
              <div
                className="coupon-ios-switch"
                style={{ background: editCoupon?.isFirstOrderOnly ? '#10b981' : '#cbd5e1' }}
              >
                <div
                  className="coupon-ios-dot"
                  style={{ left: editCoupon?.isFirstOrderOnly ? '18px' : '2px' }}
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="coupon-field-group">
                <label className="coupon-field-label">Start Date *</label>
                <input
                  type="date"
                  required
                  className="coupon-text-input"
                  value={editCoupon?.startsAt || ''}
                  onChange={e => setEditCoupon(curr => ({ ...curr, startsAt: e.target.value }))}
                />
              </div>

              <div className="coupon-field-group">
                <label className="coupon-field-label">Expiry Date *</label>
                <input
                  type="date"
                  required
                  className="coupon-text-input"
                  value={editCoupon?.expiresAt || ''}
                  onChange={e => setEditCoupon(curr => ({ ...curr, expiresAt: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Sticky Actions Footer */}
          <div className="coupon-form-footer">
            <Button type="button" variant="ghost" disabled={busy} onClick={() => setEditCoupon(null)}>
              Cancel
            </Button>
            <Button
              disabled={busy}
              style={{
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 800,
                padding: '8px 20px',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)'
              }}
            >
              {busy ? <LoaderCircle className="spin" size={15} /> : <Save size={15} />}
              <span>Save Coupon</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialogs */}
      <ConfirmDialog
        open={!!removeCampaign}
        onClose={() => setRemoveCampaign(null)}
        onConfirm={handleDeleteCampaign}
        title="Delete Campaign?"
        itemName={removeCampaign?.title}
        itemType="Campaign"
        message={`Are you sure you want to delete campaign “${removeCampaign?.title || ''}”? It will be immediately removed.`}
        warningNote="Active promotions, storefront banners, or pushes linked to this campaign will cease."
        confirmText="Delete Campaign"
        cancelText="Cancel"
      />
      <ConfirmDialog
        open={!!removeCoupon}
        onClose={() => setRemoveCoupon(null)}
        onConfirm={handleDeleteCoupon}
        title="Delete Coupon?"
        itemName={removeCoupon?.code}
        itemType="Coupon"
        message={`Are you sure you want to delete coupon code “${removeCoupon?.code || ''}”? Customers will no longer be able to claim it.`}
        warningNote="Prior customer orders with this coupon discount applied will remain completely intact."
        confirmText="Delete Coupon"
        cancelText="Cancel"
      />
    </>
  );
}
