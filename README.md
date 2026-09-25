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
scripts/
└── check-links.mjs  # lisälukemista-linkkien tarkistus
src/
├── components/   # React-komponentit: tunnuslukukortti ja sen osat (vaihe 4), ruudukko (vaihe 5)
├── data/         # tunnusluvut, kategoriat, sanasto ja linkkien sivustot (vaihe 2–3b)
├── hooks/        # selitysikkunat (usePopover), korttiin siirtyminen (useCardNavigation), haku- ja suodatuslogiikka (vaihe 7)
├── styles/       # värit, välit ja teemat
└── test/         # testien alustus
```

Uuden tunnusluvun lisäämisohje kirjoitetaan tähän vaiheessa 11.
