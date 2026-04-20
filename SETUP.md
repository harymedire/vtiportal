# VTIportal — Setup vodič

Korak-po-korak uputstvo za pokretanje i deploy **vtiportal.com** portala.

Ovaj repo ima dvije komponente:
- **Backend** (Python/Celery) — generiše članke, upload-uje slike, scheduluje batch
- **Frontend** (Next.js) u `frontend/` folderu — web portal koji čita iz DB-a

---

## 1. Registruj servise i uzmi API ključeve

Ovo je jedini dio koji ja ne mogu uraditi umjesto tebe. Treba da registruješ ove servise i kopiraš ključeve u `.env`:

### 1.1. Anthropic (Claude)
1. Idi na https://console.anthropic.com
2. Kreiraj account, dodaj kreditnu karticu (pay-as-you-go, bez mjesečne pretplate)
3. Settings → API Keys → Create Key
4. Kopiraj `sk-ant-api03-...` → `ANTHROPIC_API_KEY`

### 1.2. OpenAI (samo embeddings)
1. Idi na https://platform.openai.com
2. Account → API Keys → Create new secret key
3. Dodaj ~$5 credita (traje godinama za embedding-e)
4. Kopiraj `sk-...` → `OPENAI_API_KEY`

### 1.3. Replicate (Flux slike)
1. Idi na https://replicate.com
2. Sign up (besplatno, dodaj karticu za pay-as-you-go)
3. Account → API tokens → Create
4. Kopiraj `r8_...` → `REPLICATE_API_TOKEN`

### 1.4. Supabase (Postgres sa pgvector)
1. Idi na https://supabase.com → New project
2. Region: **eu-central-1** (najbliže BiH)
3. Kreiraj jak password, sačuvaj ga
4. Project Settings → Database → Connection string → **Transaction** pooler (port 6543!)
5. Kopiraj connection string → `DATABASE_URL`
6. U SQL Editor-u pokreni: `CREATE EXTENSION IF NOT EXISTS vector;`

### 1.5. Cloudflare R2 (storage za slike)
1. dash.cloudflare.com → R2 → Create bucket → ime: `vtiportal-images`
2. Manage R2 API Tokens → Create API Token → Permissions: **Object Read & Write**
3. Kopiraj: Account ID, Access Key ID, Secret Access Key → `R2_*`
4. U bucket settings: **Public access** → Allow public access
5. Opciono: pod "Custom Domains" poveži `cdn.vtiportal.com` (poslije, kad DNS podesimo)
6. Za sada uzmi `https://pub-xxxxx.r2.dev` URL i stavi u `R2_PUBLIC_URL`

### 1.6. Telegram (alerti)
1. U Telegram-u pronađi [@BotFather](https://t.me/BotFather) → `/newbot`
2. Slijedi instrukcije, na kraju kopiraj token → `TELEGRAM_BOT_TOKEN`
3. Pošalji poruku svom novom botu (bilo šta) — inače ne može da ti piše
4. Pronađi [@userinfobot](https://t.me/userinfobot) → pokreni → kopiraj svoj ID → `TELEGRAM_CHAT_ID`

### 1.7. Facebook (opciono, kasnije)
Preskoči za sada. Kad portal bude live, slijedi Fazu 4 iz originalnog HANDOFF.md.

---

## 2. Lokalni development (provjera da sve radi)

### 2.1. Backend — test jednog članka

```bash
# U root folderu repo-a:
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Font
mkdir -p assets
curl -L -o assets/Anton-Regular.ttf \
  https://github.com/googlefonts/anton/raw/main/fonts/Anton-Regular.ttf

# .env
cp .env.example .env
# popuni .env sa pravim ključevima iz koraka 1

# Redis u Dockeru
docker run -d --name vtiportal-redis -p 6379:6379 redis:7-alpine

# Migracije + seed
alembic upgrade head
python scripts/seed_variables.py

# Test
python scripts/test_article.py --template 1
```

Očekivano: za 60–120s izgenerisan članak, slika uploadana na R2, upisan u Postgres.

**Ako padne**:
- `pgvector extension error` → u Supabase SQL Editoru pokreni `CREATE EXTENSION IF NOT EXISTS vector;`
- `Font not found` → provjeri da li je `assets/Anton-Regular.ttf` na mjestu
- `Invalid JSON from Claude` → provjeri log, vjerovatno rate limit ili model greška
- `R2 AccessDenied` → provjeri da li su R2 credentials ispravni i da je bucket Public

### 2.2. Frontend — lokalni preview

```bash
cd frontend
npm install
cp .env.example .env.local
# popuni .env.local:
#   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...  (Supabase → Project Settings → API → anon public)
#   NEXT_PUBLIC_SITE_URL=http://localhost:3000
#   REVALIDATE_SECRET=isti-string-kao-u-backendu

npm run dev
```

Otvori http://localhost:3000 → vidiš članak koji si testirao u koraku 2.1.

---

## 3. Deploy — Railway

Imaš već Railway account. Ovdje ćemo kreirati **3 servisa** u jednom projektu:
1. **worker** (Python Celery worker)
2. **beat** (Python Celery scheduler)
3. **frontend** (Next.js)

I dodajemo **Redis** plugin.

### 3.1. Push repo na GitHub

```bash
git add .
git commit -m "Initial VTIportal setup"

# Kreiraj repo na github.com/new (private)
git remote add origin git@github.com:<tvoj-user>/vtiportal.git
git push -u origin main
```

### 3.2. Railway projekat

1. railway.app → New Project → Deploy from GitHub repo → odaberi `vtiportal`
2. Kad se prvi servis kreira, preimenuj ga u **worker**
3. U settings-u tog servisa:
   - Root directory: `/` (default)
   - Build: automatski detektuje `railway.json` + `Dockerfile`
   - Start command: ostavi default iz `railway.json` (worker start command)

### 3.3. Dodaj Redis

1. U projektu → "+ New" → Database → **Redis**
2. Railway automatski postavlja `REDIS_URL` env var u svim servisima

### 3.4. Dodaj **beat** servis

1. "+ New" → GitHub Repo → isti repo → "Add a service"
2. Preimenuj u **beat**
3. Settings → Deploy → **Custom Start Command**:
   ```
   celery -A app.celery_app beat --loglevel=info
   ```
4. Copy-paste sve env varijable iz worker-a u beat (ili koristi shared env group u Railway-u)

### 3.5. Dodaj **frontend** servis

1. "+ New" → GitHub Repo → isti repo
2. Preimenuj u **frontend**
3. Settings → **Root Directory**: `frontend`
4. Settings → **Start Command** već je definisan u `frontend/railway.json`
5. Settings → **Networking** → Generate Domain (Railway ti da privremeni `xxx.up.railway.app`)

### 3.6. Postavi environment varijable

U svakom od tri servisa, dodaj env vars. Najlakše kroz Railway UI ili kroz Shared Variables.

**Worker + Beat** (backend):
- Sve varijable iz `.env.example`
- `PORTAL_BASE_URL=https://vtiportal.com` (kad DNS radi) ili privremeno Railway domain frontend-a
- `REDIS_URL` — automatski postavljen (Railway Redis plugin)

**Frontend**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL=https://vtiportal.com`
- `NEXT_PUBLIC_ADSENSE_CLIENT=` (prazno dok ne dodaš AdSense)
- `REVALIDATE_SECRET` — isti kao u backend-u

### 3.7. Pokreni migracije u produkciji

Migracije treba pokrenuti **jednom** nakon prvog deploy-a. Imaš dvije opcije:

**A)** Railway CLI + oneshot run:
```bash
railway login
railway link      # odaberi projekat
railway run --service=worker -- alembic upgrade head
railway run --service=worker -- python scripts/seed_variables.py
```

**B)** Direktno iz lokalnog terminala (prije deploy-a, sa Supabase `DATABASE_URL` u `.env`):
```bash
alembic upgrade head
python scripts/seed_variables.py
```

### 3.8. Domain i DNS

**vtiportal.com (frontend)**:
1. U frontend servisu → Settings → Networking → **Custom Domain** → dodaj `vtiportal.com` i `www.vtiportal.com`
2. Railway ti da DNS zapis: CNAME → `xxx.up.railway.app`
3. Kod svog registrar-a dodaj zapise:
   - `@` (root) → A zapis ili ALIAS/ANAME na Railway IP (Railway dashboard pokaže)
   - `www` → CNAME → Railway domain
4. Čekaj 5–30 min da DNS propagira

**cdn.vtiportal.com (R2 CDN — opciono ali poželjno)**:
1. Cloudflare R2 bucket → Settings → Custom Domains → `cdn.vtiportal.com`
2. Kod registrar-a: CNAME `cdn` → R2 custom domain koji Cloudflare pokaže
3. Kad radi, update `R2_PUBLIC_URL=https://cdn.vtiportal.com` u backend env

---

## 4. Pokretanje autopilot-a

Kad sve radi:
1. U Railway-u provjeri da **worker**, **beat**, **frontend**, **redis** svi rade (zelena tačka)
2. Celery beat će automatski u 00:00 (Sarajevo time) pokrenuti `schedule_daily_batch`
3. Prva stvarna serija ide sljedeće ponoći. Ako hoćeš odmah provjeriti:

```bash
railway run --service=worker -- python -c "from app.tasks import generate_single_article; generate_single_article.apply(args=[1, None]).get()"
```

Trebalo bi za ~90s da izađe novi članak na portalu.

---

## 5. AdSense (kad si spreman)

1. Portal mora biti live sa 10+ članaka prije nego AdSense odobri
2. U Google AdSense uzmi svoj **publisher ID** (`ca-pub-XXXXXXXXXXXXXXXX`)
3. Dodaj ga u Railway frontend env:
   ```
   NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX
   ```
4. U AdSense dashboard-u kreiraj **ad units** (tipovi: Display, In-article, In-feed) i za svaki dobiješ slot ID
5. Ažuriraj slot ID-jeve u `frontend/components/AdSlot.tsx` pozivima (trenutno koristim placeholder imena poput `"article-top"`, `"sidebar-big"` itd.)
6. Redeploy frontend

---

## 6. Dnevni workflow održavanja

**Svako jutro (2 min)**:
- Provjeri Telegram digest u 06:15 — da li je 20/20 članaka objavljeno?
- Ako nije, provjeri Railway → worker logs za greške

**Sedmično (30 min)**:
- Pregled top 10 i bottom 10 članaka — šta klikću?
- Dodaj nove varijable u `app/variables/pool.py` za veći varijetet
- Sampling 3-5 članaka za ljudski review kvaliteta (su li priče dobre?)

---

## Troubleshooting

| Problem | Rješenje |
|---------|----------|
| "pgvector extension error" | Supabase SQL Editor: `CREATE EXTENSION IF NOT EXISTS vector;` |
| "Claude API error 429" | Rate limit — sistem auto-retry za 60s. Ako uporno, provjeri balance |
| "Replicate timeout" | Provjeri balance na replicate.com/account/billing |
| "Article failed validation 3x" | Template problem — pogledaj Sentry log ili Railway worker logs |
| "FB post failed" | Page access token istekao (60 dana) — generiši novi |
| "R2 403 AccessDenied" | Bucket nije public ili R2 credentials pogrešni |
| Frontend pokazuje "Uskoro stižu prve priče" | Nijedan članak u DB-u sa `status=published`. Pokreni `test_article.py` |
| ISR ne radi (članak se ne pojavljuje 1h nakon generisanja) | `REVALIDATE_SECRET` se razlikuje između backend-a i frontend-a |

---

## Status checklist

Prati šta si završio:

- [ ] API ključevi kupljeni (Anthropic, OpenAI, Replicate, Supabase, R2, Telegram)
- [ ] `.env` popunjen lokalno
- [ ] Font Anton-Regular.ttf download-ovan
- [ ] Redis lokalno radi
- [ ] `alembic upgrade head` uspio
- [ ] `seed_variables.py` uspio
- [ ] `test_article.py` generisao članak (provjeri u Supabase)
- [ ] Frontend lokalno prikazuje članak na http://localhost:3000
- [ ] GitHub repo kreiran i push-ovan
- [ ] Railway projekat kreiran sa 3 servisa + Redis
- [ ] Railway env vars postavljene
- [ ] Railway migracije pokrenute
- [ ] DNS za vtiportal.com podešen
- [ ] vtiportal.com otvara frontend
- [ ] Celery beat zakazao prvu seriju u 00:00
- [ ] Telegram digest u 06:15 radi
- [ ] AdSense slotovi dodani (kasnije)
- [ ] FB auto-post aktiviran (kasnije, opciono)
