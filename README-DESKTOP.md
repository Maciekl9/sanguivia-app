# 🩸 Sanguivia Desktop - Instrukcja Uruchamiania

## 🚀 Szybkie Uruchomienie

### Opcja 1: Uruchomienie przez start.bat (ZALECANE)
1. Kliknij dwukrotnie na `start.bat`
2. Poczekaj na instalację zależności (pierwszy raz)
3. Aplikacja uruchomi się automatycznie

### Opcja 2: Uruchomienie przez launcher.js
```bash
node launcher.js
```

### Opcja 3: Uruchomienie bezpośrednio przez Electron
```bash
npm install
npx electron electron-simple.js
```

### Opcja 4: Uruchomienie bez Electron (jeśli problemy)
```bash
node electron-simple.js
```

## 🔧 Wymagania Systemowe

- **Node.js** 16+ (https://nodejs.org/)
- **Windows** 10/11
- **RAM** 4GB minimum
- **Dysk** 500MB wolnego miejsca

## 📁 Struktura Aplikacji

```
Sanguiviav2/
├── build/                 # Pliki aplikacji Electron
│   ├── electron.js       # Główny proces Electron
│   ├── preload.js        # Bezpieczny preload
│   ├── index.html        # Interfejs użytkownika
│   ├── script.js         # Logika frontend
│   └── style.css         # Style CSS
├── backend/              # Serwer API
│   └── server.js         # Backend Express
├── launcher.js           # Uruchamiacz aplikacji
├── start.bat            # Skrypt uruchamiania Windows
└── package.json         # Konfiguracja npm
```

## 🛠️ Naprawione Problemy

### ✅ Bezpieczne Przechowywanie Danych
- Zastąpiono localStorage bezpiecznym Electron Store
- Dane użytkownika są szyfrowane
- Trwały zapis po zamknięciu aplikacji

### ✅ Poprawione Uruchamianie
- Automatyczna instalacja Electron
- Fallback dla różnych systemów
- Lepsze obsługiwanie błędów

### ✅ Konfiguracja Electron
- Dodano preload.js dla bezpieczeństwa
- Poprawiono konfigurację okna
- Dodano menu aplikacji

## 🔐 Bezpieczeństwo

- **Context Isolation** włączone
- **Node Integration** wyłączone
- **Szyfrowane przechowywanie** danych użytkownika
- **Bezpieczne API** komunikacja

## 🐛 Rozwiązywanie Problemów

### Problem: "Electron nie jest zainstalowany"
**Rozwiązanie:** Uruchom `npm install` w folderze aplikacji

### Problem: "Błąd uruchamiania Electron"
**Rozwiązanie:** 
1. Sprawdź czy Node.js jest zainstalowany
2. Uruchom `npm install electron --save-dev`
3. Spróbuj `node electron-simple.js` (bez Electron)
4. Spróbuj ponownie

### Problem: "Store is not a constructor"
**Rozwiązanie:** Użyj `electron-simple.js` zamiast `build/electron.js`

### Problem: Aplikacja nie łączy się z API
**Rozwiązanie:** Sprawdź połączenie internetowe i status serwera

## 📞 Wsparcie

W przypadku problemów:
1. Sprawdź logi w konsoli
2. Uruchom `npm install` ponownie
3. Sprawdź połączenie internetowe

## 🎯 Funkcje

- ✅ **Bezpieczne logowanie** z szyfrowaniem
- ✅ **Rejestracja użytkowników** z weryfikacją email
- ✅ **Trwały zapis danych** po zamknięciu
- ✅ **Nowoczesny interfejs Neumorphism** - identyczny z Vercel/GitHub
- ✅ **Responsywny design** dla różnych rozdzielczości
- ✅ **Menu aplikacji** z skrótami klawiszowymi
- ✅ **Animacje i efekty** hover, focus, loading
- ✅ **Ikony SVG** i nowoczesne elementy UI

---
**Sanguivia Desktop v1.0.0** - System ERP/CRM dla branży perfumeryjnej
