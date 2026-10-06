// Esimerkkiyhtiö (suunnitelman kohta 12.2): valmis analyysi, jonka "Kokeile esimerkkiyhtiöllä"
// avaa ilman liitettävää tekstiä tai API-avainta. Yhtiö ja luvut ovat keksittyjä, koska
// periaatteen 4 mukaan oikeita yhtiöitä ei käytetä.
//
// Luvut on valittu niin, että analyysi näyttää sivun ominaisuudet (example.test.ts tarkistaa ne):
// - laskettuja lukuja kaavoineen, esim. P/E kurssista ja osakekohtaisesta tuloksesta
// - puuttuva luku, esim. PEG, joka tarvitsee tuloksen kasvuennusteen
// - välien väliin osuva luku: EBIT-% 7 % on välien 3–5 % ja 10–15 % välissä
// - nollan tai negatiivisen nimittäjän takia laskematta jäänyt P/FCF
// - yhdistelmähuomioita: ROE on selvästi ROI:ta korkeampi, kassavirta jää tuloksesta, ja
//   investoinnit ja osingot vievät enemmän kuin liiketoiminta tuottaa.

/** Esimerkkiyhtiön nimi. Analyysinäkymä tunnistaa esimerkin tästä nimestä. */
export const EXAMPLE_NAME = "Esimerkki Oyj";

/** Luvut toteutuneina vuodelta 2025, käyttäjän syöttäminä: id=arvo~t~2025~k. */
const figures: Record<string, number> = {
  kurssi: 7,
  "osakkeiden-maara": 100_000_000,
  liikevaihto: 1_000_000_000,
  "liikevaihto-edellinen": 950_000_000,
  ebit: 70_000_000,
  poistot: 40_000_000,
  rahoituskulut: 15_000_000,
  "tulos-ennen-veroja": 55_000_000,
  nettotulos: 44_000_000,
  "oma-paaoma": 250_000_000,
  "taseen-loppusumma": 900_000_000,
  "korolliset-velat": 350_000_000,
  kassa: 50_000_000,
  "liiketoiminnan-kassavirta": 30_000_000,
  investoinnit: 50_000_000,
  "osinko-per-osake": 0.3,
};

/** Esimerkkianalyysin osoitteen kyselyosa. */
export const EXAMPLE_SEARCH =
  `?sivu=tutki&nimi=${encodeURIComponent(EXAMPLE_NAME)}&val=EUR&` +
  Object.entries(figures)
    .map(([id, value]) => `${id}=${value}~t~2025~k`)
    .join("&");
