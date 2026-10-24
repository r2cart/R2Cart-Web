const image=id=>`https://images.unsplash.com/${id}?auto=format&fit=crop&w=320&q=75`;

export const categories = [
  ['fruits-vegetables','Fruits & Vegetables',image('photo-1610832958506-aa56368176cf'),'#EAF8E8'],
  ['dairy-bread-eggs','Dairy, Bread & Eggs',image('photo-1550583724-b2692b85b150'),'#E9F5FF'],
  ['atta-rice-dal-oil','Atta, Rice, Dal & Oil',image('photo-1586201375761-83865001e31c'),'#FFF6D9'],
  ['masala-dry-fruits','Masalas & Dry Fruits',image('photo-1596040033229-a9821ebd058d'),'#FFF0E5'],
  ['cold-drinks-juices','Cold Drinks & Juices',image('photo-1629203851122-3726ecdf080e'),'#FFEDED'],
  ['snacks','Snacks',image('photo-1566478989037-eec170784d0b'),'#FFF2DF'],
  ['biscuits-bakery','Biscuits & Bakery',image('photo-1558961363-fa8fdf82db35'),'#FFF0E4'],
  ['ice-creams-more','Ice Creams & More',image('photo-1501443762994-82bd5dace89a'),'#FFE8EC'],
  ['tea-coffee','Tea & Coffee',image('photo-1544787219-7f47ccb76574'),'#F5EBE1'],
  ['packaged-food','Packaged Food',image('photo-1612929633738-8fe44f7ec841'),'#FFF3D6'],
  ['breakfast-sauces','Breakfast & Sauces',image('photo-1589301760014-d929f3979dbc'),'#FFF3E0'],
  ['sweet-cravings','Sweet Cravings',image('photo-1582293041079-7814c2f12063'),'#FCE4EC'],
  ['household','Household Care',image('photo-1585832770485-e68a5dbfad52'),'#EAF3FF'],
  ['personal','Personal Care',image('photo-1598440947619-2c35fc9aa908'),'#F7ECFF'],
  ['baby-care','Baby Care',image('photo-1515488042361-ee00e0ddd4e4'),'#EBF4FF'],
  ['jewellery','Jewellery',image('photo-1515562141207-7a88fb7ce338'),'#FFF0F6'],
  ['cleaning-kitchen','Cleaning & Kitchen',image('photo-1585832770485-e68a5dbfad52'),'#E8F8F5'],
  ['paan-corner','Paan Corner',image('photo-1621996346565-e3d5d6281220'),'#E8F5E9'],
  ['pharma-wellness','Pharma & Wellness',image('photo-1584308666744-24d5c474f2ae'),'#F3E5F5'],
  ['stationery-utilities','Stationery & Utilities',image('photo-1583485088034-697b5bc54ccd'),'#FFFDE7']
].map(([slug,name,imageUrl,color],index)=>({id:index+1,slug,name,image:imageUrl,color}));
