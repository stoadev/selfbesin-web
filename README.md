# Selfbesin

Türkiye'ye özel besin veritabanı ve öğün takip uygulaması.

## Tech Stack

- **React 19** + TypeScript + Vite
- **Tailwind CSS 4**
- **Supabase** — veritabanı (PostgreSQL) + auth
- **MeiliSearch** — full-text besin arama
- **TanStack Query** — veri önbellekleme
- **n8n** — chatbot ve besin çekme webhook'ları

## Kurulum

```bash
npm install
```

`.env` dosyası oluştur:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_MEILISEARCH_URL=
VITE_MEILISEARCH_API_KEY=
VITE_MEILISEARCH_ADMIN_KEY=
VITE_FOOD_FETCH_WEBHOOK_URL=
VITE_CHATBOT_WEBHOOK_URL=
```

```bash
npm run dev
```

## Sayfalar

| Route | Sayfa |
|---|---|
| `/` | Ana sayfa — besin arama, random öneri |
| `/besin/:slug` | Besin detayı — porsiyon hesaplama, makrolar |
| `/search` | Arama sonuçları |
| `/meals` | Öğün takibi (giriş gerekli) |
| `/privacy` | Gizlilik politikası |
