// crypto.js - AES-GCM + PBKDF2
export const rand=n=>{ const a=new Uint8Array(n); crypto.getRandomValues(a); return Array.from(a).map(b=>b.toString(16).padStart(2,'0')).join(''); };
export const strongEnough=p=> p && (p.length>=20 || (p.length>=12 && /[a-z]/.test(p) && /[A-Z]/.test(p) && /\d/.test(p) && /[^A-Za-z0-9]/.test(p)));
export const calibrate=async()=>{ const t=performance.now(); await derive('test','00'.repeat(16),1000); const el=performance.now()-t; return Math.min(200000, Math.max(50000, Math.floor(1000/el*100000))); };
async function getKey(pass,salt,iter){ const enc=new TextEncoder(); const base=await crypto.subtle.importKey('raw',enc.encode(pass),'PBKDF2',false,['deriveKey']); return crypto.subtle.deriveKey({name:'PBKDF2',salt:hex(salt),iterations:iter,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']); }
function hex(s){ const a=new Uint8Array(s.length/2); for(let i=0;i<a.length;i++) a[i]=parseInt(s.substr(i*2,2),16); return a; }
function b64(b){ let s=''; b.forEach(x=>s+=String.fromCharCode(x)); return btoa(s); }
function ub64(s){ return Uint8Array.from(atob(s),c=>c.charCodeAt(0)); }
export const derive=async(pass,salt,iter)=>getKey(pass,salt,iter);
export const encrypt=async(key,data)=>{ const iv=crypto.getRandomValues(new Uint8Array(12)); const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,data); return {iv:b64(iv),ct:b64(new Uint8Array(ct))}; };
export const decrypt=async(key,obj)=>{ const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:ub64(obj.iv)},key,ub64(obj.ct)); return new Uint8Array(pt); };
export const encJson=async(key,obj)=>encrypt(key,new TextEncoder().encode(JSON.stringify(obj)));
export const decJson=async(key,obj)=>JSON.parse(new TextDecoder().decode(await decrypt(key,obj)));
