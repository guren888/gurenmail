# Guren TempMail

TempMail frontend + Cloudflare Worker API proxy menggunakan Mail.cx.

## 1. Upload ke GitHub

Upload semua file dan folder ini ke repository GitHub:

- `public/index.html`
- `public/style.css`
- `public/app.js`
- `src/index.js`
- `wrangler.jsonc`

## 2. Deploy ke Cloudflare

Hubungkan repository GitHub ke Cloudflare Workers Builds/Deployments.

## 3. Tambahkan Secret

Di Worker Cloudflare, buat secret:

`MAILCX_API_TOKEN`

Isinya token API Mail.cx (`tm_live_...`).

Jangan menaruh token di GitHub.

## 4. Domain

Setelah Worker aktif, tambahkan custom domain:

`mail.guren88.biz.id`

## Catatan

Mail.cx menggunakan alamat mailbox secara implicit. Tidak ada endpoint "create mailbox" terpisah pada API; alamat mulai menerima mail ketika SMTP gateway Mail.cx menerima pesan untuk alamat tersebut.

API Mail.cx mendukung inbox, email lengkap, raw `.eml`, SSE, dan custom domain.

...
