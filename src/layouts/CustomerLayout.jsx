import {useEffect, useState, useMemo, useCallback} from 'react'; import {Link,NavLink,useLocation,useNavigate} from 'react-router-dom';
import {ArrowLeft,ArrowRight,Briefcase,Camera,Check,ChevronDown,Clock3,Globe,Heart,History,Home,LogOut,MapPin,Menu,Minus,Package,Plus,Search,Share2,ShoppingBag,ShoppingCart,Sparkles,UserRound,X,Zap,AlertCircle} from 'lucide-react';
import {useApp} from '../context/AppContext'; import {Button,Modal,SearchInput,money} from '../components/ui';
import {useLanguage} from '../context/LanguageContext';
import LaunchNoticeModal from '../components/customer/LaunchNoticeModal';
import brandWordmark from '../assets/r2cart-logo.png';
import {BRAND} from '../config/brand';
import {customerService} from '../services/customer.service';
import {catalogService} from '../services/catalog.service';
import {addressPayload,addressView} from '../utils/address';

import {ItemPrice,PriceSummary} from '../components/customer/PriceSummary';
export function Logo(){return <Link className="logo" to="/" aria-label={`${BRAND.name} home`}><span className="brand-wordmark"><img src={brandWordmark} alt={BRAND.name}/></span></Link>}
function HeaderSearch({user}){const nav=useNavigate();const {notify}=useApp();const [q,setQ]=useState('');const [open,setOpen]=useState(false);const [history,setHistory]=useState([]);const load=async()=>{setOpen(true);try{setHistory(user?await customerService.searchHistory():JSON.parse(localStorage.getItem('grocify-search-history')||'[]'))}catch(error){notify(error.message,'error')}};const go=value=>{const query=value.trim();if(!query)return;setOpen(false);nav(`/search?q=${encodeURIComponent(query)}`)};const remove=async value=>{try{const next=history.filter(item=>item!==value);if(user)await customerService.removeSearch(value);else localStorage.setItem('grocify-search-history',JSON.stringify(next));setHistory(next);notify('Search removed')}catch(error){notify(error.message,'error')}};const clear=async()=>{try{if(user)await customerService.clearSearchHistory();else localStorage.removeItem('grocify-search-history');setHistory([]);notify('Search history cleared')}catch(error){notify(error.message,'error')}};return <div className="header-search"><SearchInput value={q} onChange={setQ} onSubmit={()=>go(q)} onFocus={load} onBlur={()=>setTimeout(()=>setOpen(false),150)}/>{open&&<div className="header-search-history" onMouseDown={event=>event.preventDefault()}><div className="row between"><b>Recent searches</b>{history.length>0&&<button type="button" onClick={clear}>Clear all</button>}</div>{history.length?<div>{history.map(item=><span className="header-history-row" key={item}><button type="button" onClick={()=>go(item)}><History/><span>{item}</span></button><button type="button" className="remove-history" onClick={()=>remove(item)} aria-label={`Remove ${item}`}>×</button></span>)}</div>:<p>No recent searches yet.</p>}</div>}</div>}
export function Header(){const nav=useNavigate();const routeLocation=useLocation();const isSearchPage=routeLocation.pathname==='/search';const {cartItems,setLocationOpen,setCartOpen,user,location,activeDeliveryRules,deliveryConfig}=useApp();const {lang,toggleLang,t}=useLanguage();const count=cartItems.reduce((s,x)=>s+x.qty,0),rules=activeDeliveryRules||deliveryConfig;const rawEta=rules?.estimatedDelivery;const cleanEta=rawEta&&!rawEta.toLowerCase().includes('unavailable')?rawEta:'15–20 mins';const isPaused=Boolean(rules?.isPaused);return <><header className={`site-header ${isSearchPage?'search-route-header':''}`}><div className="header-main container"><Logo/><button className="location-btn" onClick={()=>setLocationOpen(true)} style={isPaused?{borderColor:'#fca5a5',background:'#fff5f5'}:undefined}><span>{isPaused?<AlertCircle size={19} color="#ef4444"/>:<MapPin size={19}/>}</span><span>{isPaused?<b style={{color:'#ef4444'}}>{t('deliveryPaused')}</b>:<b>{t('deliveryIn')} {cleanEta}</b>}<small title={location} style={isPaused?{color:'#991b1b'}:undefined}>{location} {isPaused?<span style={{fontWeight:800}}>(Paused)</span>:null} <ChevronDown size={13}/></small></span></button>{!isSearchPage?<HeaderSearch user={user}/>:<div style={{flex:1,minWidth:'160px'}}/>}<button type="button" className="lang-toggle-btn" onClick={toggleLang} title={lang==='hi'?'Switch to English':'हिंदी में बदलें'} aria-label="Toggle language"><Globe size={16} color="#059669"/><span>{lang==='hi'?'English':'हिंदी'}</span></button><Link className="account-btn" to={user?'/account':'/login'} title={user?.name||'Account'}><UserRound/><span><small>{user?t('welcomeBack'):t('helloSignIn')}</small><b title={user?.name}>{user?.name||t('account')}</b></span></Link><button className="cart-btn" onClick={()=>setCartOpen(true)}><ShoppingCart size={19} strokeWidth={2.2}/><span>{count?<><b>{count} {t('items')}</b><small>{money(cartItems.reduce((s,x)=>s+x.price*x.qty,0))}</small></>:<b>{t('myCart')}</b>}</span>{count>0&&<i>{count}</i>}</button></div><div className="mobile-head container"><div className="mobile-top-bar"><Logo/><div className="mobile-head-actions"><button type="button" className="mobile-lang-btn" onClick={toggleLang} title={lang==='hi'?'English':'हिंदी'}><Globe size={13} color="#059669"/><span>{lang==='hi'?'EN':'हिं'}</span></button><Link className="mobile-user-btn" to={user?'/account':'/login'} aria-label={user?'My account':'Sign in'} title={user?.name||'Account'}><UserRound size={16}/><span title={user?.name}>{user?(user.name||t('account')):t('signIn')}</span></Link><button className="mobile-cart" onClick={()=>setCartOpen(true)} aria-label="Shopping cart"><ShoppingCart size={19} strokeWidth={2.2}/>{count>0&&<i>{count}</i>}</button></div></div><div className="mobile-sub-row"><button className="mobile-location" onClick={()=>setLocationOpen(true)} style={isPaused?{borderColor:'#fca5a5',background:'#fff5f5'}:undefined}>{isPaused?<AlertCircle size={15} color="#ef4444"/>:<Clock3 size={15}/>}<span>{isPaused?<b style={{color:'#ef4444'}}>{t('deliveryPaused')}</b>:<b>{t('deliveryIn')} {cleanEta}</b>}<small title={location} style={isPaused?{color:'#991b1b'}:undefined}>{location}</small></span><ChevronDown size={14}/></button></div>{!isSearchPage&&<div onClick={()=>nav('/search')}><SearchInput value="" placeholder={t('searchPlaceholder')}/></div>}</div></header></>}
export function Footer(){const {storeSettings}=useApp();const legalEntity=storeSettings?.policies?.legalName||BRAND.company;const legalAddress=storeSettings?.address||storeSettings?.policies?.officeAddress||'Bailey Road, Patna, Bihar — 800001';return <footer><div className="container footer-grid"><div><Logo/><p>{BRAND.tagline}</p><p style={{fontSize:'12px',color:'var(--muted)',marginTop:'6px'}}>{legalEntity} · {legalAddress}</p><div className="social"><button aria-label="Social gallery"><Camera/></button><button aria-label={`Share ${BRAND.name}`}><Share2/></button></div></div><div><h4>{BRAND.name}</h4><Link to="/about">About Us</Link><Link to="/contact">Contact Us</Link><Link to="/support">Help & Support</Link><Link to="/grievance">Grievance Redressal</Link></div><div><h4>Policies & Legal</h4><Link to="/privacy">Privacy Policy</Link><Link to="/terms">Terms & Conditions</Link><Link to="/refund-policy">Return & Refund Policy</Link><Link to="/cancellation-policy">Cancellation Policy</Link><Link to="/cookie-policy">Cookie Policy</Link></div><div><h4>Delivery & Shopping</h4><Link to="/delivery-info">Shipping & Delivery</Link><Link to="/orders">Track Your Order</Link><Link to="/coupons">Offers & Coupons</Link><Link to="/search">Browse Catalogue</Link></div></div><div className="footer-bottom"><div className="container">© 2026 {legalEntity} · {BRAND.tagline} · All rights reserved.</div></div></footer>}
export function MobileBottomNav(){const {categories,user}=useApp();const {t}=useLanguage();const mobileNav=[{id:'nav-home',to:'/',label:t('home'),Icon:Home},{id:'nav-cats',to:`/category/${categories[0]?.slug||'fruits-vegetables'}`,label:t('categories'),Icon:Menu},{id:'nav-search',to:'/search',label:t('search'),Icon:Search},{id:'nav-orders',to:user?'/orders':'/login',label:t('orders'),Icon:Package},{id:'nav-account',to:user?'/account':'/login',label:user?t('account'):t('signIn'),Icon:UserRound}];return <nav className="bottom-nav">{mobileNav.map(item=><NavLink key={item.id} to={item.to} end={item.to==='/'}><item.Icon/><span>{item.label}</span></NavLink>)}</nav>}
export function LocationModal(){
  const nav=useNavigate();
  const {locationOpen,setLocationOpen,notify,addressList,setAddressList,addressesLoaded,user,deliveryRulesFor,activeAddress,setActiveAddress,storeSettings,deliveryZones}=useApp();
  const [manual,setManual]=useState(false);

  const emergencyPause = storeSettings?.policies?.emergencyPause;
  const effectiveStatus = storeSettings?.effectiveStatus;
  const emergencyType = storeSettings?.emergencySettings?.type || effectiveStatus?.emergencyDetails?.type;
  const affectedVillageIds = useMemo(() => {
    const list = storeSettings?.emergencySettings?.affectedVillageIds ||
      effectiveStatus?.emergencyDetails?.affectedVillageIds ||
      [];
    return Array.isArray(list) ? list.map((id) => String(id).trim().toLowerCase()) : [];
  }, [storeSettings?.emergencySettings?.affectedVillageIds, effectiveStatus?.emergencyDetails?.affectedVillageIds]);

  const isAreaSuspended = useCallback((addr) => {
    if (!addr) return false;
    const isEmerg = Boolean(storeSettings?.isOrderPaused || effectiveStatus?.isEmergencyActive || storeSettings?.emergencySettings?.isActive);
    if (!isEmerg) return false;
    if (emergencyType === 'ALL_ORDERS' || emergencyType === 'STORE_CLOSE') return true;
    if (emergencyType !== 'SELECTED_AREAS') return false;
    if (!affectedVillageIds.length) return false;

    const cleanArea = String(addr.area || '').trim().toLowerCase();
    const cleanVillage = String(addr.villageName || '').trim().toLowerCase();
    const addrVillageId = String(addr.villageId || '').trim().toLowerCase();
    const matchedZone = (deliveryZones || []).find(z =>
      (z.id && (String(z.id).toLowerCase() === addrVillageId || String(z.id).toLowerCase() === cleanArea)) ||
      (z.name && String(z.name).trim().toLowerCase() === cleanArea)
    );

    return Boolean(
      affectedVillageIds.includes(cleanArea) ||
      affectedVillageIds.includes(cleanVillage) ||
      affectedVillageIds.includes(addrVillageId) ||
      (matchedZone?.id && affectedVillageIds.includes(String(matchedZone.id).toLowerCase())) ||
      (matchedZone?.name && affectedVillageIds.includes(String(matchedZone.name).trim().toLowerCase())) ||
      affectedVillageIds.some(id => id === cleanArea || id === cleanVillage || id === addrVillageId)
    );
  }, [storeSettings?.isOrderPaused, effectiveStatus?.isEmergencyActive, storeSettings?.emergencySettings?.isActive, emergencyType, affectedVillageIds, deliveryZones]);

  const close=()=>{
    setManual(false);
    setLocationOpen(false);
    localStorage.setItem('r2cart_last_address_prompt_time',String(Date.now()));
  };
  const select=(address,zone)=>{
    if(!zone)return notify(`Delivery is currently unavailable in ${address.area}`,'error');
    const isSuspended = Boolean(zone?.isPaused || isAreaSuspended(address));
    setActiveAddress(address);
    setManual(false);
    setLocationOpen(false);
    localStorage.setItem('r2cart_last_address_prompt_time',String(Date.now()));
    if (isSuspended) {
      notify(`⚠️ Deliveries to ${address.area} are temporarily suspended due to emergency conditions.`, 'error');
    } else {
      notify(`Delivery location set to ${address.name} · ${zone.zoneName || zone.villageName || address.area} (Fee: ₹${zone.deliveryFee})`);
    }
  };
  const saveManual=async value=>{
    try{
      const saved=addressView(await customerService.addAddress(addressPayload(value)));
      setAddressList(items=>[saved,...items]);
      select(saved,deliveryRulesFor(saved.area));
    }catch(error){
      notify(error.message,'error');
    }
  };
  const signIn=()=>{close();nav('/login')};
  return (
    <Modal open={locationOpen} onClose={close} title={manual ? "Add New Delivery Address" : "Choose Delivery Address"} size="location-modal">
      <div className="modal-body">
        {!manual ? (
          <>
            <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>
                Select delivery location or add a new address.
              </p>
            </div>

            {user && (
              <button
                type="button"
                onClick={() => setManual(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '11px 14px',
                  marginBottom: '14px',
                  borderRadius: '12px',
                  border: '1.5px dashed #059669',
                  background: '#f0fdf4',
                  color: '#059669',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Plus size={16} strokeWidth={2.5} />
                <span>+ Add New Delivery Address</span>
              </button>
            )}

            {user && addressList.length > 0 && (
              <div className="address-modal-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                {addressList.map(address => {
                  const zone = deliveryRulesFor(address.area);
                  const isSelected = activeAddress?.id === address.id;
                  const isSuspended = isAreaSuspended(address);

                  return (
                    <button
                      key={address.id}
                      type="button"
                      disabled={!zone}
                      className={`address-option ${isSelected ? 'selected' : ''} ${!zone ? 'unavailable' : ''}`}
                      onClick={() => select(address, zone)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        padding: '14px',
                        borderRadius: '14px',
                        border: isSelected ? (isSuspended ? '1.5px solid #ef4444' : '1.5px solid #059669') : (isSuspended ? '1px solid #fecdd3' : '1px solid #e2e8f0'),
                        background: isSelected ? (isSuspended ? '#fff5f5' : '#f0fdf4') : (isSuspended ? '#fffafa' : '#ffffff'),
                        boxShadow: isSelected ? (isSuspended ? '0 0 0 1px #ef4444, 0 4px 12px rgba(239, 68, 68, 0.08)' : '0 0 0 1px #059669, 0 4px 12px rgba(5, 150, 105, 0.08)') : '0 1px 3px rgba(0,0,0,0.02)',
                        cursor: !zone ? 'not-allowed' : 'pointer',
                        position: 'relative',
                        textAlign: 'left',
                        width: '100%',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {/* Icon Box */}
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '10px',
                          background: isSelected ? (isSuspended ? '#ef4444' : '#059669') : (isSuspended ? '#fee2e2' : '#ecfdf5'),
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0
                        }}
                      >
                        {address.type === 'Home' ? (
                          <Home size={18} color={isSelected ? '#ffffff' : (isSuspended ? '#b91c1c' : '#059669')} />
                        ) : address.type === 'Work' ? (
                          <Briefcase size={18} color={isSelected ? '#ffffff' : (isSuspended ? '#b91c1c' : '#059669')} />
                        ) : (
                          <MapPin size={18} color={isSelected ? '#ffffff' : (isSuspended ? '#b91c1c' : '#059669')} />
                        )}
                      </div>

                      {/* Address Details */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '3px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <b style={{ fontSize: '14px', color: '#0f172a' }}>{address.name}</b>
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 800,
                                padding: '2px 7px',
                                borderRadius: '6px',
                                background: isSelected ? '#dcfce7' : '#f1f5f9',
                                color: isSelected ? '#15803d' : '#64748b',
                                textTransform: 'uppercase'
                              }}
                            >
                              {address.type || 'HOME'}
                            </span>
                            {isSuspended && (
                              <span
                                style={{
                                  fontSize: '9.5px',
                                  fontWeight: 800,
                                  padding: '2px 7px',
                                  borderRadius: '6px',
                                  background: '#fee2e2',
                                  color: '#b91c1c',
                                  textTransform: 'uppercase'
                                }}
                              >
                                🚫 Area Suspended
                              </span>
                            )}
                          </div>

                          {/* Selected Radio Indicator */}
                          <div
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              background: isSelected ? (isSuspended ? '#ef4444' : '#059669') : 'transparent',
                              border: isSelected ? 'none' : '2px solid #cbd5e1',
                              display: 'grid',
                              placeItems: 'center',
                              color: '#ffffff',
                              flexShrink: 0
                            }}
                          >
                            {isSelected && <Check size={12} strokeWidth={3} />}
                          </div>
                        </div>

                        <p style={{ margin: '2px 0 6px', fontSize: '12.5px', color: '#475569', lineHeight: 1.4 }}>
                          {address.line}, {address.cityLine || address.city}
                        </p>

                        {isSuspended ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '11px',
                                fontWeight: 700,
                                color: '#b91c1c',
                                background: '#fef2f2',
                                border: '1px solid #fecaca',
                                padding: '2px 8px',
                                borderRadius: '6px'
                              }}
                            >
                              <span>⚠️</span>
                              <span>Deliveries to {address.area} temporarily suspended</span>
                            </span>
                          </div>
                        ) : zone ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '11px',
                                fontWeight: 700,
                                color: '#047857',
                                background: '#ecfdf5',
                                border: '1px solid #a7f3d0',
                                padding: '2px 8px',
                                borderRadius: '6px'
                              }}
                            >
                              <span>⚡</span>
                              <span>{zone.zoneName} · Fee: ₹{zone.deliveryFee} · {zone.estimatedDelivery}</span>
                            </span>
                            {zone.freeDeliveryThreshold > 0 && (
                              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                                Free above ₹{zone.freeDeliveryThreshold}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#dc2626', fontSize: '11.5px', fontWeight: 600 }}>
                            ⚠️ Delivery unavailable in {address.area}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            {user && !addressList.length && !addressesLoaded && (
              <div style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--muted)', fontSize: '13px' }}>
                Loading your delivery addresses…
              </div>
            )}
            {user && !addressList.length && addressesLoaded && (
              <div style={{ textAlign: 'center', padding: '32px 16px', background: 'var(--soft)', borderRadius: '12px', marginBottom: '16px' }}>
                <div style={{ fontSize: '34px', marginBottom: '8px' }}>📍</div>
                <h4 style={{ margin: '0 0 6px', fontSize: '15px' }}>No saved addresses found</h4>
                <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--muted)', maxWidth: '340px', marginInline: 'auto' }}>
                  Please add your delivery address so we can show you instant delivery rates and availability for your area.
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <Button onClick={() => setManual(true)}>
                    + Add delivery address
                  </Button>
                  <Button variant="ghost" onClick={close}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
            {user && addressList.length > 0 && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <Button variant="outline" className="wide" onClick={() => setManual(true)}>
                  + Add new delivery address
                </Button>
                <Button variant="ghost" onClick={close}>
                  Cancel
                </Button>
              </div>
            )}
            {!user && (
              <div style={{ textAlign: 'center', padding: '24px 16px' }}>
                <p className="location-empty" style={{ marginBottom: '16px' }}>
                  Sign in to view your saved addresses and unlock instant delivery to your doorstep.
                </p>
                <Button className="wide" onClick={signIn}>
                  Sign in to continue
                </Button>
              </div>
            )}
          </>
        ) : (
          <AddressForm onSave={saveManual} onCancel={() => setManual(false)} />
        )}
      </div>
    </Modal>
  );
}
export function AddressForm({onSave,onCancel,initial={}}){const {availableLocalities}=useApp();const fields=[['name','Full name'],['mobile','Mobile number'],['street','Street / Colony / Ward details'],['landmark','Nearby Landmark (Mandir, School, etc.)'],['area','Village / Area']];const required=['name','mobile','landmark','area'];const standardTypes=['Home','Work'];const initialType=standardTypes.includes(initial.type)?initial.type:initial.type?'Other':'Home';const [form,setForm]=useState({...initial,house:initial.house||'',street:initial.street||'',landmark:initial.landmark||'',area:availableLocalities.includes(initial.area)?initial.area:(initial.area||''),city:'Hathua',type:initialType,customType:initialType==='Other'?initial.type:'',isDefault:initial.isDefault??true});const submit=e=>{e.preventDefault();if(fields.some(([key])=>!String(form[key]||'').trim()&&required.includes(key)))return;if(form.type==='Other'&&!form.customType?.trim())return;onSave({...form,house:'',street:String(form.street||'').trim(),landmark:String(form.landmark||'').trim(),area:String(form.area||'').trim(),city:'Hathua',type:form.type==='Other'?form.customType.trim():form.type,isDefault:form.isDefault??true})};return <form onSubmit={submit} className="address-form"><div className="form-grid">{fields.map(([key,label])=><label key={key}>{label}{required.includes(key)&&' *'}{key==='area'?<LocalityPicker localities={availableLocalities} value={form.area} onChange={area=>setForm({...form,area})}/>:<input value={form[key]||''} onChange={e=>setForm({...form,[key]:e.target.value})} placeholder={key==='landmark'?'e.g. Near Shiv Mandir, High School':key==='street'?'e.g. Ward No. 3, Main Market road':undefined} required={required.includes(key)}/>}</label>)}</div><p className="service-area-note">{availableLocalities.length?`Delivery active in Hathua across ${availableLocalities.length} localities.`:'No delivery locality is active right now.'}</p><label>Address type<div className="segmented">{['Home','Work','Other'].map(type=><button type="button" className={form.type===type?'active':''} onClick={()=>setForm({...form,type})} key={type}>{type}</button>)}</div></label>{form.type==='Other'&&<label className="custom-address-type">Custom address label *<input value={form.customType||''} onChange={e=>setForm({...form,customType:e.target.value.slice(0,30)})} placeholder="e.g. Parents, Shop or Hostel" required autoFocus/></label>}<div className="row end gap">{onCancel&&<Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>}<Button type="submit" disabled={!availableLocalities.length}>Save address</Button></div></form>}
function LocalityPicker({localities,value,onChange}){const [query,setQuery]=useState(value||'');const [open,setOpen]=useState(false);const results=localities.filter(locality=>locality.toLowerCase().includes(query.trim().toLowerCase()));const choose=locality=>{setQuery(locality);onChange(locality);setOpen(false)};return <span className="locality-picker"><span className="locality-input"><Search/><input value={query} required autoComplete="off" placeholder="Search delivery village / area" onFocus={()=>setOpen(true)} onBlur={()=>setTimeout(()=>setOpen(false),150)} onChange={event=>{setQuery(event.target.value);onChange('');setOpen(true)}}/><ChevronDown/></span>{open&&<span className="locality-menu" onMouseDown={event=>event.preventDefault()}>{results.length?results.map(locality=><button type="button" className={value===locality?'selected':''} onClick={()=>choose(locality)} key={locality}><MapPin/><span>{locality}<small>Delivery available</small></span>{value===locality&&<b>✓</b>}</button>):<span className="locality-empty">No active delivery locality found</span>}</span>}</span>}
export function CartDrawer() {
  const {
    cartOpen,
    setCartOpen,
    cartItems,
    qty,
    add,
    subtotal,
    mrpTotal,
    activeDeliveryRules,
    deliveryConfig,
    categories,
    products,
    notify
  } = useApp();

  const nav = useNavigate();
  const itemCount = cartItems.reduce((sum, item) => sum + item.qty, 0);
  const rules = activeDeliveryRules || deliveryConfig;
  const freeThreshold = Number(rules?.freeDeliveryThreshold || 0);
  const fee = freeThreshold > 0 && subtotal >= freeThreshold ? 0 : Number(rules?.deliveryFee || 0);

  const popularCats = (categories && categories.length > 0 ? categories : [
    { name: 'Fruits & Vegetables', slug: 'fruits-vegetables' },
    { name: 'Dairy & Bread', slug: 'dairy-bread' },
    { name: 'Atta, Rice & Dal', slug: 'atta-rice-dal' },
    { name: 'Snacks & Drinks', slug: 'snacks-drinks' }
  ]).slice(0, 4);

  const popularProds = (products && products.length > 0 ? products : []).filter((p) => p.stock > 0).slice(0, 3);

  return (
    <>
      <div className={`drawer-backdrop ${cartOpen ? 'show' : ''}`} onClick={() => setCartOpen(false)} />
      <aside className={`cart-drawer ${cartOpen ? 'show' : ''}`} style={{ background: '#f8fafc' }}>
        {/* Drawer Header */}
        <div
          style={{
            padding: '16px 18px',
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
            zIndex: 2
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                Your Basket
              </h3>
              {itemCount > 0 && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: '12px',
                    background: '#ecfdf5',
                    color: '#059669'
                  }}
                >
                  {itemCount}
                </span>
              )}
            </div>
            <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px', display: 'block' }}>
              {itemCount > 0
                ? `${itemCount} ${itemCount === 1 ? 'item' : 'items'} · ${money(subtotal)}`
                : `⚡ Delivery in ${rules?.estimatedDelivery || '15–20 mins'}`}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setCartOpen(false)}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#f1f5f9',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#475569',
              cursor: 'pointer',
              transition: 'background 0.15s ease'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="drawer-body" style={{ padding: '14px', overflowY: 'auto', flex: 1 }}>
          {!cartItems.length ? (
            /* Empty Cart View */
            <div style={{ padding: '20px 4px', textAlign: 'center' }}>
              {/* Glowing Bag Circle */}
              <div
                style={{
                  width: '74px',
                  height: '74px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px',
                  boxShadow: '0 8px 24px rgba(5, 150, 105, 0.25)',
                  position: 'relative'
                }}
              >
                <ShoppingBag size={34} strokeWidth={2.2} />
              </div>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '3px 10px',
                  borderRadius: '14px',
                  background: '#ecfdf5',
                  color: '#047857',
                  fontSize: '10.5px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  marginBottom: '8px'
                }}
              >
                <Zap size={12} color="#059669" />
                <span>15–20 Mins Delivery</span>
              </div>

              <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                Your basket is empty
              </h3>
              <p style={{ margin: '0 auto 16px', fontSize: '12.5px', color: '#64748b', maxWidth: '280px', lineHeight: 1.45 }}>
                Explore fresh fruits, daily dairy, snacks, and groceries ready for delivery.
              </p>

              <button
                type="button"
                onClick={() => {
                  setCartOpen(false);
                  nav('/');
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '11px 22px',
                  borderRadius: '12px',
                  fontSize: '13.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(5, 150, 105, 0.25)',
                  marginBottom: '24px'
                }}
              >
                <span>Start Shopping</span>
                <ArrowRight size={15} strokeWidth={2.5} />
              </button>

              {/* Popular Categories */}
              <div style={{ textAlign: 'left', marginBottom: '20px' }}>
                <b style={{ fontSize: '13px', color: '#0f172a', display: 'block', marginBottom: '8px' }}>
                  Explore Categories
                </b>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {popularCats.map((cat) => (
                    <button
                      key={cat.slug}
                      type="button"
                      onClick={() => {
                        setCartOpen(false);
                        nav(`/category/${cat.slug}`);
                      }}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <div
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '8px',
                          background: '#f8fafc',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          overflow: 'hidden'
                        }}
                      >
                        {cat.image ? (
                          <img src={cat.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : (
                          <ShoppingBag size={14} color="#059669" />
                        )}
                      </div>
                      <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155', lineHeight: 1.25 }}>
                        {cat.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Add Essentials */}
              {popularProds.length > 0 && (
                <div style={{ textAlign: 'left' }}>
                  <b style={{ fontSize: '13px', color: '#0f172a', display: 'block', marginBottom: '8px' }}>
                    Quick Add Essentials
                  </b>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {popularProds.map((p) => (
                      <div
                        key={p.id}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          padding: '8px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                          <img
                            src={p.image}
                            alt=""
                            style={{ width: '38px', height: '38px', borderRadius: '6px', objectFit: 'contain', background: '#f8fafc', flexShrink: 0 }}
                          />
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <b style={{ fontSize: '12px', color: '#0f172a', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {p.name}
                            </b>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '1px' }}>
                              <b style={{ fontSize: '12px', color: '#059669' }}>{money(p.price)}</b>
                              <small style={{ fontSize: '10.5px', color: '#94a3b8' }}>{p.unit}</small>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (typeof add === 'function') add(p.id, 1);
                            else if (typeof qty === 'function') qty(p.id, 1);
                            if (notify) notify(`Added ${p.name} to basket!`);
                          }}
                          style={{
                            background: '#ecfdf5',
                            border: '1px solid #a7f3d0',
                            color: '#059669',
                            padding: '5px 12px',
                            borderRadius: '8px',
                            fontSize: '11.5px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            flexShrink: 0
                          }}
                        >
                          + ADD
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Items in Cart */
            <>
              {/* Delivery ETA Pill */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock3 size={15} color="#059669" />
                  <span style={{ fontSize: '12px', color: '#334155' }}>
                    Delivery in <b style={{ color: '#0f172a' }}>{rules.estimatedDelivery}</b>
                  </span>
                </div>
                {fee === 0 ? (
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#15803d', background: '#dcfce7', padding: '2px 7px', borderRadius: '5px' }}>
                    FREE DELIVERY
                  </span>
                ) : (
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    Fee: ₹{fee}
                  </span>
                )}
              </div>

              {/* Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                {cartItems.map((product) => (
                  <div
                    key={product.id}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                      <img
                        src={product.image}
                        alt=""
                        style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'contain', background: '#f8fafc', flexShrink: 0 }}
                      />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <b style={{ fontSize: '12.5px', color: '#0f172a', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {product.name}
                        </b>
                        <small style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>
                          {product.unit}
                        </small>
                        <div style={{ marginTop: '2px' }}>
                          <ItemPrice product={product} />
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#f0fdf4',
                        border: '1px solid #a7f3d0',
                        borderRadius: '8px',
                        padding: '2px 4px',
                        flexShrink: 0
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => qty(product.id, product.qty - 1)}
                        style={{
                          width: '22px',
                          height: '22px',
                          border: 'none',
                          background: '#ffffff',
                          borderRadius: '6px',
                          color: '#059669',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Minus size={12} strokeWidth={2.5} />
                      </button>
                      <b style={{ fontSize: '12px', color: '#047857', minWidth: '16px', textAlign: 'center' }}>
                        {product.qty}
                      </b>
                      <button
                        type="button"
                        onClick={() => qty(product.id, product.qty + 1)}
                        style={{
                          width: '22px',
                          height: '22px',
                          border: 'none',
                          background: '#ffffff',
                          borderRadius: '6px',
                          color: '#059669',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Plus size={12} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bill Details Summary */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '12px 14px'
                }}
              >
                <PriceSummary compact title="Bill Details" mrpTotal={mrpTotal} subtotal={subtotal} deliveryFee={fee} />
              </div>
            </>
          )}
        </div>

        {/* Footer Checkout Bar (When Items in Cart) */}
        {cartItems.length > 0 && (
          <div
            style={{
              padding: '12px 14px',
              background: '#ffffff',
              borderTop: '1px solid #e2e8f0',
              boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.04)',
              zIndex: 2
            }}
          >
            <button
              type="button"
              onClick={() => {
                setCartOpen(false);
                nav('/cart');
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '14px',
                padding: '12px 18px',
                fontSize: '14px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(5, 150, 105, 0.28)'
              }}
            >
              <div style={{ textAlign: 'left' }}>
                <b style={{ fontSize: '15px' }}>{money(subtotal + fee)}</b>
                <span style={{ fontSize: '11px', display: 'block', opacity: 0.9 }}>
                  {itemCount} {itemCount === 1 ? 'item' : 'items'} · Total
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Review Basket</span>
                <ArrowRight size={17} strokeWidth={2.5} />
              </div>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
const pageNames={'/search':'Search','/favorites':'Favourites','/cart':'Your basket','/checkout':'Checkout','/order-success':'Order confirmed','/orders':'My orders','/account':'My account','/account/addresses':'Saved addresses','/coupons':'Coupons','/support':'Help & support','/about':`About ${BRAND.name}`,'/contact':'Contact us','/privacy':'Privacy policy','/terms':'Terms & conditions','/refund-policy':'Return & refund policy','/cancellation-policy':'Cancellation policy','/delivery-info':'Shipping & delivery policy','/shipping-policy':'Shipping & delivery policy','/grievance':'Grievance redressal','/grievance-redressal':'Grievance redressal','/cookie-policy':'Cookie policy'};
function CustomerBack(){const location=useLocation();const nav=useNavigate();if(location.pathname==='/'||location.pathname==='/search')return null;const label=pageNames[location.pathname]||(location.pathname.startsWith('/product/')?'Product details':location.pathname.startsWith('/category/')?'Category':location.pathname.startsWith('/orders/')?'Order details':'Back');return <div className="context-back-wrap"><div className="container context-back"><button onClick={()=>location.key!=='default'?nav(-1):nav('/')} aria-label="Go back"><ArrowLeft/><span>Back</span></button><i>/</i><b>{label}</b></div></div>}
function DesktopNav(){const {categories}=useApp();return <nav className="desktop-category-nav"><div className="container"><div className="desktop-category-links">{categories.slice(0,7).map(category=><Link to={`/category/${category.slug}`} key={category.slug}>{category.name}</Link>)}</div><Link className="nav-offer" to="/coupons">Offers <span>NEW</span></Link></div></nav>}
function BackendNotice(){const {catalogErrors,refreshCategories,refreshProducts,refreshBanners,refreshDelivery,categories}=useApp();if(categories?.length>0)return null;const activeErrors=Object.entries(catalogErrors).filter(([,error])=>error);if(!activeErrors.length)return null;return <div className="container" role="status" style={{margin:'0.75rem auto'}}><div className="surface-card" style={{padding:'0.75rem 1.25rem',display:'flex',alignItems:'center',justifyContent:'space-between',borderRadius:'10px',background:'#fef3c7',border:'1px solid #fde68a'}}><span style={{fontSize:'0.88rem',color:'#92400e',fontWeight:500}}>Connecting to store server…</span><Button variant="outline" size="sm" onClick={()=>{refreshCategories();refreshProducts();refreshBanners();refreshDelivery();}}>Reconnect</Button></div></div>}
import {AuthPromptModal} from '../components/customer/AuthPromptModal';
import {FloatingBottomCartBar} from '../components/customer/FloatingBottomCartBar';
import {subscribeToPush,playNotificationSound} from '../services/pushNotification.service';

export default function CustomerLayout({children}){
 const {user,storeSettings,setLocationOpen,addressesLoaded,activeDeliveryRules,activeAddress,notify}=useApp();
 const nav=useNavigate();
 const [customerAlert,setCustomerAlert]=useState(null);
 const [announcement,setAnnouncement]=useState(null);
 const [announcementDismissed,setAnnouncementDismissed]=useState(false);
 const [showAnnouncementDetails,setShowAnnouncementDetails]=useState(false);
 const [promoPopup,setPromoPopup]=useState(null);
 const [showPromoModal,setShowPromoModal]=useState(false);

 const handleAnnouncementAction = (e) => {
  if (e) e.preventDefault();
  if (!announcement) return;
  catalogService.trackMarketing(announcement.id, 'click').catch(() => {});

  const couponCode = announcement.metadata?.couponCode ||
    (announcement.badge && /^[A-Z0-9_-]{3,15}$/.test(announcement.badge) ? announcement.badge : null);
  if (couponCode) {
    navigator.clipboard?.writeText(couponCode).catch(() => {});
    notify?.(`🎉 Coupon code "${couponCode}" copied to clipboard!`, 'success');
  }

  const rawUrl = announcement.linkUrl || announcement.ctaUrl || '';
  const trimmed = rawUrl.trim();

  if (!trimmed || trimmed === '/' || trimmed === '#details' || trimmed === '#') {
    setShowAnnouncementDetails(true);
  } else if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    window.open(trimmed, '_blank', 'noopener,noreferrer');
  } else {
    nav(trimmed);
  }
 };

 const handlePromoPopupAction = (e) => {
  if (e) e.preventDefault();
  if (!promoPopup) return;
  catalogService.trackMarketing(promoPopup.id, 'click').catch(() => {});
  sessionStorage.setItem(`r2cart-dismissed-popup-${promoPopup.id}-${promoPopup.updatedAt || '0'}`, 'true');
  setShowPromoModal(false);

  const couponCode = promoPopup.metadata?.couponCode ||
    (promoPopup.badge && /^[A-Z0-9_-]{3,15}$/.test(promoPopup.badge) ? promoPopup.badge : null);
  if (couponCode) {
    navigator.clipboard?.writeText(couponCode).catch(() => {});
    notify?.(`🎉 Offer Claimed! Coupon code "${couponCode}" copied to clipboard!`, 'success');
  }

  const rawUrl = promoPopup.linkUrl || promoPopup.ctaUrl || '';
  const trimmed = rawUrl.trim();

  if (trimmed && trimmed !== '/' && trimmed !== '#') {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      window.open(trimmed, '_blank', 'noopener,noreferrer');
    } else {
      nav(trimmed);
    }
  } else {
    nav('/coupons');
  }
 };

 // Smart 2-hour cooldown session for address confirmation prompt
 useEffect(()=>{
  if(!user?.id || !addressesLoaded) return;
  const path=window.location.pathname;
  if(['/checkout','/order-success','/login','/signup','/verify-otp','/forgot-password'].includes(path)||path.startsWith('/admin')||path.startsWith('/delivery')||path.startsWith('/super-admin')){
   return;
  }
  const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
  const lastPromptTime = Number(localStorage.getItem('r2cart_last_address_prompt_time') || 0);
  const now = Date.now();
  if (now - lastPromptTime < TWO_HOURS_MS) {
   return;
  }
  // Set the timestamp immediately so subsequent fast navigations/reloads don't re-trigger it
  localStorage.setItem('r2cart_last_address_prompt_time', String(now));
  const timer=setTimeout(()=>{
   setLocationOpen(true);
  }, 400);
  return()=>clearTimeout(timer);
 },[user?.id, addressesLoaded]);

 const fetchActiveMarketing = useCallback(() => {
  // Clear legacy test dismissal keys
  try {
   Object.keys(sessionStorage).forEach(k => {
    if (k.startsWith('r2cart-dismissed-') && k.split('-').length === 4) {
     sessionStorage.removeItem(k);
    }
   });
  } catch (_) {}

  catalogService.getActiveMarketing()
   .then(data => {
    if (!data) return;
    if (data.announcement) {
     const verKey = `r2cart-dismissed-announcement-${data.announcement.id}-${data.announcement.updatedAt || '0'}`;
     const dismissed = sessionStorage.getItem(verKey);
     if (!dismissed) {
      setAnnouncement(data.announcement);
      setAnnouncementDismissed(false);
      catalogService.trackMarketing(data.announcement.id, 'view').catch(() => {});
     } else {
      setAnnouncement(null);
     }
    } else {
     setAnnouncement(null);
    }
    if (data.popup) {
     const verKey = `r2cart-dismissed-popup-${data.popup.id}-${data.popup.updatedAt || '0'}`;
     const dismissed = sessionStorage.getItem(verKey);
     if (!dismissed) {
      setPromoPopup(data.popup);
      setShowPromoModal(true);
      catalogService.trackMarketing(data.popup.id, 'view').catch(() => {});
     } else {
      setPromoPopup(null);
      setShowPromoModal(false);
     }
    } else {
     setPromoPopup(null);
     setShowPromoModal(false);
    }
   })
   .catch(() => {});
 }, []);

 useEffect(() => {
  fetchActiveMarketing();
  const handleMarketingUpdate = () => fetchActiveMarketing();
  window.addEventListener('r2cart:marketing-updated', handleMarketingUpdate);
  return () => window.removeEventListener('r2cart:marketing-updated', handleMarketingUpdate);
 }, [fetchActiveMarketing]);

 useEffect(()=>{
  if(user&&typeof Notification!=='undefined'&&Notification.permission==='granted'){
   subscribeToPush({role:'CUSTOMER'}).catch(()=>{});
  }
 },[user]);

 useEffect(()=>{
  const onSwPush=event=>{
   if(event.data?.type==='R2CART_PUSH_RECEIVED'){
    playNotificationSound();
    const p=event.data.payload||{};
    setCustomerAlert({
     title:p.title||'🎉 Order Update · R2Cart',
     body:p.body||'Your order status has been updated.',
     url:p.data?.url||p.url||'/orders'
    });
   }
  };
  const onCustomAlert=event=>{
   if(event.detail){
    playNotificationSound();
    setCustomerAlert(event.detail);
   }
  };
  if('serviceWorker' in navigator){
   navigator.serviceWorker.addEventListener('message',onSwPush);
  }
  window.addEventListener('r2cart:customer-order-alert',onCustomAlert);
  return()=>{
   if('serviceWorker' in navigator){
    navigator.serviceWorker.removeEventListener('message',onSwPush);
   }
   window.removeEventListener('r2cart:customer-order-alert',onCustomAlert);
  };
 },[]);

 return <>
  {/* Emergency Store Pause Top Alert Banner */}
  {(storeSettings?.policies?.emergencyPause?.isPaused || storeSettings?.effectiveStatus?.storeStatus === 'EMERGENCY_PAUSED') && (() => {
    const rawReason = storeSettings?.effectiveStatus?.statusReason ||
      storeSettings?.policies?.emergencyPause?.message ||
      (storeSettings?.policies?.emergencyPause?.reason ? `High order volume (${storeSettings.policies.emergencyPause.reason})` : 'We are temporarily not taking new orders due to high order volume.');
    const cleanReason = (rawReason || '').trim().replace(/\s+\./g, '.').replace(/\.+$/, '');
    const nextOpening = storeSettings?.effectiveStatus?.nextAvailableOpening;
    const rawEndTime = storeSettings?.effectiveStatus?.emergencyDetails?.endTime || storeSettings?.policies?.emergencyPause?.resumesAt;
    const resumesAtTime = nextOpening?.label
      ? nextOpening.label
      : rawEndTime
      ? new Date(rawEndTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
      : null;

    return (
      <aside role="alert" className="emergency-store-alert">
        <div className="emergency-alert-inner">
          <div className="emergency-alert-main">
            <span className="emergency-alert-icon-wrap" aria-hidden="true">
              <span className="emergency-alert-icon">🚨</span>
            </span>
            <div className="emergency-alert-copy">
              <span className="emergency-alert-title">Orders Temporarily Paused</span>
              {cleanReason && (
                <span className="emergency-alert-desktop-desc">— {cleanReason}</span>
              )}
            </div>
          </div>

          <div className="emergency-alert-badges">
            {resumesAtTime && (
              <span className="emergency-resumes-chip">
                <Clock3 size={11} strokeWidth={2.4} />
                <span>Resumes {resumesAtTime}</span>
              </span>
            )}
            <span className="emergency-pause-tag">
              <span className="emergency-pulse-dot" />
              Paused
            </span>
          </div>
        </div>

        {cleanReason && (
          <div className="emergency-alert-mobile-msg">
            {cleanReason}
          </div>
        )}
      </aside>
    );
  })()}

  {/* Selected Area Delivery Suspended Alert Banner (Active Location is Suspended) */}
  {!storeSettings?.policies?.emergencyPause?.isPaused && 
   storeSettings?.effectiveStatus?.storeStatus !== 'EMERGENCY_PAUSED' &&
   activeDeliveryRules?.isPaused && (() => {
    const rawReason = activeDeliveryRules?.pauseReason ||
      storeSettings?.effectiveStatus?.statusReason ||
      storeSettings?.emergencySettings?.message ||
      `Deliveries to ${activeAddress?.area || 'your selected area'} are temporarily paused due to emergency conditions.`;
    const cleanReason = (rawReason || '').trim().replace(/\s+\./g, '.').replace(/\.+$/, '');
    const nextOpening = storeSettings?.effectiveStatus?.nextAvailableOpening;
    const rawEndTime = storeSettings?.effectiveStatus?.emergencyDetails?.endTime || storeSettings?.emergencySettings?.endTime;
    const resumesAtTime = nextOpening?.label
      ? nextOpening.label
      : rawEndTime
      ? new Date(rawEndTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
      : null;

    return (
      <aside
        role="alert"
        style={{
          background: 'linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)',
          color: '#ffffff',
          padding: '8px 12px',
          boxShadow: '0 2px 8px rgba(185, 28, 28, 0.25)',
          position: 'sticky',
          top: 0,
          zIndex: 99990,
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        <div
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
            <span style={{ fontSize: '15px', flexShrink: 0 }}>🚫</span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#ffffff', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Deliveries Suspended in {activeAddress?.area || 'Your Area'}
              </span>
              <span style={{ fontSize: '11px', color: '#fecaca', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.25 }}>
                {cleanReason}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setLocationOpen(true)}
            style={{
              background: '#ffffff',
              color: '#b91c1c',
              border: 'none',
              padding: '5px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            Change →
          </button>
        </div>
      </aside>
    );
  })()}

  {/* Scheduled-Only / Outside Operating Hours Notice */}
  {!storeSettings?.policies?.emergencyPause?.isPaused && 
   storeSettings?.effectiveStatus?.storeStatus !== 'EMERGENCY_PAUSED' &&
   (storeSettings?.effectiveStatus?.storeStatus === 'SCHEDULED_ONLY' || storeSettings?.effectiveStatus?.allowImmediateOrders === false) && (() => {
    const isEm = Boolean(storeSettings?.effectiveStatus?.isEmergencyActive);
    const nextOpening = storeSettings?.effectiveStatus?.nextAvailableOpening;
    const reopenLabel = nextOpening?.label;
    const isResume = Boolean(nextOpening?.isEmergencyEnd);

    return (
      <aside role="status" className="store-status-bar">
        <div className="store-status-inner">
          <div className="store-status-main">
            <span className="store-status-icon-wrap" aria-hidden="true">
              <span className="store-status-icon">{isEm ? '⚡' : '🌙'}</span>
            </span>
            <div className="store-status-copy">
              <span className="store-status-title">
                {isEm ? 'Instant Orders Temporarily Paused' : 'Store Closed for Instant Delivery'}
              </span>
              <span className="store-status-desktop-note">
                {isEm && storeSettings?.effectiveStatus?.statusReason
                  ? `— ${storeSettings.effectiveStatus.statusReason}`
                  : '— Schedule orders for upcoming slots'}
              </span>
            </div>
          </div>

          <div className="store-status-badges">
            {reopenLabel && (
              <span className="store-status-reopen-chip">
                <Clock3 size={11} strokeWidth={2.4} />
                <span>{isResume ? 'Resumes' : 'Reopens'} {reopenLabel}</span>
              </span>
            )}
            <span className="store-status-schedule-tag">
              <span className="store-status-pulse-dot" />
              Schedule Open
            </span>
          </div>
        </div>
      </aside>
    );
  })()}

  {/* Marketing Announcement Bar */}
  {announcement && !announcementDismissed && (() => {
    const rawCta = announcement.metadata?.ctaText || announcement.ctaText || 'Learn More';
    const ctaClean = rawCta.replace(/[→\->\s]+$/, '').trim() || 'Learn More';
    const badge = announcement.badgeText || announcement.badge;

    return (
      <aside
        role="complementary"
        className="marketing-announcement-bar"
        style={{
          '--announcement-bg': announcement.bgColor || '#15803d',
          '--announcement-color': announcement.textColor || '#ffffff',
          top: storeSettings?.policies?.emergencyPause?.isPaused ? '40px' : 0,
        }}
      >
        <div className="announcement-content-wrap">
          {badge && (
            <span className="announcement-badge">
              {badge}
            </span>
          )}
          <span className="announcement-text" title={announcement.title || announcement.content}>
            {announcement.title || announcement.content}
          </span>
        </div>

        <div className="announcement-actions-wrap">
          <button
            type="button"
            onClick={handleAnnouncementAction}
            className="announcement-cta-btn"
          >
            <span>{ctaClean}</span>
            <span className="announcement-arrow" aria-hidden="true">→</span>
          </button>
          <button
            type="button"
            onClick={() => {
              sessionStorage.setItem(`r2cart-dismissed-announcement-${announcement.id}-${announcement.updatedAt || '0'}`, 'true');
              setAnnouncementDismissed(true);
            }}
            className="announcement-close-btn"
            aria-label="Dismiss announcement"
          >
            ✕
          </button>
        </div>
      </aside>
    );
  })()}

  {/* Announcement Details Modal */}
  {announcement && showAnnouncementDetails && (
    <Modal
      open={showAnnouncementDetails}
      onClose={() => setShowAnnouncementDetails(false)}
      title="Store Announcement"
      size="sm"
    >
      <div className="modal-body" style={{ textAlign: 'center', padding: '20px 24px' }}>
        {(announcement.badge || announcement.badgeText) && (
          <span style={{ display: 'inline-block', background: '#dcfce7', color: '#15803d', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 800, marginBottom: '12px', letterSpacing: '0.5px' }}>
            {announcement.badge || announcement.badgeText}
          </span>
        )}
        <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 10px', color: 'var(--text, #111827)' }}>
          {announcement.title || announcement.content}
        </h3>
        <p style={{ fontSize: '14px', color: 'var(--muted, #64748b)', margin: '0 0 20px', lineHeight: 1.6 }}>
          {announcement.subtitle || announcement.content || 'Enjoy this limited-time offer on your grocery orders. Fresh picks delivered directly to your doorstep in minutes.'}
        </p>
        <div className="row gap" style={{ justifyContent: 'center' }}>
          <Button variant="outline" onClick={() => setShowAnnouncementDetails(false)}>
            Close
          </Button>
          <Button onClick={() => {
            setShowAnnouncementDetails(false);
            const target = announcement.linkUrl && announcement.linkUrl !== '/' && announcement.linkUrl !== '#details' && announcement.linkUrl !== '#' ? announcement.linkUrl : '/coupons';
            nav(target);
          }}>
            Explore Offers →
          </Button>
        </div>
      </div>
    </Modal>
  )}
  {/* In-App Heads-up Notification Banner (Sliding down from top on mobile & website) */}
  {customerAlert&&(
   <aside
    role="alert"
    aria-live="assertive"
    style={{
     position:'fixed',
     top:'12px',
     left:'50%',
     transform:'translateX(-50%)',
     zIndex:999999,
     maxWidth:'480px',
     width:'calc(100vw - 24px)',
     background:'linear-gradient(135deg, #148542 0%, #0d5f2e 100%)',
     color:'#fff',
     padding:'12px 16px',
     borderRadius:'14px',
     boxShadow:'0 16px 36px rgba(0, 0, 0, 0.4), 0 0 20px rgba(20, 133, 66, 0.35)',
     display:'flex',
     alignItems:'center',
     justifyContent:'space-between',
     gap:'12px',
     border:'1px solid rgba(255, 255, 255, 0.2)'
    }}
   >
    <div style={{flex:1,minWidth:0}}>
     <strong style={{display:'block',fontSize:'13px',fontWeight:700,letterSpacing:'0.2px'}}>
      {customerAlert.title}
     </strong>
     <p style={{margin:'2px 0 0',fontSize:'12px',opacity:0.95,lineHeight:1.35}}>
      {customerAlert.body}
     </p>
    </div>
    <div style={{display:'flex',alignItems:'center',gap:'8px',flexShrink:0}}>
     {customerAlert.url&&(
      <button
       onClick={()=>{
        const u=customerAlert.url;
        setCustomerAlert(null);
        nav(u);
       }}
       style={{
        background:'#fff',
        color:'#148542',
        border:'none',
        borderRadius:'8px',
        padding:'6px 12px',
        fontSize:'12px',
        fontWeight:700,
        cursor:'pointer',
        whiteSpace:'nowrap'
       }}
      >
       View
      </button>
     )}
     <button
      onClick={()=>setCustomerAlert(null)}
      style={{
       background:'none',
       border:'none',
       color:'rgba(255, 255, 255, 0.8)',
       fontSize:'18px',
       cursor:'pointer',
       padding:'2px 6px',
       lineHeight:1
      }}
      aria-label="Close notification"
     >
      ✕
     </button>
    </div>
   </aside>
  )}
  <Header/>
  <DesktopNav/>
  <CustomerBack/>
  <main><BackendNotice/>{children}</main>
  <Footer/>
  <FloatingBottomCartBar/>
  <MobileBottomNav/>
  <LocationModal/>
  <CartDrawer/>
  <AuthPromptModal/>
  <LaunchNoticeModal/>

  {/* Promotional Popup Modal */}
  {promoPopup && showPromoModal && (
    <Modal
      open={showPromoModal}
      onClose={() => {
        sessionStorage.setItem(`r2cart-dismissed-popup-${promoPopup.id}-${promoPopup.updatedAt || '0'}`, 'true');
        setShowPromoModal(false);
      }}
      title={promoPopup.name || promoPopup.title || 'Special Offer'}
      size="promo-popup-modal"
    >
      <div className="modal-body promo-modal-content" style={{ textAlign: 'center', padding: '16px 20px 24px' }}>
        {promoPopup.imageUrl && (
          <img
            src={promoPopup.imageUrl}
            alt={promoPopup.name || promoPopup.title}
            style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '12px', marginBottom: '16px' }}
          />
        )}
        <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px', color: 'var(--text, #111827)' }}>
          {promoPopup.name || promoPopup.title}
        </h3>
        <p style={{ fontSize: '14px', color: 'var(--muted, #64748b)', margin: '0 0 20px', lineHeight: 1.5 }}>
          {promoPopup.content || promoPopup.subtitle}
        </p>
        <button
          type="button"
          onClick={handlePromoPopupAction}
          className="btn btn-primary"
          style={{ display: 'inline-block', width: '100%', padding: '12px', fontWeight: 700, borderRadius: '10px', textAlign: 'center', cursor: 'pointer', border: 'none' }}
        >
          {promoPopup.metadata?.ctaText || promoPopup.ctaText || 'Claim Offer Now'}
        </button>
      </div>
    </Modal>
  )}
 </>;
}
