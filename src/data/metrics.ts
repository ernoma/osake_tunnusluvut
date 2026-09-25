// KAIKKI TUNNUSLUVUT. Uusi tunnusluku = uusi olio tähän listaan.
// Ohje: README.md ja TOTEUTUSSUUNNITELMA.md, kohta 9. Aja lopuksi `npm test`.

import type { Metric } from "./types.ts";

export const metrics: Metric[] = [
  {
    id: "pe",
    name: "P/E-luku",
    abbreviation: "P/E",
    abbreviationExpanded: "Price / Earnings = hinta suhteessa tulokseen",
    aliases: ["hinta-voittosuhde", "hinta-tulossuhde", "pe-luku", "price to earnings"],
    category: "arvostus",
    level: "perus",
    question: "Montako vuoden tulosta maksat osakkeen hinnassa?",
    summary:
      "Kertoo, kuinka monta kertaa yhtiön vuoden [[nettotulos|tuloksen]] maksat, kun ostat osakkeen. Mitä pienempi luku, sitä vähemmän maksat jokaisesta tuloseurosta.",
    analogy:
      "Kioski tekee 10 000 € voittoa vuodessa ja maksaa 100 000 €. P/E on 10: voitoilla kestäisi noin 10 vuotta maksaa kioskin hinta takaisin.",
    formula: {
      words: "Osakkeen hinta ÷ osakekohtainen tulos",
      symbols: "Kurssi ÷ EPS",
      note: "Tulos on yleensä viimeisen 12 kuukauden ajalta. Joskus käytetään seuraavan vuoden [[ennuste|ennustetta]].",
    },
    example: "Osake maksaa 20 € ja [[EPS]] on 2 €. P/E = 20 ÷ 2 = 10.",
    unit: "x",
    direction: "lower",
    directionLabel: "Pienempi = yleensä halvempi",
    rules: [
      "Vertaa saman [[toimiala|alan]] yhtiöihin ja yhtiön omaan historiaan.",
      "Nopeasti kasvavalla yhtiöllä korkea P/E voi olla perusteltu.",
      "Jos yhtiö tekee tappiota, P/E:tä ei voi käyttää.",
    ],
    commonMistake:
      "”Matala P/E = hyvä ostos.” Matala luku voi kertoa, että sijoittajat odottavat tuloksen laskevan.",
    factors: [
      "Toimiala: vakailla aloilla P/E on usein matalampi kuin kasvualoilla.",
      "Korkotaso: kun korot ovat korkealla, P/E-luvut ovat yleensä matalampia.",
      "[[kertaerä|Kertaerät]] voivat nostaa tai laskea yhden vuoden tulosta, jolloin P/E näyttää harhaanjohtavalta.",
      "Suhdanne: huippuvuoden tulos saa P/E:n näyttämään halvalta juuri ennen kuin tulos laskee.",
    ],
    pitfalls: [
      "P/E ei huomioi velkaa. Jos yhtiöillä on hyvin eri määrä velkaa, vertaa mieluummin [[EV/EBIT]]-lukua.",
      "Toteutuneeseen ja ennustettuun tulokseen perustuvat P/E-luvut eivät ole keskenään vertailukelpoisia.",
    ],
    ranges: [
      {
        label: "Negatiivinen",
        meaning: "Yhtiö tekee tappiota, eikä luku kerro mitään.",
        tone: "warning",
      },
      {
        label: "Alle 10",
        meaning: "Halpa, tai markkinat odottavat tuloksen laskevan.",
        tone: "neutral",
      },
      { label: "10–20", meaning: "Tavallinen taso monella alalla.", tone: "neutral" },
      {
        label: "Yli 25",
        meaning: "Kallis, tai markkinat odottavat nopeaa kasvua.",
        tone: "warning",
      },
    ],
    rangesNote: "Nyrkkisääntö. Tavalliset tasot vaihtelevat toimialoittain ja ajan mukaan.",
    companions: [
      { id: "peg", reason: "Kertoo, selittyykö korkea P/E nopealla kasvulla." },
      { id: "eps", reason: "P/E lasketaan EPS:stä. Katso, onko tulos kasvussa vai laskussa." },
      { id: "ev-ebit", reason: "Parempi vertailuun, kun yhtiöillä on eri määrä velkaa." },
    ],
  },
  {
    id: "peg",
    name: "PEG-luku",
    abbreviation: "PEG",
    abbreviationExpanded: "Price / Earnings to Growth = P/E suhteessa kasvuun",
    aliases: ["peg-luku", "p/e kasvuun suhteutettuna", "price earnings to growth"],
    category: "arvostus",
    level: "syventava",
    question: "Onko P/E kohtuullinen, kun yhtiön kasvu otetaan huomioon?",
    summary:
      "Suhteuttaa [[P/E]]-luvun tuloksen kasvuvauhtiin. Näin nopeasti ja hitaasti kasvavia yhtiöitä voi verrata reilummin.",
    analogy:
      "Kaksi omenapuuta: kalliimpi voi olla edullisempi ostos, jos se kasvaa nopeasti ja tuottaa pian enemmän omenoita.",
    formula: {
      words: "P/E ÷ tuloksen vuotuinen kasvu prosentteina",
      symbols: "(Kurssi ÷ EPS) ÷ EPS:n kasvu-%",
      note: "Kasvu on yleensä analyytikoiden [[ennuste]] seuraaville 3–5 vuodelle.",
    },
    example: "P/E on 20, ja tuloksen odotetaan kasvavan 20 % vuodessa. PEG = 20 ÷ 20 = 1.",
    unit: "x",
    direction: "lower",
    directionLabel: "Pienempi = yleensä halvempi",
    rules: [
      "Alle 1 on kasvuun nähden edullinen, noin 1 kohtuullinen ja yli 1 kallis (nyrkkisääntö).",
      "Luku on vain yhtä luotettava kuin kasvu[[ennuste]].",
      "Ei toimi, jos tulos ei kasva tai laskee.",
    ],
    commonMistake:
      "Kasvuennustetta pidetään varmana tietona. Todellinen kasvu jää usein ennustettua pienemmäksi.",
    factors: [
      "Kasvuennusteen lähde ja aikaväli: eri palvelut voivat laskea PEG:n eri tavoin.",
      "Yhtiön koko: hyvin nopea kasvu yleensä hidastuu, kun yhtiö kasvaa isoksi.",
      "[[osinko|Osingot]]: PEG ei huomioi osinkoja, joten se voi aliarvioida vakaita osinkoyhtiöitä.",
    ],
    pitfalls: [
      "Jos tulos on juuri toipunut huonosta vuodesta, kasvuprosentti näyttää suurelta ja PEG harhaanjohtavan pieneltä.",
      "Negatiivista PEG-lukua ei voi tulkita.",
    ],
    ranges: [
      { label: "Alle 1", meaning: "Kasvuun nähden edullinen.", tone: "good" },
      { label: "Noin 1", meaning: "Kohtuullinen.", tone: "neutral" },
      { label: "Yli 2", meaning: "Kallis kasvuun nähden.", tone: "warning" },
    ],
    rangesNote: "Nyrkkisääntö, ei totuus. Riippuu täysin kasvuennusteen osuvuudesta.",
    companions: [
      { id: "pe", reason: "PEG lasketaan P/E:stä. Katso aina molemmat." },
      { id: "eps", reason: "Näyttää, onko tulos todella kasvanut aiempina vuosina." },
    ],
  },
];
