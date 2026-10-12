import {useEffect,useState} from 'react';
import {adminService} from '../services/admin.service';

export default function useAdminCategories(){
 const [categories,setCategories]=useState([]),[error,setError]=useState('');
 const reload=async()=>{try{setCategories(await adminService.categories());setError('')}catch(reason){setError(reason.message)}};
 useEffect(()=>{reload()},[]);
 return {categories,categoryError:error,reloadCategories:reload};
}
