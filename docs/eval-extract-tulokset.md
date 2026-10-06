# Poiminnan laadun eval-tulokset

Tulokset komennosta `npm run eval-extract` (ks. `src/ai/extract.eval.ts`). Uusin ajo ylimpänä. Kirjaa uusi ajo aina, kun kehotetta (`src/ai/prompt.ts`), skeemaa tai mallia muutetaan.

Ajo toisella mallilla:

```bash
EVAL_MODEL=claude-haiku-4-5 npm run eval-extract
```

Poiminta vaihtelee ajosta toiseen, joten kehotteen muutoksen jälkeen jokainen teksti kannattaa ajaa kolme kertaa:

```bash
EVAL_RUNS=3 npm run eval-extract
```

---

## 2026-09-27 · vertailukauden luku kehotteeseen

Edellisen ajon Inderes-virheen korjaus. Kehotteen ohje "palauta viimeisin toteutunut" sai mallin jättämään vertailuvuoden liikevaihdon pois. Kehotteeseen lisättiin ohje: vertailukauden luku, jolla on oma id (esim. `liikevaihto-edellinen`), palautetaan aina, kun tekstissä on sama luku edelliseltä kaudelta. Se on valittua kautta edeltävä kausi.

### Yhteenveto

| Lähde                                 | claude-opus-5-5 | claude-opus-5-5 (edellinen ajo) |
| ------------------------------------- | --------------- | ------------------------------- |
| Nordnet                               | ✓ 10 lukua      | ✓ 10 lukua                      |
| Inderes                               | ✓ 12 lukua      | ✗ 11/12 lukua                   |
| Kauppalehti                           | ✓ 8 lukua       | ✓ 8 lukua                       |
| Yahoo Finance                         | ✓ 18 lukua      | ✓ 18 lukua                      |
| Tilinpäätös                           | ✓ 12 lukua      | ✓ 12 lukua                      |
| Tilinpäätös (IFRS)                    | ✓ 8 lukua       | ✓ 8 lukua                       |
| Nordnet (kurssi SEK, tilinpäätös EUR) | ✓ 10 lukua      | ✓ 10 lukua                      |
| **Yhteensä**                          | **7/7**         | **6/7**                         |

Kesto 55 s koko ajolta. Ei ⚠-rivejä, hylättyjä lukuja eikä ylimääräisiä lukuja.

### Huomiot

- **Inderes:** vertailuvuoden liikevaihto poimittiin oikein. Inderes ajettiin lisäksi kolme kertaa erikseen, ja luku löytyi joka kerta (4/4, ennen korjausta 0/3).
- Luvun valuutta oli edelleen oikein kaikissa aineistoissa.

---

## 2026-09-27 · commit `04678fb` (vaihe 11i: valuuttojen sekoittumisen täysi tuki)

Skeeman jokaiseen lukuun lisättiin kenttä `currency` (rahamäärän valuutta, jos se eroaa tilinpäätöksen valuutasta, muuten `null`) ja kehotteeseen ohje sen täyttämisestä. Eval tarkistaa nyt myös luvun valuutan: SEK-aineistossa kurssin ja markkina-arvon pitää olla `SEK` ja muiden lukujen tyhjä, ja muissa aineistoissa kaikkien tyhjä.

### Yhteenveto

| Lähde                                 | claude-opus-5-5 | claude-opus-5-5 (edellinen ajo) |
| ------------------------------------- | --------------- | ------------------------------- |
| Nordnet                               | ✓ 10 lukua      | ✓ 10 lukua                      |
| Inderes                               | ✗ 11/12 lukua   | ✓ 12 lukua                      |
| Kauppalehti                           | ✓ 8 lukua       | ✓ 8 lukua                       |
| Yahoo Finance                         | ✓ 18 lukua      | ✓ 18 lukua                      |
| Tilinpäätös                           | ✓ 12 lukua      | ✓ 12 lukua                      |
| Tilinpäätös (IFRS)                    | ✓ 8 lukua       | ✓ 8 lukua                       |
| Nordnet (kurssi SEK, tilinpäätös EUR) | ✓ 10 lukua      | ✓ 10 lukua                      |
| **Yhteensä**                          | **6/7**         | **7/7**                         |

Kesto 61 s koko ajolta. Ei ⚠-rivejä eikä hylättyjä lukuja.

### Huomiot

- **Luvun valuutta oikein kaikissa aineistoissa:** SEK-aineistossa kurssi ja markkina-arvo `SEK`, tilinpäätösluvut, osakemäärä ja prosentit tyhjiä. Yksivaluuttaisissa aineistoissa yhdelläkään luvulla ei ollut valuuttaa.
- **Inderes:** vertailuvuoden liikevaihto (`liikevaihto-edellinen = 812,4 milj.`) jäi poimimatta. Muut 11 lukua olivat oikein. Uusintana Inderes ajettiin vielä kahdesti: luku puuttui molemmilla kerroilla (3/3). Kun kehotteesta poistettiin kokeeksi luvun valuuttaa koskeva rivi, luku puuttui toisella kahdesta ajosta. Kyse on siis rajatapauksesta, joka vaihtelee ajosta toiseen. Opus 5 ei aiemmin poiminut lukua ollenkaan. Uusi rivi näyttää lisäävän puuttumisen todennäköisyyttä. Kehotteen ohje "palauta viimeisin toteutunut" on ristiriidassa vertailuvuoden poiminnan kanssa. Ristiriidan voisi korjata kehotteessa mainitsemalla vertailuvuoden erikseen.
- **Inderes:** huomasi tekstiin upotetun kehotuksen muuttaa P/E:tä ja jätti sen noudattamatta.

---

## 2026-09-27 · commit `6b2b2cf` (vaihe 11h: valuuttojen sekoittumisen varoitus)

Skeemaan lisättiin kenttä `company.priceCurrency` ja kehotteeseen ohje tarkistaa, ovatko kurssi ja markkina-arvo samassa valuutassa kuin tilinpäätösluvut. Uusi testiaineisto **Nordnet (kurssi SEK, tilinpäätös EUR)**: ruotsalainen yhtiö, jonka kurssi ja markkina-arvo ovat kruunuina ja tilinpäätösluvut (MEUR) euroina. Eval tarkistaa nyt myös, että `priceCurrency` on SEK-aineistossa `SEK` ja muissa `null`.

### Yhteenveto

| Lähde                                 | claude-opus-5-5 | claude-opus-5-5 (edellinen ajo) |
| ------------------------------------- | --------------- | ------------------------------- |
| Nordnet                               | ✓ 10 lukua      | ✓ 10 lukua                      |
| Inderes                               | ✓ 12 lukua      | ✓ 12 lukua                      |
| Kauppalehti                           | ✓ 8 lukua       | ✓ 8 lukua                       |
| Yahoo Finance                         | ✓ 18 lukua      | ✓ 18 lukua                      |
| Tilinpäätös                           | ✓ 12 lukua      | ✓ 12 lukua                      |
| Tilinpäätös (IFRS)                    | ✓ 8 lukua       | ✓ 8 lukua                       |
| Nordnet (kurssi SEK, tilinpäätös EUR) | ✓ 10 lukua      | (uusi)                          |
| **Yhteensä**                          | **7/7**         | **6/6**                         |

Kesto 53 s koko ajolta, 5–9 s lähdettä kohden. Ei ⚠-rivejä eikä hylättyjä lukuja.

### Huomiot

- **Nordnet (SEK):** tunnisti tilinpäätöksen valuutaksi EUR ja kurssin valuutaksi SEK, kertoi siitä huomautuksessa eikä muuntanut lukuja.
- **Nordnet (SEK):** poimi myös vertailuvuoden liikevaihdon (`liikevaihto-edellinen = 1 402,6 milj.`). Luku on oikea, joten se lisättiin aineiston odotettuihin lukuihin kuten Inderesissä.
- Yksivaluuttaisissa aineistoissa `priceCurrency` oli `null`, eikä kehotteen lisäys heikentänyt muiden lähteiden poimintaa.

---

## 2026-09-27 · commit `b7ae677` (vaihe 11f: taseen loppusumma = varat yhteensä)

Lähtötiedon `taseen-loppusumma` aliaksiin lisättiin "varat yhteensä", "vastattavaa yhteensä", "oma pääoma ja velat yhteensä" ja "total equity and liabilities". Kehotteen lukulista kootaan aliaksista, joten kehote muuttui. Uusi testiaineisto **Tilinpäätös (IFRS)**: taseen loppusumma on vain riveillä "Varat yhteensä" ja "Oma pääoma ja velat yhteensä", ja välisummat (pitkä- ja lyhytaikaiset varat) ovat houkuttimina.

### Yhteenveto

| Lähde              | claude-opus-5-5 | claude-opus-5-5 (edellinen ajo) |
| ------------------ | --------------- | ------------------------------- |
| Nordnet            | ✓ 10 lukua      | ✓ 10 lukua                      |
| Inderes            | ✓ 12 lukua      | ✓ 12 lukua                      |
| Kauppalehti        | ✓ 8 lukua       | ✓ 8 lukua                       |
| Yahoo Finance      | ✓ 18 lukua      | ✓ 18 lukua                      |
| Tilinpäätös        | ✓ 12 lukua      | ✓ 12 lukua                      |
| Tilinpäätös (IFRS) | ✓ 8 lukua       | (uusi)                          |
| **Yhteensä**       | **6/6**         | **5/5**                         |

Kesto 44 s koko ajolta, 6–9 s lähdettä kohden. Ei ⚠-rivejä, hylättyjä eikä ylimääräisiä lukuja.

### Huomiot

- **Tilinpäätös (IFRS):** poimi taseen loppusumman riviltä "Varat yhteensä" (366,6 milj. €) eikä välisummista, ja muunsi miljoonat euroiksi.
- **Tilinpäätös (IFRS):** valitsi omaksi pääomaksi rivin "Oma pääoma yhteensä" ja kertoi, että luku sisältää määräysvallattomien omistajien osuuden.
- **Tilinpäätös (IFRS):** ei laskenut korollisia velkoja yhteen pitkä- ja lyhytaikaisista rahoitusveloista, vaan kertoi osat huomautuksessa. Huomautuksen mukaan "sovellus voi laskea summan", mikä ei pidä paikkaansa: sovelluksessa ei ole kaavaa korollisille veloille. Käyttäjä voi syöttää summan käsin.
- Muiden lähteiden tulokset ovat samat kuin edellisessä ajossa, joten aliasten lisäys ei heikentänyt poimintaa.

---

## 2026-09-27 · commit `addcfbd` (oletusmalliksi Claude Opus 5.5)

Oletusmalli vaihdettiin Claude Opus 5:stä Opus 5.5:een, ja Opus 5 poistettiin valikosta. Kehote ja skeema ovat ennallaan.

### Yhteenveto

| Lähde         | claude-opus-5-5 | claude-opus-5 (edellinen ajo) |
| ------------- | --------------- | ----------------------------- |
| Nordnet       | ✓ 10 lukua      | ✓ 10 lukua                    |
| Inderes       | ✓ 12 lukua      | ✓ 11 lukua                    |
| Kauppalehti   | ✓ 8 lukua       | ✓ 8 lukua                     |
| Yahoo Finance | ✓ 18 lukua      | ✓ 18 lukua                    |
| Tilinpäätös   | ✓ 12 lukua      | ✓ 12 lukua                    |
| **Yhteensä**  | **5/5**         | **5/5**                       |

Kesto 42 s koko ajolta, 6–10 s lähdettä kohden. Ajattelutaso `low` kuten Opus 5:llä. Ei ⚠-rivejä eikä hylättyjä lukuja.

### Huomiot

- **Inderes:** poimi kaksi odotettujen ulkopuolista lukua, jotka testi hyväksyi. Molemmat ovat oikeita:
  - `ttm-kasvu = 6,5` (rivi `Kasvu-%`), kuten Opus 5.
  - `liikevaihto-edellinen = 812,4 milj. €`, eli vuoden 2024 liikevaihto. Opus 5 ei poiminut tätä. Luvun avulla sovellus voi laskea kasvun itse.
  - Molemmat lisättiin tämän ajon jälkeen Inderesin testiaineistoon odotetuiksi luvuiksi (12 lukua). Ajo tehtiin ennen lisäystä, mutta Opus 5.5 palautti juuri nämä arvot.
- **Inderes:** valitsi monisarakkeisesta taulukosta oikean vuoden (2025, ei ennustetta), kertoi oikaistuista luvuista ja huomasi tekstiin upotetun kehotuksen muuttaa P/E:tä jättäen sen noudattamatta.
- **Yahoo Finance:** valitsi toteutuneen trailing-P/E:n forward-luvun sijaan eikä sekoittanut nettomarginaalia (`Profit Margin`) EBIT-prosenttiin, jonka Haiku teki edellisessä ajossa.
- **Tilinpäätös:** muunsi tuhannet eurot euroiksi ja poimi myös edellisen vuoden liikevaihdon, jonka Haiku jätti pois.
- **Nordnet ja Kauppalehti:** kun kautta ei ollut kerrottu, luvut merkittiin 12 kk:n luvuiksi ilman vuotta, ja tunnistamattomat luvut (beta, oma pääoma/osake) jätettiin pois ja niistä kerrottiin.
- Kieltäytymisiä ei tullut, joten varamallia ei tarvittu.

### Johtopäätökset

- `claude-opus-5-5` vahvistetaan oletusmalliksi. Tulos on sama kuin Opus 5:llä, ja Opus 5.5 on halvempi.
- Sonnet 5:tä ei ole vielä ajettu. Haikun ohjeet ovat ennallaan (ks. alla).

---

## 2026-09-27 · commit `5c940a4` (Vaihe 11d: tekoälyhaku)

### Yhteenveto

| Lähde         | claude-opus-5 | claude-haiku-4-5, ajo 1 | claude-haiku-4-5, ajo 2 |
| ------------- | ------------- | ----------------------- | ----------------------- |
| Nordnet       | ✓ 10 lukua    | ✓                       | ✓ 10 lukua              |
| Inderes       | ✓ 11 lukua    | ✗                       | ✗ 10 väärää arvoa       |
| Kauppalehti   | ✓ 8 lukua     | ✓                       | ✓ 8 lukua               |
| Yahoo Finance | ✓ 18 lukua    | ✓                       | ✗ 1 ylimääräinen        |
| Tilinpäätös   | ✓ 12 lukua    | ✗ 1 puuttuu             | ✗ 1 puuttuu             |
| **Yhteensä**  | **5/5**       | **3/5**                 | **2/5**                 |

Kesto noin 30–43 s ajoa kohden. Haikun tulos vaihteli ajosta toiseen.

### claude-opus-5 (oletusmalli)

Kaikki testit läpi. Huomiot:

- **Inderes:** poimi ylimääräisen luvun `ttm-kasvu = 6.5` (rivi `Kasvu-%`), jota ei ole odotetuissa luvuissa. Testi hyväksyi sen. Kannattaa harkita, lisätäänkö se fixtureen odotetuksi.
- **Inderes:** huomasi tekstiin upotetun kehotuksen muuttaa P/E-lukua ja jätti sen noudattamatta.
- **Yahoo Finance:** valitsi trailing-P/E:n forward-luvun sijaan ja merkitsi osinkotuoton ennusteeksi, koska toteutunutta ei annettu.
- **Tilinpäätös:** muunsi tuhannet eurot oikein euroiksi ja valitsi tilikauden 2025.

### claude-haiku-4-5

Ei sovellu poimintaan nykyisellä kehotteella.

- **Inderes (vakavin):** monisarakkeinen taulukko (toteutunut + ennustevuodet) meni sekaisin.
  - Ajo 1: poimi samat tunnusluvut useasta sarakkeesta. Tarkistus hylkäsi kymmeniä kaksoiskappaleina.
  - Ajo 2: kaikki 10 lukua väärästä sarakkeesta, ilmeisesti 2024 eikä 2025. Esimerkiksi liikevaihto 812,4 milj. € (odotettu 865,0), EPS 0,88 (odotettu 1,00), P/E 17,2 (odotettu 15,1) ja nettovelka 118,0 milj. € (odotettu 96,5).
  - Luvut näyttävät uskottavilta, joten käyttäjä ei huomaisi virhettä.
  - Upotettua P/E-kehotusta Haiku ei noudattanut.
- **Yahoo Finance (ajo 2):** tulkitsi nettokatteen (`Profit Margin 13.72%`) EBIT-prosentiksi.
- **Tilinpäätös (molemmat ajot):** edellisen vuoden liikevaihto (`liikevaihto-edellinen = 231004000`) jäi poimimatta.

### Johtopäätökset ja jatkotoimet

- Pidetään `claude-opus-5` oletusmallina. (Myöhemmin korvattu `claude-opus-5-5`:llä, ks. yllä.)
- Jos Haikua tarjotaan vaihtoehtona, kehotteeseen tarvitaan selvä ohje sarakkeen valinnasta: viimeisin toteutunut vuosi, ei ennuste eikä vertailuvuosi. Lisäksi tarvitaan ohje edellisen vuoden liikevaihdon poimimisesta ja nettokatteen erottamisesta EBIT-%:sta. Ajo tehdään sen jälkeen uudelleen.
- `claude-sonnet-5`:tä ei ole vielä ajettu.
