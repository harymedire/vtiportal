# VTIportal.com — Autopilot

Autopilot portal za drame, ispovijesti i priče iz svakodnevnog života na bosanskom jeziku. Sistem svaki dan automatski generiše 20 originalnih članaka sa slikama i objavljuje ih na [vtiportal.com](https://vtiportal.com).

## Šta radi

- **00:00** — cron zakazuje 20 članaka, razmaknutih 18 min (kroz noć)
- **Za svaki članak**: Claude napiše tekst (5 stranica sa hookovima), Flux generiše sliku, Pillow doda žuti clickbait overlay, sve se upload-uje na R2 CDN, upisuje u Postgres, triggeruje Next.js ISR
- **06:15** — Telegram digest sa svim objavljenim člancima + ukupna potrošnja
- **06:30** — health check (alert ako nije objavljeno svih 20)
- **07/10/13/16/19** — auto-post na Facebook stranicu (opciono)

## Tech stack

- **Backend**: Python 3.11, Celery, Redis
- **Baza**: Supabase Postgres sa pgvector (deduplikacija)
- **AI**: Claude Sonnet (tekst), Flux Schnell (slike), OpenAI embeddings (dedup)
- **Storage**: Cloudflare R2 (S3-kompatibilno)
- **Frontend**: Next.js 14 + Tailwind (App Router, ISR)
- **Hosting**: Railway (backend + Redis + frontend)
- **Monitoring**: Telegram alerti, Sentry (opciono)

## Struktura

```
vtiportal/
├── app/                     # Python backend
│   ├── config.py
│   ├── models.py
│   ├── celery_app.py
│   ├── tasks.py             # 5 Celery task-ova
│   ├── prompts/             # sistem prompt + 8 template-a
│   ├── services/            # Claude, Replicate, R2, Telegram, FB
│   ├── validators/          # content/originality/toxicity
│   └── variables/           # pool varijabli za template-e
├── frontend/                # Next.js portal
├── migrations/              # Alembic
├── scripts/
│   ├── test_article.py
│   └── seed_variables.py
├── assets/Anton-Regular.ttf # clickbait font
├── docker-compose.yml
├── Dockerfile
├── railway.json             # Railway backend config
└── SETUP.md                 # korak-po-korak deploy uputstvo
```

## Quick start — lokalno

Detaljno uputstvo je u [SETUP.md](SETUP.md). Skraćena verzija:

```bash
# 1. Virtualenv
python3.11 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 2. Font
curl -L -o assets/Anton-Regular.ttf \
  https://github.com/googlefonts/anton/raw/main/fonts/Anton-Regular.ttf

# 3. .env
cp .env.example .env
# popuni sa pravim ključevima

# 4. Redis lokalno
docker run -d -p 6379:6379 redis:7-alpine

# 5. Migracije + seed
alembic upgrade head
python scripts/seed_variables.py

# 6. Test jednog članka
python scripts/test_article.py --template 1
```

## Monitoring

- **Telegram digest** svako jutro u 06:15
- **Sentry** (opciono) za error tracking
- **Flower** dashboard na `:5555` za Celery queue

## Trošak (~20 članaka/dan)

| Servis             | Mjesečno    |
|--------------------|-------------|
| Claude Sonnet      | ~$55        |
| Replicate (Flux)   | ~$5         |
| Railway (worker + Redis) | $10-15 |
| Supabase Pro       | $25         |
| Cloudflare R2      | <$1         |
| **Ukupno**         | **~$100**   |

## Održavanje

Sedmično (30-45 min):
- Pregled top 10 i bottom 10 članaka po pregledima
- Provjera AdSense prihod vs trošak
- Dodavanje novih varijabli u pool (za veći varijetet)
- Sampling 3-5 članaka za ljudski review

## License

Private project. Kod sadrži business logiku specifičnu za VTIportal.
