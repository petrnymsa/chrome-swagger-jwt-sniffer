# Swagger JWT Sniffer - Chrome Extension (Unpacked)

## Instalace pro vývoj (Unpacked Extension)

### Kroky pro načtení extension v Chrome:

1. **Otevřete Chrome Developer Mode:**
   - Otevřete Chrome browser
   - Jděte na `chrome://extensions/` nebo Menu → More tools → Extensions
   - Zapněte "Developer mode" (pravý horní roh)

2. **Načtěte unpacked extension:**
   - Klikněte na "Load unpacked" tlačítko
   - Vyberte složku s tímto projektem (`chrome-swagger-jwt`)
   - Extension se načte a zobrazí v seznamu

3. **Ověření instalace:**
   - Extension by se měl zobrazit v seznamu s názvem "Swagger JWT Sniffer (Dev)"
   - Ikona extension by se měla zobrazit v Chrome toolbar

### Použití:

1. **Nastavení origins:**
   - Klikněte pravým tlačítkem na ikonu extension → Options
   - Přidejte origins (domény), kde chcete zachytávat JWT tokeny
   - Například: `https://petstore.swagger.io`

2. **Zachytávání JWT:**
   - Jděte na stránku se Swagger UI
   - Proveďte API volání s Authorization headerem
   - Klikněte na ikonu extension v toolbar
   - Uvidíte zachycené JWT tokeny a jejich dekódovaný obsah

### Vývojářské poznámky:

- Extension je nakonfigurován pro manifest v3
- Používá service worker místo background page
- Má nastavené `host_permissions` pro přístup ke všem doménám
- Název obsahuje "(Dev)" pro rozlišení od produkční verze

### Reload extension po změnách:

1. Jděte na `chrome://extensions/`
2. Najděte "Swagger JWT Sniffer (Dev)"
3. Klikněte na refresh/reload ikonu
4. Nebo použijte Ctrl+R na extension kartě

### Debugging:

- Service worker log: `chrome://extensions/` → "service worker" link u extension
- Popup debugging: F12 v otevřeném popup okně
- Background errors se zobrazí na extension detail stránce
