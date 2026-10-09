# Karakterlapok – Daggerheart és D&D 5e

Kétnyelvű (magyar–angol) karakteralkotó és karakterlap-kezelő webapp két játékhoz. Egyetlen statikus oldal: nincs szerver, nincs fiók.

**Kezdőlap:** játékválasztó (Daggerheart / D&D 5e), a karakterek listája, új karakter, szabálykönyv.

**Daggerheart:** lépésenkénti karakteralkotás · automatikusan számolt értékek · Kettősség-dobó · sebzés, pihenő, halálmozdulatok · szintlépés 10. szintig · mind a 189 tartománykártya · a teljes SRD 1.0 keresővel.

**D&D 5e (2024-es szabályok, SRD 5.2.1):** 12 osztály (osztályonként egy alosztály), 9 faj, 4 háttér · tulajdonságok, mentők, jártasságok, PO, ÉP, kezdeményezés automatikusan · d20-dobó előnnyel/hátránnyal · 339 varázslat teljes szöveggel, varázshelyek · pihenők, életkockák, halálmentők · szintlépés 20. szintig · a teljes SRD 5.2.1 (szabályok, varázslatok, mágikus tárgyak, szörnyek) keresővel.

**Kalandmester:** kampányalkotó lépésről lépésre (rendszer → alapötlet → első helyszín → szereplők → események → első csata) · történettábla · helyszínek és jelenlévők · szereplők · bestiárium a könyvek ellenfeleivel (129 Daggerheart-ellenfél és 19 környezet, 341 D&D-szörny) · csatakövető nehézségbecsléssel · házi szabályok, infók, árlista · napló és keresés.

**Közös:** nappali/éjszakai téma · profilkép · session-napló és jegyzetek · exportálás (nyomtatás/PDF, HTML, Markdown, JSON) és visszatöltés · automatikus mentés fájlba · telepíthető, offline is működik (PWA) · natív macOS-program.

## Közzététel GitHub Pages-en

1. Hozz létre egy új repót a GitHubon, és töltsd fel ennek a mappának a tartalmát (`git push`).
2. A repóban: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, Branch: `main`, mappa: `/ (root)`, majd **Save**.
3. Egy-két perc múlva az app elérhető a `https://<felhasználónév>.github.io/<repó-név>/` címen. Telefonon a böngésző menüjéből „Hozzáadás a kezdőképernyőhöz”.

## macOS-program

A [Releases](https://github.com/ombolidadi/daggerheart-karakterlapok/releases) oldalról letölthető a `Daggerheart-Karakterlapok-macOS.zip`: kicsomagolás után a **Daggerheart Karakterlapok.app** az Alkalmazások mappába húzható. Önálló ablakban fut, internet nélkül is, és a karaktereket magától menti ide: `~/Library/Application Support/Daggerheart Karakterlapok/karakterek.json` (naponta biztonsági másolattal a `backups` mappában).

A program nincs Apple fejlesztői azonosítóval aláírva, ezért az első indításnál a macOS figyelmeztet. Megnyitás: jobb klikk az appon → **Megnyitás**, vagy Rendszerbeállítások → Adatvédelem és biztonság → **Megnyitás mindenképp**.

Saját fordítás: `bash macos/build-app.sh` (Xcode Command Line Tools kell hozzá); az eredmény a `dist/` mappába kerül.

## Fejlesztés

- `src/app.html` – az alkalmazás váza és a Daggerheart-lap (HTML + CSS + JS egy fájlban).
- `src/dnd.js` – a D&D 5e karakterlap.
- `src/gm.js` – a kalandmesteri felület (kampányok).
- `srd-source/` – a Daggerheart SRD 1.0 és (a `dnd/` almappában) a D&D SRD 5.2.1 adatai.
- `python3 build.py` – ebből készül az `index.html`, a `dnd.js`, a `data/*.js`, a manifest és az ikonok. Szerkesztés után futtasd újra.
- Helyi kipróbálás: `python3 -m http.server 8000`, majd `http://localhost:8000`.

## Adatok és mentés

Asztali Chrome-ban vagy Edge-ben a fenti **Mentés fájlba…** gombbal kiválasztható egy mentésfájl a gépeden: az app minden változás után magától belementi az összes karaktert, megnyitáskor pedig onnan olvassa vissza a frissebb állapotot. Enélkül a karakterek csak abban a böngészőben léteznek, ahol létrehoztad őket. Másik eszközre az **Exportálás / betöltés** panel JSON-fájljával vihetők át; érdemes időnként biztonsági mentést készíteni.

## Licenc és forrás

This product includes materials from the Daggerheart System Reference Document 1.0, © Critical Role, LLC. under the terms of the Darrington Press Community Gaming (DPCGL) License. More information can be found at https://www.daggerheart.com. There are no previous modifications by others.

**D&D:** This work includes material from the System Reference Document 5.2.1 (“SRD 5.2.1”) by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode. A strukturált adatok a [5e-bits/5e-database](https://github.com/5e-bits/5e-database) (MIT), a szabályszöveg a [downfallx/dnd-5e-srd-markdown](https://github.com/downfallx/dnd-5e-srd-markdown) repóból származnak. Nem áll kapcsolatban a Wizards of the Coasttal.

**Daggerheart:** az SRD strukturált adatai a [seansbox/daggerheart-srd](https://github.com/seansbox/daggerheart-srd) repóból származnak. A magyar szövegek saját, nem hivatalos fordítások. Nem hivatalos rajongói eszköz; nem áll kapcsolatban a Critical Role-lal vagy a Darrington Press-szel. Nyilvános közzététel előtt olvasd el a DPCGL feltételeit: https://www.darringtonpress.com/license
