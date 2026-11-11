const NAME='dokumen-aman', VER=1;
let _db=null;
function open(){ if(_db) return Promise.resolve(_db); return new Promise((res,rej)=>{ const r=indexedDB.open(NAME,VER); r.onupgradeneeded=()=>{ const d=r.result; if(!d.objectStoreNames.contains('meta')) d.createObjectStore('meta'); if(!d.objectStoreNames.contains('docs')) d.createObjectStore('docs',{keyPath:'id'}); if(!d.objectStoreNames.contains('files')) d.createObjectStore('files',{keyPath:'id'}); }; r.onsuccess=()=>{ _db=r.result; res(_db)}; r.onerror=()=>rej(r.error); });}
function req(store,mode,fn){ return open().then(db=>new Promise((res,rej)=>{ const t=db.transaction(store,mode); const s=t.objectStore(store); const q=fn(s); if(q && q.onsuccess!==undefined){ q.onsuccess=()=>res(q.result); q.onerror=()=>rej(q.error); } else { t.oncomplete=()=>res(); t.onerror=()=>rej(t.error); } })); }
export const supported=()=>!!window.indexedDB && !!window.crypto?.subtle;
export const get=(store,key)=>req(store,'readonly',s=>s.get(key));
export const put=(store,key,val)=>req(store,'readwrite',s=> store==='meta'? s.put(val,key) : s.put(val));
export const all=(store)=>req(store,'readonly',s=>s.getAll());
export const del=(store,key)=>req(store,'readwrite',s=>s.delete(key));
export const clear=(store)=>req(store,'readwrite',s=>s.clear());
export const wipeAll=async()=>{ for(const st of ['meta','docs','files']) await clear(st); };
