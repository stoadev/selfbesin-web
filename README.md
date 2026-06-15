# Selfbesin

Türkiye'ye özel besin veritabanı ve öğün takip uygulaması. Yerel marka ve yemekleri (köfte, mantı, simit, lahmacun vb.) içeren bir besin kataloğu üzerinden porsiyon/makro hesabı yapmayı, öğün kaydı tutmayı ve AI chatbot ile doğal dilde besin/öğün eklemeyi sağlar.

## Özellikler

- **Besin arama** — MeiliSearch tabanlı full-text + tipo toleranslı arama, eksik sonuçlar n8n webhook'u üzerinden dinamik olarak çekilir
- **Besin detayı** — porsiyon/serving birimleri ile makro hesaplama
- **Random besin önerisi** — keşif için rastgele besin
- **Öğün takibi** — kullanıcıya özel öğün CRUD'u (giriş gerekli)
- **AI chatbot** — n8n webhook'u üzerinden çalışan asistan; "şuna 100g ekmek ekle" gibi komutlarla öğün/besin ekleyebilir
- **SEO** — react-helmet-async + sitemap üretimi + opsiyonel statik prerender

## Tech Stack

- **React 19** + TypeScript + Vite 7
- **Tailwind CSS 4**
- **Supabase** — veritabanı (PostgreSQL) + auth
- **MeiliSearch** — full-text besin arama
- **TanStack Query** — veri önbellekleme
- **React Router 7** — yönlendirme
- **React Hook Form + Zod** — form ve validasyon
- **react-helmet-async** — SEO / meta tagleri
- **react-markdown** — chatbot mesaj render
- **lucide-react** — ikonlar
- **n8n** — chatbot ve besin çekme webhook'ları

## Kurulum

Node.js 22+ gerekli.

```bash
npm install
```

`.env` dosyası oluştur:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_MEILISEARCH_URL=
VITE_MEILISEARCH_API_KEY=
VITE_FOOD_FETCH_WEBHOOK_URL=
VITE_CHATBOT_WEBHOOK_URL=
```

| Env | Görev |
|---|---|
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Supabase bağlantısı (DB + auth) |
| `VITE_MEILISEARCH_URL` / `VITE_MEILISEARCH_API_KEY` | İstemci tarafı arama (search-only key) |
| `VITE_FOOD_FETCH_WEBHOOK_URL` | Aramada bulunamayan besinleri n8n üzerinden harici kaynaktan çekip DB'ye yükleyen webhook |
| `VITE_CHATBOT_WEBHOOK_URL` | Chatbot mesajlarının yönlendirildiği n8n webhook'u |

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
| `*` | 404 |

## Scriptler

| Komut | Açıklama |
|---|---|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Sitemap üret + TS derle + Vite build |
| `npm run build:prerender` | Build + statik HTML prerender |
| `npm run lint` | ESLint |
| `npm run preview` | Production build önizleme |

## Auth

Supabase Auth kullanılır. Desteklenen yöntemler:

- Email + parola
- Google OAuth

`/meals` gibi korumalı route'lar `ProtectedRoute` ile sarılır; oturum yoksa AuthModal açılır.

## Mimari

```
src/
├── pages/         # Route bazlı sayfalar (Landing, Food, Search, Meals, Auth, ...)
├── components/    # layout/, common/, charts/, meals/ — yeniden kullanılabilir bileşenler
├── context/       # AuthContext, MealContext (global state)
├── services/      # food.service, chat.service — Supabase + Meili + n8n çağrıları
├── hooks/         # TanStack Query hook'ları + custom hook'lar
├── lib/           # Supabase client
├── scripts/       # seedMeilisearch.ts (Meili index seed)
├── types/         # paylaşılan TS tipleri
├── utils/         # yardımcı fonksiyonlar
└── router/        # AppRouter
scripts/           # generate-sitemap.js, prerender.js (build-time)
```

**Veri akışı:**

- **Arama:** istemci → MeiliSearch (`foods` index). Sonuç boşsa kullanıcı "internetten ara" der → `VITE_FOOD_FETCH_WEBHOOK_URL` (n8n) → harici kaynaktan çekilen besinler Supabase'e yazılır → Meili reindex → tekrar arama.
- **Chatbot:** istemci → `VITE_CHATBOT_WEBHOOK_URL` (n8n LLM agent) → cevap + opsiyonel `action` (`meal_added`, `food_added`, `meal_created`) → istemci ilgili context'i refresh eder.
- **Auth & öğün CRUD:** doğrudan Supabase (RLS ile kullanıcı bazlı izolasyon).

## Backend: MeiliSearch Senkronizasyonu

`selfbesin_foods` tablosundaki değişiklikler MeiliSearch `foods` index'ine
PostgreSQL trigger üzerinden otomatik yansır:

```
food ekle/güncelle/sil
   → DB trigger (sync_foods_to_meili)
   → Edge Function (meili-sync)
   → MeiliSearch
```

MeiliSearch write/admin key'i güvenlik gereği **Edge Function'ın environment
variable'ında** tutulur (`MEILI_URL`, `MEILI_KEY`) — veritabanında saklanmaz.
Trigger yalnızca yemek dokümanını Edge Function'a iletir, secret'a erişmez.
Bu sayede veritabanına erişimi olan araçlar (ör. MCP) write key'i göremez.

- Edge Function: `volumes/functions/meili-sync/` (self-hosted)
- Gerekli env (edge-functions servisi): `MEILI_URL`, `MEILI_KEY`
- Hesaplanan alanlar (search_text, qualifier_score, brand_priority) trigger'da üretilir; Edge Function yalnızca MeiliSearch'e yazar/siler.

## Deploy

Vite ile statik build üretilir; herhangi bir static host'a (Vercel, Netlify, Cloudflare Pages) deploy edilebilir. SEO için `npm run build:prerender` ile prerender'lanmış HTML'ler üretilir.
