# UP RENT — Smart Logistics Planner

Modern demo aplikacija za planiranje prijevoza radnih strojeva.

## Stack

- Frontend: React, TypeScript, Vite, Framer Motion, Lucide
- Backend: Node.js, Express, TypeScript
- Tests: Vitest

## Pokretanje

Preduvjet: Node.js 20+.

```bash
npm install
npm --prefix server install
npm --prefix client install
npm run dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:4000/api/health

## Testovi

```bash
npm test
```

## Optimizacijska logika

- Strojevi teži od 3.500 kg obavezno se dodjeljuju kamionu B.
- Za preostalih pet naloga enumerira se svih 2^5 = 32 mogućih raspodjela.
- Za svako vozilo beam search slaže pickup/delivery događaje uz provjeru nosivosti, broja istodobno prevezenih strojeva, redoslijeda pickup-before-delivery i radnog vremena.
- U radno vrijeme uključena je vožnja (60 km/h) i 20 minuta za svaku operaciju utovara/istovara.
- Na kraju se dodaje povratak u bazu L0, a bira se raspodjela s najmanjom ukupnom kilometražom među pronađenim izvedivim rješenjima.

**Važno:** Beam search je heuristička metoda. Ovo je kvalitetan prototip i ne predstavlja matematički dokaz globalnog optimuma. U prezentaciji treba jasno navesti da se radi o heurističkoj optimizaciji. Povećanje širine snopa i dodatni lokalni search mogu poboljšati rezultat.

## API

- `GET /api/health`
- `GET /api/data`
- `POST /api/optimize`

## Napomene

Udaljenost između lokacija računa se euklidski i zaokružuje na jednu decimalu po dionici.

## Deployment

Aplikacija se može implementirati na Netlify za frontend i Heroku za backend.

### Netlify

1. Povežite svoj Git repozitorij s Netlify-jem.
2. Postavite osnovne postavke, uključujući varijable okruženja.
3. Odaberite granu za implementaciju (npr. `main`).
4. Konfigurirajte build naredbu: `npm run build`.
5. Postavite objavljeni direktorij na `client/dist`.

### Heroku

1. Instalirajte Heroku CLI i prijavite se.
2. Kreirajte novu Heroku aplikaciju: `heroku create`.
3. Postavite varijable okruženja: `heroku config:set KEY=VALUE`.
4. Implementirajte aplikaciju: `git push heroku main`.
5. Pokrenite migracije ako ih ima: `heroku run npm run migrate`.

## GitHub Workflow

- Koristite grane za nove značajke ili ispravke.
- Otvorite Pull Request za spajanje u `main` granu.
- Osigurajte da svi testovi prolaze prije spajanja.
- Nakon spajanja, povucite promjene u lokalni repozitorij.
