const PREFIX='r2cart-';

// Transparently migrate any existing grocify tokens to r2cart
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    ['access-token', 'refresh-token', 'user', 'admin-access-token', 'admin-refresh-token', 'admin-user', 'admin', 'delivery-access-token', 'delivery-refresh-token', 'delivery-user', 'delivery', 'search-history'].forEach(k => {
      const oldVal = localStorage.getItem('grocify-' + k);
      if (oldVal && !localStorage.getItem('r2cart-' + k)) {
        localStorage.setItem('r2cart-' + k, oldVal);
      }
    });
  } catch {}
}
export const storage={
 get(key,fallback){try{const value=JSON.parse(localStorage.getItem(`${PREFIX}${key}`));return value??fallback}catch{return fallback}},
 set(key,value){try{localStorage.setItem(`${PREFIX}${key}`,JSON.stringify(value));return true}catch{return false}},
 remove(key){try{localStorage.removeItem(`${PREFIX}${key}`);return true}catch{return false}}
};
