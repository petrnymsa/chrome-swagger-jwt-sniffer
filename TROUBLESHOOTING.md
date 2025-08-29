# Řešení problémů s Authorize tokeny

## Problém: Při authorize se načte chybný token

### Co se děje:
1. **Login** - uživatel se přihlásí → extension zachytí `access_token` z `/api/login` response
2. **Authorize** - Swagger UI používá zachycený token pro API volání → extension může zachytit starší/jiný token z request headers

### Řešení v extension:

#### 1. **Priorita tokenů:**
- **Login tokeny** mají vyšší prioritu než request header tokeny
- Login tokeny se nenahrazují request header tokeny po dobu 30 sekund
- Nové login tokeny vždy nahradí staré tokeny

#### 2. **Historie tokenů:**
- Extension si pamatuje posledních 5 tokenů
- Každý token má označení zdroje: "LOGIN" nebo "REQUEST"
- Uživatel může vybrat konkrétní token z historie

#### 3. **Použití History funkce:**

1. **Otevřete popup extension**
2. **Klikněte "History"** - zobrazí se seznam zachycených tokenů
3. **Vyberte správný token** z dropdown menu:
   - `Latest token (auto)` - automaticky nejnovější
   - `čas - LOGIN - token...` - token z login response
   - `čas - REQUEST - token...` - token z request header

#### 4. **Debugging:**

Otevřete Developer Tools pro debugging:

**Service Worker Console:**
```
chrome://extensions/ → "service worker" u vašeho extension
```

**Popup Console:**
```
Otevřete popup → F12
```

**Typické log zprávy:**
```
Captured authorization header: Bearer eyJ...
Login token captured: eyJ...
Keeping existing login token, request header token added to history only
Updated latest token from request header
```

### Doporučený workflow:

1. **Přihlaste se** na Bakalari stránku
2. **Otevřete popup** → měl by zobrazit token z login response
3. **Pokud se zobrazí chybný token:**
   - Klikněte "History"
   - Vyberte token označený "LOGIN"
4. **Pro nové API volání:** Extension automaticky použije nejvhodnější token

### Časové okno:

- **Login tokeny** zůstávají prioritní **30 sekund** po zachycení
- Po 30 sekundách může request header token nahradit login token
- Toto zajišťuje, že fresh login tokeny mají přednost před starými authorize requesty

### Manuální výběr:

Pokud automatika nefunguje správně, vždy můžete:
1. Kliknout "History"
2. Najít token s označením "LOGIN" a nejnovějším časem
3. Vybrat ho ručně
