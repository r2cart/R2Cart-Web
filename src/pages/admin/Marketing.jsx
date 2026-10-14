import {useEffect,useState} from 'react';
import {AlertCircle,BarChart3,Calendar,CheckCircle2,Clock,Copy,Edit2,Eye,Image as ImageIcon,Layers,LoaderCircle,Megaphone,MousePointerClick,PauseCircle,PlayCircle,Plus,RefreshCcw,Save,Sliders,Sparkles,Tag,Ticket,Trash2} from 'lucide-react';
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
  linkUrl: '',
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

export function AdminMarketing() {
  const { notify } = useApp();
  const [tab, setTab] = useState('campaigns'); // 'campaigns' | 'popups' | 'coupons' | 'reports'
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Campaigns state
  const [campaignsList, setCampaignsList] = useState([]);
  const [editCampaign, setEditCampaign] = useState(null);
  const [removeCampaign, setRemoveCampaign] = useState(null);

  // Coupons state
  const [couponsList, setCouponsList] = useState([]);
  const [couponUsages, setCouponUsages] = useState([]);
  const [editCoupon, setEditCoupon] = useState(null);
  const [removeCoupon, setRemoveCoupon] = useState(null);

  // Performance state
  const [perfReport, setPerfReport] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cData, coupData, usagesData, pData] = await Promise.all([
        adminService.getCampaigns(),
        adminService.coupons(),
        adminService.getCouponUsages(),
        adminService.getMarketingPerformance()
      ]);
      setCampaignsList(cData || []);
      setCouponsList(coupData || []);
      setCouponUsages(usagesData.usages || []);
      setPerfReport(pData || null);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Campaign Handlers
  const handleSaveCampaign = async e => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        ...editCampaign,
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
        usageLimit: editCoupon.usageLimit ? Number(editCoupon.usageLimit) : null,
        perUserLimit: Number(editCoupon.perUserLimit || 1),
        isFirstOrderOnly: Boolean(editCoupon.isFirstOrderOnly),
        startsAt: new Date(editCoupon.startsAt).toISOString(),
        expiresAt: new Date(new Date(editCoupon.expiresAt).setHours(23, 59, 59)).toISOString()
      };

      if (editCoupon.id) {
        await adminService.updateCoupon(editCoupon.id, payload);
        notify('Coupon updated');
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

  if (loading) {
    return (
      <div className="admin-card delivery-loading">
        <LoaderCircle className="spin" /> Loading marketing & campaign management…
      </div>
    );
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
              <Button onClick={() => setEditCampaign({ ...campaignBlank, type: 'ANNOUNCEMENT_BAR', title: 'Free delivery on all orders above ₹499 this week!' })}>
                <Plus /> Add Announcement Bar
              </Button>
              <Button onClick={() => setEditCampaign({ ...campaignBlank, type: 'POPUP', title: 'Welcome to R2Cart! Get 20% off your first grocery order.' })}>
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
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>Max {c.perUserLimit || 1}/user</div>
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', color: '#4b5563' }}>
                          {new Date(c.expiresAt).toLocaleDateString('en-IN')}
                        </span>
                      </td>
                      <td><StatusBadge status={c.status === 'ACTIVE' ? 'Active' : 'Inactive'} /></td>
                      <td>
                        <div className="row gap" style={{ gap: '6px' }}>
                          <Button variant="outline" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => setEditCoupon({
                            ...c,
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
      <Modal open={!!editCampaign} onClose={() => !busy && setEditCampaign(null)} title={editCampaign?.id ? 'Edit Marketing Campaign' : 'Create Marketing Campaign'}>
        <form className="modal-body admin-form" onSubmit={handleSaveCampaign}>
          <label>
            Internal Campaign Name *
            <input
              required
              value={editCampaign?.name || ''}
              onChange={e => setEditCampaign(curr => ({ ...curr, name: e.target.value }))}
              placeholder="e.g. Diwali Dhamaka 2026, Summer Coolers Sale"
            />
          </label>
          <div className="form-grid">
            <label>
              Campaign Type *
              <select
                value={editCampaign?.type || 'FESTIVAL'}
                onChange={e => setEditCampaign(curr => ({ ...curr, type: e.target.value }))}
              >
                <option value="FESTIVAL">Festival Offer</option>
                <option value="POPUP">Homepage Promotional Popup</option>
                <option value="ANNOUNCEMENT_BAR">Top Announcement Bar</option>
                <option value="DISCOUNT_DEAL">Discount Deal Banner</option>
              </select>
            </label>
            <label>
              Badge Text (e.g. 50% OFF, LIMITED)
              <input
                value={editCampaign?.badge || ''}
                onChange={e => setEditCampaign(curr => ({ ...curr, badge: e.target.value }))}
                placeholder="Optional promo tag"
              />
            </label>
          </div>
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
            Subtitle / Description
            <textarea
              rows="2"
              value={editCampaign?.subtitle || ''}
              onChange={e => setEditCampaign(curr => ({ ...curr, subtitle: e.target.value }))}
              placeholder="Supporting copy or promotion details"
            />
          </label>
          <div className="form-grid">
            <label>
              Banner / Modal Image URL
              <input
                value={editCampaign?.imageUrl || ''}
                onChange={e => setEditCampaign(curr => ({ ...curr, imageUrl: e.target.value }))}
                placeholder="https://..."
              />
            </label>
            <label>
              Destination Link URL
              <input
                value={editCampaign?.linkUrl || ''}
                onChange={e => setEditCampaign(curr => ({ ...curr, linkUrl: e.target.value }))}
                placeholder="e.g. /category/dairy or /search?q=ghee"
              />
            </label>
          </div>
          {editCampaign?.type === 'ANNOUNCEMENT_BAR' && (
            <div className="form-grid">
              <label>
                Background Color
                <input
                  type="color"
                  value={editCampaign?.bgColor || '#10b981'}
                  onChange={e => setEditCampaign(curr => ({ ...curr, bgColor: e.target.value }))}
                />
              </label>
              <label>
                Text Color
                <input
                  type="color"
                  value={editCampaign?.textColor || '#ffffff'}
                  onChange={e => setEditCampaign(curr => ({ ...curr, textColor: e.target.value }))}
                />
              </label>
            </div>
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
          <div className="row end gap" style={{ marginTop: '20px' }}>
            <Button type="button" variant="ghost" disabled={busy} onClick={() => setEditCampaign(null)}>Cancel</Button>
            <Button disabled={busy}>
              {busy ? <LoaderCircle className="spin" /> : <Save />} Save Campaign
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add / Edit Coupon */}
      <Modal open={!!editCoupon} onClose={() => !busy && setEditCoupon(null)} title={editCoupon?.id ? 'Edit Coupon' : 'Create Promotional Coupon'}>
        <form className="modal-body admin-form" onSubmit={handleSaveCoupon}>
          <div className="form-grid">
            <label>
              Coupon Code *
              <input
                required
                value={editCoupon?.code || ''}
                onChange={e => setEditCoupon(curr => ({ ...curr, code: e.target.value.toUpperCase() }))}
                placeholder="e.g. FRESH50, DIWALI100"
              />
            </label>
            <label>
              Discount Type *
              <select
                value={editCoupon?.type || 'PERCENTAGE'}
                onChange={e => setEditCoupon(curr => ({ ...curr, type: e.target.value }))}
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (₹)</option>
              </select>
            </label>
          </div>
          <div className="form-grid">
            <label>
              Discount Value *
              <input
                type="number"
                min="1"
                required
                value={editCoupon?.discount ?? ''}
                onChange={e => setEditCoupon(curr => ({ ...curr, discount: e.target.value }))}
                placeholder={editCoupon?.type === 'PERCENTAGE' ? 'e.g. 20 (%)' : 'e.g. 50 (₹)'}
              />
            </label>
            <label>
              Minimum Order Required (₹) *
              <input
                type="number"
                min="0"
                required
                value={editCoupon?.minimumOrder ?? ''}
                onChange={e => setEditCoupon(curr => ({ ...curr, minimumOrder: e.target.value }))}
                placeholder="e.g. 299"
              />
            </label>
          </div>
          <div className="form-grid">
            <label>
              Maximum Discount Cap (₹)
              <input
                type="number"
                min="0"
                value={editCoupon?.maximumDiscount ?? ''}
                onChange={e => setEditCoupon(curr => ({ ...curr, maximumDiscount: e.target.value }))}
                placeholder="Optional max cap for % discounts"
              />
            </label>
            <label>
              Per-Customer Usage Limit
              <input
                type="number"
                min="1"
                required
                value={editCoupon?.perUserLimit || '1'}
                onChange={e => setEditCoupon(curr => ({ ...curr, perUserLimit: e.target.value }))}
              />
            </label>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: '#fef3c7', padding: '10px 14px', borderRadius: '8px', margin: '10px 0' }}>
            <input
              type="checkbox"
              checked={Boolean(editCoupon?.isFirstOrderOnly)}
              onChange={e => setEditCoupon(curr => ({ ...curr, isFirstOrderOnly: e.target.checked }))}
              style={{ width: '18px', height: '18px' }}
            />
            <div>
              <b style={{ color: '#92400e' }}>First-Order Only Discount</b>
              <p style={{ margin: 0, fontSize: '12px', color: '#b45309' }}>
                Strictly validated on backend: only customers with 0 completed/confirmed orders can redeem this.
              </p>
            </div>
          </label>
          <div className="form-grid">
            <label>
              Start Date *
              <input
                type="date"
                required
                value={editCoupon?.startsAt || ''}
                onChange={e => setEditCoupon(curr => ({ ...curr, startsAt: e.target.value }))}
              />
            </label>
            <label>
              Expiry Date *
              <input
                type="date"
                required
                value={editCoupon?.expiresAt || ''}
                onChange={e => setEditCoupon(curr => ({ ...curr, expiresAt: e.target.value }))}
              />
            </label>
          </div>
          <div className="row end gap" style={{ marginTop: '20px' }}>
            <Button type="button" variant="ghost" disabled={busy} onClick={() => setEditCoupon(null)}>Cancel</Button>
            <Button disabled={busy}>
              {busy ? <LoaderCircle className="spin" /> : <Save />} Save Coupon
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
        message={`“${removeCampaign?.title || ''}” will be permanently removed.`}
      />
      <ConfirmDialog
        open={!!removeCoupon}
        onClose={() => setRemoveCoupon(null)}
        onConfirm={handleDeleteCoupon}
        title="Delete Coupon?"
        message={`Coupon “${removeCoupon?.code || ''}” will be deleted. Prior orders will remain intact.`}
      />
    </>
  );
}
