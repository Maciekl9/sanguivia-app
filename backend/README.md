# Sanguivia Mailer (Express + Nodemailer + PostgreSQL)

Gotowy backend do wysyłki maili aktywacyjnych/resetu hasła (home.pl SMTP) i prostego logowania.

## Szybki start (lokalnie)
1. `cp env.example .env` i uzupełnij wartości.
2. `npm install`
3. `npm start`
4. `POST http://localhost:10000/api/init-db` (jednorazowo, tworzy tabelę).

## Deploy na Render
- New → Web Service → to repo/paczka.
- Build: `npm install` (domyślnie)
- Start: `npm start`
- Environment Variables – wklej **dokładnie** z `env.example`.
- Health Check Path: `/api/health`

## Endpointy
- `GET  /api/health` – ping
- `GET  /api/diag/smtp` – sprawdza DNS/port SMTP
- `POST /api/init-db` – tworzy tabelę `users` (jednorazowo)
- `POST /api/register` – rejestracja + email weryfikacyjny
- `GET  /api/verify/:token` – potwierdzenie
- `POST /api/resend-activation` – ponowna wysyłka
- `POST /api/forgot-password` – wysyłka linku resetu
- `POST /api/reset-password/:token` – zmiana hasła

## DNS (sanguivia.pl)
- SPF: `v=spf1 include:_spf.home.pl ~all`
- DKIM: rekord z panelu home.pl (już dodany u Ciebie)
- DMARC: `_dmarc` = `v=DMARC1; p=none; rua=mailto:dmarc@sanguivia.pl; fo=1`

## Ważne
- `FROM_EMAIL` **musi** być `Sanguivia <kontakt@sanguivia.pl>` (ten sam adres co `SMTP_USER`).
- Jeśli `GET /api/diag/smtp` nie zwróci `ok:true`, sprawdź `SMTP_HOST/PORT/SECURE` i region usługi.
