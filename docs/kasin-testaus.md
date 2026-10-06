# Käsin testaus: Tutki osaketta -sivu (vaihe 11e)

Automaattiset testit eivät kata kaikkea: oikeiden sivujen tekstin rakenne vaihtelee, ja jsdom ei laske tyylejä. Tähän kirjataan käsin tehdyt tarkistukset. Uusin kirjaus ylimpänä.

---

## 2026-10-06 · oikeat sivut tekoälyhaulla

Kultakin sivulta kopioitiin yhden yhtiön sivu tai tunnuslukuosio tekstitiedostoon kansioon `oikeat_sivut/` (ei repossa), ja poiminta ajettiin komennolla `npm run eval-real` (oletusmalli Opus 5.5). Jokainen poimittu luku verrattiin käsin tekstiin.

| Sivu                                            | Yhtiö                 | Poimittu / oikein | ⚠-rivit  | Hylätyt | Huomiot |
| ----------------------------------------------- | --------------------- | ----------------- | -------- | ------- | ------- |
| Nordnet (osakkeen sivu, USD, monivuotinen)      | Walmart               | 26 / 26           | 0        | 0       | ¹       |
| Inderes (yhtiösivu, vain ennusteita)            | Solar Foods           | 6 / 6             | 0        | 0       | ²       |
| Kauppalehti (tilinpäätöksen tunnusluvut)        | IQM Quantum Computers | 14 / 14           | 0        | 0       | ³       |
| Yahoo Finance (Income Statement, TTM-sarake)    | Nokia                 | 8 / 8             | 0        | 0       | ⁴       |
| Tilinpäätös (englanninkielinen, EURm, 3 vuotta) | Nokia                 | 19 / 19           | 12 → 0 ⁵ | 0       |         |

¹ Kurssiin sidotut luvut (P/E, P/B, osinkotuotto) ovat nykyhetken, EV-kertoimet vuoden 2025 lopun lukuja. Malli kertoi erosta huomioissa. ROA:ta ei poimittu ROI:ksi, mikä on oikein.
² Kertoimet ovat vain ennusteita (26e), ja ne poimittiin kaudella "ennuste". Negatiiviset P/E ja EV/EBIT säilyivät negatiivisina.
³ Kauppalehti näyttää markkina-arvon, P/E:n ja muut kertoimet nollina ja osan luvuista täytearvona 999,90. Malli jätti ne pois ja kertoi syyn. Yksikkö "miljoonina euroina" otsikossa huomioitiin.
⁴ Malli valitsi TTM-sarakkeen. Korkokuluille ei ole TTM-lukua, joten se otti vuoden 2025 luvun ja kertoi siitä.
⁵ Kaikki arvot olivat oikein, mutta 12 rahamäärää sai turhan ⚠-merkin, koska lainauksen tarkistus ei tunnistanut otsikon kerroinsanaa "EURm". Korjattu: `verify.ts` tunnistaa nyt muodot EURm, USDm, EURbn ja muut vastaavat. Uusinta-ajossa ⚠-rivejä oli 0.

**Havainto:** taulukosta poimitun luvun lainaus on usein pelkkä luku ("31,33") tai rivin kaikki vuodet ("2.17B 1.47B 2.09B 915M 1.06B") ilman rivin nimeä. Tarkistus hyväksyy sen, mutta tarkistusvaiheessa käyttäjä ei näe lainauksesta, mistä rivistä ja vuodesta luku on.

Tarkistuslista:

- [x] Arvot ja yksiköt vastaavat sivua (milj. / mrd oikein, prosentit prosentteina).
- [x] Kausi on oikea: viimeisin toteutunut tai 12 kk, ennuste vain, kun toteutunutta ei ole.
- [x] Sivulta puuttuva luku (Kauppalehden nollat, Inderesin osinkotuotto) ei päädy analyysiin.
- [x] ⚠-merkityt luvut ovat oikeasti tarkistettavia (korjauksen jälkeen ei turhia).
- [x] Kopioidut osiot mahtuivat 30 000 merkkiin (suurin 5 100 merkkiä).
- [ ] Analyysin osuvat välit ja lasketut luvut: ei tarkistettu selaimessa tällä kertaa.

Puhelintestaus jätettiin pois.

---

## 2026-09-27 · vaihe 11e

### Mobiili (375 px) ja saavutettavuus

Tarkistettu kehityspalvelimella selaimen 375 × 812 -näkymässä. Tekoälyn vastaus korvattiin testiaineiston vastauksella (`src/ai/fixtures/inderes.ts`), joten oikeaa rajapintaa ei kutsuttu.

| Vaihe                                                     | Vaakavieritys | Alle 24 px kosketuskohteet | axe (kontrastit mukana), vaalea / tumma |
| --------------------------------------------------------- | ------------- | -------------------------- | --------------------------------------- |
| Aloitus (tekstikenttä, avaimen kenttä, viimeisimmät)      | ei            | ei                         | ✓ / ✓                                   |
| Liian pitkä teksti                                        | ei            | ei                         | ✓ / –                                   |
| Virhe (hylätty avain)                                     | ei            | ei                         | – / ✓                                   |
| Tarkistus (⚠-rivit, huomiot, hylätyt auki)                | ei            | ei                         | ✓ / ✓                                   |
| Analyysi (lukutaulukko, Lisää luku, puuttuvien lomakkeet) | ei ¹          | ei                         | ✓ / ✓                                   |

¹ Korjattu: "Lisää luku" -listan pitkä nimi ("Nettovelkaantumisaste") ei mahtunut riville ja teki listaan vaakavierityksen.

Muut löydökset ja korjaukset:

- **Vastuuvapauslauseke oli maamerkkien ulkopuolella** (axe: `region`). Siirretty `main`-elementin alkuun. Komponenttitestit eivät huomanneet tätä, koska axe ajettiin vain renderöidylle säiliölle. Nyt tarkistus ajetaan koko dokumentille (`src/test/axe.ts`).

Lighthouse 12, saavutettavuus, tuotantoversio (Edge, headless):

| Sivu                                 | Mobiili | Työpöytä |
| ------------------------------------ | ------- | -------- |
| `/` (Tunnusluvut)                    | 100     | 100      |
| `/?sivu=tutki` (aloitus)             | 100     | 100      |
| `/?sivu=tutki&…` (analyysi luvuilla) | 100     | 100      |

### Oikeat sivut tekoälyhaulla

**Tehty 2026-10-06, ks. yllä.** Kopioi kultakin sivulta yhden yhtiön tunnuslukuosio ja liitä se Tutki osaketta -sivulle (oletusmalli Opus 5.5). Kirjaa tulos taulukkoon.

| Sivu                                     | Yhtiö | Poimittu / oikein | ⚠-rivit | Hylätyt | Huomiot |
| ---------------------------------------- | ----- | ----------------- | ------- | ------- | ------- |
| Nordnet (osakkeen sivu, tunnusluvut)     |       |                   |         |         |         |
| Inderes (yhtiösivun taulukko)            |       |                   |         |         |         |
| Kauppalehti (osakkeen tunnusluvut)       |       |                   |         |         |         |
| Yahoo Finance (Statistics)               |       |                   |         |         |         |
| Tilinpäätös (PDF, tuloslaskelma ja tase) |       |                   |         |         |         |

Tarkista jokaisella sivulla:

- [ ] Arvot ja yksiköt vastaavat sivua (milj. / mrd oikein, prosentit prosentteina).
- [ ] Kausi on oikea: viimeisin toteutunut tai 12 kk, ei ennuste, jos toteutunut on saatavilla.
- [ ] Sivulta puuttuva luku ei päädy analyysiin ilman, että valitset sen itse.
- [ ] ⚠-merkityt luvut ovat oikeasti tarkistettavia, eivät turhia varoituksia.
- [ ] Kopioitu osio mahtuu 30 000 merkkiin. Jos ei, onko ohje "valitse vain tunnuslukuosio" riittävä?
- [ ] Analyysin osuvat välit ja lasketut luvut ovat järkeviä sivun lukuihin verrattuna.

Lisäksi puhelimella (oikea laite, ei vain kapea selainikkuna):

- [ ] Tekstin liittäminen puhelimen leikepöydältä onnistuu.
- [ ] Näppäimistö ei peitä "Anna tekoälyn poimia luvut" -painiketta tai virheilmoitusta.
- [ ] Numerokentän syöttö ("1,2 mrd") onnistuu puhelimen näppäimistöllä.
