# Kopiku POS — Kasir dengan Database

Aplikasi kasir kedai kopi dengan **database file** (`data/db.json`) agar data tersimpan permanen.

## Keunggulan
- Tidak perlu `npm install` (hanya Node.js bawaan)
- Data produk, stok, transaksi, password admin tersimpan di file
- Tidak hilang saat clear browser / ganti perangkat (selama server & file database sama)
- Backup mudah: salin folder `data/`

## Cara Menjalankan

### 1. Install Node.js
Download dari https://nodejs.org (versi 18 atau lebih baru)

### 2. Buka terminal di folder project
```bash
cd kopiku-pos
```

### 3. Jalankan server
```bash
node server.js
```
atau
```bash
npm start
```

### 4. Buka browser
```
http://localhost:3000
```

## Password Admin Default
```
admin123
```
Ganti segera lewat **Admin → Keamanan**.

## Struktur
```
kopiku-pos/
├── server.js           Backend + API
├── package.json
├── data/
│   └── db.json         DATABASE (otomatis dibuat)
├── public/
│   └── index.html      Frontend kasir
└── README.md
```

## Isi Database (`data/db.json`)
- `products` — daftar menu, harga, stok, gambar
- `orders` — semua transaksi + item
- `admin_password` — password ter-hash
- `nextProductId` / `nextOrderId` — counter ID

## Backup
Salin file `data/db.json` ke tempat aman secara berkala.
