export const flattenProducts=rows=>[...new Map(rows.flatMap(product=>[product,...(product.variants||[])]).map(product=>[product.id,product])).values()];
export const uniqueProducts=rows=>[...new Map(rows.map(product=>[product.variantGroupId||product.id,product])).values()];
export const packOptions=(product,products)=>product.variantGroupId?products.filter(item=>item.variantGroupId===product.variantGroupId).sort((a,b)=>a.price-b.price):[product];
