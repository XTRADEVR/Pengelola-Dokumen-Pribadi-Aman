export const CATS=['KTP','SIM','Paspor','STNK','Ijazah','Kartu Keluarga','Lainnya'];
export function validateDoc(d){ const e=[]; if(!d.name) e.push('Nama wajib diisi.'); if(d.number && d.number.length>50) e.push('Nomor terlalu panjang.'); return e; }
export async function checkFile(f,maxMB){ if(f.size>maxMB*1024*1024) throw new Error('File terlalu besar, maks '+maxMB+' MB.'); if(!['application/pdf','image/jpeg','image/png'].includes(f.type)) throw new Error('Hanya PDF/JPEG/PNG.'); return {bytes:new Uint8Array(await f.arrayBuffer()), type:f.type}; }
