# Daggerheart Karakterlapok

Kétnyelvű (magyar–angol) Daggerheart karakteralkotó és karakterlap-kezelő webapp. Egyetlen statikus oldal: nincs szerver, nincs fiók, a karakterek a böngésző tárhelyén (localStorage) maradnak.

**Tudja:** lépésenkénti karakteralkotás · automatikusan számolt értékek · Kettősség-dobó · sebzés, pihenő, halálmozdulatok · szintlépés 10. szintig · mind a 189 tartománykártya teljes szövege · fegyver-, páncél- és tárgykatalógus · session-napló és jegyzetek · nappali/éjszakai téma · profilkép · exportálás (nyomtatás/PDF, HTML, Markdown, JSON) és visszatöltés (JSON, valamint az appból exportált HTML és PDF) · a teljes SRD 1.0 szabályszöveg keresővel · telepíthető és offline is működik (PWA).

## Közzététel GitHub Pages-en

1. Hozz létre egy új repót a GitHubon, és töltsd fel ennek a mappának a tartalmát (`git push`).
2. A repóban: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, Branch: `main`, mappa: `/ (root)`, majd **Save**.
3. Egy-két perc múlva az app elérhető a `https://<felhasználónév>.github.io/<repó-név>/` címen. Telefonon a böngésző menüjéből „Hozzáadás a kezdőképernyőhöz”.

## Fejlesztés

- `src/app.html` – az alkalmazás (HTML + CSS + JS egy fájlban).
- `srd-source/` – a Daggerheart SRD 1.0 adatai (JSON + Markdown).
- `python3 build.py` – ebből készül az `index.html`, a `data/srd-data.js`, a `data/srd-rules.js`, a manifest és az ikonok. Szerkesztés után futtasd újra.
- Helyi kipróbálás: `python3 -m http.server 8000`, majd `http://localhost:8000`.

## Adatok és mentés

A karakterek csak abban a böngészőben léteznek, ahol létrehoztad őket. Másik eszközre az **Exportálás / betöltés** panel JSON-fájljával vihetők át; érdemes időnként biztonsági mentést készíteni.

## Licenc és forrás

This product includes materials from the Daggerheart System Reference Document 1.0, © Critical Role, LLC. under the terms of the Darrington Press Community Gaming (DPCGL) License. More information can be found at https://www.daggerheart.com. There are no previous modifications by others.

Az SRD strukturált adatai a [seansbox/daggerheart-srd](https://github.com/seansbox/daggerheart-srd) repóból származnak. A magyar szövegek saját, nem hivatalos fordítások. Nem hivatalos rajongói eszköz; nem áll kapcsolatban a Critical Role-lal vagy a Darrington Press-szel. Nyilvános közzététel előtt olvasd el a DPCGL feltételeit: https://www.darringtonpress.com/license
