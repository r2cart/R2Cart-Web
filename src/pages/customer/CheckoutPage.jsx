import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Banknote,
  Calendar,
  Check,
  Clock,
  ShieldCheck,
  Tag,
  Zap,
  MapPin,
  Clock3,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Plus,
  ShoppingBag,
  Leaf
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { AddressForm } from '../../layouts/CustomerLayout';
import { Badge, Button, EmptyState, Modal, money } from '../../components/ui';
import { isProductComingSoon } from '../../config/homeLayout';
import { orderService } from '../../services/order.service';
import { customerService } from '../../services/customer.service';
import { catalogService } from '../../services/catalog.service';
import { addressPayload, addressView } from '../../utils/address';

const TIME_SLOTS = [
  { id: 'morning', label: 'Morning Slot (07:00 AM – 11:00 AM)', time: '07:00 AM - 11:00 AM', startTime: '07:00', endTime: '11:00', startHour: 7, endHour: 11 },
  { id: 'midday', label: 'Midday Slot (10:00 AM - 01:00 PM)', time: '10:00 AM - 01:00 PM', startTime: '10:00', endTime: '13:00', startHour: 10, endHour: 13 },
  { id: 'afternoon', label: 'Afternoon Slot (01:00 PM - 04:00 PM)', time: '01:00 PM - 04:00 PM', startTime: '13:00', endTime: '16:00', startHour: 13, endHour: 16 },
  { id: 'evening', label: 'Evening Slot (04:00 PM - 07:00 PM)', time: '04:00 PM - 07:00 PM', startTime: '16:00', endTime: '19:00', startHour: 16, endHour: 19 },
  { id: 'night', label: 'Night Slot (07:00 PM – 11:00 PM)', time: '07:00 PM - 11:00 PM', startTime: '19:00', endTime: '23:00', startHour: 19, endHour: 23 }
];

const PRESET_INSTRUCTIONS = [
  { id: 'no-bell', label: "Don't ring bell", sub: 'Drop and avoid noise', icon: '🔕' },
  { id: 'at-door', label: 'Leave at door', sub: 'Place outside doorstep', icon: '🚪' },
  { id: 'call-first', label: 'Call on arrival', sub: 'Rider calls upon arrival', icon: '📞' },
  { id: 'with-guard', label: 'Leave with guard', sub: 'Security desk / gate', icon: '🛡️' }
];

export function formatSlotTime(timeStr) {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  if (isNaN(h)) return timeStr;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
}

function isSlotAvailable(slot, isToday, sameDayCutoffMinutes = 60) {
  if (!isToday) return true;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  let endMinutes;
  if (slot.endTime) {
    const [h, m] = slot.endTime.split(':').map(Number);
    endMinutes = h * 60 + (m || 0);
  } else {
    const endH = slot.endHour !== undefined ? slot.endHour : ((slot.startHour || 7) + 3);
    endMinutes = endH * 60;
  }
  const cutoff = (slot.cutoffMinutes !== undefined && slot.cutoffMinutes !== null)
    ? Number(slot.cutoffMinutes)
    : Number(sameDayCutoffMinutes || 60);
  // Cutoff is evaluated against slot END time (e.g. 1 hour before 11:00 = 10:00 cutoff)
  const cutoffThreshold = endMinutes - cutoff;
  return currentMinutes < cutoffThreshold;
}

function formatLocalYMD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getAvailableDates(holidayDates = [], advanceBookingDays = 4, sameDayCutoffMinutes = 60, todaySlots = null) {
  const dates = [];
  const now = new Date();
  const daysLimit = Math.max(1, Math.min(30, parseInt(advanceBookingDays, 10) || 4));
  for (let i = 0; i < daysLimit; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const id = formatLocalYMD(d);
    const isToday = i === 0;
    const isTomorrow = i === 1;
    const isHoliday = Array.isArray(holidayDates) && holidayDates.includes(id);
    const dayName = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short' });
    const dateFormatted = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const label = `${dayName}, ${dateFormatted}`;

    let isTodayAvailable;
    if (todaySlots !== null && Array.isArray(todaySlots) && todaySlots.length > 0) {
      isTodayAvailable = todaySlots.some((s) => s.isAvailable);
    } else {
      isTodayAvailable = TIME_SLOTS.some((s) => isSlotAvailable(s, true, sameDayCutoffMinutes));
    }

    const hasAvailableSlot = !isHoliday && (isToday ? isTodayAvailable : true);
    dates.push({
      id,
      dayName,
      dateFormatted,
      label,
      isToday,
      isTomorrow,
      isHoliday,
      hasAvailableSlot
    });
  }
  return dates;
}

export function CheckoutPage() {
  const {
    cartItems,
    subtotal,
    mrpTotal,
    addressList,
    setAddressList,
    setOrderList,
    setCart,
    notify,
    deliveryConfig,
    deliveryZones,
    deliveryRulesFor,
    user,
    openAuthModal,
    refreshProducts,
    storeSettings,
    activeAddress,
    setActiveAddress,
    activeDeliveryRules,
    setLocationOpen,
    categories,
    products,
    add,
    qty
  } = useApp();

  const emergencyPause = storeSettings?.policies?.emergencyPause;
  const effectiveStatus = storeSettings?.effectiveStatus;
  const emergencyType = storeSettings?.emergencySettings?.type || effectiveStatus?.emergencyDetails?.type || 'ALL_ORDERS';

  // Store is completely paused for ALL orders if status is EMERGENCY_PAUSED or legacy pause without scope
  const isStoreFullyClosed = Boolean(
    effectiveStatus?.storeStatus === 'EMERGENCY_PAUSED' ||
    (storeSettings?.isOrderPaused && (emergencyType === 'ALL_ORDERS' || emergencyType === 'STORE_CLOSE'))
  );

  // Granular order type permissions derived from store schedule engine
  const allowImmediate = !isStoreFullyClosed && (
    effectiveStatus !== undefined && effectiveStatus !== null
      ? Boolean(effectiveStatus.allowImmediateOrders)
      : true
  );

  const allowScheduled = !isStoreFullyClosed && (
    effectiveStatus !== undefined && effectiveStatus !== null
      ? Boolean(effectiveStatus.allowScheduledOrders)
      : true
  );

  const isEmergencyActive = Boolean(
    storeSettings?.isOrderPaused ||
    emergencyPause?.isPaused ||
    storeSettings?.emergencySettings?.isActive ||
    effectiveStatus?.isEmergencyActive
  );

  const holidayDates = Array.isArray(emergencyPause?.holidayDates) ? emergencyPause.holidayDates : [];
  const advanceBookingDays = Math.max(1, Math.min(30, Number(storeSettings?.advanceBookingDays || storeSettings?.effectiveStatus?.globalDefault?.advanceBookingDays || 4)));
  const sameDayCutoffMinutes = Math.max(0, Number(storeSettings?.sameDayCutoffMinutes ?? storeSettings?.effectiveStatus?.globalDefault?.sameDayCutoffMinutes ?? 60));

  const nav = useNavigate();
  const [selected, setSelected] = useState(() => activeAddress?.id || null);
  const [placing, setPlacing] = useState(false);
  const [addressModal, setAddressModal] = useState(false);

  // Delivery instructions state
  const [selectedInstructions, setSelectedInstructions] = useState(() => {
    try {
      const saved = sessionStorage.getItem('r2cart-delivery-instruction-presets');
      return saved ? JSON.parse(saved) : ['Call on arrival'];
    } catch {
      return ['Call on arrival'];
    }
  });
  const [customNote, setCustomNote] = useState(() => sessionStorage.getItem('r2cart-custom-note') || '');

  // Coupons state
  const [coupons, setCoupons] = useState([]);
  const [couponLoading, setCouponLoading] = useState(true);
  const [applying, setApplying] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState(() => {
    const code = sessionStorage.getItem('r2cart-coupon');
    const discount = Number(sessionStorage.getItem('r2cart-coupon-discount') || 0);
    return code ? { code, discount } : null;
  });

  const todayId = useMemo(() => formatLocalYMD(new Date()), []);
  const [todaySlots, setTodaySlots] = useState(null);

  useEffect(() => {
    let active = true;
    const fetchTodaySlots = () => {
      catalogService
        .listDeliverySlots(todayId)
        .then((slots) => {
          if (!active) return;
          if (Array.isArray(slots)) {
            setTodaySlots(slots);
          }
        })
        .catch(() => {});
    };
    fetchTodaySlots();
    window.addEventListener('r2cart:slots-updated', fetchTodaySlots);
    window.addEventListener('r2cart:settings-updated', fetchTodaySlots);
    window.addEventListener('focus', fetchTodaySlots);
    return () => {
      active = false;
      window.removeEventListener('r2cart:slots-updated', fetchTodaySlots);
      window.removeEventListener('r2cart:settings-updated', fetchTodaySlots);
      window.removeEventListener('focus', fetchTodaySlots);
    };
  }, [todayId]);

  // Scheduling state
  const dates = useMemo(
    () => getAvailableDates(holidayDates, advanceBookingDays, sameDayCutoffMinutes, todaySlots),
    [holidayDates, advanceBookingDays, sameDayCutoffMinutes, todaySlots]
  );
  const [deliveryType, setDeliveryType] = useState(() => {
    if (effectiveStatus && !effectiveStatus.allowImmediateOrders && effectiveStatus.allowScheduledOrders) {
      return 'SCHEDULED';
    }
    return 'INSTANT';
  });

  useEffect(() => {
    if (!allowImmediate && allowScheduled && deliveryType !== 'SCHEDULED') {
      setDeliveryType('SCHEDULED');
    } else if (!allowScheduled && allowImmediate && deliveryType !== 'INSTANT') {
      setDeliveryType('INSTANT');
    }
  }, [allowImmediate, allowScheduled, deliveryType]);

  const [userSelectedDateManually, setUserSelectedDateManually] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    return dates.find((d) => d.hasAvailableSlot) || dates[0];
  });

  useEffect(() => {
    if (!userSelectedDateManually && dates[0]?.hasAvailableSlot && selectedDate?.id !== dates[0]?.id) {
      setSelectedDate(dates[0]);
    } else if (selectedDate && !dates.some((d) => d.id === selectedDate.id)) {
      setSelectedDate(dates.find((d) => d.hasAvailableSlot) || dates[0]);
    }
  }, [dates, userSelectedDateManually]);

  const [dynamicSlots, setDynamicSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(() => {
    const isToday = dates[0]?.hasAvailableSlot;
    return TIME_SLOTS.find((s) => isSlotAvailable(s, isToday, sameDayCutoffMinutes)) || TIME_SLOTS[0];
  });

  const slotsToRender = useMemo(() => {
    const raw = dynamicSlots.length > 0 ? dynamicSlots : TIME_SLOTS.map((s) => ({
      ...s,
      isAvailable: isSlotAvailable(s, selectedDate?.isToday, sameDayCutoffMinutes)
    }));
    // Deduplicate slots by time window so each slot appears only once
    const seen = new Set();
    return raw.filter((s) => {
      const timeKey = s.startTime && s.endTime ? `${s.startTime}-${s.endTime}` : (s.time || s.label || '');
      const cleanKey = timeKey.toLowerCase().replace(/\s+/g, '');
      if (seen.has(cleanKey)) return false;
      seen.add(cleanKey);
      return true;
    });
  }, [dynamicSlots, selectedDate?.isToday, sameDayCutoffMinutes]);

  // Require login on checkout
  useEffect(() => {
    if (!user && !localStorage.getItem('r2cart-access-token')) {
      sessionStorage.setItem('r2cart-auth-redirect', '/checkout');
      openAuthModal('order');
      nav('/cart', { replace: true });
    }
  }, [user]);

  // Load slots for selected date with real-time listeners for instant admin reflection
  const loadDeliverySlots = useCallback((dateId) => {
    const targetDateId = dateId || selectedDate?.id;
    if (!targetDateId) return;
    catalogService
      .listDeliverySlots(targetDateId)
      .then((slots) => {
        if (Array.isArray(slots) && slots.length > 0) {
          setDynamicSlots(slots);
          setSelectedSlot((curr) => {
            const match = slots.find((s) => (s.id === curr?.id || s.label === curr?.label || s.label === curr?.time) && s.isAvailable);
            return match || slots.find((s) => s.isAvailable) || slots[0];
          });
        } else {
          setDynamicSlots([]);
        }
      })
      .catch(() => {
        setDynamicSlots([]);
      });
  }, [selectedDate?.id]);

  useEffect(() => {
    loadDeliverySlots(selectedDate?.id);
  }, [selectedDate?.id, loadDeliverySlots]);

  // Real-time synchronization when admin changes delivery slots or when switching tabs
  useEffect(() => {
    const handleRefresh = () => {
      if (selectedDate?.id) loadDeliverySlots(selectedDate.id);
    };
    const handleStorage = (e) => {
      if (e.key === 'r2cart-slots-updated' && selectedDate?.id) {
        loadDeliverySlots(selectedDate.id);
      }
    };
    window.addEventListener('r2cart:slots-updated', handleRefresh);
    window.addEventListener('r2cart:settings-updated', handleRefresh);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleRefresh);
    return () => {
      window.removeEventListener('r2cart:slots-updated', handleRefresh);
      window.removeEventListener('r2cart:settings-updated', handleRefresh);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleRefresh);
    };
  }, [selectedDate?.id, loadDeliverySlots]);

  // Auto select default address
  useEffect(() => {
    if (addressList.length > 0) {
      const currentExists = selected && addressList.some((item) => item.id === selected);
      if (!currentExists) {
        const available = addressList.filter((item) => Boolean(deliveryRulesFor(item.area)));
        const nextId = activeAddress?.id && available.some((a) => a.id === activeAddress.id)
          ? activeAddress.id
          : available.find((item) => item.default)?.id || available[0]?.id;
        setSelected(nextId);
        const nextAddr = addressList.find((a) => a.id === nextId);
        if (nextAddr) setActiveAddress(nextAddr);
      }
    }
  }, [addressList, deliveryZones, selected, activeAddress?.id]);

  // Sync selected address whenever activeAddress updates (e.g. from LocationModal)
  useEffect(() => {
    if (activeAddress?.id && selected !== activeAddress.id) {
      setSelected(activeAddress.id);
    }
  }, [activeAddress?.id]);

  // Load available coupons
  useEffect(() => {
    let active = true;
    customerService
      .coupons()
      .then((rows) => {
        if (!active) return;
        setCoupons(Array.isArray(rows) ? rows : rows?.data || []);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setCouponLoading(false);
      });
    return () => { active = false; };
  }, [subtotal]);

  const selectedAddress = addressList.find((item) => item.id === selected) || activeAddress;
  const rules = (selectedAddress?.area ? deliveryRulesFor(selectedAddress.area) : null) || activeDeliveryRules || deliveryConfig;

  const affectedVillageIds = useMemo(() => {
    const list = storeSettings?.emergencySettings?.affectedVillageIds ||
      effectiveStatus?.emergencyDetails?.affectedVillageIds ||
      [];
    return Array.isArray(list) ? list.map((id) => String(id)) : [];
  }, [storeSettings?.emergencySettings?.affectedVillageIds, effectiveStatus?.emergencyDetails?.affectedVillageIds]);

  const isSelectedAreaSuspended = useMemo(() => {
    if (!selectedAddress) return false;
    if (rules?.isPaused) return true;
    const isEmerg = Boolean(storeSettings?.isOrderPaused || effectiveStatus?.isEmergencyActive || storeSettings?.emergencySettings?.isActive);
    if (!isEmerg || emergencyType !== 'SELECTED_AREAS') return false;
    if (!affectedVillageIds.length) return false;

    const addrArea = String(selectedAddress.area || '').trim().toLowerCase();
    const addrVillageName = String(selectedAddress.villageName || '').trim().toLowerCase();
    const addrVillageId = String(selectedAddress.villageId || '');
    const rulesVillageId = String(rules?.villageId || '');
    const rulesVillageName = String(rules?.villageName || '').trim().toLowerCase();
    const rulesZoneId = String(rules?.zoneId || '');
    const rulesZoneName = String(rules?.zoneName || '').trim().toLowerCase();

    const matchedZone = (deliveryZones || []).find(z =>
      (z.id && (String(z.id) === addrVillageId || String(z.id) === String(selectedAddress.area))) ||
      (z.name && String(z.name).trim().toLowerCase() === addrArea)
    );

    return Boolean(
      affectedVillageIds.includes(addrVillageId) ||
      affectedVillageIds.includes(rulesVillageId) ||
      affectedVillageIds.includes(rulesZoneId) ||
      affectedVillageIds.includes(String(selectedAddress.area || '')) ||
      (matchedZone?.id && affectedVillageIds.includes(String(matchedZone.id))) ||
      (matchedZone?.name && affectedVillageIds.some(id => String(id).trim().toLowerCase() === String(matchedZone.name).trim().toLowerCase())) ||
      affectedVillageIds.some(id => {
        const idL = String(id).trim().toLowerCase();
        return idL === addrArea ||
               idL === addrVillageName ||
               idL === rulesVillageName ||
               idL === rulesZoneName;
      })
    );
  }, [selectedAddress, rules, storeSettings, effectiveStatus, emergencyType, affectedVillageIds, deliveryZones]);

  const deliveryFee = subtotal >= rules.freeDeliveryThreshold ? 0 : rules.deliveryFee;
  const total = Math.max(0, subtotal + deliveryFee - (coupon?.discount || 0));
  const minimumRemaining = Math.max(0, rules.minimumOrder - subtotal);
  const productSavings = Math.max(0, Number(mrpTotal || 0) - Number(subtotal || 0));
  const totalSavings = productSavings + (coupon?.discount || 0);

  if (!cartItems.length) {
    const popularCategories = (categories && categories.length > 0 ? categories : [
      { name: 'Fruits & Vegetables', slug: 'fruits-vegetables' },
      { name: 'Dairy & Bread', slug: 'dairy-bread' },
      { name: 'Atta, Rice & Dal', slug: 'atta-rice-dal' },
      { name: 'Snacks & Drinks', slug: 'snacks-drinks' },
      { name: 'Masalas & Spices', slug: 'masalas-oils' },
      { name: 'Cleaning & Household', slug: 'cleaning-household' }
    ]).slice(0, 6);

    const popularProducts = (products && products.length > 0 ? products : [])
      .filter((p) => p.stock > 0 && p.status !== 'INACTIVE')
      .slice(0, 4);

    const eta = activeDeliveryRules?.estimatedDelivery || deliveryConfig?.estimatedDelivery || '15–25 mins';

    return (
      <div className="container" style={{ padding: '0 0 30px', boxSizing: 'border-box' }}>
        <div className="checkout-empty-wrapper">
          <div className="checkout-empty-card">
            {/* Animated Hero Basket */}
            <div className="checkout-empty-icon-wrap">
              <ShoppingBag size={42} strokeWidth={2.2} />
              <div className="checkout-empty-sparkle">
                <Sparkles size={14} />
              </div>
            </div>

            {/* Delivery ETA Pill */}
            <div className="checkout-empty-eta-pill">
              <Zap size={14} color="#059669" />
              <span>Delivery in {eta}</span>
            </div>

            {/* Title & Subtitle */}
            <h1 className="checkout-empty-title">Your basket is empty</h1>
            <p className="checkout-empty-subtitle">
              Looks like you haven't added any groceries yet. Explore farm-fresh produce, dairy, snacks & household essentials delivered in minutes.
            </p>

            {/* Primary CTA */}
            <Link to="/" className="checkout-empty-cta">
              <span>Explore Groceries</span>
              <ArrowRight size={17} strokeWidth={2.4} />
            </Link>

            {/* Trust Assurance Strip */}
            <div className="checkout-empty-assurances">
              <div className="checkout-empty-assurance-item">
                <Zap size={18} color="#059669" />
                <b>15–30 Mins</b>
                <span>Express Doorstep</span>
              </div>
              <div className="checkout-empty-assurance-item" style={{ borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
                <Leaf size={18} color="#059669" />
                <b>100% Fresh</b>
                <span>Quality Assured</span>
              </div>
              <div className="checkout-empty-assurance-item">
                <ShieldCheck size={18} color="#059669" />
                <b>Pay on Delivery</b>
                <span>Cash & UPI</span>
              </div>
            </div>

            {/* Popular Categories Grid */}
            <div style={{ marginBottom: popularProducts.length > 0 ? '24px' : '8px', width: '100%' }}>
              <div className="checkout-empty-section-head">
                <div>
                  <b>Explore Categories</b>
                  <small>Quick access to daily essentials</small>
                </div>
                <Link to="/">View all →</Link>
              </div>

              <div className="checkout-empty-cats-grid">
                {popularCategories.map((cat) => (
                  <Link key={cat.slug || cat.name} to={cat.slug ? `/category/${cat.slug}` : '/'} className="checkout-empty-cat-card">
                    <div className="checkout-empty-cat-icon">
                      {cat.image ? (
                        <img src={cat.image} alt={cat.name} loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      ) : (
                        <ShoppingBag size={20} color="#059669" />
                      )}
                    </div>
                    <span className="checkout-empty-cat-name">{cat.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Trending Products Shelf with 1-Tap ADD */}
            {popularProducts.length > 0 && (
              <div style={{ width: '100%', boxSizing: 'border-box' }}>
                <div className="checkout-empty-section-head">
                  <div>
                    <b>Trending Groceries</b>
                    <small>Add directly to checkout in 1-tap</small>
                  </div>
                </div>

                <div className="checkout-empty-prods-grid">
                  {popularProducts.map((p) => (
                    <div key={p.id} className="checkout-empty-prod-card">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1, overflow: 'hidden' }}>
                        <img
                          src={p.image}
                          alt={p.name}
                          style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'contain', background: '#f8fafc', flexShrink: 0, border: '1px solid #f1f5f9' }}
                          loading="lazy"
                          onError={(e) => { e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2248%22 height=%2248%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2310b981%22 stroke-width=%221.75%22%3E%3Cpath d=%22M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z%22/%3E%3Cline x1=%223%22 x2=%2221%22 y1=%226%22 y2=%226%22/%3E%3Cpath d=%22M16 10a4 4 0 0 1-8 0%22/%3E%3C/svg%3E'; }}
                        />
                        <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                          <b style={{ fontSize: '13px', color: '#0f172a', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.name}
                          </b>
                          <small style={{ fontSize: '11px', color: '#64748b', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.unit || 'Standard pack'}
                          </small>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                            <b style={{ fontSize: '13px', color: '#0f172a' }}>{money(p.price)}</b>
                            {p.mrp > p.price && (
                              <del style={{ fontSize: '10.5px', color: '#94a3b8' }}>{money(p.mrp)}</del>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (typeof add === 'function') add(p.id);
                          else if (typeof qty === 'function') qty(p.id, 1);
                          notify?.(`Added ${p.name} to basket!`);
                        }}
                        className="checkout-empty-add-btn"
                      >
                        + ADD
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const toggleInstruction = (label) => {
    setSelectedInstructions((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  };

  const applyCouponCode = async (codeToApply) => {
    const code = (codeToApply || couponInput).trim().toUpperCase();
    if (!code) return notify('Please enter a coupon code', 'error');
    setApplying(code);
    try {
      const result = await customerService.validateCoupon(code);
      const next = { code: result.code, discount: Number(result.discount) };
      setCoupon(next);
      setCouponInput('');
      sessionStorage.setItem('r2cart-coupon', next.code);
      sessionStorage.setItem('r2cart-coupon-discount', String(next.discount));
      notify(`Coupon ${next.code} applied! You save ${money(next.discount)}`);
    } catch (error) {
      notify(error.message || 'Invalid coupon code', 'error');
    } finally {
      setApplying('');
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponInput('');
    sessionStorage.removeItem('r2cart-coupon');
    sessionStorage.removeItem('r2cart-coupon-discount');
    notify('Coupon removed');
  };

  const handleDateSelect = (date) => {
    setUserSelectedDateManually(true);
    setSelectedDate(date);
    const activeSlotList = dynamicSlots.length > 0 ? dynamicSlots : TIME_SLOTS;
    if (!isSlotAvailable(selectedSlot, date.isToday, sameDayCutoffMinutes)) {
      const firstAvail = activeSlotList.find((s) =>
        s.isAvailable !== undefined ? s.isAvailable : isSlotAvailable(s, date.isToday, sameDayCutoffMinutes)
      );
      if (firstAvail) setSelectedSlot(firstAvail);
    }
  };

  const placeOrder = async () => {
    if (isStoreFullyClosed) {
      return notify(effectiveStatus?.statusReason || emergencyPause?.message || 'Store orders are temporarily paused. Please check back shortly.', 'error');
    }
    if (isSelectedAreaSuspended) {
      return notify(
        effectiveStatus?.statusReason ||
        effectiveStatus?.emergencyDetails?.message ||
        'Deliveries to your selected area are temporarily paused. Please choose another delivery address or check back later.',
        'error'
      );
    }
    if (deliveryType === 'INSTANT' && !allowImmediate) {
      return notify(effectiveStatus?.statusReason || 'Store is currently closed for instant delivery. Please select a scheduled delivery slot.', 'error');
    }
    if (deliveryType === 'SCHEDULED' && !allowScheduled) {
      return notify('Scheduled orders are currently unavailable.', 'error');
    }
    if (deliveryType === 'SCHEDULED' && holidayDates.includes(selectedDate?.id)) {
      return notify('Deliveries are closed on this date due to a store holiday.', 'error');
    }
    if (placing) return;
    if (!selected || !selectedAddress) {
      notify('Please select or add your delivery address', 'error');
      setAddressModal(true);
      return;
    }
    if (!deliveryRulesFor(selectedAddress.area)) {
      return notify(`Delivery is unavailable in ${selectedAddress.area}`, 'error');
    }
    if (rules?.allowCod === false) {
      return notify(`Cash on Delivery is currently unavailable for ${selectedAddress.area}.`, 'error');
    }
    if (minimumRemaining > 0) {
      return notify(`Add ${money(minimumRemaining)} more to reach minimum order of ${money(rules.minimumOrder)}`, 'error');
    }
    if (deliveryType === 'SCHEDULED' && (!selectedDate || !selectedSlot)) {
      return notify('Please select a valid delivery date and time slot', 'error');
    }

    const comingSoonItem = cartItems.find((p) => isProductComingSoon(p, storeSettings));
    if (comingSoonItem) {
      return notify(`"${comingSoonItem.name}" is coming soon and cannot be ordered. Please remove it from your basket.`, 'error');
    }

    const combinedInstruction = [...selectedInstructions, customNote].filter(Boolean).join('. ');

    setPlacing(true);
    try {
      const order = await orderService.create({
        addressId: String(selected),
        couponCode: coupon?.code || null,
        deliveryInstruction: combinedInstruction || 'Call before delivery',
        paymentMethod: 'COD',
        deliveryType,
        deliveryDate: deliveryType === 'SCHEDULED' ? (selectedDate?.id || selectedDate?.label) : null,
        deliverySlot: deliveryType === 'SCHEDULED' ? (selectedSlot?.label || selectedSlot?.time) : null,
        items: cartItems.map((p) => ({ productId: p.id, quantity: p.qty }))
      });

      sessionStorage.setItem('last-order', JSON.stringify(order));
      sessionStorage.removeItem('r2cart-coupon');
      sessionStorage.removeItem('r2cart-coupon-discount');
      setOrderList((current) => [order, ...current]);
      setCart({});
      await refreshProducts();
      window.dispatchEvent(new Event('r2cart:products-updated'));
      window.dispatchEvent(new Event('r2cart:orders-updated'));
      notify('Order placed successfully! 🎉');
      nav('/order-success');
    } catch (error) {
      notify(error.message || 'Failed to place order. Please try again.', 'error');
    } finally {
      setPlacing(false);
    }
  };

  const saveAddress = async (value) => {
    try {
      const saved = addressView(await customerService.addAddress(addressPayload(value)));
      setAddressList((items) => [saved, ...items]);
      setSelected(saved.id);
      setActiveAddress(saved);
      setAddressModal(false);
      notify('Address saved successfully');
    } catch (error) {
      notify(error.message || 'Failed to save address', 'error');
    }
  };

  const scrollToBill = () => {
    const el = document.getElementById('checkout-bill-summary');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <style>{`
        .checkout-page-wrapper {
          max-width: 1100px;
          margin: 0 auto;
          padding: 16px 12px 120px;
          box-sizing: border-box;
          width: 100%;
          overflow-x: hidden;
        }
        .checkout-grid-container {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 24px;
          align-items: start;
          width: 100%;
          box-sizing: border-box;
        }
        .checkout-grid-container > section,
        .checkout-grid-container > aside {
          min-width: 0;
          max-width: 100%;
          box-sizing: border-box;
        }
        .checkout-card-v2 {
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
          padding: 18px;
          margin-bottom: 16px;
          transition: box-shadow 0.2s ease;
          box-sizing: border-box;
          max-width: 100%;
          overflow: hidden;
        }
        .checkout-step-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f1f5f9;
        }
        .checkout-step-num {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: #ecfdf5;
          color: #059669;
          font-size: 13px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .checkout-step-num.done {
          background: #059669;
          color: #ffffff;
        }
        .delivery-type-card-v2 {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 14px;
          border: 1.5px solid #e2e8f0;
          background: #ffffff;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          box-sizing: border-box;
          min-width: 0;
        }
        .delivery-type-card-v2.active {
          border-color: #059669;
          background: #f0fdf4;
          box-shadow: 0 0 0 1px #059669, 0 4px 12px rgba(5, 150, 105, 0.08);
        }
        .date-pill-v2 {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          cursor: pointer;
          transition: all 0.15s ease;
          flex-shrink: 0;
          min-width: 72px;
          text-align: center;
          box-sizing: border-box;
        }
        .date-pill-v2.active {
          background: #059669;
          border-color: #059669;
          color: #ffffff !important;
          box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);
        }
        .date-pill-v2.disabled {
          opacity: 0.45;
          cursor: not-allowed;
          background: #f1f5f9;
        }
        .slot-chip-v2 {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 11px 14px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: left;
          box-sizing: border-box;
          min-width: 0;
        }
        .slot-chip-v2.active {
          border-color: #059669;
          background: #f0fdf4;
          box-shadow: 0 0 0 1px #059669;
        }
        .slot-chip-v2.disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: #f8fafc;
        }
        .mobile-checkout-sticky-footer {
          display: none;
        }
        @media (max-width: 820px) {
          .checkout-page-wrapper {
            padding: 10px 10px 110px;
          }
          .checkout-grid-container {
            grid-template-columns: 100%;
            gap: 12px;
          }
          .checkout-card-v2 {
            padding: 14px;
          }
          .delivery-type-card-v2 {
            flex: 1 1 100%;
            min-width: 0;
          }
          .mobile-checkout-sticky-footer {
            display: flex;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: #ffffff;
            border-top: 1px solid #e2e8f0;
            box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.08);
            padding: 10px 16px calc(10px + env(safe-area-inset-bottom, 0px));
            z-index: 95;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
          }
        }
      `}</style>

      <div className="checkout-page-wrapper">
        {/* Contextual Emergency / Pause Notice */}
        {isStoreFullyClosed ? (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '14px',
              padding: '12px 16px',
              color: '#b91c1c',
              fontSize: '13px',
              marginBottom: '14px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800 }}>
              <AlertCircle size={18} />
              <span>Store Orders Temporarily Paused</span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#991b1b', lineHeight: 1.4 }}>
              {(effectiveStatus?.statusReason || emergencyPause?.message || 'We are temporarily not taking new orders due to high order volume. Please check back shortly.').trim().replace(/\s+\./g, '.')}
            </p>
          </div>
        ) : isSelectedAreaSuspended ? (
          <div
            style={{
              background: '#fff1f2',
              border: '1px solid #fecdd3',
              borderRadius: '12px',
              padding: '10px 14px',
              color: '#9f1239',
              fontSize: '13px',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
              <AlertCircle size={18} color="#e11d48" style={{ flexShrink: 0 }} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <b style={{ fontSize: '13px', color: '#881337', display: 'block', lineHeight: 1.3 }}>
                  Delivery Closed in {selectedAddress?.area || 'Your Area'}
                </b>
                <span style={{ fontSize: '11.5px', color: '#be123c', lineHeight: 1.3, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {effectiveStatus?.statusReason || effectiveStatus?.emergencyDetails?.message || `Deliveries to this village are temporarily suspended.`}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setLocationOpen(true)}
              style={{
                background: '#e11d48',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              Change →
            </button>
          </div>
        ) : !allowImmediate && allowScheduled ? (
          <div
            style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '14px',
              padding: '12px 16px',
              color: '#1d4ed8',
              fontSize: '13px',
              marginBottom: '14px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800 }}>
              <Calendar size={18} color="#2563eb" />
              <span>Instant Orders Paused · Slot Booking Open</span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#1e40af', lineHeight: 1.4 }}>
              {effectiveStatus?.statusReason || 'Instant 30-min delivery is temporarily paused. Please select an available delivery slot below to place your order.'}
            </p>
          </div>
        ) : allowImmediate && !allowScheduled && (emergencyType === 'SCHEDULED_ONLY' || isEmergencyActive) ? (
          <div
            style={{
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '14px',
              padding: '12px 16px',
              color: '#b45309',
              fontSize: '13px',
              marginBottom: '14px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800 }}>
              <Zap size={18} color="#d97706" />
              <span>Scheduled Orders Paused · Instant Delivery Available</span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#92400e', lineHeight: 1.4 }}>
              {effectiveStatus?.statusReason || 'Advance scheduled bookings are temporarily paused. You can still order for instant delivery.'}
            </p>
          </div>
        ) : null}

        {/* 2-Column Responsive Layout */}
        <div className="checkout-grid-container">
          {/* Left Column: Address, Speed/Slot, Instructions, Payment */}
          <section>
            {/* Step 1: Delivery Address (Compact Quick-Commerce Style) */}
            <div
              className="checkout-card-v2"
              style={{
                padding: '12px 14px',
                border: isSelectedAreaSuspended ? '1px solid #fca5a5' : '1px solid #e2e8f0',
                background: isSelectedAreaSuspended ? '#fff5f5' : '#ffffff',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                  <span
                    className={`checkout-step-num ${selectedAddress && !isSelectedAreaSuspended ? 'done' : ''}`}
                    style={{
                      width: '24px',
                      height: '24px',
                      fontSize: '11px',
                      flexShrink: 0,
                      background: isSelectedAreaSuspended ? '#fee2e2' : undefined,
                      color: isSelectedAreaSuspended ? '#dc2626' : undefined
                    }}
                  >
                    {isSelectedAreaSuspended ? <AlertCircle size={13} /> : selectedAddress ? <Check size={13} strokeWidth={3} /> : '1'}
                  </span>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                        Deliver to
                      </span>
                      {selectedAddress && (
                        <>
                          <b style={{ fontSize: '13px', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                            {selectedAddress.name}
                          </b>
                          <span
                            style={{
                              fontSize: '9.5px',
                              fontWeight: 800,
                              padding: '1px 5px',
                              borderRadius: '4px',
                              background: '#dcfce7',
                              color: '#15803d',
                              textTransform: 'uppercase',
                              flexShrink: 0
                            }}
                          >
                            {selectedAddress.type || 'HOME'}
                          </span>
                          {isSelectedAreaSuspended && (
                            <span
                              style={{
                                fontSize: '9.5px',
                                fontWeight: 800,
                                padding: '1px 5px',
                                borderRadius: '4px',
                                background: '#fee2e2',
                                color: '#b91c1c',
                                flexShrink: 0,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '2px'
                              }}
                            >
                              🚫 Paused
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    <p
                      style={{
                        margin: '2px 0 0',
                        fontSize: '11.5px',
                        color: selectedAddress ? '#475569' : '#dc2626',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: 1.3
                      }}
                      title={selectedAddress ? `${selectedAddress.line}, ${selectedAddress.cityLine || selectedAddress.city}` : 'No address selected'}
                    >
                      {selectedAddress
                        ? `${selectedAddress.line}, ${selectedAddress.cityLine || selectedAddress.city}`
                        : 'Please select a delivery address'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setLocationOpen(true)}
                  style={{
                    background: isSelectedAreaSuspended ? '#fee2e2' : '#f0fdf4',
                    border: isSelectedAreaSuspended ? '1px solid #fca5a5' : '1px solid #a7f3d0',
                    color: isSelectedAreaSuspended ? '#b91c1c' : '#059669',
                    padding: '5px 12px',
                    borderRadius: '7px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'all 0.15s ease'
                  }}
                >
                  {selectedAddress ? 'Change' : '+ Add'}
                </button>
              </div>
            </div>

            {/* Step 2: Delivery Speed & Schedule Selection */}
            <div className="checkout-card-v2">
              <div className="checkout-step-header">
                <span className="checkout-step-num done">
                  <Check size={14} strokeWidth={3} />
                </span>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                  Delivery Timing
                </h3>
              </div>

              {/* Speed Mode Selector Cards */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
                <div
                  role="button"
                  tabIndex={0}
                  className={`delivery-type-card-v2 ${deliveryType === 'INSTANT' && !isSelectedAreaSuspended ? 'active' : ''}`}
                  onClick={() => {
                    if (isSelectedAreaSuspended) {
                      return notify(effectiveStatus?.statusReason || `Deliveries to ${selectedAddress?.area || 'your area'} are temporarily suspended.`, 'error');
                    }
                    if (!allowImmediate) {
                      return notify(effectiveStatus?.statusReason || 'Store is currently closed for instant delivery.', 'error');
                    }
                    setDeliveryType('INSTANT');
                  }}
                  style={!allowImmediate || isSelectedAreaSuspended ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: deliveryType === 'INSTANT' && !isSelectedAreaSuspended ? '#059669' : '#ecfdf5',
                      color: deliveryType === 'INSTANT' && !isSelectedAreaSuspended ? '#ffffff' : '#059669',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Zap size={18} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <b style={{ fontSize: '13.5px', color: '#0f172a' }}>Instant Delivery</b>
                      <span
                        style={{
                          fontSize: '9.5px',
                          fontWeight: 800,
                          padding: '1px 5px',
                          borderRadius: '4px',
                          background: isSelectedAreaSuspended ? '#fee2e2' : allowImmediate ? '#dcfce7' : '#fee2e2',
                          color: isSelectedAreaSuspended ? '#b91c1c' : allowImmediate ? '#15803d' : '#b91c1c'
                        }}
                      >
                        {isSelectedAreaSuspended ? 'Area Closed' : allowImmediate ? 'Fastest' : 'Closed'}
                      </span>
                    </div>
                    <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#64748b' }}>
                      {isSelectedAreaSuspended ? `Deliveries to ${selectedAddress?.area || 'this area'} suspended` : allowImmediate ? `Estimated in ${rules?.estimatedDelivery || '15–30 mins'}` : 'Closed outside store hours'}
                    </p>
                  </div>
                  {deliveryType === 'INSTANT' && !isSelectedAreaSuspended && (
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#059669', color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </div>

                <div
                  role="button"
                  tabIndex={0}
                  className={`delivery-type-card-v2 ${deliveryType === 'SCHEDULED' && allowScheduled && !isSelectedAreaSuspended ? 'active' : ''}`}
                  onClick={() => {
                    if (isSelectedAreaSuspended) {
                      return notify(effectiveStatus?.statusReason || `Deliveries to ${selectedAddress?.area || 'your area'} are temporarily suspended.`, 'error');
                    }
                    if (!allowScheduled) {
                      return notify(effectiveStatus?.statusReason || (isStoreFullyClosed ? 'Store orders are temporarily paused.' : 'Scheduled delivery is currently unavailable.'), 'error');
                    }
                    setDeliveryType('SCHEDULED');
                  }}
                  style={!allowScheduled || isSelectedAreaSuspended ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: deliveryType === 'SCHEDULED' && allowScheduled && !isSelectedAreaSuspended ? '#059669' : '#f0f9ff',
                      color: deliveryType === 'SCHEDULED' && allowScheduled && !isSelectedAreaSuspended ? '#ffffff' : '#0284c7',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Calendar size={18} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <b style={{ fontSize: '13.5px', color: '#0f172a' }}>Schedule Later</b>
                      <span
                        style={{
                          fontSize: '9.5px',
                          fontWeight: 800,
                          padding: '1px 5px',
                          borderRadius: '4px',
                          background: isSelectedAreaSuspended ? '#fee2e2' : allowScheduled ? '#e0f2fe' : '#fee2e2',
                          color: isSelectedAreaSuspended ? '#b91c1c' : allowScheduled ? '#0369a1' : '#b91c1c'
                        }}
                      >
                        {isSelectedAreaSuspended ? 'Area Closed' : allowScheduled ? 'Slot' : 'Closed'}
                      </span>
                    </div>
                    <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#64748b' }}>
                      {isSelectedAreaSuspended ? 'Bookings unavailable for this area' : allowScheduled ? 'Choose preferred date & time' : 'Advance bookings temporarily paused'}
                    </p>
                  </div>
                  {deliveryType === 'SCHEDULED' && allowScheduled && !isSelectedAreaSuspended && (
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#059669', color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </div>
              </div>



              {/* Scheduled Date & Time Pickers */}
              {deliveryType === 'SCHEDULED' && !allowScheduled && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '14px', padding: '14px', color: '#b91c1c', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span>Advance scheduled ordering is currently paused. Please check back later.</span>
                </div>
              )}

              {deliveryType === 'SCHEDULED' && allowScheduled && (
                <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '14px', border: '1px solid #e2e8f0', boxSizing: 'border-box', width: '100%', overflow: 'hidden' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#334155', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} color="#059669" /> Select Delivery Date:
                  </div>

                  {/* Dates Row */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', maxWidth: '100%', boxSizing: 'border-box', paddingBottom: '4px' }}>
                    {dates.map((d) => {
                      const isCur = selectedDate?.id === d.id;
                      const disabled = !d.hasAvailableSlot;
                      return (
                        <button
                          key={d.id}
                          type="button"
                          disabled={disabled}
                          className={`date-pill-v2 ${isCur ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
                          onClick={() => handleDateSelect(d)}
                        >
                          <span style={{ fontSize: '11px', fontWeight: 700 }}>{d.dayName}</span>
                          <span style={{ fontSize: '13px', fontWeight: 900, marginTop: '2px' }}>{d.dateFormatted}</span>
                          {d.isHoliday ? (
                            <span style={{ fontSize: '9px', color: '#ef4444', fontWeight: 800, marginTop: '2px' }}>Holiday</span>
                          ) : disabled ? (
                            <span style={{ fontSize: '9px', color: '#94a3b8', marginTop: '2px' }}>Closed</span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#334155', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={14} color="#059669" /> Select Time Slot:
                  </div>

                  {/* Clean, Compact Slots Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', width: '100%', boxSizing: 'border-box' }}>
                    {slotsToRender.map((s) => {
                      const available = Boolean(s.isAvailable);
                      const isCur = (selectedSlot?.id === s.id || selectedSlot?.label === s.label) && available;
                      const timeStr = s.startTime && s.endTime
                        ? `${formatSlotTime(s.startTime)} – ${formatSlotTime(s.endTime)}`
                        : (s.time || '');
                      const slotTitle = (s.label || '').replace(/\s*\([^)]*\)/g, '').trim() || s.name || 'Slot';

                      return (
                        <button
                          key={s.id || `${s.startTime}-${s.endTime}`}
                          type="button"
                          disabled={!available}
                          className={`slot-chip-v2 ${isCur ? 'active' : ''} ${!available ? 'disabled' : ''}`}
                          onClick={() => available && setSelectedSlot(s)}
                          style={{
                            padding: '9px 12px',
                            minHeight: 'auto',
                            borderRadius: '10px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'stretch',
                            textAlign: 'left',
                            cursor: available ? 'pointer' : 'not-allowed',
                            transition: 'all 0.15s ease',
                            background: isCur ? '#ecfdf5' : available ? '#ffffff' : '#f8fafc',
                            border: isCur ? '1.5px solid #059669' : '1px solid #e2e8f0',
                            boxShadow: isCur ? '0 2px 8px -2px rgba(5,150,105,0.2)' : 'none'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', marginBottom: '2px' }}>
                            <b style={{ fontSize: '12px', color: isCur ? '#059669' : '#0f172a', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {slotTitle}
                            </b>
                            {available && isCur && (
                              <Check size={13} color="#059669" strokeWidth={3} style={{ flexShrink: 0 }} />
                            )}
                            {!available && (
                              <span style={{ fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '4px', background: '#fee2e2', color: '#b91c1c', flexShrink: 0 }}>
                                {s.isFull ? 'Full' : 'Closed'}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '10.5px', color: isCur ? '#047857' : '#64748b', fontWeight: 600 }}>{timeStr}</div>
                          {available && s.remainingOrders !== undefined && (
                            <div style={{ fontSize: '9.5px', color: isCur ? '#059669' : '#059669', marginTop: '3px', fontWeight: 700 }}>
                              {s.remainingOrders} left
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Delivery Preferences & Instructions */}
            <div className="checkout-card-v2" style={{ padding: '14px' }}>
              <div className="checkout-step-header" style={{ marginBottom: '10px', paddingBottom: '10px' }}>
                <span className="checkout-step-num done" style={{ width: '22px', height: '22px', fontSize: '11px' }}>
                  <Check size={12} strokeWidth={3} />
                </span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                    Delivery Instructions
                  </h3>
                  <small style={{ fontSize: '11px', color: '#64748b' }}>
                    Guide your rider for a smooth drop-off
                  </small>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '8px', marginBottom: '10px' }}>
                {PRESET_INSTRUCTIONS.map((pref) => {
                  const isActive = selectedInstructions.includes(pref.label);
                  return (
                    <button
                      key={pref.id}
                      type="button"
                      onClick={() => toggleInstruction(pref.label)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '9px 11px',
                        borderRadius: '10px',
                        border: isActive ? '1.5px solid #059669' : '1px solid #e2e8f0',
                        background: isActive ? '#f0fdf4' : '#ffffff',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                        boxSizing: 'border-box'
                      }}
                    >
                      <span style={{ fontSize: '18px', flexShrink: 0 }}>{pref.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <b style={{ fontSize: '11.5px', color: isActive ? '#047857' : '#0f172a', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {pref.label}
                        </b>
                        <span style={{ fontSize: '9.5px', color: '#64748b', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {pref.sub}
                        </span>
                      </div>
                      {isActive && (
                        <Check size={13} color="#059669" strokeWidth={3} style={{ flexShrink: 0 }} />
                      )}
                    </button>
                  );
                })}
              </div>

              <input
                type="text"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="✍️ Any specific instructions? (e.g. Landmark, second floor, leave on table)"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  boxSizing: 'border-box',
                  background: '#f8fafc'
                }}
              />
            </div>

            {/* Step 4: Items in Order (Direct compact list, no hide/view toggle) */}
            <div className="checkout-card-v2" style={{ padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '7px',
                      background: '#ecfdf5',
                      color: '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <ShoppingBag size={15} />
                  </div>
                  <div>
                    <b style={{ fontSize: '13.5px', color: '#0f172a' }}>
                      Items in Order ({cartItems.length})
                    </b>
                  </div>
                </div>
                <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>
                  {cartItems.reduce((s, i) => s + i.qty, 0)} units · {money(subtotal)}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      padding: '6px 0',
                      borderBottom: '1px solid #f8fafc',
                      fontSize: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover', background: '#f8fafc', flexShrink: 0 }}
                      />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <b style={{ display: 'block', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '12px' }}>
                          {item.name}
                        </b>
                        <small style={{ color: '#64748b', fontSize: '10.5px' }}>
                          {item.unit || 'Pack'} · Qty: {item.qty} × {money(item.price)}
                        </small>
                      </div>
                    </div>
                    <b style={{ color: '#0f172a', flexShrink: 0, fontSize: '12px' }}>
                      {money(item.price * item.qty)}
                    </b>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 5: Payment Option (Compact Single-Row Card) */}
            <div
              className="checkout-card-v2"
              style={{
                padding: '12px 14px',
                boxSizing: 'border-box',
                width: '100%'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: '#ecfdf5',
                      color: '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Banknote size={17} />
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <b style={{ fontSize: '13px', color: '#0f172a' }}>Cash on Delivery (COD)</b>
                      <span
                        style={{
                          fontSize: '9.5px',
                          fontWeight: 800,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: rules?.allowCod === false ? '#fee2e2' : '#dcfce7',
                          color: rules?.allowCod === false ? '#b91c1c' : '#15803d',
                          textTransform: 'uppercase',
                          flexShrink: 0
                        }}
                      >
                        {rules?.allowCod === false ? 'Unavailable' : 'Available'}
                      </span>
                    </div>
                    <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Pay via cash or UPI scanner upon doorstep delivery
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: '#059669',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Check size={12} strokeWidth={3} />
                </div>
              </div>

              {rules?.allowCod === false && (
                <div style={{ marginTop: '8px', padding: '8px 12px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', color: '#b91c1c', fontSize: '12px' }}>
                  ⚠️ Cash on Delivery is currently disabled for {selectedAddress?.area || 'selected delivery zone'}.
                </div>
              )}
            </div>
          </section>

          {/* Right Column: Coupons & Bill Details */}
          <aside id="checkout-bill-summary">
            {/* Promo / Coupon Card */}
            <div className="checkout-card-v2">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Tag size={16} color="#059669" />
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                  Coupon & Offers
                </h4>
              </div>

              {coupon ? (
                <div
                  style={{
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#065f46', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={14} color="#059669" />
                      <span>{coupon.code} Applied</span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#047857', marginTop: '1px' }}>
                      Saving {money(coupon.discount)} on your bill
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={removeCoupon}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#dc2626',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: '4px 8px'
                    }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="Enter promo code"
                      style={{
                        flex: 1,
                        padding: '9px 12px',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '13px',
                        fontWeight: 700,
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                        outline: 'none'
                      }}
                    />
                    <button
                      type="button"
                      disabled={Boolean(applying) || !couponInput.trim()}
                      onClick={() => applyCouponCode()}
                      style={{
                        padding: '0 16px',
                        borderRadius: '10px',
                        background: '#059669',
                        color: '#ffffff',
                        border: 'none',
                        fontSize: '12.5px',
                        fontWeight: 800,
                        cursor: applying || !couponInput.trim() ? 'not-allowed' : 'pointer',
                        opacity: applying || !couponInput.trim() ? 0.6 : 1
                      }}
                    >
                      {applying ? 'Applying…' : 'APPLY'}
                    </button>
                  </div>

                  {/* Available coupon chips */}
                  {coupons.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                      {coupons.slice(0, 3).map((c) => (
                        <button
                          key={c.id || c.code}
                          type="button"
                          onClick={() => applyCouponCode(c.code)}
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: '8px',
                            background: '#f8fafc',
                            border: '1px dashed #059669',
                            color: '#059669',
                            cursor: 'pointer'
                          }}
                        >
                          Use {c.code}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Bill Summary Card */}
            <div className="checkout-card-v2">
              <h4 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                Bill Details
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                {mrpTotal > subtotal && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                    <span>Items Total (MRP)</span>
                    <del>{money(mrpTotal)}</del>
                  </div>
                )}

                {productSavings > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 600 }}>
                    <span>Product Discount</span>
                    <span>-{money(productSavings)}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#1e293b' }}>
                  <span>Item Subtotal</span>
                  <b>{money(subtotal)}</b>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#1e293b' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span>Delivery Partner Fee</span>
                    {rules?.freeDeliveryThreshold > 0 && (
                      <small style={{ fontSize: '10.5px', color: '#64748b' }}>
                        Free on orders above {money(rules.freeDeliveryThreshold)}
                      </small>
                    )}
                  </div>
                  <b>
                    {deliveryFee === 0 ? (
                      <span style={{ color: '#059669', fontWeight: 800 }}>FREE</span>
                    ) : (
                      money(deliveryFee)
                    )}
                  </b>
                </div>

                {coupon?.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 700 }}>
                    <span>Coupon Savings ({coupon.code})</span>
                    <span>-{money(coupon.discount)}</span>
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingTop: '12px',
                    marginTop: '4px',
                    borderTop: '1.5px solid #e2e8f0',
                    fontSize: '16px',
                    fontWeight: 900,
                    color: '#0f172a'
                  }}
                >
                  <span>To Pay</span>
                  <span style={{ color: '#059669' }}>{money(total)}</span>
                </div>
              </div>

              {/* Quality & Safety Assurance */}
              <div
                style={{
                  marginTop: '16px',
                  padding: '10px 12px',
                  background: '#f8fafc',
                  border: '1px solid #f1f5f9',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '11.5px',
                  color: '#475569',
                  lineHeight: 1.4
                }}
              >
                <ShieldCheck size={20} color="#059669" style={{ flexShrink: 0 }} />
                <span><b>Quality & Freshness Guarantee:</b> 100% refund or free replacement for any damaged or missing item.</span>
              </div>

              {/* Desktop Place Order Button */}
              {(() => {
                const isOrderBlocked = Boolean(
                  placing ||
                  isStoreFullyClosed ||
                  isSelectedAreaSuspended ||
                  (!allowImmediate && !allowScheduled) ||
                  (deliveryType === 'INSTANT' && !allowImmediate) ||
                  (deliveryType === 'SCHEDULED' && !allowScheduled) ||
                  rules?.allowCod === false ||
                  minimumRemaining > 0 ||
                  (deliveryType === 'SCHEDULED' && holidayDates.includes(selectedDate?.id))
                );

                const blockedReasonLabel = placing
                  ? 'Placing Order…'
                  : isStoreFullyClosed || (!allowImmediate && !allowScheduled)
                  ? 'Orders Paused'
                  : isSelectedAreaSuspended
                  ? `Delivery Closed in ${selectedAddress?.area || 'Area'}`
                  : deliveryType === 'SCHEDULED' && !allowScheduled
                  ? 'Scheduling Paused'
                  : deliveryType === 'INSTANT' && !allowImmediate
                  ? 'Store Closed (Schedule Only)'
                  : rules?.allowCod === false
                  ? 'COD Unavailable'
                  : minimumRemaining > 0
                  ? `Add ${money(minimumRemaining)} more`
                  : null;

                return (
                  <div style={{ marginTop: '16px' }} className="desktop-only-action">
                    <Button
                      className="wide"
                      disabled={isOrderBlocked}
                      onClick={placeOrder}
                      style={{
                        height: '46px',
                        fontSize: '14.5px',
                        fontWeight: 800,
                        borderRadius: '12px',
                        background: isOrderBlocked ? '#cbd5e1' : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                        color: isOrderBlocked ? '#64748b' : '#ffffff',
                        cursor: isOrderBlocked ? 'not-allowed' : 'pointer',
                        boxShadow: isOrderBlocked ? 'none' : '0 4px 14px rgba(5, 150, 105, 0.3)'
                      }}
                    >
                      {blockedReasonLabel || <span>Place Order · Pay {money(total)} →</span>}
                    </Button>
                  </div>
                );
              })()}
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile Sticky Bottom Place Order Bar */}
      {(() => {
        const isOrderBlocked = Boolean(
          placing ||
          isStoreFullyClosed ||
          isSelectedAreaSuspended ||
          (!allowImmediate && !allowScheduled) ||
          (deliveryType === 'INSTANT' && !allowImmediate) ||
          (deliveryType === 'SCHEDULED' && !allowScheduled) ||
          rules?.allowCod === false ||
          minimumRemaining > 0 ||
          (deliveryType === 'SCHEDULED' && holidayDates.includes(selectedDate?.id))
        );

        const blockedReasonLabel = placing
          ? 'Placing…'
          : isStoreFullyClosed || (!allowImmediate && !allowScheduled)
          ? 'Orders Paused'
          : isSelectedAreaSuspended
          ? 'Area Closed'
          : deliveryType === 'SCHEDULED' && !allowScheduled
          ? 'Scheduling Paused'
          : deliveryType === 'INSTANT' && !allowImmediate
          ? 'Store Closed'
          : minimumRemaining > 0
          ? `Add ${money(minimumRemaining)}`
          : null;

        return (
          <div className="mobile-checkout-sticky-footer">
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }} onClick={scrollToBill} role="button" tabIndex={0}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>
                  {money(total)}
                </span>
                {totalSavings > 0 && (
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      background: '#ecfdf5',
                      color: '#059669',
                      padding: '1px 6px',
                      borderRadius: '6px'
                    }}
                  >
                    Saved {money(totalSavings)}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); scrollToBill(); }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#059669',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                Pay on Delivery (COD) · View Bill ▲
              </button>
            </div>

            <button
              type="button"
              disabled={isOrderBlocked}
              onClick={placeOrder}
              style={{
                height: '44px',
                padding: '0 20px',
                borderRadius: '12px',
                background: isOrderBlocked ? '#cbd5e1' : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: isOrderBlocked ? '#64748b' : '#ffffff',
                border: 'none',
                fontSize: '14px',
                fontWeight: 800,
                cursor: isOrderBlocked ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: isOrderBlocked ? 'none' : '0 4px 14px rgba(5, 150, 105, 0.35)',
                flexShrink: 0
              }}
            >
              {blockedReasonLabel ? (
                <span>{blockedReasonLabel}</span>
              ) : (
                <>
                  <span>Place Order</span>
                  <ArrowRight size={16} strokeWidth={2.5} />
                </>
              )}
            </button>
          </div>
        );
      })()}

      {/* Address Form Modal */}
      <Modal
        open={addressModal}
        onClose={() => setAddressModal(false)}
        title="Add Delivery Address"
        size="location-modal"
      >
        <div className="modal-body">
          <AddressForm onCancel={() => setAddressModal(false)} onSave={saveAddress} />
        </div>
      </Modal>
    </>
  );
}

export default CheckoutPage;
