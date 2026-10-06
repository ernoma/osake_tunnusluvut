# Osakkeen tunnusluvut – selkokielellä

Selainpohjainen opas osakesijoittamisen tunnuslukuihin aloittelijalle: **https://ernoma.github.io/osake_tunnusluvut/**. Suunnitelma on tiedostossa [TOTEUTUSSUUNNITELMA.md](TOTEUTUSSUUNNITELMA.md).

Sovelluksessa on kaksi sivua:

- **Tunnusluvut** selittää tunnusluvut ja niiden tulkinnan.
- **Tutki osaketta** (`?sivu=tutki`) näyttää yhden osakkeen luvut samojen tunnuslukujen avulla: mihin nyrkkisääntöväliin kukin osuu, mitkä luvut voi laskea muista ja mitä puuttuu.

> **Ei sijoitusneuvontaa.** Sovellus on harrastusprojekti ja opas tunnuslukujen ymmärtämiseen. Sen tiedoissa, laskelmissa ja tekoälyn poimimissa luvuissa voi olla virheitä. Sovellus tarjotaan sellaisenaan ilman takuita, ja sitä käytetään omalla vastuulla: tekijä ei vastaa vahingoista tai menetyksistä, jotka aiheutuvat sovelluksen tai sen tietojen käytöstä.

## Tutki osaketta: luvut tekoälyllä tai käsin

Luvut saa sivulle kahdella tavalla:

1. **Käsin, ilman API-avainta.** Valitse "Syötä luvut itse" ja lisää luvut "Lisää luku" -haulla, esimerkiksi pankin sovelluksesta tai tilinpäätöksestä. Kenttä hyväksyy muodot "1 234,5", "1,2 mrd" ja "12 %". Sovellus laskee puuttuvat tunnusluvut, jos lähtötiedot riittävät.
2. **Tekoälyllä.** Kopioi pörssisivulta tai tilinpäätöksestä tunnuslukuosio, liitä se tekstikenttään ja valitse "Anna tekoälyn poimia luvut". Claude poimii luvut, ja tarkistat ne lainauksia vasten ennen kuin ne siirtyvät analyysiin. Luku, jonka lainaus ei vastaa arvoa, on merkitty ⚠-merkillä eikä ole valittuna.

Analyysin luvut tallentuvat osoitteeseen, joten analyysin voi avata uudelleen linkistä. Selain muistaa lisäksi viisi viimeisintä analyysiä. Liitettyä tekstiä ei tallenneta.

### API-avain

Tekoälyhaku käyttää Clauden rajapintaa suoraan selaimesta **käyttäjän omalla API-avaimella**. Sovelluksella ei ole palvelinta, joten avain ja teksti eivät kulje minkään muun kuin Anthropicin rajapinnan (`api.anthropic.com`) kautta.

1. Kirjaudu [Anthropic Consoleen](https://console.anthropic.com/) ja lisää tilille maksutapa tai saldoa. Rajapinnan käyttö maksaa, ja hinta riippuu tekstin pituudesta ja mallista.
2. Luo avain kohdassa **Settings → API keys** ([suora linkki](https://console.anthropic.com/settings/keys)). Tee tätä sovellusta varten oma avain, jotta voit poistaa sen vaikuttamatta muuhun käyttöön.
3. Aseta Consolessa kuukausittainen kulukatto (**Settings → Limits**), jotta kulut eivät voi yllättää.
4. Liitä avain Tutki osaketta -sivun kenttään "Claude API -avain". Avain tallentuu selaimeen ensimmäisellä haulla.

Hyvä tietää:

- **Avain on vain tässä selaimessa** (`localStorage`, avain `tunnusluvut.api-avain`). Kuka tahansa samalla koneella ja selainprofiililla voi käyttää sitä, joten älä tallenna avainta yhteiskäyttöiselle koneelle. Painike "Poista avain tältä laitteelta" poistaa sen. Jos avain on vuotanut, poista se myös Consolesta.
- **Avain ei päädy** osoitteeseen, jakolinkkiin, viimeisimpien listaan eikä virheilmoituksiin.
- **Liitetty teksti lähetetään Anthropicille** käsiteltäväksi. Älä liitä tekstiä, jota et halua lähettää.
- **Malli:** oletus on Claude Opus 5.5, joka poimi testiaineistosta kaikki luvut oikein. Halvemmat Sonnet 5 ja Haiku 4.5 ovat valittavissa, mutta Haiku sekoitti testeissä monisarakkeisen taulukon vuodet (ks. [eval-tulokset](docs/eval-extract-tulokset.md)). Tarkista luvut aina itse.
- **Virheet:** "API-avain ei kelpaa" tarkoittaa väärää tai poistettua avainta. "Pyyntö hylättiin" johtuu usein loppuneesta saldosta, jonka näet Consolesta.

## Kehitys

Vaatii Node.js 20:n tai uudemman.

```bash
npm install
npm run dev
```

| Komento                | Tarkoitus                                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`          | Kehityspalvelin osoitteessa http://localhost:5173                                                                   |
| `npm test`             | Testit kertaalleen                                                                                                  |
| `npm run test:watch`   | Testit jatkuvasti muutosten mukaan                                                                                  |
| `npm run lint`         | ESLint                                                                                                              |
| `npm run format`       | Prettier-muotoilu                                                                                                   |
| `npm run typecheck`    | TypeScript-tarkistus                                                                                                |
| `npm run check-links`  | Lisälukemista-linkkien tarkistus (verkkoyhteys)                                                                     |
| `npm run build`        | Tuotantoversio kansioon `dist/`                                                                                     |
| `npm run eval-extract` | Tekoälyhaun laatu oikeaa mallia vasten (`ANTHROPIC_API_KEY`, maksullinen), tulokset `docs/eval-extract-tulokset.md` |
| `npm run eval-real`    | Tekoälyhaku oikeilta sivuilta kopioiduille teksteille kansiossa `oikeat_sivut/` (ei repossa), tarkistus käsin       |

## Kansiorakenne

```
docs/                # tekoälyhaun eval-tulokset ja käsin testauksen kirjaus
public/              # favicon ja robots.txt
scripts/
└── check-links.mjs  # lisälukemista-linkkien tarkistus
src/
├── ai/           # tekoälyhaku: kehote, skeema, lainaustarkistus, API-avain ja testiaineisto
├── components/   # React-komponentit: molemmat sivut, kortti ja sen osat, analyysi ja lukutaulukko
├── data/         # tunnusluvut, kategoriat, sanasto, linkkien sivustot, lähtötiedot, kaavat ja lukujen muotoilu
├── hooks/        # selitysikkunat, korttiin siirtyminen, haku ja suodatus, URL-tila, teema, selaimeen muistetut valinnat
├── styles/       # värit, välit ja teemat sekä niiden kontrastitesti
└── test/         # testien alustus ja yhteinen axe-tarkistus
```

## Saavutettavuus

`npm test` tarkistaa saavutettavuuden kahdella tavalla:

- axe-tarkistus (`src/test/axe.ts`) ajetaan koko dokumentille eri tiloissa: päänäkymä `a11y.test.tsx`:ssä ja Tutki osaketta -sivun jokainen vaihe (liittäminen, haku käynnissä, virheet, tarkistus ja analyysi) `PasteStep.test.tsx`:ssä ja `StockPage.test.tsx`:ssä. Koska tarkistus kattaa koko dokumentin, myös maamerkkien ulkopuolelle jäävä sisältö löytyy.
- `src/styles/contrast.test.ts` laskee WCAG AA -kontrastit `tokens.css`:n väreistä molemmissa teemoissa. Uusi teksti–tausta-pari lisätään sen listaan.

Lighthouse ajetaan käsin tuotantoversiota vasten molemmille sivuille (`/` ja `/?sivu=tutki`, lisäksi analyysi luvuilla). Tavoite on saavutettavuus ≥ 95. Chromen sijaan käy Edge (`CHROME_PATH`). Jos osoitteessa on `&`-merkkejä, Windowsin `npx` katkaisee sen, joten osoite kannattaa lainata tai ajaa Lighthouse `node`lla.

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

**Yhdistelmähuomiot.** Jos uusi luku kertoo yhdessä toisen luvun kanssa jotain, mitä kumpikaan ei kerro yksin, lisää sääntö tiedostoon `src/data/insights.ts` ja sille esimerkki, jossa se laukeaa, ja esimerkki, jossa se ei laukea, tiedostoon `src/data/insights.test.ts`. Ota sääntöjen rajat korttien nyrkkisäännöistä. Teksti sanoo "yleensä" eikä kehota ostamaan tai myymään.

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

## Julkaisu

`.github/workflows/pages.yml` ajaa tarkistukset (lint, muotoilu, testit, build) jokaiselle pushille ja pull requestille ja julkaisee `main`-haaran GitHub Pagesiin. Ota julkaisu käyttöön repositorion asetuksista: **Settings → Pages → Source: GitHub Actions**. Build käyttää suhteellisia polkuja, joten sivu toimii myös alihakemistossa (`https://<käyttäjä>.github.io/<repo>/`).

`.github/workflows/linkit.yml` ajaa `npm run check-links` maanantaisin ja tarvittaessa käsin (**Actions → Linkkitarkistus → Run workflow**). Jos jokin linkki on rikki, se avaa issuen "Rikkinäisiä lisälukemista-linkkejä" tai kommentoi jo avoinna olevaa.

## Lisenssi

[EUPL 1.2](LICENSE) (European Union Public Licence). Lisenssi on saatavilla kaikilla EU:n virallisilla kielillä, myös [suomeksi](https://eur-lex.europa.eu/legal-content/FI/TXT/?uri=CELEX:32017D0863).
