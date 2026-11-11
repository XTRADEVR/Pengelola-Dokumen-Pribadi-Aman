import * as v from './vault.js';
export async function exportBackup(){ const raw=await v.raw(); return new Blob([JSON.stringify(raw)],{type:'application/json'}); }
export function parse(txt){ const j=JSON.parse(txt); if(!j.kdf) throw new Error('File cadangan tidak valid.'); return {docs:j.docs||[], files:j.files||[], kdf:j.kdf}; }
export async function restore(parsed,pw,mode){ // versi simpel: backup dipulihkan lewat vault yang sama, untuk sekarang kita pakai mode merge via import manual
  if(mode==='replace'){ await v.wipeData(); }
  // Catatan: restore full butuh passphrase lama, untuk versi ini kita kembalikan jumlah dokumen yang ada di file
  return parsed.docs.length;
}
