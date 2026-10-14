import {createContext,useContext,useEffect,useMemo,useState} from 'react';
import {storage} from '../services/storage.service';
import {customerService} from '../services/customer.service';
import {authService} from '../services/auth.service';
import {orderService} from '../services/order.service';
import {catalogService} from '../services/catalog.service';
import {addressView} from '../utils/address';
import {mediaUrl} from '../utils/media';
import grocifyLogo from '../assets/r2cart-mark.svg';

const Ctx=createContext(null);
const DEFAULT_LOCATION='Select delivery address';
const formatLocation=address=>address?`${address.line}, ${address.cityLine||address.city}`:DEFAULT_LOCATION;
const isInvalidCustomer=value=>Boolean(value)&&(value.role&&value.role!=='CUSTOMER'||value.email?.toLowerCase()==='aarav@example.com'||value.name?.trim().toLowerCase()==='aarav sharma');
function clearLegacyDemoSession(){
 try{
  const stored=storage.get('user',null);
  if(isInvalidCustomer(stored)){
   localStorage.removeItem('grocify-access-token');
   storage.remove('user');
  }
 }catch{}
}
clearLegacyDemoSession();
export function AppProvider({children}){
 const [cart,setCart]=useState(()=>storage.get('cart',{}));
 const [favorites,setFavorites]=useState(()=>storage.get('favorites',[]));
 const [user,setUserState]=useState(()=>{if(!onlineSession()){storage.remove('user');return null}const stored=storage.get('user',null);if(isInvalidCustomer(stored)){localStorage.removeItem('grocify-access-token');storage.remove('user');return null}return stored});
 const [location,setLocation]=useState(DEFAULT_LOCATION);
 const [addressList,setAddressList]=useState([]);
 const [orderList,setOrderList]=useState([]);
 const [categories,setCategories]=useState([]);
 const [products,setProducts]=useState([]);
 const [banners,setBanners]=useState([]);
 const [catalogErrors,setCatalogErrors]=useState({});
 const catalogResult=(key,error)=>setCatalogErrors(current=>({...current,[key]:error||''}));
 const [storeSettings,setStoreSettings]=useState(null);
 const [deliveryZones,setDeliveryZones]=useState([]);
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

 function onlineSession(){return Boolean(localStorage.getItem('grocify-access-token'))}
 const online=onlineSession;
 const setUser=value=>{setUserState(value);if(value)storage.set('user',value);else storage.remove('user')};
 const clearCustomerView=()=>{setUserState(null);setAddressList([]);setLocation(DEFAULT_LOCATION);storage.remove('user');storage.remove('location')};
 const logout=async()=>{try{await authService.logout()}finally{clearCustomerView()}};
 useEffect(()=>{if(!isInvalidCustomer(user))return;authService.logout().catch(()=>{});localStorage.removeItem('grocify-access-token');clearCustomerView()},[user]);
 useEffect(()=>{storage.remove('location');if(!user?.id){setAddressList([]);setLocation(DEFAULT_LOCATION)}},[user?.id]);
 useEffect(()=>{if(user?.id&&location!==DEFAULT_LOCATION)storage.set(`location-${user.id}`,location)},[location,user?.id]);
 useEffect(()=>{
  if(!online())return;
  const localCart=storage.get('cart',{});
  const syncPromises=Object.entries(localCart).filter(([,q])=>q>0).map(([id,q])=>customerService.setCartItem(id,q).catch(()=>{}));
  Promise.all(syncPromises).then(()=>Promise.all([authService.me(),customerService.cart(),customerService.favorites(),customerService.addresses()])).then(([profile,remoteCart,remoteFavorites,remoteAddresses])=>{if(isInvalidCustomer(profile)){authService.logout().catch(()=>{});localStorage.removeItem('grocify-access-token');clearCustomerView();return null}const addresses=remoteAddresses.map(addressView);setUser(profile);setCart(remoteCart.cart);setFavorites(remoteFavorites.map(p=>p.id));setAddressList(addresses);const savedLocation=storage.get(`location-${profile.id}`,'');const defaultAddress=addresses.find(address=>address.default)||addresses[0];setLocation(savedLocation||formatLocation(defaultAddress));return orderService.list()}).then(rows=>{if(rows)setOrderList(rows)}).catch(error=>{
    // Only clear session if genuinely unauthenticated (and not during server restart/deployment)
    if((error?.status===401||error?.status===403)&&error?.message?.toLowerCase().includes('invalid')){
      localStorage.removeItem('grocify-access-token');
      localStorage.removeItem('grocify-refresh-token');
      clearCustomerView();
    }
  });
 },[user?.id]);
 const notify=(message,type='success')=>{
  if(!message)return;
  const lower=String(message).toLowerCase();
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
  setToast({message,type});
  setTimeout(()=>setToast(null),2600);
 };
 const refreshOrders=async()=>{if(!online())return;try{setOrderList(await orderService.list())}catch(error){if(error.status!==401)notify(error.message,'error')}};
 useEffect(()=>{if(!user?.id)return;window.addEventListener('focus',refreshOrders);window.addEventListener('grocify:orders-updated',refreshOrders);return()=>{window.removeEventListener('focus',refreshOrders);window.removeEventListener('grocify:orders-updated',refreshOrders)}},[user?.id]);
 const refreshCategories=async()=>{try{const rows=await catalogService.listCategories();setCategories(rows.map(category=>({...category,image:mediaUrl(category.image)||grocifyLogo})));catalogResult('categories');return rows}catch(error){catalogResult('categories',error.message);return []}};
 const refreshProducts=async()=>{try{const rows=await catalogService.listProducts();setProducts(rows.map(product=>({...product,image:mediaUrl(product.image)||grocifyLogo,images:(product.images||[]).map(mediaUrl)})));catalogResult('products');return rows}catch(error){catalogResult('products',error.message);return []}};
 const refreshBanners=async()=>{try{const rows=await catalogService.listBanners();setBanners(rows.map(banner=>({...banner,image:mediaUrl(banner.image)})));catalogResult('banners');return rows}catch(error){catalogResult('banners',error.message);return []}};
 const refreshDelivery=async()=>{try{const [settings,deliveryData]=await Promise.all([catalogService.getStoreSettings(),catalogService.listDelivery()]);setStoreSettings(settings);const rawZones=Array.isArray(deliveryData)?deliveryData:[...(deliveryData?.areas||[]),...(deliveryData?.villages||[]).map(v=>({id:v.id,name:v.name,localities:[v.name],deliveryFee:Number(v.deliveryFee),minimumOrder:Number(v.minimumOrder),freeDeliveryThreshold:Number(v.freeDeliveryThreshold),estimatedMinutes:30,radiusKm:Number(v.radiusKm||5),isVillage:true}))];setDeliveryZones(rawZones.map(zone=>({...zone,localities:zone.localities||zone.pincodes||[zone.name]})));catalogResult('delivery');return rawZones}catch(error){catalogResult('delivery',error.message);return []}};
 useEffect(()=>{const refresh=()=>{refreshCategories();refreshProducts();refreshBanners();refreshDelivery()};refresh();window.addEventListener('focus',refresh);window.addEventListener('grocify:categories-updated',refresh);window.addEventListener('grocify:products-updated',refresh);window.addEventListener('grocify:banners-updated',refresh);window.addEventListener('grocify:delivery-updated',refresh);window.addEventListener('grocify:settings-updated',refresh);return()=>{window.removeEventListener('focus',refresh);window.removeEventListener('grocify:categories-updated',refresh);window.removeEventListener('grocify:products-updated',refresh);window.removeEventListener('grocify:banners-updated',refresh);window.removeEventListener('grocify:delivery-updated',refresh);window.removeEventListener('grocify:settings-updated',refresh)}},[]);
 const syncCart=(id,quantity)=>{if(online())customerService.setCartItem(id,quantity).catch(async error=>{notify(error.message,'error');try{const remote=await customerService.cart();setCart(remote.cart)}catch{}})};
 const canSetQuantity=(id,quantity)=>{const product=products.find(item=>item.id===id);if(quantity>0&&(!product||product.status?.toUpperCase()==='INACTIVE'||quantity>Number(product.stock))){notify('This pack does not have enough available stock','error');return false}return true};
 const add=id=>{const quantity=(cart[id]||0)+1;if(!canSetQuantity(id,quantity))return;setCart(current=>({...current,[id]:quantity}));syncCart(id,quantity);notify('Added to your basket')};
 const qty=(id,quantity)=>{if(!canSetQuantity(id,quantity))return;setCart(current=>{const next={...current};if(quantity<=0)delete next[id];else next[id]=quantity;return next});syncCart(id,quantity)};
 const toggleFavorite=async id=>{const saved=favorites.includes(id);if(!online())return notify('Please sign in to use your wishlist','error');setFavorites(current=>saved?current.filter(value=>value!==id):[...current,id]);try{await(saved?customerService.removeFavorite(id):customerService.addFavorite(id));notify(saved?'Removed from favourites':'Saved to favourites')}catch(error){setFavorites(current=>saved?[...new Set([...current,id])]:current.filter(value=>value!==id));notify(error.message,'error')}};
 const cartItems=useMemo(()=>products.filter(p=>cart[p.id]).map(p=>({...p,qty:cart[p.id]})),[cart,products]);
 const subtotal=cartItems.reduce((sum,p)=>sum+p.price*p.qty,0),mrpTotal=cartItems.reduce((sum,p)=>sum+p.mrp*p.qty,0);
 const deliveryConfig=useMemo(()=>({minimumOrder:Number(storeSettings?.minimumOrder||0),deliveryFee:Number(storeSettings?.deliveryFee||0),freeDeliveryThreshold:Number(storeSettings?.freeDeliveryThreshold||0),estimatedDelivery:storeSettings?.estimatedDelivery||'Delivery estimate unavailable'}),[storeSettings]);
 const availableLocalities=useMemo(()=>[...new Set(deliveryZones.flatMap(zone=>zone.localities))],[deliveryZones]);
 const deliveryRulesFor=area=>{const zone=deliveryZones.find(item=>item.localities.some(locality=>locality.toLowerCase()===String(area||'').trim().toLowerCase()));return zone?{zoneId:zone.id,zoneName:zone.name,minimumOrder:Number(zone.minimumOrder),deliveryFee:Number(zone.deliveryFee),freeDeliveryThreshold:Number(zone.freeDeliveryThreshold),estimatedDelivery:`${zone.estimatedMinutes} minutes`}:area?null:deliveryConfig};
 return <Ctx.Provider value={{cart,setCart,add,qty,cartItems,subtotal,mrpTotal,favorites,toggleFavorite,user,setUser,logout,location,setLocation,addressList,setAddressList,orderList,setOrderList,refreshOrders,categories,refreshCategories,products,refreshProducts,banners,refreshBanners,storeSettings,deliveryZones,deliveryConfig,availableLocalities,deliveryRulesFor,refreshDelivery,catalogErrors,toast,notify,locationOpen,setLocationOpen,cartOpen,setCartOpen,authModalOpen,setAuthModalOpen,authModalReason,openAuthModal,closeAuthModal}}>{children}</Ctx.Provider>
}
export const useApp=()=>useContext(Ctx);
