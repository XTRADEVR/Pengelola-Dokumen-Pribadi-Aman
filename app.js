// UI + alur aplikasi (ui.js digabung di sini). DOM dibuat lewat properti/textContent, tanpa innerHTML.
import*as v from './vault.js';import*as bk from './backup.js';import*as val from './validation.js';import*as rm from './reminders.js';import*as db from './database.js';
const root=document.getElementById('app');
const h=(t,a={},...k)=>{const e=document.createElement(t);for(const[x,y]of Object.entries(a))x==='on'?Object.entries(y).forEach(([n,f])=>e.addEventListener(n,f)):(x in e)?e[x]=y:e.setAttribute(x,y);e.append(...k.filter(z=>z!=null&&z!==false));return e};
let docs=[],S={},flt={q:'',cat:'',st:''},urls=[],timers=[];
const L=(t,i)=>h('label',{},t,i),fmt=s=>s?s.split('-').reverse().join('/'):'-',mask=n=>n?'••••'+n.slice(-4):'';
function dlg(title,...b){const d=h('dialog',{'aria-labelledby':'dt'},h('h2',{id:'dt'},title),...b,h('button',{type:'button',className:'alt',on:{click:()=>d.close()}},'Tutup'));
  d.addEventListener('close',()=>{urls.splice(0).forEach(URL.revokeObjectURL);d.remove()});document.body.append(d);d.showModal();return d}
const theme=()=>{document.documentElement.dataset.theme=S.theme==='light'||S.theme==='dark'?S.theme:''};
function gate(setup){
  const e=h('p',{role:'alert',className:'err'}),p=h('input',{type:'password',required:true,autocomplete:setup?'new-password':'current-password'}),p2=h('input',{type:'password',required:true,autocomplete:'new-password'}),ok=h('input',{type:'checkbox',required:true});
  root.replaceChildren(h('h1',{},'Pengelola Dokumen Pribadi Aman'),
    h('p',{},setup?'Data disimpan hanya di perangkat ini, terenkripsi dengan passphrase Anda. Tidak ada server dan tidak ada reset: jika passphrase hilang, data tidak dapat dipulihkan. Aplikasi tidak melindungi dari malware, keylogger, tangkapan layar, atau perangkat yang sudah dikompromikan.':'Brankas terkunci.'),
    h('form',{on:{submit:async ev=>{ev.preventDefault();e.textContent='';try{
      if(setup&&p.value!==p2.value)throw new Error('Konfirmasi passphrase tidak sama.');
      setup?await v.create(p.value):await v.unlock(p.value);p.value=p2.value='';await enter()}catch(x){e.textContent=setup?x.message:'Gagal membuka brankas. Periksa passphrase Anda.'}}}},
      L('Passphrase utama',p),setup&&L('Ulangi passphrase',p2),setup&&h('label',{},ok,' Saya paham: kehilangan passphrase berarti kehilangan akses.'),e,h('button',{type:'submit'},setup?'Buat brankas':'Buka')))}
async function enter(){S=await v.getSettings();docs=await v.listDocs();theme();arm();check();render()}
function lock(){v.lock();docs=[];S={};timers.forEach(clearTimeout);timers=[];urls.splice(0).forEach(URL.revokeObjectURL);document.querySelectorAll('dialog').forEach(d=>d.remove());gate(false)}
function arm(){ // auto-lock: tidak aktif / tab disembunyikan. Browser tidak menjamin callback sebelum proses dihentikan.
  const reset=()=>{clearTimeout(timers[0]);timers[0]=setTimeout(lock,S.autoMin*6e4)};arm.reset=reset;
  if(!arm.on){arm.on=true;for(const ev of['pointerdown','keydown','touchstart'])addEventListener(ev,()=>v.isUnlocked()&&arm.reset(),{passive:true});
    document.addEventListener('visibilitychange',()=>{if(!v.isUnlocked())return;document.hidden?(S.lockHidden&&lock()):check()});addEventListener('pagehide',()=>v.isUnlocked()&&lock())}
  reset();clearInterval(timers[1]);timers[1]=setInterval(()=>v.isUnlocked()&&check(),36e5)}
async function check(){const items=rm.due(docs,new Date(),S.offsets,S.sent);
  if(items.length&&await rm.notify(items,S.showDetail)){S.sent=[...S.sent,...items.map(i=>i.key)].slice(-500);await v.saveSettings(S)}}
function render(){
  const now=new Date(),st=d=>rm.status(d,now),soon=docs.filter(d=>st(d)==='segera').length,over=docs.filter(d=>st(d)==='kedaluwarsa').length;
  const nx=docs.filter(d=>d.expires&&rm.daysUntil(d.expires,now)>=0).sort((a,b)=>a.expires.localeCompare(b.expires))[0];
  const ul=h('ul'),draw=()=>{const q=flt.q.toLowerCase(),r=docs.filter(d=>(!flt.cat||d.cat===flt.cat)&&(!flt.st||st(d)===flt.st)&&(!q||[d.name,d.number,d.notes].some(x=>(x||'').toLowerCase().includes(q))));
    ul.replaceChildren(...(r.length?r.map(d=>h('li',{},h('button',{type:'button',on:{click:()=>view(d)}},h('strong',{},d.name),h('br'),`${d.cat} · ${mask(d.number)} · Kedaluwarsa ${fmt(d.expires)} · Status: ${st(d)}`))):[h('li',{},docs.length?'Tidak ada hasil.':'Belum ada dokumen. Tekan “Tambah dokumen”.')]))};
  const sel=(o,k,all)=>h('select',{'aria-label':all,on:{change:e=>{flt[k]=e.target.value;draw()}}},h('option',{value:''},all),...o.map(x=>h('option',{value:x},x)));
  root.replaceChildren(h('header',{},h('h1',{},'Dokumen Saya'),h('div',{className:'row'},h('button',{type:'button',on:{click:lock}},'🔒 Kunci'),h('button',{type:'button',className:'alt',on:{click:backup}},'Cadangan'),h('button',{type:'button',className:'alt',on:{click:settings}},'Pengaturan'))),
    h('section',{className:'cards','aria-label':'Ringkasan'},h('div',{className:'card'},h('strong',{},soon),' kedaluwarsa ≤30 hari'),h('div',{className:'card'},h('strong',{},over),' terlambat'),h('div',{className:'card'},'Terdekat: ',nx?`${nx.name} (${rm.daysUntil(nx.expires,now)} hari)`:'-')),
    h('div',{className:'row'},h('input',{type:'search','aria-label':'Cari dokumen',placeholder:'Cari…',on:{input:e=>{flt.q=e.target.value;draw()}}}),sel(val.CATS,'cat','Semua kategori'),sel(['berlaku','segera','kedaluwarsa','tanpa-tanggal'],'st','Semua status'),h('button',{type:'button',on:{click:()=>edit({})}},'Tambah dokumen')),ul);draw()}
function view(d){
  const num=h('span',{},mask(d.number)),box=dlg(d.name,h('p',{},`Kategori: ${d.cat}`),h('p',{},'Nomor: ',num,' ',d.number&&h('button',{type:'button',className:'alt',on:{click:()=>{if(confirm('Nomor sensitif akan ditampilkan. Pastikan tidak ada yang melihat layar Anda.'))num.textContent=d.number}}},'Tampilkan')),
    h('p',{},`Terbit: ${fmt(d.issued)} · Kedaluwarsa: ${fmt(d.expires)}`),h('p',{},d.notes||''),
    d.file&&h('button',{type:'button',on:{click:async()=>{try{const b=await v.readFile(d.file.id),u=URL.createObjectURL(new Blob([b],{type:d.file.type}));urls.push(u);
      box.append(d.file.type==='application/pdf'?h('iframe',{src:u,title:'Lampiran PDF'}):h('img',{src:u,alt:'Lampiran '+d.name}))}catch(x){alert(x.message)}}}},'Buka lampiran'),
    h('button',{type:'button',className:'alt',on:{click:()=>{box.close();edit(d)}}},'Ubah'),
    h('button',{type:'button',className:'alt',on:{click:async()=>{if(!confirm(`Hapus “${d.name}” beserta lampirannya? Tindakan ini permanen.`))return;await v.removeDoc(d);docs=await v.listDocs();box.close();render()}}},'Hapus'))}
function edit(d){
  const m=h('p',{role:'alert',className:'err'}),f={name:h('input',{required:true,maxLength:120,value:d.name||''}),number:h('input',{autocomplete:'off',value:d.number||''}),issued:h('input',{type:'date',value:d.issued||''}),expires:h('input',{type:'date',value:d.expires||''}),
    cat:h('select',{},...val.CATS.map(c=>h('option',{value:c,selected:c===(d.cat||'Lainnya')},c))),notes:h('textarea',{rows:3,value:d.notes||''}),file:h('input',{type:'file',accept:'application/pdf,image/jpeg,image/png'})};
  const box=dlg(d.id?'Ubah dokumen':'Tambah dokumen',h('form',{on:{submit:async ev=>{ev.preventDefault();m.textContent='';try{
    const nd={...d};for(const k of['name','number','issued','expires','cat','notes'])nd[k]=f[k].value.trim();
    const er=val.validateDoc(nd);if(er.length)return void(m.textContent=er.join(' '));
    const fl=f.file.files[0];if(fl){const{bytes,type}=await val.checkFile(fl,S.maxMB),id=await v.saveFile(bytes);if(d.file)await v.dropFile(d.file.id);nd.file={id,type,name:fl.name.slice(0,80)}}
    await v.saveDoc(nd);docs=await v.listDocs();box.close();render()}catch(x){m.textContent=x.message}}}},
    L('Nama dokumen *',f.name),L('Nomor',f.number),L('Tanggal terbit',f.issued),L('Tanggal kedaluwarsa',f.expires),L('Kategori',f.cat),L('Catatan',f.notes),L(`Lampiran (PDF/JPEG/PNG, maks ${S.maxMB} MB)`,f.file),m,h('button',{type:'submit'},'Simpan')))}
function backup(){
  const m=h('p',{role:'alert'}),fi=h('input',{type:'file',accept:'.enc'}),pw=h('input',{type:'password',autocomplete:'off'}),md=h('select',{},h('option',{value:'merge'},'Gabung (lewati ID yang sudah ada)'),h('option',{value:'replace'},'Ganti seluruh isi')),info=h('p',{});let parsed;
  dlg('Cadangan',h('button',{type:'button',on:{click:async()=>{const u=URL.createObjectURL(await bk.exportBackup());h('a',{href:u,download:`dokumen-aman-${new Date().toISOString().slice(0,10)}.enc`}).click();setTimeout(()=>URL.revokeObjectURL(u),1e4)}}},'Ekspor cadangan .enc'),
    h('p',{},'Pemulihan memerlukan passphrase brankas asal cadangan. Simpan berkas di tempat aman.'),
    L('Impor cadangan',fi),h('button',{type:'button',className:'alt',on:{click:async()=>{m.textContent='';try{parsed=bk.parse(await fi.files[0].text());info.textContent=`Pratinjau: ${parsed.docs.length} dokumen, ${parsed.files.length} lampiran.`}catch(x){parsed=null;m.textContent=x.message}}}},'Periksa berkas'),info,
    L('Passphrase cadangan',pw),L('Mode',md),m,h('button',{type:'button',on:{click:async()=>{if(!parsed)return void(m.textContent='Periksa berkas dahulu.');
      if(md.value==='replace'&&!confirm('Seluruh dokumen aktif akan DIGANTI. Lanjutkan?'))return;
      try{const n=await bk.restore(parsed,pw.value,md.value);docs=await v.listDocs();render();m.textContent=`${n} dokumen dipulihkan.`}catch(x){m.textContent=x.message}}}},'Pulihkan'))}
function settings(){
  const i=o=>h('input',o),auto=i({type:'number',min:1,max:120,value:S.autoMin}),mb=i({type:'number',min:1,max:20,value:S.maxMB}),hid=i({type:'checkbox',checked:S.lockHidden}),det=i({type:'checkbox',checked:S.showDetail}),
    th=h('select',{},...['auto','light','dark'].map(x=>h('option',{value:x,selected:S.theme===x},x))),offs=[30,7,1].map(o=>[o,i({type:'checkbox',checked:S.offsets.includes(o)})]);
  const perm=h('p',{},'Izin notifikasi: '+(globalThis.Notification?Notification.permission:'tidak didukung')+'. Pengingat hanya berjalan saat aplikasi terbuka/aktif; ubah izin lewat pengaturan situs di browser.');
  const box=dlg('Pengaturan',h('form',{on:{submit:async ev=>{ev.preventDefault();Object.assign(S,{autoMin:+auto.value||5,maxMB:+mb.value||5,lockHidden:hid.checked,showDetail:det.checked,theme:th.value,offsets:offs.filter(([,c])=>c.checked).map(([o])=>o)});await v.saveSettings(S);theme();arm();box.close()}}},
    L('Auto-lock (menit)',auto),L('Batas lampiran (MB)',mb),h('label',{},hid,' Kunci saat tab disembunyikan'),h('label',{},det,' Tampilkan nama dokumen di notifikasi (berisiko di layar terkunci)'),L('Tema',th),
    h('fieldset',{},h('legend',{},'Pengingat'),...offs.map(([o,c])=>h('label',{},c,` H-${o}`))),perm,
    globalThis.Notification&&h('button',{type:'button',className:'alt',on:{click:async()=>{await Notification.requestPermission();box.close();settings()}}},'Aktifkan notifikasi'),h('button',{type:'submit'},'Simpan')),
    h('button',{type:'button',className:'alt',on:{click:wipe}},'Hapus seluruh data…'))}
function wipe(){
  if(!confirm('Hapus SELURUH data aplikasi di perangkat ini? Tidak dapat dibatalkan.'))return;
  const t=h('input',{autocomplete:'off'}),m=h('p',{role:'alert',className:'err'});
  dlg('Konfirmasi akhir',h('p',{},'Ketik HAPUS. Ini tidak menjamin penghapusan forensik dari penyimpanan flash, snapshot, backup OS, atau salinan yang sudah Anda buat.'),t,m,h('button',{type:'button',on:{click:async()=>{if(t.value!=='HAPUS')return void(m.textContent='Ketik HAPUS persis.');v.lock();await db.wipeAll();location.reload()}}},'Hapus permanen'))}
(async()=>{
  if(!db.supported())return void root.replaceChildren(h('p',{className:'err'},'Browser ini tidak mendukung penyimpanan lokal dan enkripsi yang dibutuhkan. Gunakan browser modern lewat HTTPS/localhost.'));
  if('serviceWorker'in navigator)navigator.serviceWorker.register('service-worker.js').catch(()=>{});
  gate(!(await v.exists()))})();
