export const addressPayload=address=>({
 name:address.name?.trim(),
 mobile:address.mobile?.trim(),
 house:address.house?.trim(),
 street:address.street?.trim()||'',
 landmark:address.landmark?.trim()||'',
 area:address.area?.trim(),
 city:address.city?.trim(),
 district:'',
 state:'',
 pin:'',
 type:address.type||'Home',
 isDefault:Boolean(address.isDefault??address.default)
});

export const addressView=address=>({
 ...address,
 default:Boolean(address.isDefault??address.default),
 line:address.line||[address.house,address.street,address.area].filter(Boolean).join(', '),
 cityLine:address.cityLine||[address.city,address.state,address.pin].filter(Boolean).join(', ')
});
export const addressText=address=>{
 const value=address||{};
 const line=value.line||[value.house,value.street,value.landmark,value.area].filter(Boolean).join(', ');
 const cityLine=value.cityLine||[value.city,value.district,value.state,value.pin].filter(Boolean).join(', ');
 return {line:line||'Address not available',cityLine:cityLine||'',mobile:value.mobile||''};
};
