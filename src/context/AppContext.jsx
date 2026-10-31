import {createContext,useCallback,useContext,useEffect,useMemo,useState} from 'react';
import {storage} from '../services/storage.service';
import {customerService} from '../services/customer.service';
import {authService} from '../services/auth.service';
import {orderService} from '../services/order.service';
import {catalogService} from '../services/catalog.service';
import {addressView} from '../utils/address';
import {mediaUrl} from '../utils/media';
import {humanErrorMessage} from '../components/ui';
import {isProductComingSoon} from '../config/homeLayout';
import r2cartLogo from '../assets/r2cart-mark.svg';

const Ctx=createContext(null);
const DEFAULT_LOCATION='Select delivery address';
const formatLocation=address=>address?`${address.line}, ${address.cityLine||address.city}`:DEFAULT_LOCATION;
const isInvalidCustomer=value=>Boolean(value)&&(value.role&&value.role!=='CUSTOMER'||value.email?.toLowerCase()==='aarav@example.com'||value.name?.trim().toLowerCase()==='aarav sharma');
function clearLegacyDemoSession(){
 try{
  const stored=storage.get('user',null);
  if(isInvalidCustomer(stored)){
   localStorage.removeItem('r2cart-access-token');
   storage.remove('user');
   storage.remove('location');
   storage.remove('active_address_id');
  }
 }catch{}
}
clearLegacyDemoSession();
export function AppProvider({children}){
 const [cart,setCart]=useState(()=>storage.get('cart',{}));
 const [favorites,setFavorites]=useState(()=>storage.get('favorites',[]));
 const [user,setUserState]=useState(()=>{if(!onlineSession()){storage.remove('user');return null}const stored=storage.get('user',null);if(isInvalidCustomer(stored)){localStorage.removeItem('r2cart-access-token');storage.remove('user');return null}return stored});
 const [location,setLocation]=useState(DEFAULT_LOCATION);
 const [addressList,setAddressList]=useState([]);
 const [addressesLoaded,setAddressesLoaded]=useState(false);
 const [activeAddressId,setActiveAddressId]=useState(()=>storage.get('active_address_id',null));
 const [orderList,setOrderList]=useState([]);
 const [categories,setCategories]=useState(()=>{
  const cached = storage.get('cached_categories',[]);
  return cached.filter(c => c.slug !== 'pet-care');
 });
 const [products,setProducts]=useState(()=>{
  const cached = storage.get('cached_products',[]);
  return cached.filter(p => p.categorySlug !== 'pet-care' && p.category !== 'pet-care');
 });
 const [banners,setBanners]=useState(()=>storage.get('cached_banners',[]));
 const [catalogErrors,setCatalogErrors]=useState({});
 const catalogResult=(key,error)=>setCatalogErrors(current=>({...current,[key]:error||''}));
 const [storeSettings,setStoreSettings]=useState(()=>storage.get('cached_store_settings',null));
 const [deliveryZones,setDeliveryZones]=useState(()=>storage.get('cached_delivery_zones',[]));
 const [toast,setToast]=useState(null);const [locationOpen,setLocationOpen]=useState(false);const [cartOpen,setCartOpen]=useState(false);
 const [authModalOpen,setAuthModalOpen]=useState(false);
 const [authModalReason,setAuthModalReason]=useState('welcome');
 const openAuthModal=(reason='welcome')=>{setAuthModalReason(reason);setAuthModalOpen(true)};
 const closeAuthModal=()=>{setAuthModalOpen(false);if(authModalReason==='welcome')sessionStorage.setItem('r2cart-auth-popup-dismissed','1')};

 useEffect(()=>{
  if(onlineSession()||user?.id)return;
  if(sessionStorage.getItem('r2cart-auth-popup-dismissed'))return;
  const path=window.location.pathname;
  if(['/login','/signup','/verify-otp','/forgot-password'].includes(path)||path.startsWith('/admin'))return;
  const timer=setTimeout(()=>{setAuthModalReason('welcome');setAuthModalOpen(true)},1200);
  return()=>clearTimeout(timer);
 },[user?.id]);

 function onlineSession(){
   return Boolean(sessionStorage.getItem('r2cart-access-token'))||
          Boolean(localStorage.getItem('r2cart-access-token'))||
          Boolean(localStorage.getItem('r2cart-session-active'));
 }
 const online=onlineSession;
 const setUser=value=>{setUserState(value);if(value)storage.set('user',value);else storage.remove('user')};
 const clearCustomerView=()=>{setUserState(null);setAddressList([]);setAddressesLoaded(false);setActiveAddressId(null);setLocation(DEFAULT_LOCATION);storage.remove('user');storage.remove('location');storage.remove('active_address_id');sessionStorage.removeItem('r2cart-access-token');localStorage.removeItem('r2cart-access-token');localStorage.removeItem('r2cart-session-active')};
 const logout=async()=>{try{await authService.logout()}finally{clearCustomerView()}};
 useEffect(()=>{
  if(typeof window!=='undefined'){
   const p=window.location.pathname;
   if(p.startsWith('/admin')||p.startsWith('/super-admin')||p.startsWith('/delivery')||p.includes('administrator')||p==='/login'||p==='/signup'||p==='/verify-otp')return;
  }
  if(!isInvalidCustomer(user))return;
  authService.logout().catch(()=>{});
  sessionStorage.removeItem('r2cart-access-token');
  localStorage.removeItem('r2cart-access-token');
  localStorage.removeItem('r2cart-session-active');
  clearCustomerView();
 },[user]);
 useEffect(()=>{storage.remove('location');if(!user?.id){setAddressList([]);setAddressesLoaded(false);setActiveAddressId(null);setLocation(DEFAULT_LOCATION)}},[user?.id]);
 useEffect(()=>{if(user?.id&&location!==DEFAULT_LOCATION)storage.set(`location-${user.id}`,location)},[location,user?.id]);
 useEffect(()=>{
  if(typeof window!=='undefined'){
   const p=window.location.pathname;
   if(p.startsWith('/admin')||p.startsWith('/super-admin')||p.startsWith('/delivery')||p.includes('administrator')||p==='/login'||p==='/signup'||p==='/verify-otp')return;
  }
  if(!online())return;
  const localCart=storage.get('cart',{});
  const syncPromises=Object.entries(localCart).filter(([,q])=>q>0).map(([id,q])=>customerService.setCartItem(id,q).catch(()=>{}));
  Promise.all(syncPromises).then(()=>Promise.all([authService.me(),customerService.cart(),customerService.favorites(),customerService.addresses()])).then(([profile,remoteCart,remoteFavorites,remoteAddresses])=>{
    if(isInvalidCustomer(profile)){sessionStorage.removeItem('r2cart-access-token');localStorage.removeItem('r2cart-access-token');localStorage.removeItem('r2cart-session-active');clearCustomerView();return null}
    const addresses=remoteAddresses.map(addressView);
    setUser(profile);
    setCart(remoteCart.cart);
    setFavorites(remoteFavorites.map(p=>p.id));
    setAddressList(addresses);
    setAddressesLoaded(true);
    const savedLocation=storage.get(`location-${profile.id}`,'');
    const savedAddressId=storage.get('active_address_id',null);
    const matchedActive=savedAddressId&&addresses.find(a=>a.id===savedAddressId);
    const defaultAddress=matchedActive||addresses.find(address=>address.default)||addresses[0];
    if(defaultAddress){
      if(!savedAddressId)setActiveAddressId(defaultAddress.id);
      setLocation(savedLocation||formatLocation(defaultAddress));
    }else{
      setLocation(DEFAULT_LOCATION);
    }
    return orderService.list();
  }).then(rows=>{if(rows)setOrderList(rows)}).catch(error=>{
    if(error?.status===403&&String(error?.message||'').toLowerCase().includes('deactivated')){
      sessionStorage.removeItem('r2cart-access-token');
      localStorage.removeItem('r2cart-session-active');
      clearCustomerView();
    }
  });
 },[user?.id]);
 const notify=(message,type='success')=>{
  if(!message)return;
  const clean=humanErrorMessage(message);
  const lower=String(clean).toLowerCase();
  if(
   lower.includes('access token')||
   lower.includes('token is refreshed')||
   lower.includes('session refreshed')||
   lower.includes('session active')||
   lower.includes('token refreshed')||
   lower.includes('refresh token')||
   lower.includes('jwt')||
   lower.includes('your session has expired')
  ){
   return;
  }
  setToast({message:clean,type});
  setTimeout(()=>setToast(null),2600);
 };
 const refreshOrders=async()=>{if(!online())return;try{setOrderList(await orderService.list())}catch(error){if(error.status!==401)notify(error.message,'error')}};
 useEffect(()=>{if(!user?.id)return;window.addEventListener('r2cart:orders-updated',refreshOrders);return()=>{window.removeEventListener('r2cart:orders-updated',refreshOrders)}},[user?.id]);
 const refreshCategories=async(retryCount=0)=>{
  try{
   const rows=await catalogService.listCategories();
   const mapped=rows.map(category=>({...category,image:mediaUrl(category.image)||r2cartLogo}));
   setCategories(mapped);
   storage.set('cached_categories',mapped);
   catalogResult('categories');
   return rows;
  }catch(error){
   if(retryCount<2){
    setTimeout(()=>refreshCategories(retryCount+1),2500);
   }else if(!storage.get('cached_categories',[]).length){
    catalogResult('categories',error.message);
   }
   return [];
  }
 };
 const refreshProducts=async(retryCount=0)=>{
  try{
   const rows=await catalogService.listProducts();
   const mapped=rows.map(product=>({...product,image:mediaUrl(product.image)||r2cartLogo,images:(product.images||[]).map(mediaUrl)}));
   setProducts(mapped);
   storage.set('cached_products',mapped);
   catalogResult('products');
   return rows;
  }catch(error){
   if(retryCount<2){
    setTimeout(()=>refreshProducts(retryCount+1),2500);
   }else if(!storage.get('cached_products',[]).length){
    catalogResult('products',error.message);
   }
   return [];
  }
 };
 const refreshBanners=async(retryCount=0)=>{
  try{
   const rows=await catalogService.listBanners();
   const mapped=rows.map(banner=>({...banner,image:mediaUrl(banner.image)}));
   setBanners(mapped);
   storage.set('cached_banners',mapped);
   catalogResult('banners');
   return rows;
  }catch(error){
   if(retryCount<2){
    setTimeout(()=>refreshBanners(retryCount+1),2500);
   }else if(!storage.get('cached_banners',[]).length){
    catalogResult('banners',error.message);
   }
   return [];
  }
 };
 const refreshDelivery=async(retryCount=0)=>{
  try{
    const [settings,deliveryData]=await Promise.all([catalogService.getStoreSettings(),catalogService.listDelivery()]);
    setStoreSettings(settings);
    storage.set('cached_store_settings',settings);
    // Prioritize village overrides FIRST before broader area zones
    const villageZones=(deliveryData?.villages||[]).map(v=>({
      id:v.id,
      name:v.name,
      localities:[v.name],
      deliveryFee:Number(v.deliveryFee),
      minimumOrder:Number(v.minimumOrder),
      freeDeliveryThreshold:Number(v.freeDeliveryThreshold),
      estimatedMinutes:Number(v.estimatedMinutes||30),
      radiusKm:Number(v.radiusKm||5),
      allowCod:v.allowCod??true,
      allowScheduled:v.allowScheduled??true,
      isVillage:true,
      isPaused:Boolean(v.isPaused),
      pauseReason:v.pauseReason||null
    }));
    const areaZones=(deliveryData?.areas||[]).map(a=>({
      ...a,
      localities:a.localities||a.pincodes||[a.name],
      deliveryFee:Number(a.deliveryFee),
      minimumOrder:Number(a.minimumOrder),
      freeDeliveryThreshold:Number(a.freeDeliveryThreshold),
      estimatedMinutes:Number(a.estimatedMinutes||20),
      radiusKm:Number(a.radiusKm||5),
      allowCod:a.allowCod??true,
      allowScheduled:a.allowScheduled??true,
      isVillage:false,
      isPaused:Boolean(a.isPaused),
      pauseReason:a.pauseReason||null,
      suspendedLocalities:a.suspendedLocalities||[]
    }));
    const rawZones=Array.isArray(deliveryData)?deliveryData:[...villageZones,...areaZones];
    const mappedZones=rawZones.map(zone=>({...zone,localities:zone.localities||zone.pincodes||[zone.name]}));
    setDeliveryZones(mappedZones);
    storage.set('cached_delivery_zones',mappedZones);
    catalogResult('delivery');
    return rawZones;
  }catch(error){
    if(retryCount<2){
     setTimeout(()=>refreshDelivery(retryCount+1),2500);
    }else if(!storage.get('cached_store_settings',null)){
     catalogResult('delivery',error.message);
    }
    return [];
  }
 };
 useEffect(()=>{
  const handleSettingsUpdated=(e)=>{
    if(e?.detail?.policies){
      setStoreSettings(prev=>({
        ...prev,
        policies: e.detail.policies
      }));
      storage.set('cached_store_settings', {
        ...storage.get('cached_store_settings', {}),
        policies: e.detail.policies
      });
    }
    refreshDelivery();
  };
  const refresh=()=>{refreshCategories();refreshProducts();refreshBanners();refreshDelivery()};
  refresh();
  window.addEventListener('r2cart:categories-updated',refresh);
  window.addEventListener('r2cart:products-updated',refresh);
  window.addEventListener('r2cart:banners-updated',refresh);
  window.addEventListener('r2cart:delivery-updated',refresh);
  window.addEventListener('r2cart:settings-updated',handleSettingsUpdated);
  return()=>{
    window.removeEventListener('r2cart:categories-updated',refresh);
    window.removeEventListener('r2cart:products-updated',refresh);
    window.removeEventListener('r2cart:banners-updated',refresh);
    window.removeEventListener('r2cart:delivery-updated',refresh);
    window.removeEventListener('r2cart:settings-updated',handleSettingsUpdated);
  };
 },[]);
 const syncCart=(id,quantity)=>{if(online())customerService.setCartItem(id,quantity).catch(async error=>{notify(error.message,'error');try{const remote=await customerService.cart();setCart(remote.cart)}catch{}})};
 const canSetQuantity=(id,quantity)=>{const product=products.find(item=>item.id===id);const isSoon=isProductComingSoon(product,storeSettings);if(quantity>0&&isSoon){notify('This product is coming soon and cannot be ordered yet','error');return false}if(quantity>0&&(!product||product.status?.toUpperCase()==='INACTIVE'||quantity>Number(product.stock))){notify('This pack does not have enough available stock','error');return false}return true};

 const checkCartConflict = (targetProduct) => {
   if (!targetProduct) return false;
   const isTargetPanIndia = targetProduct.deliveryScope === 'PAN_INDIA' || targetProduct.deliveryScope === 'CUSTOM';
   const existingItems = products.filter(p => (cart[p.id] || 0) > 0);
   if (!existingItems.length) return false;

   const hasLocal = existingItems.some(p => p.deliveryScope !== 'PAN_INDIA' && p.deliveryScope !== 'CUSTOM');
   const hasPanIndia = existingItems.some(p => p.deliveryScope === 'PAN_INDIA' || p.deliveryScope === 'CUSTOM');

   if (isTargetPanIndia && hasLocal) {
     return 'Cannot mix Pan-India items with local grocery items in the same basket. Please order them separately.';
   }
   if (!isTargetPanIndia && hasPanIndia) {
     return 'Cannot mix local grocery items with Pan-India courier items in the same basket. Please order them separately.';
   }
   return false;
 };

 const add=id=>{
   const targetProduct = products.find(item => item.id === id);
   const conflictError = checkCartConflict(targetProduct);
   if (conflictError) {
     notify(conflictError, 'error');
     return;
   }
   const quantity=(cart[id]||0)+1;
   if(!canSetQuantity(id,quantity))return;
   setCart(current=>({...current,[id]:quantity}));
   syncCart(id,quantity);
   notify('Added to your basket');
 };

 const qty=(id,quantity)=>{
   if (quantity > 0 && !(cart[id] > 0)) {
     const targetProduct = products.find(item => item.id === id);
     const conflictError = checkCartConflict(targetProduct);
     if (conflictError) {
       notify(conflictError, 'error');
       return;
     }
   }
   if(!canSetQuantity(id,quantity))return;
   setCart(current=>{const next={...current};if(quantity<=0)delete next[id];else next[id]=quantity;return next});
   syncCart(id,quantity);
 };
 const toggleFavorite=async id=>{const saved=favorites.includes(id);if(!online())return notify('Please sign in to use your wishlist','error');setFavorites(current=>saved?current.filter(value=>value!==id):[...current,id]);try{await(saved?customerService.removeFavorite(id):customerService.addFavorite(id));notify(saved?'Removed from favourites':'Saved to favourites')}catch(error){setFavorites(current=>saved?[...new Set([...current,id])]:current.filter(value=>value!==id));notify(error.message,'error')}};
 const cartItems=useMemo(()=>products.filter(p=>cart[p.id]).map(p=>({...p,qty:cart[p.id]})),[cart,products]);
 const isPanIndiaCart = useMemo(() => cartItems.some(p => p.deliveryScope === 'PAN_INDIA' || p.deliveryScope === 'CUSTOM'), [cartItems]);
 const subtotal=cartItems.reduce((sum,p)=>sum+p.price*p.qty,0),mrpTotal=cartItems.reduce((sum,p)=>sum+p.mrp*p.qty,0);
 const deliveryConfig=useMemo(()=>({minimumOrder:Number(storeSettings?.minimumOrder||0),deliveryFee:Number(storeSettings?.deliveryFee||0),freeDeliveryThreshold:Number(storeSettings?.freeDeliveryThreshold||0),estimatedDelivery:storeSettings?.estimatedDelivery||'15–20 mins'}),[storeSettings]);
 const availableLocalities=useMemo(()=>{
  const set=new Set();
  deliveryZones.forEach(zone=>{
    if(zone.isVillage&&zone.name)set.add(zone.name);
    else if(Array.isArray(zone.localities))zone.localities.forEach(loc=>set.add(loc));
  });
  return Array.from(set).sort((a,b)=>a.localeCompare(b));
 },[deliveryZones]);

 const deliveryRulesFor=useCallback(area=>{
  const clean=String(area||'').trim().toLowerCase();
  if(!clean)return deliveryConfig;

  // Emergency status check
  const em = storeSettings?.emergencySettings || storeSettings?.effectiveStatus?.emergencyDetails;
  const isEmActive = Boolean(storeSettings?.isOrderPaused || storeSettings?.effectiveStatus?.isEmergencyActive || em?.isActive);
  const emType = em?.type || storeSettings?.effectiveStatus?.emergencyDetails?.type;
  const affectedList = (Array.isArray(em?.affectedVillageIds) ? em.affectedVillageIds : []).map(x => String(x).trim().toLowerCase());
  const isAllOrdersPaused = isEmActive && (emType === 'ALL_ORDERS' || emType === 'STORE_CLOSE');
  const isAreaEmergSuspended = isEmActive && emType === 'SELECTED_AREAS' && (
    affectedList.includes(clean) ||
    affectedList.some(id => id === clean)
  );

  // 1. First priority: Exact Village override
  const villageMatch=deliveryZones.find(item=>item.isVillage&&String(item.name||'').trim().toLowerCase()===clean);
  if(villageMatch){
    const isSuspended = Boolean(
      villageMatch.isPaused ||
      isAreaEmergSuspended ||
      isAllOrdersPaused ||
      affectedList.includes(String(villageMatch.id).toLowerCase()) ||
      affectedList.includes(String(villageMatch.name).toLowerCase())
    );
    return {
      zoneId:villageMatch.id,
      villageId:villageMatch.id,
      villageName:villageMatch.name,
      name:villageMatch.name,
      minimumOrder:Number(villageMatch.minimumOrder),
      deliveryFee:Number(villageMatch.deliveryFee),
      freeDeliveryThreshold:Number(villageMatch.freeDeliveryThreshold),
      estimatedDelivery:`${villageMatch.estimatedMinutes||30} minutes`,
      radiusKm:Number(villageMatch.radiusKm||5),
      allowCod:villageMatch.allowCod??true,
      allowScheduled:villageMatch.allowScheduled??true,
      isVillage:true,
      isPaused:isSuspended,
      pauseReason:isSuspended ? (em?.message || villageMatch.pauseReason || 'Deliveries to this village are temporarily suspended.') : null
    };
  }

  // 2. Second priority: Area / Zone locality match
  const areaMatch=deliveryZones.find(item=>!item.isVillage&&Array.isArray(item.localities)&&item.localities.some(loc=>String(loc||'').trim().toLowerCase()===clean));
  if(areaMatch){
    const isSuspended = Boolean(
      areaMatch.isPaused ||
      isAreaEmergSuspended ||
      isAllOrdersPaused ||
      affectedList.includes(String(areaMatch.id).toLowerCase()) ||
      affectedList.includes(String(areaMatch.name).toLowerCase()) ||
      (Array.isArray(areaMatch.suspendedLocalities) && areaMatch.suspendedLocalities.some(loc => String(loc).trim().toLowerCase() === clean))
    );
    return {
      zoneId:areaMatch.id,
      zoneName:areaMatch.name,
      minimumOrder:Number(areaMatch.minimumOrder),
      deliveryFee:Number(areaMatch.deliveryFee),
      freeDeliveryThreshold:Number(areaMatch.freeDeliveryThreshold),
      estimatedDelivery:`${areaMatch.estimatedMinutes||20} minutes`,
      radiusKm:Number(areaMatch.radiusKm||5),
      allowCod:areaMatch.allowCod??true,
      allowScheduled:areaMatch.allowScheduled??true,
      isVillage:false,
      isPaused:isSuspended,
      pauseReason:isSuspended ? (em?.message || areaMatch.pauseReason || 'Deliveries to this area are temporarily suspended.') : null
    };
  }

  // 3. Fallback: Any zone containing the locality
  const anyMatch=deliveryZones.find(item=>Array.isArray(item.localities)&&item.localities.some(loc=>String(loc||'').trim().toLowerCase()===clean));
  if(anyMatch){
    const isSuspended = Boolean(
      anyMatch.isPaused ||
      isAreaEmergSuspended ||
      isAllOrdersPaused ||
      affectedList.includes(String(anyMatch.id).toLowerCase()) ||
      affectedList.includes(String(anyMatch.name).toLowerCase())
    );
    return {
      zoneId:anyMatch.id,
      zoneName:anyMatch.name,
      minimumOrder:Number(anyMatch.minimumOrder),
      deliveryFee:Number(anyMatch.deliveryFee),
      freeDeliveryThreshold:Number(anyMatch.freeDeliveryThreshold),
      estimatedDelivery:`${anyMatch.estimatedMinutes||25} minutes`,
      radiusKm:Number(anyMatch.radiusKm||5),
      allowCod:anyMatch.allowCod??true,
      allowScheduled:anyMatch.allowScheduled??true,
      isVillage:Boolean(anyMatch.isVillage),
      isPaused:isSuspended,
      pauseReason:isSuspended ? (em?.message || anyMatch.pauseReason || 'Deliveries to this area are temporarily suspended.') : null
    };
  }

  return {
    ...deliveryConfig,
    isPaused: isAreaEmergSuspended || isAllOrdersPaused,
    pauseReason: (isAreaEmergSuspended || isAllOrdersPaused) ? (em?.message || 'Deliveries are temporarily suspended.') : null
  };
 },[deliveryZones,deliveryConfig,storeSettings]);

 const activeAddress=useMemo(()=>{
  if(!addressList.length)return null;
  if(activeAddressId){
    const found=addressList.find(a=>a.id===activeAddressId);
    if(found)return found;
  }
  return addressList.find(a=>a.default)||addressList[0]||null;
 },[addressList,activeAddressId]);

 const setActiveAddress=useCallback(addrOrId=>{
  const addr=typeof addrOrId==='object'?addrOrId:addressList.find(a=>a.id===addrOrId);
  const id=addr?.id||(typeof addrOrId==='string'?addrOrId:null);
  setActiveAddressId(id);
  if(id)storage.set('active_address_id',id);
  else storage.remove('active_address_id');
  if(addr){
    const locStr=`${addr.line}, ${addr.cityLine||addr.area||addr.city}`;
    setLocation(locStr);
    if(user?.id)storage.set(`location-${user.id}`,locStr);
  }
 },[addressList,user?.id]);

 const activeDeliveryRules=useMemo(()=>{
  if(activeAddress?.area){
    const rules=deliveryRulesFor(activeAddress.area);
    if(rules)return rules;
  }
  return deliveryConfig;
 },[activeAddress,deliveryRulesFor,deliveryConfig]);

 return <Ctx.Provider value={{cart,setCart,add,qty,cartItems,isPanIndiaCart,subtotal,mrpTotal,favorites,toggleFavorite,user,setUser,logout,location,setLocation,addressList,setAddressList,addressesLoaded,activeAddress,setActiveAddress,activeDeliveryRules,orderList,setOrderList,refreshOrders,categories,refreshCategories,products,refreshProducts,banners,refreshBanners,storeSettings,setStoreSettings,deliveryZones,deliveryConfig,availableLocalities,deliveryRulesFor,refreshDelivery,catalogErrors,toast,notify,locationOpen,setLocationOpen,cartOpen,setCartOpen,authModalOpen,setAuthModalOpen,authModalReason,openAuthModal,closeAuthModal}}>{children}</Ctx.Provider>
}
export const useApp=()=>useContext(Ctx);
