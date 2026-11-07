import {useEffect,useRef,useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Bell,Globe,Search,UserRound,X} from 'lucide-react';
import {api} from '../../services/httpClient';
import {mediaUrl} from '../../utils/media';
import {useLanguage} from '../../context/LanguageContext';
import {env} from '../../config/env';
import {playNotificationSound,subscribeToPush,sendTestPush,triggerSystemNotification,enableOrderAlerts} from '../../services/pushNotification.service';
import './navbar.css';

const getInitialAlerted = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem('r2cart-alerted-orders') || '[]'));
  } catch {
    return new Set();
  }
};

export default function AdminNavbarActions(){
 const nav=useNavigate(),root=useRef(null),prevNoticesRef=useRef([]),seenAlertsRef=useRef(getInitialAlerted());
 const {lang,toggleLang,t}=useLanguage();
 const [q,setQ]=useState(''),[results,setResults]=useState([]),[menu,setMenu]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[data,setData]=useState(null),[noticeError,setNoticeError]=useState('');
 const [testStatus,setTestStatus]=useState('idle');
 const [perm,setPerm]=useState(()=>(typeof Notification!=='undefined'?Notification.permission:'unsupported'));
 const [read,setRead]=useState(()=>{try{return JSON.parse(localStorage.getItem('r2cart-admin-read-notifications')||'[]')}catch{return []}});
 const [cleared,setCleared]=useState(()=>{try{return JSON.parse(localStorage.getItem('r2cart-admin-cleared-notifications')||'[]')}catch{return []}});

 const markAlertSeen = (id) => {
   seenAlertsRef.current.add(id);
   try {
     const arr = Array.from(seenAlertsRef.current).slice(-300);
     localStorage.setItem('r2cart-alerted-orders', JSON.stringify(arr));
   } catch {}
 };

 useEffect(()=>{
  const handlePerm=()=>setPerm(typeof Notification!=='undefined'?Notification.permission:'unsupported');
  window.addEventListener('r2cart:notifications-enabled',handlePerm);
  return ()=>window.removeEventListener('r2cart:notifications-enabled',handlePerm);
 },[]);

 const handleEnableAlerts=async()=>{
  const res=await enableOrderAlerts({role:'ADMIN',onStatusChange:setPerm});
  if(res.success){
   setPerm('granted');
   load();
  }else if(res.reason==='permission_denied'){
   alert(res.message||'Notifications are blocked in your browser. Please allow notifications in your browser settings.');
  }
 };

 const fireOrderAlert = (notice) => {
   const alertKey = notice.id || `order-${notice.orderNumber}`;
   markAlertSeen(alertKey);
   playNotificationSound();
   triggerSystemNotification({
     title: '🚨 New Order Received! · R2Cart',
     body: `${notice.title || 'New Order'} (${notice.text || 'Order placed'})`,
     url: notice.path || '/admin/orders',
     tag: alertKey,
   });
   window.dispatchEvent(new CustomEvent('r2cart:new-order-alert', {
     detail: {
       orderNumber: notice.orderNumber || (notice.title ? notice.title.replace(/^New order\s*#?/i, '') : 'New Order'),
       customerName: notice.customerName || 'Customer',
       total: notice.total || '',
       itemsCount: notice.itemsCount || 1,
       url: notice.path || '/admin/orders',
     }
   }));
 };

 const load=()=>api.get('/admin/notifications').then(value=>{
  const nextNotices=value?.notifications||[];
  const now = Date.now();

  // Alert on ANY unalerted order placed within the last 30 minutes
  for (const n of nextNotices) {
    if (n.id && n.id.startsWith('order-') && !seenAlertsRef.current.has(n.id)) {
      const noticeTime = n.date ? new Date(n.date).getTime() : 0;
      const isRecent = noticeTime > 0 ? (now - noticeTime) < 30 * 60 * 1000 : true;
      if (isRecent) {
        fireOrderAlert(n);
        break; // Alert the most recent one first; subsequent ticks will process any others
      } else {
        markAlertSeen(n.id);
      }
    }
  }

  // Also check inquiries
  for (const n of nextNotices) {
    if (n.id && n.id.startsWith('enquiry-') && !seenAlertsRef.current.has(n.id)) {
      const noticeTime = n.date ? new Date(n.date).getTime() : 0;
      const isRecent = noticeTime > 0 ? (now - noticeTime) < 30 * 60 * 1000 : true;
      if (isRecent) {
        markAlertSeen(n.id);
        playNotificationSound();
        triggerSystemNotification({
          title: '📞 New Customer Inquiry! · R2Cart',
          body: `${n.title} · ${n.text}`,
          url: n.path || '/admin/enquiries',
          tag: n.id,
        });
        window.dispatchEvent(new CustomEvent('r2cart:new-order-alert', {
          detail: {
            orderNumber: n.title,
            customerName: n.text,
            total: 'Custom Inquiry',
            itemsCount: 1,
            url: n.path || '/admin/enquiries',
          }
        }));
        break;
      } else {
        markAlertSeen(n.id);
      }
    }
  }

  prevNoticesRef.current=nextNotices;
  setData(value);
  setNoticeError('');
 }).catch(e=>setNoticeError(e.message));

 useEffect(()=>{
  load();
  // Fast 4.5s polling as ultra-reliable real-time fallback
  const timer=setInterval(load,4500);
  
  window.addEventListener('r2cart:settings-updated',load);

  // Background push notification event from service worker
  const onSwPush=event=>{
   if(event.data?.type==='R2CART_PUSH_RECEIVED'){
    const p=event.data.payload||{};
    const alertKey=p.tag||p.orderId||p.data?.orderId||p.orderNumber||'sw-push';
    if(!seenAlertsRef.current.has(alertKey)){
     markAlertSeen(alertKey);
     playNotificationSound();
     window.dispatchEvent(new CustomEvent('r2cart:new-order-alert',{
      detail:{
       orderNumber:p.orderNumber||p.data?.orderNumber||p.title||'New Order',
       customerName:p.customerName||p.data?.customerName||p.body||'Customer',
       total:p.total||p.data?.total||'',
       itemsCount:p.itemsCount||p.data?.itemsCount||1,
       time:p.time||p.data?.time,
       url:p.url||p.data?.url||'/admin/orders',
      }
     }));
    }
    load();
   }
  };
  if('serviceWorker' in navigator){
   navigator.serviceWorker.addEventListener('message',onSwPush);
  }

  // Real-Time Server-Sent Events (SSE) connection for instant zero-latency alerts
  let es = null;
  let esRetryTimer = null;
  const adminToken = localStorage.getItem('r2cart-admin-access-token');

  const connectSSE = () => {
    if (!adminToken || typeof EventSource === 'undefined') return;
    try {
      const sseUrl = `${env.apiBaseUrl}/admin/orders/live-stream?token=${encodeURIComponent(adminToken)}`;
      es = new EventSource(sseUrl);

      es.onmessage = (event) => {
        if (!event.data) return;
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'NEW_ORDER' && payload.order) {
            const o = payload.order;
            const alertKey = `order-${o.id}`;
            if (!seenAlertsRef.current.has(alertKey)) {
              markAlertSeen(alertKey);
              playNotificationSound();
              triggerSystemNotification({
                title: '🚨 New Order Received! · R2Cart',
                body: `Order #${o.orderNumber} (₹${o.total}) from ${o.customerName}`,
                url: o.url || '/admin/orders',
                tag: alertKey,
              });
              window.dispatchEvent(new CustomEvent('r2cart:new-order-alert', {
                detail: {
                  orderNumber: o.orderNumber,
                  customerName: o.customerName,
                  total: o.total,
                  itemsCount: o.itemsCount,
                  url: o.url || '/admin/orders',
                }
              }));
            }
            load();
          }
        } catch (err) {
          console.warn('[SSE] Event parse warning:', err);
        }
      };

      es.onerror = () => {
        es?.close();
        esRetryTimer = setTimeout(connectSSE, 6000);
      };
    } catch (err) {
      console.warn('[SSE] Init warning:', err);
    }
  };

  connectSSE();

  const close=e=>{if(!root.current?.contains(e.target))setMenu('')};
  document.addEventListener('pointerdown',close);
  return()=>{
   clearInterval(timer);
   if (esRetryTimer) clearTimeout(esRetryTimer);
   if (es) es.close();
   window.removeEventListener('r2cart:settings-updated',load);
   if('serviceWorker' in navigator)navigator.serviceWorker.removeEventListener('message',onSwPush);
   document.removeEventListener('pointerdown',close);
  };
 },[]);

 useEffect(()=>{
  let active=true;
  if(!q.trim()){setResults([]);setBusy(false);setError('');return}
  setBusy(true);
  const timer=setTimeout(()=>api.get(`/admin/search?q=${encodeURIComponent(q)}`).then(rows=>{if(active){setResults(rows);setError('')}}).catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setBusy(false)}),250);
  return()=>{active=false;clearTimeout(timer)};
 },[q]);

 const mark=ids=>{const next=[...new Set([...read,...ids])].slice(-500);setRead(next);localStorage.setItem('r2cart-admin-read-notifications',JSON.stringify(next))};
 const clearAll=()=>{
  const allIds=notices.map(n=>n.id);
  const next=[...new Set([...cleared,...allIds])].slice(-1000);
  setCleared(next);
  localStorage.setItem('r2cart-admin-cleared-notifications',JSON.stringify(next));
  mark(allIds);
 };
 const clearOne=(id,e)=>{
  if(e){e.preventDefault();e.stopPropagation();}
  const next=[...new Set([...cleared,id])].slice(-1000);
  setCleared(next);
  localStorage.setItem('r2cart-admin-cleared-notifications',JSON.stringify(next));
 };
 const allNotices=data?.notifications||[];
 const notices=allNotices.filter(n=>!cleared.includes(n.id));
 const unread=notices.filter(n=>!read.includes(n.id)).length;
 const go=path=>{setMenu('');nav(path)};

 return <div className="admin-head-actions" ref={root}>
  <div className="admin-global-search">
   <form className="admin-search" onSubmit={e=>{e.preventDefault();setMenu('search');if(results.length&&!busy)go(results[0].path)}}>
    <Search/>
    <input aria-label="Search admin records" placeholder="Search products, orders, customers…" value={q} onFocus={()=>setMenu('search')} onChange={e=>{setQ(e.target.value);setMenu('search')}}/>
    {q&&<button type="button" aria-label="Clear search" onClick={()=>setQ('')}><X size={16}/></button>}
   </form>
   {menu==='search'&&<div className="admin-navbar-popover">
    <b>Search records</b>
    {!q.trim()?<p>Search by product, SKU, order number, customer or ticket.</p>:busy?<p>Searching…</p>:error?<p role="alert">{error}</p>:!results.length?<p>No matching records.</p>:results.map(item=><button key={`${item.type}-${item.id}`} className="navbar-result" onClick={()=>go(item.path)}>{item.image&&<img src={mediaUrl(item.image)} alt={item.title || item.type || 'Search result'} onError={e=>{e.currentTarget.hidden=true}}/>}<span><small>{item.type}</small><b>{item.title}</b><small>{item.subtitle}</small></span></button>)}
   </div>}
  </div>

  <button
    type="button"
    className="admin-lang-btn"
    onClick={toggleLang}
    title={lang === 'hi' ? 'Switch Admin to English' : 'एडमिन पैनल को हिंदी में बदलें'}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      background: '#ffffff',
      border: '1.5px solid #d1d5db',
      color: '#1f2937',
      padding: '7px 14px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 700,
      cursor: 'pointer',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      whiteSpace: 'nowrap',
      transition: 'all 0.15s ease'
    }}
  >
    <Globe size={15} color="#059669" />
    <span>{lang === 'hi' ? 'English' : 'हिंदी'}</span>
  </button>

  <div className="admin-notice-anchor">
   <button className="notification" aria-label="Notifications" aria-expanded={menu==='notifications'} onClick={()=>{setMenu(menu==='notifications'?'':'notifications');load()}}>
    <Bell/>
    {unread>0&&<i>{unread>99?'99+':unread}</i>}
   </button>
   {menu==='notifications'&&<div className="admin-navbar-popover" style={{ width: '380px', maxWidth: 'calc(100vw - 32px)' }}>
    <div className="row between" style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9' }}>
     <b style={{ fontSize: '14px', color: '#0f172a' }}>Notifications {unread > 0 ? `(${unread})` : ''}</b>
     <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
       <button
         type="button"
         disabled={!unread}
         onClick={()=>mark(notices.map(n=>n.id))}
         style={{ background: 'none', border: 'none', color: unread ? '#059669' : '#94a3b8', fontSize: '11.5px', fontWeight: 700, cursor: unread ? 'pointer' : 'default', padding: '2px 4px' }}
       >
         Mark all read
       </button>
       <span style={{ color: '#cbd5e1', fontSize: '11px' }}>·</span>
       <button
         type="button"
         disabled={!notices.length}
         onClick={clearAll}
         style={{ background: 'none', border: 'none', color: notices.length ? '#ef4444' : '#94a3b8', fontSize: '11.5px', fontWeight: 700, cursor: notices.length ? 'pointer' : 'default', padding: '2px 4px' }}
       >
         Clear all
       </button>
     </div>
    </div>

    {perm!=='granted'&&perm!=='unsupported'&&(
     <div style={{padding:'8px 10px',background:'rgba(20,133,66,0.08)',borderRadius:'8px',marginBottom:'10px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
      <span style={{fontSize:'12px',color:'#148542',fontWeight:500}}>Turn on background alerts for orders</span>
      <button style={{fontSize:'11px',padding:'4px 8px',background:'#148542',color:'#fff',borderRadius:'6px',border:'none',cursor:'pointer'}} onClick={handleEnableAlerts}>Enable</button>
     </div>
    )}

    {perm==='granted'&&(
     <div style={{padding:'6px 10px',background:'rgba(20,133,66,0.06)',borderRadius:'8px',marginBottom:'10px',display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:'11px'}}>
      <span style={{color:'#148542',fontWeight:500}}>🔔 Windows & push alerts active</span>
      <button
        style={{
          background: testStatus==='sent'?'#148542':'none',
          border:'1px solid #148542',
          color: testStatus==='sent'?'#fff':'#148542',
          padding:'3px 8px',
          borderRadius:'4px',
          cursor: testStatus==='sending'?'wait':'pointer',
          fontSize:'10px',
          fontWeight:600,
          transition:'all 0.2s ease'
        }}
        disabled={testStatus==='sending'}
        onClick={async()=>{
          setTestStatus('sending');
          try {
            await sendTestPush('ADMIN');
            setTestStatus('sent');
            setTimeout(()=>setTestStatus('idle'), 3500);
          } catch(e) {
            console.error('Test push error:', e);
            setTestStatus('idle');
          }
        }}
      >
        {testStatus==='sending'?'Sending…':testStatus==='sent'?'✓ Sent to Windows!':'Send test'}
      </button>
     </div>
    )}

    {noticeError ? (
      <><p role="alert">{noticeError}</p><button onClick={load}>Try again</button></>
    ) : !data ? (
      <p>Loading notifications…</p>
    ) : !notices.length ? (
      <div style={{ padding: '24px 10px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
        🔔 No pending alerts. All clear!
      </div>
    ) : (
      notices.map(n => (
        <div
          key={n.id}
          className={`navbar-result ${read.includes(n.id) ? '' : 'unread'}`}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '8px', padding: '8px 10px', borderRadius: '8px', marginBottom: '4px' }}
        >
          <button
            type="button"
            onClick={() => { mark([n.id]); go(n.path); }}
            style={{ flex: 1, background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer', color: 'inherit' }}
          >
            <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <b style={{ fontSize: '12.5px', color: '#0f172a' }}>{n.title}</b>
              <small style={{ color: '#475569', fontSize: '11px' }}>{n.text}</small>
              <small style={{ color: '#059669', fontWeight: 600, fontSize: '10.5px', marginTop: '2px' }}>
                ⏰ {new Date(n.date).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true })} · {new Date(n.date).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short' })}
              </small>
            </span>
          </button>
          <button
            type="button"
            onClick={(e) => clearOne(n.id, e)}
            style={{ background: '#f1f5f9', border: 'none', color: '#64748b', cursor: 'pointer', width: '22px', height: '22px', borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: '11px', flexShrink: 0 }}
            title="Clear notification"
          >
            ✕
          </button>
        </div>
      ))
    )}
   </div>}
  </div>

  <div className="admin-profile-anchor">
   <button className="head-avatar" aria-label="Admin account" onClick={()=>setMenu(menu==='profile'?'':'profile')}>
    {data?.store.logo?<img src={mediaUrl(data.store.logo)} alt="Store logo" onError={e=>{e.currentTarget.hidden=true}}/>:<UserRound size={20}/>}
   </button>
   {menu==='profile'&&<div className="admin-navbar-popover">
    <b>{data?.admin.name||'Administrator'}</b>
    <p>{data?.admin.email}</p>
    <small>{data?.admin.role}</small>
    <button className="navbar-result" onClick={()=>go('/admin/settings')}>Store settings & logo</button>
   </div>}
  </div>
 </div>;
}
