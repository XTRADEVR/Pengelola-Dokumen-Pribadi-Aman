# Pengelola Dokumen Pribadi Aman
PWA client-only (vanilla JS, tanpa dependensi runtime). Data: IndexedDB terenkripsi (PBKDF2-SHA-256 → AES-GCM 256, IV 96-bit acak per enkripsi).

## Menjalankan
`python3 -m http.server 8080` di folder ini, buka `http://localhost:8080` (atau deploy via HTTPS). `file://` tidak didukung. Instal PWA lewat menu browser ("Install"/"Tambahkan ke Layar Utama").

## Tes
`TZ=Asia/Jakarta node --test tests/` (ulangi dengan `TZ=America/Los_Angeles`). Hanya Node ≥ 20 (dev saja).

## Format cadangan `.enc`
JSON berversi: `{format:"PDAI-BACKUP", v:1, kdf:{salt,iter,verifier}, docs:[{id,d}], files:[{id,d}]}`; `d` = base64(IV‖ciphertext+tag). Terbuka: versi, salt, iterasi, jumlah/ID record. Tidak ada kunci/passphrase di dalamnya. Pulihkan dengan passphrase brankas asal; impor memverifikasi seluruh tag sebelum menulis.

## Batasan
- Passphrase hilang = data hilang (tidak ada reset). Tidak melindungi dari malware/keylogger/perangkat terkompromi/tangkapan layar.
- Pengingat hanya berjalan saat aplikasi aktif; Web Push andal memerlukan server (tidak ada di versi ini).
- WebAuthn/biometrik tidak diimplementasikan: tidak dapat menggantikan kunci enkripsi secara portabel.
- Penghapusan data tidak menjamin penghapusan forensik. CSP lewat `<meta>`; header HTTP (mis. `frame-ancestors`) perlu diatur di server.
- Tidak ada tampilan PNG ikon; manifest memakai SVG (beberapa platform menginginkan PNG 192/512).
