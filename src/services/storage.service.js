const PREFIX='r2cart-';
export const storage={
 get(key,fallback){try{const value=JSON.parse(localStorage.getItem(`${PREFIX}${key}`));return value??fallback}catch{return fallback}},
 set(key,value){try{localStorage.setItem(`${PREFIX}${key}`,JSON.stringify(value));return true}catch{return false}},
 remove(key){try{localStorage.removeItem(`${PREFIX}${key}`);return true}catch{return false}}
};
