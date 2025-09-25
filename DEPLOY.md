# 🚀 DEPLOY DO CHMURY - INSTRUKCJA

## **KROK 1: Przygotuj GitHub**

1. **Utwórz repozytorium na GitHub:**
   - Idź na: https://github.com/new
   - Nazwa: `sanguivia-app`
   - Publiczne (żeby było darmowe)

2. **Wgraj kod:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/TWOJ_USERNAME/sanguivia-app.git
   git push -u origin main
   ```

## **KROK 2: Deploy Backend na Render**

1. **Idź na:** https://render.com
2. **Zaloguj się** przez GitHub
3. **Kliknij "New +"** → **"Web Service"**
4. **Połącz z GitHub** i wybierz `sanguivia-app`
5. **Ustawienia:**
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free

6. **Dodaj zmienne środowiskowe:**
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = `twoj-super-sekretny-klucz`
   - `EMAIL_USER` = `twoj-email@gmail.com`
   - `EMAIL_PASS` = `twoje-haslo-aplikacji-gmail`

7. **Dodaj bazę danych:**
   - **Kliknij "New +"** → **"PostgreSQL"**
   - **Nazwa:** `sanguivia-db`
   - **Plan:** Free

8. **Deploy!** 🚀

## **KROK 3: Deploy Frontend na Vercel**

1. **Idź na:** https://vercel.com
2. **Zaloguj się** przez GitHub
3. **Import Project** → wybierz `sanguivia-app`
4. **Ustawienia:**
   - **Root Directory:** `build`
   - **Framework:** Other
   - **Build Command:** `echo "No build needed"`
   - **Output Directory:** `.`

5. **Deploy!** 🚀

## **KROK 4: Zaktualizuj URL w kodzie**

Po deploy zmień w `build/script.js`:
```javascript
this.API_BASE_URL = 'https://TWOJ-BACKEND-URL.onrender.com/api';
```

## **KROK 5: Testuj**

1. **Otwórz aplikację** z Vercel
2. **Zarejestruj się** - powinien przyjść email
3. **Kliknij link** - konto się aktywuje
4. **Zaloguj się** - wszystko działa!

## **🎯 REZULTAT:**

- ✅ **Backend w chmurze** - działa 24/7
- ✅ **Baza danych w chmurze** - PostgreSQL
- ✅ **Frontend w chmurze** - Vercel
- ✅ **Linki aktywacyjne działają** - HTTPS
- ✅ **Aplikacja działa** - niezależnie od Twojego komputera

## **💰 KOSZT:**
- **Render:** Darmowe (z limitami)
- **Vercel:** Darmowe (z limitami)
- **PostgreSQL:** Darmowe (z limitami)

**TOTAL: 0 zł!** 🎉
