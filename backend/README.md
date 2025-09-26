# Sanguivia Backend - Node.js Email Activation

Minimalny backend Node.js (Express 4) z pełną logiką wysyłki maila aktywacyjnego przez Gmail SMTP oraz prostymi endpointami do rejestracji i weryfikacji konta. Backend działa na Render.com i jest wywoływany z aplikacji Electron.

## Wymagania

- Node.js >= 20
- Gmail z App Password (nie zwykłe hasło!)
- PostgreSQL (opcjonalnie, może używać pamięci)

## Szybki start (lokalnie)

1. **Kopiuj i skonfiguruj zmienne środowiskowe:**
   ```bash
   cp env.example .env
   ```
   
2. **Uzupełnij `.env` z Twoimi danymi Gmail:**
   ```
   SMTP_USER=twoj_adres@gmail.com
   SMTP_PASS=16-znakowe-app-password
   FROM_EMAIL=Sanguivia <twoj_adres@gmail.com>
   APP_JWT_SECRET=losowy-sekret-min-32-znaki
   ```

3. **Zainstaluj i uruchom:**
   ```bash
   npm install
   npm start
   ```

4. **Inicjalizuj bazę danych (opcjonalnie):**
   ```bash
   curl -X POST http://localhost:10000/api/init-db
   ```

## Deploy na Render.com

1. **Utwórz nowy Web Service**
   - Build Command: `npm install`
   - Start Command: `npm start`
- Health Check Path: `/api/health`

2. **Skonfiguruj Environment Variables:**
   ```
   APP_BASE_URL=https://sanguivia.pl
   APP_JWT_SECRET=<32-character-secret>
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=<your-gmail@gmail.com>
   SMTP_PASS=<16-character-app-password>
   FROM_EMAIL=Sanguivia <your-gmail@gmail.com>
   DATABASE_URL=<your-postgres-url>
   NODE_ENV=production
   PORT=10000
   ```

## Gmail App Password

⚠️ **WAŻNE**: Musisz użyć App Password, nie zwykłego hasła Gmail!

1. Idź do [Google Account Security](https://myaccount.google.com/security)
2. Włącz 2-Step Verification jeśli nie masz
3. Idź do "App passwords"
4. Wygeneruj nowe hasło dla "Mail"
5. Użyj tego 16-znakowego hasła jako `SMTP_PASS`

## API Endpointy

### Diagnostyka
- `GET /api/health` → `{ ok: true, ts: "..." }`
- `GET /api/diag/smtp` → `{ ok: true, host: "smtp.gmail.com", ip: "...", port: 465 }`

### Baza danych
- `POST /api/init-db` → Tworzy tabelę `users` (opcjonalne)

### Autoryzacja
- `POST /api/register` → Rejestracja + wysyłka emaila aktywacyjnego
- `GET /api/verify/:token` → Aktywacja konta przez kliknięcie w link
- `POST /api/resend-activation` → Ponowna wysyłka emaila aktywacyjnego

### Przykład rejestracji:
```bash
curl -X POST http://localhost:10000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstname": "Jan",
    "lastname": "Kowalski", 
    "login": "jkowalski",
    "email": "jan@example.com",
    "password": "haslo123"
  }'
```

### Przykład weryfikacji:
```bash
curl http://localhost:10000/api/verify/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Przykład ponownej aktywacji:
```bash
curl -X POST http://localhost:10000/api/resend-activation \
  -H "Content-Type: application/json" \
  -d '{"email": "jan@example.com"}'
```

## Helper dla Electron (stabilny klient)

```javascript
async function postJSON(url, body, timeoutMs=60000) {
  const c = new AbortController();
  const t = setTimeout(()=>c.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(body),
      signal: c.signal,
      redirect: 'follow'
    });
    const ct = res.headers.get('content-type')||'';
    const raw = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} :: ${raw.slice(0,200)}`);
    if (ct.includes('application/json')) return raw?JSON.parse(raw):{};
    throw new Error(`Expected JSON, got: ${ct} :: ${raw.slice(0,200)}`);
  } finally { clearTimeout(t); }
}

// Użycie:
try {
  const result = await postJSON('https://your-backend.onrender.com/api/register', {
    firstname: 'Jan',
    lastname: 'Kowalski',
    login: 'jkowalski', 
    email: 'jan@example.com',
    password: 'haslo123'
  });
  console.log('Rejestracja OK:', result);
} catch (error) {
  console.error('Błąd rejestracji:', error.message);
}
```

## Link aktywacyjny

Backend generuje link w formacie:
```
${APP_BASE_URL}/verify/${token}
```

Przykład: `https://sanguivia.pl/verify/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## Troubleshooting

### SMTP nie działa?
1. Sprawdź `GET /api/diag/smtp` - powinno zwrócić `ok: true`
2. Upewnij się, że używasz App Password, nie zwykłego hasła Gmail
3. Sprawdź czy `FROM_EMAIL` ma ten sam adres co `SMTP_USER`

### Database connection error?
- Backend może działać bez bazy (używa pamięci)
- Jeśli chcesz PostgreSQL, ustaw `DATABASE_URL` w environment variables

### Token errors?
- Tokeny wygasają po 24h
- Sprawdź czy `APP_JWT_SECRET` ma min. 32 znaki

## Struktura plików

```
backend/
├── package.json      # Dependencies + start script
├── .nvmrc           # Node 20
├── server.js        # Cały kod serwera
├── env.example      # Przykładowe zmienne ENV
└── README.md        # Ta instrukcja
```

## Checklistа po wdrożeniu

- ✅ `GET /api/health` → 200 `{ ok: true }`
- ✅ `GET /api/diag/smtp` → 200 `{ ok: true, host: "smtp.gmail.com", ... }`
- ✅ `POST /api/register` z testowym adresem → 201 `{ ok:true }` + mail dostarczony
- ✅ Kliknięcie w link → `GET /api/verify/:token` → 200 `{ ok:true }`
- ✅ `POST /api/resend-activation` dla niezweryfikowanego → 200 `{ ok:true }`
- ✅ Wszystkie odpowiedzi to JSON; brak HTML 404/502; brak crashy na starcie
