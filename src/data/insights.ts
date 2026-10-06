// Yhdistelmähuomiot (suunnitelman kohta 12.1): tulkinnat, jotka syntyvät kahden tai useamman
// luvun yhdistelmästä. Säännöt ovat dataa kuten kaavat (formulas.ts). Sääntö arvioidaan vain,
// kun kaikki sen luvut ovat saatavilla, syötettyinä, poimittuina tai laskettuina.
//
// Rajat ovat nyrkkisääntöjä, ja teksti sanoo sen ("yleensä"). Huomio kertoo, mitä yhdistelmä
// tarkoittaa, eikä koskaan kehota ostamaan tai myymään.

import type { ResolvedFigure } from "./formulas.ts";
import type { NumberUnit } from "./numberFormat.ts";

export interface Insight {
  id: string;
  /** Tunnuslukujen tai lähtötietojen id:t, joista huomio syntyy. Kaikkien pitää olla tiedossa. */
  figures: readonly string[];
  /** Laukeaako huomio. Arvot ovat analyysin valuutassa, ja prosentit prosentteina. */
  when: (v: (id: string) => number) => boolean;
  /** Johdettu luku, joka näytetään lukujen yhteydessä, esim. osingot yhteensä. */
  derived?: { label: string; unit: NumberUnit; value: (v: (id: string) => number) => number };
  /** Lyhyt otsikko: mitä luvuissa näkyy. */
  title: string;
  /** Mitä yhdistelmä tarkoittaa. [[termi]]-merkinnät kuten korteilla. */
  text: string;
}

/** Osinkosuhde, jota korkeampi on "suuri" (kortin nyrkkisääntö: 30–70 % on usein kestävää). */
const HIGH_PAYOUT = 70;
/** Nettovelka/EBITDA, jota korkeampi on "paljon velkaa" (kortin nyrkkisääntö: yli 3). */
const HIGH_LEVERAGE = 3;
/** ROE:n ja ROI:n ero prosenttiyksikköinä, jota pidetään selvänä. */
const ROE_ROI_GAP = 5;
/** Kassavirta on "selvästi" tulosta pienempi, kun se jää alle tämän osuuden tuloksesta. */
const CASH_CONVERSION = 0.8;

const dividendsTotal = (v: (id: string) => number) => v("osinko-per-osake") * v("osakkeiden-maara");

export const insights: readonly Insight[] = [
  {
    id: "osinko-yli-tuloksen",
    figures: ["osinkosuhde"],
    when: (v) => v("osinkosuhde") > 100,
    title: "Osinkoa jaetaan enemmän kuin yhtiö tekee tulosta",
    text: "Erotus maksetaan aiempien vuosien voitoista, kassasta tai velalla. Se ei yleensä voi jatkua pitkään, ellei [[nettotulos]] kasva.",
  },
  {
    id: "osinko-yli-kassavirran",
    figures: ["osinko-per-osake", "osakkeiden-maara", "vapaa-kassavirta"],
    when: (v) => v("osinko-per-osake") > 0 && dividendsTotal(v) > v("vapaa-kassavirta"),
    derived: { label: "Osingot yhteensä", unit: "€", value: dividendsTotal },
    title: "Osingot ovat suuremmat kuin vapaa kassavirta",
    text: "Osinko maksetaan silloin osin [[kassa|kassasta]] tai velalla. Yksi vuosi ei kerro paljon, koska [[investointi|investoinnit]] vaihtelevat, mutta toistuessaan tämä on varoitusmerkki.",
  },
  {
    id: "roe-velasta",
    figures: ["roe", "roi"],
    when: (v) => v("roe") > 0 && v("roe") - v("roi") >= ROE_ROI_GAP,
    title: "ROE on selvästi ROI:ta korkeampi",
    text: "Ero johtuu yleensä velasta. Velka kasvattaa [[oma pääoma|oman pääoman]] tuottoa, kun liiketoiminta tuottaa enemmän kuin lainan korko on, mutta se kasvattaa myös riskiä.",
  },
  {
    id: "kassavirta-alle-tuloksen",
    figures: ["liiketoiminnan-kassavirta", "nettotulos"],
    when: (v) =>
      v("nettotulos") > 0 && v("liiketoiminnan-kassavirta") < CASH_CONVERSION * v("nettotulos"),
    title: "Liiketoiminnan kassavirta on selvästi tulosta pienempi",
    text: "Tulos ei ole muuttunut rahaksi. Syynä on usein [[käyttöpääoma]]: rahaa on sitoutunut varastoihin ja maksamattomiin laskuihin. Jos tämä toistuu vuodesta toiseen, se on varoitusmerkki.",
  },
  {
    id: "investoinnit-yli-kassavirran",
    figures: ["ebitda", "vapaa-kassavirta"],
    when: (v) => v("ebitda") > 0 && v("vapaa-kassavirta") < 0,
    title: "Käyttökate on positiivinen, mutta vapaa kassavirta negatiivinen",
    text: "[[investointi|Investoinnit]] ja muut rahan käytöt vievät enemmän kuin liiketoiminta tuottaa. Kasvuyhtiöllä se voi olla tarkoituksellista, mutta raha tulee silloin velasta, kassasta tai [[osakeanti|osakeannista]].",
  },
  {
    id: "ev-ebit-yli-pe",
    figures: ["pe", "ev-ebit"],
    when: (v) => v("pe") > 0 && v("ev-ebit") > 0 && v("ev-ebit") >= v("pe"),
    title: "EV/EBIT on vähintään yhtä suuri kuin P/E",
    text: "Tavallisesti EV/EBIT on pienempi, koska liikevoitosta ei ole vähennetty veroja. Ero johtuu yleensä velasta: [[ev]] huomioi sen, P/E ei. Velan kanssa osake on kalliimpi kuin P/E näyttää.",
  },
  {
    id: "pe-paljon-yli-ev-ebit",
    figures: ["pe", "ev-ebit"],
    when: (v) => v("pe") > 0 && v("ev-ebit") > 0 && v("pe") >= 2 * v("ev-ebit"),
    title: "P/E on yli kaksinkertainen EV/EBIT:iin verrattuna",
    text: "Syynä on yleensä suuri [[kassa]], joka pienentää [[ev|yritysarvoa]], tai korot ja [[kertaerä|kertaerät]], jotka pienentävät nettotulosta. P/E ei huomioi kassaa eikä velkaa.",
  },
  {
    id: "velka-ja-osinko",
    figures: ["nettovelka-ebitda", "osinkosuhde"],
    when: (v) => v("nettovelka-ebitda") > HIGH_LEVERAGE && v("osinkosuhde") > HIGH_PAYOUT,
    title: "Velkaa on paljon, ja tuloksesta jaetaan silti suuri osa",
    text: "Velan lyhentämiseen jää vähän rahaa. Jos tulos heikkenee, yhtiö joutuu yleensä valitsemaan osingon ja velan lyhentämisen välillä, ja osinkoa usein leikataan.",
  },
];

export interface FiredInsight {
  insight: Insight;
  /** Huomion luvut ja niiden arvot sääntöjen järjestyksessä. */
  values: { id: string; value: number }[];
  /** Johdetun luvun arvo, jos säännöllä on sellainen. */
  derived?: number;
  /** Luvut ovat eri kausilta tai jokin niistä on laskettu eri kausien luvuista (kohta 11.4). */
  mixedPeriods: boolean;
}

/** Huomiot, jotka laukeavat annetuilla luvuilla. */
export function evaluateInsights(
  figures: ReadonlyMap<string, ResolvedFigure>,
  list: readonly Insight[] = insights,
): FiredInsight[] {
  const fired: FiredInsight[] = [];
  for (const insight of list) {
    const used = insight.figures.map((id) => figures.get(id));
    if (used.some((f) => f === undefined)) continue;
    const v = (id: string) => {
      const figure = figures.get(id);
      if (!figure || !insight.figures.includes(id))
        throw new Error(`${insight.id}: luku ${id} puuttuu figures-listalta`);
      return figure.value;
    };
    if (!insight.when(v)) continue;
    const periods = new Set(used.flatMap((f) => (f!.period ? [f!.period] : [])));
    fired.push({
      insight,
      values: insight.figures.map((id) => ({ id, value: figures.get(id)!.value })),
      ...(insight.derived ? { derived: insight.derived.value(v) } : {}),
      mixedPeriods: periods.size > 1 || used.some((f) => f!.mixedPeriods),
    });
  }
  return fired;
}
