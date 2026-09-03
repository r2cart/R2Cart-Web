import {createContext,useContext,useEffect,useMemo,useState} from 'react';
import {addresses as seedAddresses} from '../data/content';
import {orders as seedOrders} from '../data/orders';
import {products} from '../data/products';
import {storage} from '../services/storage.service';
import {customerService} from '../services/customer.service';
import {authService} from '../services/auth.service';
import {orderService} from '../services/order.service';
import {addressView} from '../utils/address';

const Ctx=createContext(null);
export function AppProvider({children}){
 const [cart,setCart]=useState(()=>storage.get('cart',{}));
 const [favorites,setFavorites]=useState(()=>storage.get('favorites',[]));
 const [user,setUserState]=useState(()=>storage.get('user',null));
 const [location,setLocation]=useState(()=>storage.get('location','Bailey Road, Patna'));
 const [addressList,setAddressList]=useState(()=>onlineSession()?[]:seedAddresses);
 const [orderList,setOrderList]=useState(seedOrders);
 const [toast,setToast]=useState(null);const [locationOpen,setLocationOpen]=useState(false);const [cartOpen,setCartOpen]=useState(false);
 function onlineSession(){return Boolean(localStorage.getItem('grocify-access-token'))}
 const online=onlineSession;
 const setUser=value=>{setUserState(value);if(value)storage.set('user',value);else storage.remove('user')};
 useEffect(()=>{storage.set('location',location)},[location]);
 useEffect(()=>{if(!online())return;Promise.all([authService.me(),customerService.cart(),customerService.favorites(),customerService.addresses()]).then(([profile,remoteCart,remoteFavorites,remoteAddresses])=>{setUser(profile);setCart(remoteCart.cart);setFavorites(remoteFavorites.map(p=>p.id));setAddressList(remoteAddresses.map(addressView));return orderService.list()}).then(rows=>setOrderList(rows.map(order=>({...order,items:order.items.map(item=>item.productId)})))).catch(()=>{})},[]);
 const notify=(message,type='success')=>{setToast({message,type});setTimeout(()=>setToast(null),2600)};
 const syncCart=(id,quantity)=>{if(online())customerService.setCartItem(id,quantity).catch(error=>notify(error.message,'error'))};
 const add=id=>{const quantity=(cart[id]||0)+1;setCart(current=>({...current,[id]:quantity}));syncCart(id,quantity);notify('Added to your basket')};
 const qty=(id,quantity)=>{setCart(current=>{const next={...current};if(quantity<=0)delete next[id];else next[id]=quantity;return next});syncCart(id,quantity)};
 const toggleFavorite=async id=>{const saved=favorites.includes(id);if(!online())return notify('Please sign in to use your wishlist','error');setFavorites(current=>saved?current.filter(value=>value!==id):[...current,id]);try{await(saved?customerService.removeFavorite(id):customerService.addFavorite(id));notify(saved?'Removed from favourites':'Saved to favourites')}catch(error){setFavorites(current=>saved?[...new Set([...current,id])]:current.filter(value=>value!==id));notify(error.message,'error')}};
 const cartItems=useMemo(()=>products.filter(p=>cart[p.id]).map(p=>({...p,qty:cart[p.id]})),[cart]);
 const subtotal=cartItems.reduce((sum,p)=>sum+p.price*p.qty,0),mrpTotal=cartItems.reduce((sum,p)=>sum+p.mrp*p.qty,0);
 return <Ctx.Provider value={{cart,setCart,add,qty,cartItems,subtotal,mrpTotal,favorites,toggleFavorite,user,setUser,location,setLocation,addressList,setAddressList,orderList,setOrderList,toast,notify,locationOpen,setLocationOpen,cartOpen,setCartOpen}}>{children}</Ctx.Provider>
}
export const useApp=()=>useContext(Ctx);
