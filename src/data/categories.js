const image=id=>`https://images.unsplash.com/${id}?auto=format&fit=crop&w=320&q=75`;

export const categories = [
  ['fruits-vegetables','Fruits & Vegetables',image('photo-1610832958506-aa56368176cf'),'#EAF8E8'],
  ['dairy-breakfast','Dairy & Breakfast',image('photo-1550583724-b2692b85b150'),'#E9F5FF'],
  ['snacks','Snacks',image('photo-1566478989037-eec170784d0b'),'#FFF2DF'],
  ['beverages','Beverages',image('photo-1544145945-f90425340c7e'),'#FFEDED'],
  ['staples','Atta, Rice & Dal',image('photo-1586201375761-83865001e31c'),'#FFF6D9'],
  ['cooking','Cooking Essentials',image('photo-1474979266404-7eaacbcd87c5'),'#F9EDE0'],
  ['household','Household Care',image('photo-1585832770485-e68a5dbfad52'),'#EAF3FF'],
  ['personal','Personal Care',image('photo-1598440947619-2c35fc9aa908'),'#F7ECFF'],
  ['bakery','Bakery',image('photo-1509440159596-0249088772ff'),'#FFF0E4'],
  ['instant','Instant Food',image('photo-1612929633738-8fe44f7ec841'),'#FFF3D6']
].map(([slug,name,imageUrl,color],index)=>({id:index+1,slug,name,image:imageUrl,color}));
