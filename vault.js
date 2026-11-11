import*as db from './database.js';import*as c from './crypto.js';
const SCHEMA=1,MIGRATIONS={/* 2: async key=>{...} — dijalankan berurutan; gagal => brankas tetap terkunci */};
export const DEFAULTS={autoMin:5,lockHidden:true,offsets:[30,7,1],maxMB:5,showDetail:false,theme:'auto',sent:[]};
let key=null;
export const isUnlocked=()=>!!key;
export const exists=async()=>!!(await db.get('meta','kdf'));
export async function create(pass){
  if(!c.strongEnough(pass))throw new Error('Passphrase terlalu lemah: minimal 12 karakter beragam, atau 20+ karakter.');
  const salt=c.rand(16),iter=await c.calibrate(),k=await c.derive(pass,salt,iter);
  await db.put('meta','kdf',{schema:SCHEMA,salt,iter,verifier:await c.encrypt(k,new TextEncoder().encode('ok'))});key=k;
}
export async function unlock(pass){
  const m=await db.get('meta','kdf');if(!m)throw new Error('Brankas belum dibuat.');
  if(m.schema>SCHEMA)throw new Error('Data dibuat versi aplikasi lebih baru.');
  const k=await c.derive(pass,m.salt,m.iter);await c.decrypt(k,m.verifier);
  for(let s=m.schema+1;s<=SCHEMA;s++)await MIGRATIONS[s](k); // gagal => throw, key tetap null
  key=k;
}
export const lock=()=>{key=null}; // JS tidak menjamin pembersihan memori; hanya referensi dilepas
export const docIds=async()=>(await db.all('docs')).map(r=>r.id);
export const listDocs=async()=>Promise.all((await db.all('docs')).map(async r=>({...await c.decJson(key,r.d),id:r.id})));
export async function saveDoc(d){d.id??=crypto.randomUUID();const{id,...rest}=d;await db.put('docs',id,{id,d:await c.encJson(key,rest)});return id}
export async function removeDoc(d){if(d.file)await db.del('files',d.file.id);await db.del('docs',d.id)}
export async function saveFile(bytes,id=crypto.randomUUID()){await db.put('files',id,{id,d:await c.encrypt(key,bytes)});return id}
export const readFile=async id=>c.decrypt(key,(await db.get('files',id)).d);
export const dropFile=id=>db.del('files',id);
export const getSettings=async()=>{const r=await db.get('meta','settings');return{...DEFAULTS,...(r?await c.decJson(key,r):{})}};
export const saveSettings=async s=>db.put('meta','settings',await c.encJson(key,s));
export const raw=async()=>({kdf:await db.get('meta','kdf'),docs:await db.all('docs'),files:await db.all('files')});
export const wipeData=async()=>{await db.clear('docs');await db.clear('files')};
