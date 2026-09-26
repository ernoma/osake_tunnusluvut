# Osakkeen tunnusluvut – selkokielellä

Selainpohjainen opas osakesijoittamisen tunnuslukuihin aloittelijalle. Suunnitelma on tiedostossa [TOTEUTUSSUUNNITELMA.md](TOTEUTUSSUUNNITELMA.md).

## Kehitys

Vaatii Node.js 20:n tai uudemman.

```bash
npm install
npm run dev
```

| Komento               | Tarkoitus                                         |
| --------------------- | ------------------------------------------------- |
| `npm run dev`         | Kehityspalvelin osoitteessa http://localhost:5173 |
| `npm test`            | Testit kertaalleen                                |
| `npm run test:watch`  | Testit jatkuvasti muutosten mukaan                |
| `npm run lint`        | ESLint                                            |
| `npm run format`      | Prettier-muotoilu                                 |
| `npm run typecheck`   | TypeScript-tarkistus                              |
| `npm run check-links` | Lisälukemista-linkkien tarkistus (verkkoyhteys)   |
| `npm run build`       | Tuotantoversio kansioon `dist/`                   |

## Kansiorakenne

```
public/              # favicon ja robots.txt
scripts/
└── check-links.mjs  # lisälukemista-linkkien tarkistus
src/
├── components/   # React-komponentit: kortti ja sen osat, ruudukko, johdanto, haku ja suodatin
├── data/         # tunnusluvut, kategoriat, sanasto, linkkien sivustot ja johdannon lukujärjestys
├── hooks/        # selitysikkunat, korttiin siirtyminen, haku ja suodatus, URL-tila, teema, selaimeen muistetut valinnat
├── styles/       # värit, välit ja teemat sekä niiden kontrastitesti
└── test/         # testien alustus
```

## Saavutettavuus

`npm test` tarkistaa saavutettavuuden kahdella tavalla:

- `src/components/a11y.test.tsx` ajaa axe-tarkistuksen koko sovellukselle eri tiloissa.
- `src/styles/contrast.test.ts` laskee WCAG AA -kontrastit `tokens.css`:n väreistä molemmissa teemoissa. Uusi teksti–tausta-pari lisätään sen listaan.

Lighthouse ajetaan käsin tuotantoversiota vasten. Tavoite on saavutettavuus ≥ 95. Chromen sijaan käy Edge (`CHROME_PATH`).

```bash
npm run build && npx vite preview --port 4173
```

```bash
npx lighthouse http://localhost:4173/ --only-categories=accessibility --view
```

## Näin lisäät uuden tunnusluvun

Tunnusluku on yksi olio tiedostossa `src/data/metrics.ts`. Koodia ei tarvitse muuttaa: kortti, sisällysluettelon rivi, haku, sanastolinkit ja "Katso rinnalla" -merkinnät syntyvät datasta. Testit (`npm test`) kertovat suomeksi, jos jokin kenttä puuttuu, on liian pitkä tai viittaa johonkin, jota ei ole.

Sisällön periaatteet ovat [toteutussuunnitelman](TOTEUTUSSUUNNITELMA.md) kohdassa 2, ja olemassa olevat tunnusluvut ovat mallina kohdassa 6.

### 1. Kopioi mallitietue

Lisää tietue `metrics.ts`:ään saman kategorian muiden lukujen joukkoon siihen kohtaan, jossa haluat kortin näkyvän. Kategorian sisällä perustason kortit näytetään ensin ja muuten tiedoston järjestyksessä. Sisällysluettelo järjestetään aakkosjärjestykseen automaattisesti.

```ts
{
  id: "uusi-luku",                 // pieniä kirjaimia, numeroita ja väliviivoja. Näkyy osoitteessa (#uusi-luku)
  name: "Uusi luku",               // kortin otsikko
  abbreviation: "UL",              // valinnainen lyhenne
  abbreviationExpanded: "Uusi Luku = uusi luku", // valinnainen, lyhenteen selitys
  aliases: ["toinen nimi", "english name"], // hakua varten: synonyymit, englanninkieliset nimet
  category: "arvostus",            // koko | kannattavuus | osakekohtaiset | osinko | velka | arvostus
  level: "syventava",              // perus | syventava
  question: "Arkikielinen kysymys, johon luku vastaa?", // enintään 90 merkkiä, päättyy ?-merkkiin
  summary: "Selkokielinen selitys, jossa vaikea sana on merkitty: [[oma pääoma]].", // enintään 160
  analogy: "Arkinen vertaus, esimerkiksi asunnosta tai kioskista.", // enintään 220
  formula: {
    words: "Osakkeen hinta ÷ jokin muu",   // kaava sanoin
    symbols: "Kurssi ÷ X",                 // valinnainen, näkyy Lisää-osiossa
    note: "Valinnainen huomautus kaavasta.", // valinnainen, enintään 220
  },
  example: "Laskuesimerkki tasaluvuilla: 20 € ÷ 2 € = 10.", // enintään 160
  unit: "x",                       // € | % | x | €/osake
  direction: "lower",              // higher | lower | range | neutral
  directionLabel: "Pienempi = yleensä halvempi", // enintään 40
  rules: [                         // 1–3 tulkintasääntöä, kukin enintään 120
    "Vertaa saman alan yhtiöihin.",
  ],
  commonMistake: "”Matala luku = hyvä ostos.” Miksi se ei pidä paikkaansa.", // enintään 140
  factors: ["Tulkintaan vaikuttava seikka (Lisää-osio)."], // kukin enintään 220, lista voi olla tyhjä
  pitfalls: ["Muu sudenkuoppa (Lisää-osio)."],             // kukin enintään 220, lista voi olla tyhjä
  ranges: [                        // valinnainen nyrkkisääntöasteikko, välit nousevassa järjestyksessä
    { label: "Alle 10", max: 10, meaning: "Mitä väli tarkoittaa.", tone: "good" }, // good | neutral | warning
    { label: "10–20", min: 10, max: 20, meaning: "Mitä väli tarkoittaa.", tone: "neutral" },
    { label: "Yli 20", min: 20, meaning: "Mitä väli tarkoittaa.", tone: "warning" },
  ],                               // min kuuluu väliin, max ei. Prosentit prosentteina (12,3), eurot euroina
  rangesNote: "Nyrkkisääntö. Vaihtelee toimialoittain.", // valinnainen
  companions: [                    // vähintään yksi, perustelu enintään 120
    { id: "pe", reason: "Miksi tämä luku kannattaa katsoa rinnalla." },
  ],
  links: [                         // 0–3 lisälukemista-linkkiä, suomenkieliset ensin
    {
      title: "Mitä sivulta löytyy, ei pelkkä sivuston nimi", // enintään 70
      url: "https://fi.wikipedia.org/wiki/...",
      sourceId: "wikipedia-fi",    // sivusto tiedostosta sources.ts
      language: "fi",              // fi | en
      kind: "selitys",             // selitys | esimerkki | laskuri | video
      checkedAt: "2026-09-26",     // päivä, jona luit sivun sisällön
    },
  ],
},
```

Merkkirajat koskevat näkyvää tekstiä: `[[oma pääoma|omasta pääomasta]]` lasketaan sanan "omasta pääomasta" mittaisena. Rajat ovat tiedostossa `src/data/schema.ts` (`LIMITS`).

### 2. Kytke tunnusluku muuhun sisältöön

| Tee näin                                                                                                                                                                                                                                                                 | Missä                           |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------- |
| Lisää rinnakkaisviittaus myös toiseen suuntaan, jos yhteys toimii molempiin suuntiin (esim. P/FCF → P/E ja P/E → P/FCF).                                                                                                                                                 | Toisen tunnusluvun `companions` |
| Merkitse vaikeat sanat muodossa `[[termi]]` tai taivutettuna `[[termi\|taivutettu muoto]]`. Jos termiä ei ole, lisää se sanastoon: `{ id, term, forms, definition }`, selitys enintään kaksi lausetta.                                                                   | `src/data/glossary.ts`          |
| Tunnusluvun nimi, lyhenne ja id toimivat automaattisesti termeinä, joten `[[UL]]` avaa uuden kortin selityksen. Jos sanastossa on jo samanniminen termi, poista se, koska samalla nimellä ei voi olla kahta kohdetta. Päivitä samalla tekstit, jotka viittasivat siihen. | `src/data/glossary.ts`          |
| Jos jokin kortti mainitsee uuden luvun pelkkänä tekstinä, muuta maininta viittaukseksi `[[Uusi luku]]`.                                                                                                                                                                  | `src/data/metrics.ts`           |
| Jos luku oli "tulossa"-listalla, poista se sieltä. Viittaukset siihen aktivoituvat itsestään.                                                                                                                                                                            | `src/data/planned.ts`           |
| Jos alias oli ennestään toisella kortilla ja kuuluu nyt uudelle, siirrä se.                                                                                                                                                                                              | Molempien korttien `aliases`    |
| Jos luvulla on lyhenne, joka ei näy nimessä (esim. nimi "Vapaa kassavirta", lyhenne "FCF"), sisällysluetteloon tulee lyhenteelle oma rivi. Lisää lyhenne sisällysluettelon testin listaan.                                                                               | `src/data/toc.test.ts`          |
| Jos linkki osoittaa uudelle sivustolle, lisää sivusto: `{ id, name, domain, type }`, jossa `type` on `neutraali` tai `kaupallinen`.                                                                                                                                      | `src/data/sources.ts`           |

**Välien rajat.** Jokaisella `ranges`-rivillä on numeeriset rajat, joiden avulla Tutki osaketta -sivu näyttää, mihin väliin yhtiön luku osuu. Vain ensimmäiseltä riviltä saa puuttua `min` ja vain viimeiseltä `max`. Välien väliin saa jäädä aukkoja (esim. 10–15 % ja Yli 20 %). "Negatiivinen" on `{ max: 0 }`, ja sen jälkeinen "Alle 5 %" on `{ min: 0, max: 5 }`. Yhden luvun väli, kuten "0 %", on `{ min: 0, max: 0 }`. Testi tarkistaa, että rajat vastaavat otsikkoa.

**Laskenta.** Jos luvun voi laskea muista luvuista, lisää kaava tiedostoon `src/data/formulas.ts` ja kaavan lähtöluvut, jotka eivät ole tunnuslukuja (esim. kurssi tai oma pääoma), tiedostoon `src/data/inputs.ts`. Lisää kaavalle testiesimerkki tiedostoon `src/data/formulas.test.ts`. Testi tarkistaa, että kaava tuottaa kortin esimerkin tuloksen. Kertoimen nimittäjä merkitään `positive`-listaan, jotta esimerkiksi tappiolliselle yhtiölle ei lasketa P/E:tä.

Tunnuslukujen määrää ei tarvitse päivittää sovellukseen, koska sisällysluettelo laskee sen itse. Toteutussuunnitelmassa määrä mainitaan kohdissa 1, 5.1b ja 6.

### 3. Valitse lisälukemista-linkit

Valintaperiaatteet ovat toteutussuunnitelman kohdassa 6.7. Lyhyesti:

- Neutraalit lähteet ensin (Pörssisäätiö, Wikipedia, Investopedia). Kaupallisilta sivustoilta vain opetussivuja.
- Vähintään yksi suomenkielinen linkki, jos sellainen löytyy.
- Aloittelijan tasoinen, vapaasti luettava sivu ilman maksumuuria.
- Lue sivu ennen lisäämistä. Sen pitää olla ristiriidaton kortin kanssa. Kirjaa lukupäivä kenttään `checkedAt`.

### 4. Aja tarkistukset

```bash
npm test
```

```bash
npm run check-links
```

`npm test` jakaa löydökset kahteen ryhmään:

- **Virheet** kaatavat testit, ja ne pitää korjata. Esimerkkejä:

| Viesti                                                          | Korjaus                                                                     |
| --------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `näkyvä teksti saa olla enintään N merkkiä`                     | Lyhennä tekstiä. Siirrä tarvittaessa osa `factors`- tai `pitfalls`-listaan. |
| `uusi-luku → xyz: tuntematon rinnakkaistunnusluku`              | Korjaa `companions`-id tai lisää luku `planned.ts`:ään "tulossa"-tilaan.    |
| `termi "…" viittaa sekä kohteeseen sanasto:… että tunnusluku:…` | Poista päällekkäinen sanastotermi tai muuta muotoa.                         |
| `tuntematon sivusto "…" (lisää se sources.ts:ään)`              | Lisää sivusto tiedostoon `sources.ts`.                                      |
| `osoite … ei ole sivuston … osoite`                             | Linkin osoite ja `sourceId` eivät vastaa toisiaan.                          |
| `suomenkieliset linkit kuuluvat listassa ensin`                 | Järjestä `links` uudelleen.                                                 |
| `"…": alkaa ennen kuin edellinen väli "…" päättyy`              | Korjaa `ranges`-rivien `min`/`max` tai järjestys.                           |
| `nimi "…" kuuluu sekä luvulle … että …`                         | Sama alias kahdella luvulla. Jätä se vain sille, jota se tarkoittaa.        |

- **Varoitukset** tulostuvat testin tulosteeseen, mutta ne eivät kaada testejä. Esimerkiksi "ei yhtään suomenkielistä lisälukemista-linkkiä" on hyväksyttävä, jos suomenkielistä lähdettä ei löytynyt.

Katso lopuksi kortti selaimessa (`npm run dev`). Löytyykö se haulla nimellä, lyhenteellä ja aliaksilla, näkyykö se sisällysluettelossa, ja toimivatko sanastotermit ja "Katso rinnalla" -merkinnät?

### 5. Tarkista sisältö aloittelijan silmin

- [ ] Kysymys on arkikielinen ja ymmärrettävä ilman taustatietoja.
- [ ] Lyhenne on avattu.
- [ ] Jokainen ammattisana on joko selitetty sanastossa tai korvattu arkisanalla.
- [ ] Esimerkissä on tasalukuja, ja se tuottaa oikean tuloksen.
- [ ] Vertaus on arkinen ja suomalaiselle tuttu.
- [ ] Suuntamerkinnässä on sana "yleensä", jos suunta ei päde aina.
- [ ] Viitearvot on merkitty nyrkkisäännöiksi.
- [ ] Yleinen virhe on muotoiltu niin, että aloittelija tunnistaa itsensä.
- [ ] Mikään teksti ei kehota ostamaan tai myymään.
- [ ] Linkit on luettu, ne ovat aloittelijan tasoisia, eivätkä ne ole ristiriidassa oppaan kanssa.
- [ ] Linkkiteksti kertoo, mitä sivulta löytyy, ja mukana on suomenkielinen linkki, jos sellainen on saatavilla.

Kirjaa lisäys lopuksi toteutussuunnitelman kohtaan 6 (taulukkorivi ja "Lisäyksen vaatimat muut muutokset") samaan tapaan kuin vaiheissa 8d–8g.
