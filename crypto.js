// Keputusan keamanan: kunci AES-GCM non-extractable; IV acak 96-bit baru di setiap enkripsi; kegagalan dekripsi -> pesan generik.
const te=new TextEncoder(),td=new TextDecoder();
export const b64=u=>{let s='';for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode(...u.subarray(i,i+8192));return btoa(s)};
export const unb64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
export const rand=n=>crypto.getRandomValues(new Uint8Array(n));
export async function derive(pass,salt,iter){
  const m=await crypto.subtle.importKey('raw',te.encode(pass),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt,iterations:iter},m,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
// Kalibrasi sederhana: ~400 ms di perangkat ini, minimum 310.000. Nilai disimpan per brankas (tidak universal).
export async function calibrate(target=400,min=310000){
  const t=performance.now();await derive('x',rand(16),50000);
  return Math.max(min,Math.round(50000*target/Math.max(performance.now()-t,1)/1000)*1000);
}
export async function encrypt(key,bytes){
  const iv=rand(12),ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,bytes));
  const o=new Uint8Array(12+ct.length);o.set(iv);o.set(ct,12);return o; // format: iv(12) || ciphertext+tag
}
export async function decrypt(key,blob){
  try{if(!(blob instanceof Uint8Array)||blob.length<29)throw 0;
    return new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:blob.slice(0,12)},key,blob.slice(12)));}
  catch{throw new Error('Gagal membuka data: passphrase salah atau data rusak.');}
}
export const encJson=(k,o)=>encrypt(k,te.encode(JSON.stringify(o)));
export const decJson=async(k,b)=>JSON.parse(td.decode(await decrypt(k,b)));
export const strongEnough=p=>(p.length>=12&&new Set(p).size>=6&&[/[a-z]/,/[A-Z]/,/\d/,/[^\w]/].filter(r=>r.test(p)).length>=2)||p.length>=20;
