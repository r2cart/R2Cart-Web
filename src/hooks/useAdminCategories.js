import {useEffect,useState} from 'react';
import {adminService} from '../services/admin.service';

let cachedCategories = null;

export default function useAdminCategories(){
 const [categories,setCategories]=useState(cachedCategories || []);
 const [error,setError]=useState('');
 const reload=async()=>{
   try{
     const data = await adminService.categories();
     cachedCategories = data;
     setCategories(data);
     setError('');
   }catch(reason){
     setError(reason.message);
   }
 };
 useEffect(()=>{
   if (!cachedCategories) {
     reload();
   } else {
     adminService.categories().then(data => {
       cachedCategories = data;
       setCategories(data);
     }).catch(() => {});
   }
 },[]);
 return {categories,categoryError:error,reloadCategories:reload};
}
