// database.js - IndexedDB wrapper
const DB='dokumen-aman-db', VER=1;
let p=null;
function open(){
  if(p) return p;
  p=new Promise((res,rej)=>{
    const r=indexedDB.open(DB,VER);
    r.onupgradeneeded=()=>{ const db=r.result;
      if(!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
      if(!db.objectStoreNames.contains('docs')) db.createObjectStore('docs',{keyPath:'id'});
      if(!db.objectStoreNames.contains('files')) db.createObjectStore('files',{keyPath:'id'});
    };
    r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error);
  }); return p;
}
async function tx(store,mode,fn){
  const db=await open();
  return new Promise((res,rej)=>{
    const t=db.transaction(store,mode), s=t.objectStore(store);
    const out=fn(s); t.oncomplete=()=>res(out); t.onerror=()=>rej(t.error);
  });
}
export const supported=()=>!!window.indexedDB && !!window.crypto?.subtle;
export const get=async(store,key)=>tx(store,'readonly',s=>new Promise((res,rej)=>{const q=s.get(key); q.onsuccess=()=>res(q.result?.v ?? q.result?.d ? q.result : q.result); q.onerror=()=>rej(q.error)}));
// Wrapper khusus biar cocok sama vault.js: vault manggil db.get('meta','kdf')
const _get=get;
export async function get2(){}
// --- Fungsi yang dipake vault.js & app.js ---
export async function getMeta(){}
export const wipeAll=async()=>{ const db=await open(); for(const st of ['kv','docs','files']){ await new Promise((res,rej)=>{ const t=db.transaction(st,'readwrite'); t.objectStore(st).clear(); t.oncomplete=res; t.onerror=()=>rej(t.error); }); } };
