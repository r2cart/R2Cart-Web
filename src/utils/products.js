export function normalizeBaseName(name) {
  if (!name || typeof name !== 'string') return '';
  return name
    .toLowerCase()
    .replace(/\s*\(\s*\d+(?:\.\d+)?\s*(?:kg|g|gm|gms|ml|l|ltr|pc|pcs|pack|packs)\b[^\)]*\)/gi, '')
    .replace(/\s*-\s*\d+(?:\.\d+)?\s*(?:kg|g|gm|gms|ml|l|ltr|pc|pcs|pack|packs)\b.*$/gi, '')
    .replace(/\s+\d+(?:\.\d+)?\s*(?:kg|g|gm|gms|ml|l|ltr|pc|pcs|pack|packs)\b.*$/gi, '')
    .trim();
}

/**
 * Distributes / interleaves variant pack sizes across different products
 * so that 3-4 packs of the same product don't crowd together consecutively in product grids.
 */
export function interleaveProductVariants(products) {
  if (!Array.isArray(products) || products.length <= 2) return products;

  const groupsMap = new Map();
  const groupOrder = [];

  for (const p of products) {
    if (!p) continue;
    const baseKey = p.variantGroupId
      ? `group:${p.variantGroupId}`
      : `name:${normalizeBaseName(p.name) || p.id}`;

    if (!groupsMap.has(baseKey)) {
      groupsMap.set(baseKey, []);
      groupOrder.push(baseKey);
    }
    groupsMap.get(baseKey).push(p);
  }

  if (groupsMap.size <= 1 || groupsMap.size === products.length) {
    return products;
  }

  let maxLen = 0;
  for (const list of groupsMap.values()) {
    if (list.length > maxLen) maxLen = list.length;
  }

  const result = [];
  for (let round = 0; round < maxLen; round++) {
    for (const key of groupOrder) {
      const list = groupsMap.get(key);
      if (round < list.length) {
        result.push(list[round]);
      }
    }
  }

  return result;
}

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
