export const addressPayload=address=>({
 name:address.name?.trim(),
 mobile:address.mobile?.trim(),
 house:address.house?.trim(),
 street:address.street?.trim()||'',
 landmark:address.landmark?.trim()||'',
 area:address.area?.trim(),
 city:address.city?.trim(),
 district:address.district?.trim()||'',
 state:address.state?.trim(),
 pin:address.pin?.trim(),
 type:address.type||'Home',
 isDefault:Boolean(address.isDefault??address.default)
});

export const addressView=address=>({
 ...address,
 default:Boolean(address.isDefault??address.default),
 line:address.line||[address.house,address.street,address.area].filter(Boolean).join(', '),
 cityLine:address.cityLine||[address.city,address.state,address.pin].filter(Boolean).join(', ')
});
