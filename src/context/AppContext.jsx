import {createContext,useContext,useEffect,useMemo,useState} from 'react';
import {products as fallbackProducts} from '../data/products';
import {storage} from '../services/storage.service';
import {customerService} from '../services/customer.service';
import {authService} from '../services/auth.service';
import {orderService} from '../services/order.service';
import {catalogService} from '../services/catalog.service';
import {addressView} from '../utils/address';
import {categories as fallbackCategories} from '../data/categories';
import grocifyLogo from '../assets/grocify-logo.png';

const Ctx=createContext(null);
function clearLegacyDemoSession(){
 try{
  const stored=storage.get('user',null);
  if(stored?.email?.toLowerCase()==='aarav@example.com'){
   localStorage.removeItem('grocify-access-token');
   storage.remove('user');
  }
 }catch{}
}
clearLegacyDemoSession();
export function AppProvider({children}){
 const [cart,setCart]=useState(()=>storage.get('cart',{}));
 const [favorites,setFavorites]=useState(()=>storage.get('favorites',[]));
 const [user,setUserState]=useState(()=>{if(!onlineSession()){storage.remove('user');return null}return storage.get('user',null)});
 const [location,setLocation]=useState(()=>{const saved=storage.get('location','');const legacy=['Bailey Road, Patna','Boring Road, Patna','Current location, Patna'];return saved&&!legacy.includes(saved)?saved:'Select delivery address'});
 const [addressList,setAddressList]=useState([]);
 const [orderList,setOrderList]=useState([]);
 const [categories,setCategories]=useState(fallbackCategories);
 const [products,setProducts]=useState(fallbackProducts);
 const [toast,setToast]=useState(null);const [locationOpen,setLocationOpen]=useState(false);const [cartOpen,setCartOpen]=useState(false);
 function onlineSession(){return Boolean(localStorage.getItem('grocify-access-token'))}
 const online=onlineSession;
 const setUser=value=>{setUserState(value);if(value)storage.set('user',value);else storage.remove('user')};
 const logout=async()=>{try{await authService.logout()}finally{setUserState(null);storage.remove('user')}};
 useEffect(()=>{storage.set('location',location)},[location]);
 useEffect(()=>{if(!online())return;Promise.all([authService.me(),customerService.cart(),customerService.favorites(),customerService.addresses()]).then(([profile,remoteCart,remoteFavorites,remoteAddresses])=>{setUser(profile);setCart(remoteCart.cart);setFavorites(remoteFavorites.map(p=>p.id));setAddressList(remoteAddresses.map(addressView));return orderService.list()}).then(rows=>setOrderList(rows)).catch(error=>{if(error?.status===401){localStorage.removeItem('grocify-access-token');storage.remove('user');setUserState(null)}})},[]);
 const notify=(message,type='success')=>{setToast({message,type});setTimeout(()=>setToast(null),2600)};
 const refreshCategories=async()=>{try{const rows=await catalogService.listCategories();setCategories(rows.map(category=>{const fallback=fallbackCategories.find(item=>item.slug===category.slug);return {...category,image:category.image||fallback?.image||grocifyLogo,color:category.color||fallback?.color||'#EAF8E8'}}));return rows}catch(error){if(!categories.length)setCategories(fallbackCategories);return []}};
 const refreshProducts=async()=>{try{const rows=await catalogService.listProducts('limit=50');setProducts(rows.map(product=>{const fallback=fallbackProducts.find(item=>item.id===product.id);return {...product,image:product.image||fallback?.image||grocifyLogo,images:product.images?.length?product.images:[product.image||fallback?.image||grocifyLogo]}}));return rows}catch(error){if(!products.length)setProducts(fallbackProducts);return []}};
 useEffect(()=>{const refresh=()=>{refreshCategories();refreshProducts()};refresh();window.addEventListener('focus',refresh);window.addEventListener('grocify:categories-updated',refresh);window.addEventListener('grocify:products-updated',refresh);return()=>{window.removeEventListener('focus',refresh);window.removeEventListener('grocify:categories-updated',refresh);window.removeEventListener('grocify:products-updated',refresh)}},[]);
 const syncCart=(id,quantity)=>{if(online())customerService.setCartItem(id,quantity).catch(error=>notify(error.message,'error'))};
 const add=id=>{const quantity=(cart[id]||0)+1;setCart(current=>({...current,[id]:quantity}));syncCart(id,quantity);notify('Added to your basket')};
 const qty=(id,quantity)=>{setCart(current=>{const next={...current};if(quantity<=0)delete next[id];else next[id]=quantity;return next});syncCart(id,quantity)};
 const toggleFavorite=async id=>{const saved=favorites.includes(id);if(!online())return notify('Please sign in to use your wishlist','error');setFavorites(current=>saved?current.filter(value=>value!==id):[...current,id]);try{await(saved?customerService.removeFavorite(id):customerService.addFavorite(id));notify(saved?'Removed from favourites':'Saved to favourites')}catch(error){setFavorites(current=>saved?[...new Set([...current,id])]:current.filter(value=>value!==id));notify(error.message,'error')}};
 const cartItems=useMemo(()=>products.filter(p=>cart[p.id]).map(p=>({...p,qty:cart[p.id]})),[cart,products]);
 const subtotal=cartItems.reduce((sum,p)=>sum+p.price*p.qty,0),mrpTotal=cartItems.reduce((sum,p)=>sum+p.mrp*p.qty,0);
 return <Ctx.Provider value={{cart,setCart,add,qty,cartItems,subtotal,mrpTotal,favorites,toggleFavorite,user,setUser,logout,location,setLocation,addressList,setAddressList,orderList,setOrderList,categories,refreshCategories,products,refreshProducts,toast,notify,locationOpen,setLocationOpen,cartOpen,setCartOpen}}>{children}</Ctx.Provider>
}
export const useApp=()=>useContext(Ctx);
