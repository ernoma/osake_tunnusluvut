# Käsin testaus: Tutki osaketta -sivu (vaihe 11e)

Automaattiset testit eivät kata kaikkea: oikeiden sivujen tekstin rakenne vaihtelee, ja jsdom ei laske tyylejä. Tähän kirjataan käsin tehdyt tarkistukset. Uusin kirjaus ylimpänä.

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

**Kesken.** Vaatii oman API-avaimen, joten testaa ylläpitäjä. Kopioi kultakin sivulta yhden yhtiön tunnuslukuosio ja liitä se Tutki osaketta -sivulle (oletusmalli Opus 5.5). Kirjaa tulos taulukkoon.

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
