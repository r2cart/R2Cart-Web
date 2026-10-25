export const flattenProducts=rows=>[...new Map(rows.flatMap(product=>[product,...(product.variants||[])]).map(product=>[product.id,product])).values()];
export const uniqueProducts=rows=>[...new Map(rows.map(product=>[product.variantGroupId||product.id,product])).values()];
export const packOptions=(product,products)=>product.variantGroupId?products.filter(item=>item.variantGroupId===product.variantGroupId).sort((a,b)=>a.price-b.price):[product];

export const dedupeProductPacks = (items) => {
  if (!Array.isArray(items)) return [];
  const groupMap = new Map();
  const result = [];
  for (const item of items) {
    const key = item.variantGroupId || (item.name ? `${item.name.toLowerCase().trim()}_${item.categoryId || item.category}` : item.id);
    if (!key) {
      result.push(item);
      continue;
    }
    if (!groupMap.has(key)) {
      groupMap.set(key, item);
      result.push(item);
    } else {
      const existing = groupMap.get(key);
      if (Number(item.price) < Number(existing.price)) {
        const idx = result.indexOf(existing);
        if (idx !== -1) result[idx] = item;
        groupMap.set(key, item);
      }
    }
  }
  return result;
};
