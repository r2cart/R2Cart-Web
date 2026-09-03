import {products} from '../../data/products';
import {useApp} from '../../context/AppContext';
import {EmptyState,ProductGrid} from '../../components/ui';
const PageHead=({eyebrow,title,text,actions})=><div className="page-head"><div><span>{eyebrow}</span><h1>{title}</h1>{text&&<p>{text}</p>}</div>{actions}</div>;
export function FavoritesPage(){const {favorites}=useApp();const list=products.filter(p=>favorites.includes(p.id));return <div className="container page"><PageHead eyebrow="YOUR PICKS" title="Favourites" text="Products you've saved for later."/>{list.length?<ProductGrid items={list}/>:<EmptyState icon="♡" title="Nothing saved yet" text="Tap the heart on products you love and find them here." action="Start exploring"/>}</div>}
