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

Uuden tunnusluvun lisäämisohje kirjoitetaan tähän vaiheessa 11.
