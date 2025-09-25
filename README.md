# Sanguivia Desktop Application

Kompletny system ERP/CRM dla przedsiębiorstwa perfumeryjnego z pełnym systemem autoryzacji.

## 🚀 Funkcje

- **System autoryzacji**: Rejestracja, logowanie, reset hasła
- **Weryfikacja email**: Aktywacja konta przez email
- **Bezpieczne hashowanie**: Hasła są bezpiecznie przechowywane
- **Nowoczesny UI**: Neumorphism design
- **Desktop app**: Aplikacja Electron z backendem w chmurze

## 📋 Wymagania

- Node.js 16+
- PostgreSQL 12+
- Gmail account (dla wysyłania emaili)

## 🛠️ Instalacja

### 1. Backend Setup

```bash
cd backend
npm install
```

### 2. Konfiguracja bazy danych

1. Zainstaluj PostgreSQL
2. Utwórz bazę danych:
```sql
CREATE DATABASE sanguivia;
```

3. Skonfiguruj plik `backend/config.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sanguivia
DB_USER=postgres
DB_PASSWORD=twoje_haslo

JWT_SECRET=twoj-super-sekretny-klucz
JWT_EXPIRES_IN=24h

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=twoj-email@gmail.com
EMAIL_PASS=twoje-haslo-aplikacji

PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

4. Zainicjalizuj bazę danych:
```bash
npm run init-db
```

### 3. Konfiguracja Gmail

1. Włącz 2FA na koncie Gmail
2. Wygeneruj hasło aplikacji
3. Użyj hasła aplikacji w `EMAIL_PASS`

### 4. Uruchomienie

#### Backend:
```bash
cd backend
npm run dev
```

#### Frontend:
```bash
cd ..
npm run dev
```

## 📁 Struktura projektu

```
Sanguiviav2/
├── backend/                 # Backend API
│   ├── server.js           # Główny serwer
│   ├── init-db.js          # Inicjalizacja bazy
│   ├── config.env          # Konfiguracja
│   └── package.json
├── build/                  # Frontend build
│   ├── index.html
│   ├── style.css
│   └── script.js
├── src/                    # Electron source
└── package.json
```

## 🔐 API Endpoints

- `POST /api/register` - Rejestracja użytkownika
- `GET /api/verify/:token` - Weryfikacja email
- `POST /api/login` - Logowanie
- `POST /api/forgot-password` - Reset hasła
- `POST /api/reset-password/:token` - Ustawienie nowego hasła
- `GET /api/health` - Status serwera

## 🎨 UI Features

- **Neumorphism design** - Nowoczesny, miękki wygląd
- **Responsive** - Działa na różnych rozmiarach ekranu
- **Animacje** - Płynne przejścia i efekty
- **Walidacja** - Real-time walidacja formularzy
- **Loading states** - Wskaźniki ładowania

## 🔧 Development

### Backend Development
```bash
cd backend
npm run dev  # Uruchamia z nodemon
```

### Frontend Development
```bash
npm run dev  # Uruchamia React dev server + Electron
```

### Build Production
```bash
npm run build:electron  # Tworzy .exe
```

## 📧 Email Templates

System wysyła profesjonalne emaile HTML z:
- Linkami aktywacyjnymi
- Linkami resetu hasła
- Responsywnym designem

## 🛡️ Security

- **JWT tokens** - Bezpieczna autoryzacja
- **bcrypt** - Hashowanie haseł
- **CORS** - Konfiguracja cross-origin
- **Input validation** - Walidacja po stronie serwera i klienta
- **SQL injection protection** - Parametryzowane zapytania

## 🚀 Deployment

1. Skonfiguruj produkcyjną bazę danych
2. Ustaw zmienne środowiskowe
3. Zbuduj aplikację: `npm run build:electron`
4. Uruchom backend na serwerze
5. Rozpowszechnij plik .exe

## 📞 Support

W przypadku problemów:
1. Sprawdź logi backendu
2. Sprawdź połączenie z bazą danych
3. Sprawdź konfigurację email
4. Sprawdź czy porty są wolne

## 🔄 Workflow

1. **Rejestracja**: Użytkownik wypełnia formularz → Backend tworzy konto → Email aktywacyjny
2. **Aktywacja**: Użytkownik klika link → Backend aktywuje konto
3. **Logowanie**: Użytkownik loguje się → Backend zwraca JWT token
4. **Reset hasła**: Użytkownik prosi o reset → Backend wysyła email → Użytkownik resetuje hasło
