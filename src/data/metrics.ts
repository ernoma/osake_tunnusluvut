// KAIKKI TUNNUSLUVUT. Uusi tunnusluku = uusi olio tähän listaan.
// Ohje: README.md ja TOTEUTUSSUUNNITELMA.md, kohta 9. Aja lopuksi `npm test`.

import type { Metric } from "./types.ts";

export const metrics: Metric[] = [
  // ─── Koko: Kuinka iso yhtiö on? ───────────────────────────────────────────
  {
    id: "markkina-arvo",
    name: "Markkina-arvo",
    aliases: ["pörssiarvo", "market cap", "markkina-arvostus"],
    category: "koko",
    level: "perus",
    question: "Paljonko kaikki yhtiön osakkeet maksavat yhteensä?",
    summary:
      "Yhtiön hinta pörssissä: yhden [[osake|osakkeen]] hinta kerrottuna osakkeiden määrällä. Kertoo yhtiön koon, ei sitä, onko osake halpa.",
    analogy:
      "Talon myyntihinta. Se kertoo, kuinka arvokas talo on ostajien mielestä, mutta ei sitä, onko talossa asuntolainaa.",
    formula: {
      words: "Osakkeen hinta × osakkeiden määrä",
      symbols: "Kurssi × osakkeiden lkm",
    },
    example:
      "Osakkeita on 10 miljoonaa ja yksi maksaa 5 €. Markkina-arvo = 5 € × 10 milj. = 50 milj. €.",
    unit: "€",
    direction: "neutral",
    directionLabel: "Kertoo koosta, ei hyvä tai huono",
    rules: [
      "Kertoo koon, ei sitä, onko osake halpa vai kallis.",
      "Pienten yhtiöiden kurssit heiluvat usein enemmän kuin suurten.",
      "Ei huomioi velkoja. Koko yhtiön hinnan velkoineen kertoo [[EV]].",
    ],
    commonMistake:
      "”Iso markkina-arvo = turvallinen sijoitus.” Suurenkin yhtiön kurssi voi pudota paljon.",
    factors: [
      "Markkina-arvo muuttuu joka päivä [[pörssikurssi|kurssin]] mukana, vaikka yhtiön liiketoiminta ei muuttuisi.",
      "Pienissä yhtiöissä kaupankäynti voi olla vähäistä, eli [[likviditeetti]] on heikko. Silloin osakkeen myyminen haluttuun hintaan voi olla vaikeaa.",
    ],
    pitfalls: [
      "Kahden yhtiön markkina-arvoja ei voi verrata järkevästi, jos toisella on paljon velkaa ja toisella ei. Vertaa silloin [[EV|yritysarvoja]].",
    ],
    ranges: [
      { label: "Alle 150 milj. €", meaning: "Pieni yhtiö (mikroyhtiö).", tone: "neutral" },
      { label: "150 milj. – 1 mrd. €", meaning: "Pieni tai keskisuuri yhtiö.", tone: "neutral" },
      { label: "Yli 1 mrd. €", meaning: "Suuri yhtiö.", tone: "neutral" },
    ],
    rangesNote: "Suuntaa antava jako, kokoluokkien rajat vaihtelevat lähteittäin.",
    companions: [
      {
        id: "ev",
        reason: "Lisää markkina-arvoon velat ja vähentää käteisen: koko yhtiön todellinen hinta.",
      },
      { id: "liikevaihto", reason: "Kun markkina-arvo jaetaan myynnillä, saadaan P/S-luku." },
    ],
    links: [
      {
        title: "Markkina-arvon määritelmä: osakeyhtiö ja asunto",
        url: "https://fi.wikipedia.org/wiki/Markkina-arvo",
        sourceId: "wikipedia-fi",
        language: "fi",
        kind: "selitys",
        checkedAt: "2026-09-25",
      },
      {
        title: "Market cap: how it is calculated and size classes",
        url: "https://www.investopedia.com/terms/m/marketcapitalization.asp",
        sourceId: "investopedia",
        language: "en",
        kind: "selitys",
        checkedAt: "2026-09-25",
      },
    ],
  },
  {
    id: "ev",
    name: "Yritysarvo",
    abbreviation: "EV",
    abbreviationExpanded: "Enterprise Value = yritysarvo",
    aliases: ["enterprise value", "velaton arvo", "velaton hinta"],
    category: "koko",
    level: "syventava",
    question: "Paljonko koko yhtiö maksaisi velkoineen?",
    summary:
      "[[Markkina-arvo]], johon on lisätty yhtiön [[nettovelka]]. Kertoo, paljonko koko yhtiön ostaminen maksaisi, kun myös velat otetaan hoitaakseen.",
    analogy:
      "Asunnon velaton hinta: myyntihinta plus asuntoon kohdistuva osuus taloyhtiön lainasta. Kaksi samanhintaista asuntoa voi olla hyvin eri hintaisia velattomina.",
    formula: {
      words: "Markkina-arvo + korolliset velat − kassa",
      symbols: "EV = markkina-arvo + nettovelka",
      note: "Tarkemmassa laskussa lisätään myös [[vähemmistöosuus]].",
    },
    example:
      "Markkina-arvo on 50 milj. €, velkaa 30 milj. € ja kassaa 10 milj. €. EV = 50 + 30 − 10 = 70 milj. €.",
    unit: "€",
    direction: "neutral",
    directionLabel: "Kertoo koosta, ei hyvä tai huono",
    rules: [
      "Velkainen yhtiö on kalliimpi kuin pelkkä markkina-arvo antaa ymmärtää.",
      "Paljon käteistä omistava yhtiö on vastaavasti halvempi.",
      "EV on pohja [[EV/EBIT]]-luvulle, jolla yhtiöitä verrataan velat huomioiden.",
    ],
    commonMistake: "Unohdetaan velat ja verrataan pelkkiä markkina-arvoja.",
    factors: [
      "Mitä velkoja lasketaan mukaan, vaihtelee lähteittäin. Esimerkiksi vuokrasopimusvastuut voivat olla mukana tai eivät.",
      "Jos [[kassa]] on suurempi kuin velat, EV on pienempi kuin markkina-arvo.",
    ],
    pitfalls: [
      "EV yksinään ei kerro, onko yhtiö halpa. Se pitää suhteuttaa tulokseen, esimerkiksi [[EV/EBIT]].",
    ],
    companions: [
      {
        id: "markkina-arvo",
        reason: "EV:n lähtökohta. Erotus kertoo, paljonko velkaa tai käteistä yhtiöllä on.",
      },
      {
        id: "ev-ebit",
        reason: "Suhteuttaa EV:n liikevoittoon, jolloin näet, onko hinta kohtuullinen.",
      },
      {
        id: "nettovelkaantumisaste",
        reason: "Kertoo, onko velkaa paljon suhteessa omistajien rahaan.",
      },
      {
        id: "ev-sales",
        reason: "Suhteuttaa EV:n myyntiin. Toimii myös, kun yhtiö ei vielä tee voittoa.",
      },
    ],
    links: [
      {
        title: "Yritysarvo velattomana hintana ja kahden yhtiön vertailu",
        url: "https://www.inderes.fi/articles/mika-enterprise-value-eli-ev-enta-evebit-ja-evebitda",
        sourceId: "inderes",
        language: "fi",
        kind: "esimerkki",
        checkedAt: "2026-09-25",
      },
      {
        title: "Enterprise value: formula, components and an example",
        url: "https://www.investopedia.com/terms/e/enterprisevalue.asp",
        sourceId: "investopedia",
        language: "en",
        kind: "selitys",
        checkedAt: "2026-09-25",
      },
    ],
  },
  {
    id: "liikevaihto",
    name: "Liikevaihto",
    aliases: ["myynti", "revenue", "sales", "liikevaihdon kasvu"],
    category: "koko",
    level: "perus",
    question: "Paljonko yhtiö myy vuodessa?",
    summary:
      "Kaikki raha, jonka yhtiö saa myynnistä [[tilikausi|tilikauden]] aikana, ennen kuin kuluja on vähennetty. Kasvuvauhti kertoo usein enemmän kuin määrä.",
    analogy:
      "Kaupan kassaan tuleva raha ennen kuin vuokra, palkat ja tavarantoimittajien laskut on maksettu.",
    formula: {
      words: "Kaikki myyntitulot tilikauden ajalta",
      note: "Liikevaihdosta on vähennetty arvonlisävero ja alennukset.",
    },
    example:
      "Kahvila myy vuodessa 100 000 kahvia 3 eurolla. Liikevaihto = 100 000 × 3 € = 300 000 €.",
    unit: "€",
    direction: "neutral",
    directionLabel: "Koko – kasvu on hyvä merkki",
    rules: [
      "Katso kasvuvauhtia: vertaa edellisiin vuosiin.",
      "Kasvu on arvokasta vain, jos myös voitto kasvaa.",
      "Yritysostot voivat kasvattaa liikevaihtoa, vaikka oma myynti ei kasva.",
    ],
    commonMistake:
      "”Suuri myynti = suuri voitto.” Kulut voivat viedä kaiken, joten katso myös EBIT.",
    factors: [
      "Valuuttakurssit muuttavat ulkomaisen myynnin arvoa euroissa.",
      "Hintojen nousu kasvattaa liikevaihtoa, vaikka myytyjä tuotteita ei olisi enempää.",
      "Joillakin [[toimiala|aloilla]] myynti vaihtelee vuodenaikojen tai suhdanteiden mukaan.",
    ],
    pitfalls: ["Yhden vuoden kasvu voi olla sattumaa. Katso useamman vuoden kehitystä."],
    companions: [
      { id: "ebit", reason: "Kertoo, jääkö myynnistä voittoa." },
      { id: "ebit-prosentti", reason: "Kertoo, montako prosenttia myynnistä jää voitoksi." },
      { id: "ps", reason: "Vertaa osakkeen hintaa myyntiin." },
      { id: "ttm-kasvu", reason: "Kertoo, kuinka nopeasti myynti kasvaa." },
    ],
    links: [
      {
        title: "Liikevaihdon määritelmä ja paikka tuloslaskelmassa",
        url: "https://fi.wikipedia.org/wiki/Liikevaihto",
        sourceId: "wikipedia-fi",
        language: "fi",
        kind: "selitys",
        checkedAt: "2026-09-25",
      },
    ],
  },
  {
    id: "ttm-kasvu",
    name: "TTM-kasvu",
    abbreviation: "TTM",
    abbreviationExpanded: "Trailing Twelve Months = viimeiset 12 kuukautta",
    aliases: [
      "liikevaihdon kasvu",
      "myynnin kasvu",
      "kasvu-%",
      "12 kk kasvu",
      "rullaava 12 kk",
      "trailing twelve months",
      "ltm",
    ],
    category: "koko",
    level: "syventava",
    question: "Kasvaako yhtiön myynti, kun katsotaan viimeistä 12 kuukautta?",
    summary:
      "Montako prosenttia viimeisten 12 kuukauden [[liikevaihto]] on kasvanut edellisistä 12 kuukaudesta. Päivittyy jokaisen [[vuosineljännes|neljänneksen]] jälkeen.",
    analogy:
      "Kun arvioit tulojesi kehitystä, vertaat viimeisen vuoden tuloja sitä edeltävään vuoteen etkä pelkkää joulukuuta. Yksi hyvä tai huono kuukausi ei silloin vääristä kuvaa.",
    formula: {
      words: "(Viimeisten 12 kk liikevaihto ÷ edellisten 12 kk liikevaihto − 1) × 100 %",
      symbols: "(LV TTM ÷ LV TTM vuotta aiemmin − 1) × 100 %",
      note: "Viimeiset 12 kk = neljän viimeisimmän [[vuosineljännes|vuosineljänneksen]] summa. Samoin voi laskea myös liikevoiton tai EPS:n TTM-kasvun.",
    },
    example:
      "Neljän viimeisimmän neljänneksen myynti on 110 milj. € ja vuotta aiemmin 100 milj. €. TTM-kasvu = (110 ÷ 100 − 1) × 100 % = 10 %.",
    unit: "%",
    direction: "higher",
    directionLabel: "Suurempi = yleensä parempi",
    rules: [
      "Kasvu on arvokasta vain, jos myös voitto kasvaa. Katso rinnalla [[EBIT-%]].",
      "Katso usean vuoden kehitystä: yksi hyvä vuosi voi olla sattumaa.",
      "Yritysostot kasvattavat lukua, vaikka oma myynti ei kasvaisi.",
    ],
    commonMistake:
      "”Nopea kasvu = hyvä sijoitus.” Kasvu voi olla jo osakkeen hinnassa, ja tappiollinen kasvu kuluttaa rahaa.",
    factors: [
      "Hintojen nousu kasvattaa lukua, vaikka myytyjä tuotteita ei olisi enempää.",
      "Valuuttakurssit muuttavat ulkomaisen myynnin arvoa euroissa.",
      "TTM tasoittaa vuodenaikojen vaihtelua, koska jokainen vuodenaika on mukana kerran.",
    ],
    pitfalls: [
      "Palvelut laskevat kasvun eri tavoin: osa vertaa vain viimeistä neljännestä vuoden takaiseen neljännekseen. Tarkista, mitä luku tarkoittaa.",
      "Kun yhtiö ostaa toisen yhtiön, kasvu näyttää suurelta vuoden ajan, kunnes ostettu myynti on mukana molemmissa jaksoissa.",
    ],
    ranges: [
      { label: "Alle 0 %", meaning: "Myynti on pienentynyt.", tone: "warning" },
      {
        label: "0–5 %",
        meaning: "Hidasta kasvua, usein hintojen nousun tasolla.",
        tone: "neutral",
      },
      { label: "5–15 %", meaning: "Hyvää kasvua.", tone: "good" },
      {
        label: "Yli 20 %",
        meaning: "Nopeaa kasvua. Tarkista, johtuuko se yritysostoista.",
        tone: "neutral",
      },
    ],
    rangesNote: "Nyrkkisääntö. Vertaa saman alan yhtiöihin ja yhtiön omaan historiaan.",
    companions: [
      { id: "liikevaihto", reason: "Luvun pohja: kuinka suurta myyntiä kasvu koskee." },
      { id: "ebit-prosentti", reason: "Kertoo, kasvaako myynti kannattavasti." },
      { id: "ps", reason: "Nopea kasvu selittää usein korkeaa P/S-lukua." },
      { id: "peg", reason: "Suhteuttaa osakkeen hinnan tuloksen kasvuun." },
    ],
    links: [
      {
        title: "Trailing 12 months (TTM): what it is and how it is used",
        url: "https://www.investopedia.com/terms/t/ttm.asp",
        sourceId: "investopedia",
        language: "en",
        kind: "selitys",
        checkedAt: "2026-09-26",
      },
    ],
  },

  // ─── Kannattavuus: Tekeekö yhtiö hyvin rahaa? ─────────────────────────────
  {
    id: "ebit",
    name: "Liikevoitto",
    abbreviation: "EBIT",
    abbreviationExpanded: "Earnings Before Interest and Taxes = tulos ennen korkoja ja veroja",
    aliases: ["liiketulos", "operating profit", "vertailukelpoinen liikevoitto"],
    category: "kannattavuus",
    level: "perus",
    question: "Paljonko varsinainen liiketoiminta tuottaa voittoa?",
    summary:
      "Voitto, joka jää [[liikevaihto|liikevaihdosta]], kun liiketoiminnan kulut on maksettu. Korot ja verot eivät vielä vähennä sitä.",
    analogy:
      "Kahvilan voitto, kun kahvipavut, palkat ja vuokra on maksettu, mutta lainan korkoa ja veroja ei vielä.",
    formula: {
      words: "Liikevaihto − liiketoiminnan kulut",
      note: "Kuluihin kuuluu myös koneiden ja laitteiden kuluminen ([[poisto|poistot]]).",
    },
    example: "Liikevaihto on 300 000 € ja kulut 270 000 €. EBIT = 300 000 − 270 000 = 30 000 €.",
    unit: "€",
    direction: "higher",
    directionLabel: "Suurempi = yleensä parempi",
    rules: [
      "Suhteuta myyntiin: [[EBIT-%]] kertoo, onko voitto suuri vai pieni.",
      "[[kertaerä|Kertaerät]] vääristävät. Katso myös ”vertailukelpoinen EBIT”.",
      "Velat ja verot eivät vaikuta lukuun, joten yhtiöitä on helppo verrata.",
    ],
    commonMistake:
      "Katsotaan euromäärää eikä suhdetta yhtiön kokoon. Isolla yhtiöllä on aina isompi EBIT.",
    factors: [
      "Kehityssuunta: kasvaako liikevoitto vuodesta toiseen?",
      "Vertailukelpoinen EBIT on luku, josta yhtiö on poistanut kertaerät. Yhtiöt määrittelevät sen hieman eri tavoin.",
    ],
    pitfalls: [
      "Hyvä EBIT ei takaa hyvää lopputulosta omistajalle, jos yhtiöllä on paljon velkaa ja korkokulut ovat suuret.",
    ],
    companions: [
      { id: "liikevaihto", reason: "Näyttää, mistä voitto on syntynyt." },
      {
        id: "ebit-prosentti",
        reason: "Suhteuttaa voiton myyntiin, jolloin eri kokoisia yhtiöitä voi verrata.",
      },
      { id: "ev-ebit", reason: "Kertoo, paljonko maksat koko yhtiöstä suhteessa liikevoittoon." },
      { id: "ebitda", reason: "Liikevoitto ennen poistoja: näyttää, paljonko kuluminen vie." },
    ],
    links: [
      {
        title: "Liikevoiton määritelmä ja kertaerien vaikutus",
        url: "https://fi.wikipedia.org/wiki/Liikevoitto",
        sourceId: "wikipedia-fi",
        language: "fi",
        kind: "selitys",
        checkedAt: "2026-09-25",
      },
      {
        title: "EBIT explained: why interest and taxes are left out",
        url: "https://www.investopedia.com/terms/e/ebit.asp",
        sourceId: "investopedia",
        language: "en",
        kind: "selitys",
        checkedAt: "2026-09-25",
      },
    ],
  },
  {
    id: "ebit-prosentti",
    name: "Liikevoittoprosentti",
    abbreviation: "EBIT-%",
    abbreviationExpanded: "Liikevoitto prosentteina liikevaihdosta",
    aliases: [
      "liikevoittomarginaali",
      "liiketulosprosentti",
      "operating margin",
      "ebit-marginaali",
    ],
    category: "kannattavuus",
    level: "perus",
    question: "Montako senttiä jokaisesta myydystä eurosta jää voitoksi?",
    summary:
      "Kertoo, montako prosenttia myynnistä jää liikevoitoksi. Mitä suurempi luku, sitä kannattavampaa yhtiön liiketoiminta on.",
    analogy:
      "Jos myyt tuotteen 100 eurolla ja kaikkien kulujen jälkeen käteen jää 10 €, EBIT-% on 10.",
    formula: {
      words: "Liikevoitto ÷ liikevaihto × 100 %",
      symbols: "EBIT ÷ liikevaihto × 100 %",
    },
    example: "EBIT on 30 000 € ja liikevaihto 300 000 €. EBIT-% = 30 000 ÷ 300 000 × 100 % = 10 %.",
    unit: "%",
    direction: "higher",
    directionLabel: "Suurempi = yleensä parempi",
    rules: [
      "Vertaa vain saman [[toimiala|alan]] yhtiöihin: tasot vaihtelevat paljon.",
      "Nouseva suunta vuodesta toiseen on hyvä merkki.",
      "Korkea [[kate]] antaa yhtiölle pelivaraa huonoina aikoina.",
    ],
    commonMistake:
      "Verrataan eri alojen yhtiöitä. Kaupan 4 % voi olla parempi suoritus kuin ohjelmistoyhtiön 15 %.",
    factors: [
      "Kilpailu: kovassa kilpailussa hinnat ja katteet painuvat alas.",
      "Mittakaava: kasvava yhtiö voi parantaa kannattavuutta, kun kiinteät kulut jakautuvat suuremmalle myynnille.",
      "[[kertaerä|Kertaerät]] voivat heilauttaa yhden vuoden lukua.",
    ],
    pitfalls: [
      "Korkea EBIT-% ei yksin kerro, onko osake hyvä sijoitus. Hinta voi olla jo valmiiksi korkea.",
    ],
    ranges: [
      { label: "Alle 0 %", meaning: "Liiketoiminta on tappiollista.", tone: "warning" },
      { label: "3–5 %", meaning: "Tavallinen esimerkiksi kaupan alalla.", tone: "neutral" },
      { label: "10–15 %", meaning: "Hyvä monella teollisuuden alalla.", tone: "good" },
      {
        label: "Yli 20 %",
        meaning: "Korkea, tyypillinen esimerkiksi ohjelmistoyhtiöille.",
        tone: "good",
      },
    ],
    rangesNote: "Nyrkkisääntö. Vertaa aina saman alan yhtiöihin.",
    companions: [
      { id: "ebit", reason: "Luvun pohja euroina." },
      { id: "liikevaihto", reason: "Kasvaako myynti samalla, kun kannattavuus paranee?" },
      { id: "ps", reason: "Hyvä kate oikeuttaa korkeamman hinnan suhteessa myyntiin." },
      { id: "roe", reason: "Kertoo, kuinka hyvin voitto tuottaa omistajien rahalle." },
    ],
    links: [
      {
        title: "Liikevoittoprosentti ja sen ohjearvot",
        url: "https://fi.wikipedia.org/wiki/Liikevoitto#Liikevoittoprosentti",
        sourceId: "wikipedia-fi",
        language: "fi",
        kind: "selitys",
        checkedAt: "2026-09-25",
      },
      {
        title: "Operating margin: formula and a worked example",
        url: "https://www.investopedia.com/terms/o/operatingmargin.asp",
        sourceId: "investopedia",
        language: "en",
        kind: "esimerkki",
        checkedAt: "2026-09-25",
      },
    ],
  },
  {
    id: "ebitda",
    name: "Käyttökate",
    abbreviation: "EBITDA",
    abbreviationExpanded:
      "Earnings Before Interest, Taxes, Depreciation and Amortization = tulos ennen korkoja, veroja ja poistoja",
    aliases: [
      "ebitda",
      "vertailukelpoinen käyttökate",
      "käyttökateprosentti",
      "ebitda-marginaali",
      "tulos ennen poistoja",
    ],
    category: "kannattavuus",
    level: "syventava",
    question: "Paljonko liiketoiminta tuottaa, ennen kuin koneiden kuluminen vähennetään?",
    summary:
      "[[EBIT|Liikevoitto]] ennen [[poisto|poistoja]]. Kertoo, paljonko liiketoiminta tuottaa ennen koneiden ja laitteiden kulumista. Voi näyttää yhtiön paremmalta kuin se on.",
    analogy:
      "Taksiyrittäjän tulot, kun polttoaine, palkat ja vakuutukset on maksettu, mutta auton arvon laskua ei ole vähennetty. Auto on silti joskus vaihdettava uuteen.",
    formula: {
      words: "Liikevoitto + poistot",
      symbols: "EBIT + poistot ja arvonalentumiset",
      note: "Myyntiin suhteutettuna käyttökate ÷ liikevaihto × 100 % (EBITDA-%), samaan tapaan kuin [[EBIT-%]].",
    },
    example: "Liikevoitto on 30 000 € ja poistot 20 000 €. EBITDA = 30 000 + 20 000 = 50 000 €.",
    unit: "€",
    direction: "higher",
    directionLabel: "Suurempi = yleensä parempi",
    rules: [
      "Poistot ovat todellinen kulu: koneet ja laitteet on joskus uusittava. Katso siksi myös [[EBIT]].",
      "Sopii yhtiöiden vertailuun, kun ne tekevät poistoja eri tavoin.",
      "Suhteuta myyntiin tai [[nettovelka|nettovelkaan]], jotta euromäärä kertoo jotain.",
    ],
    commonMistake:
      "”Käyttökate on voittoa.” Siitä puuttuvat vielä poistot, korot ja verot, joten omistajalle jää paljon vähemmän.",
    factors: [
      "Aloilla, jotka tarvitsevat paljon koneita, kiinteistöjä tai laitteita, EBITDA ja EBIT eroavat paljon. Kevyillä palvelualoilla ero on pieni.",
      "Lainanantajat vertaavat usein nettovelkaa käyttökatteeseen: [[Nettovelka/EBITDA]] kertoo, montako vuoden käyttökatteella velat voisi maksaa.",
      "[[kertaerä|Kertaerät]] vääristävät. Katso myös vertailukelpoista käyttökatetta.",
    ],
    pitfalls: [
      "Yhtiöt korostavat joskus käyttökatetta, koska se on suurempi kuin liikevoitto. Katso aina myös EBIT ja nettotulos.",
      "Käyttökate ei kerro, paljonko rahaa yhtiölle jää: siitä puuttuvat vielä [[investointi|investoinnit]], korot ja verot. Sen kertoo [[Vapaa kassavirta]].",
    ],
    companions: [
      { id: "ebit", reason: "Kertoo, paljonko jää, kun koneiden kuluminen on vähennetty." },
      { id: "ebit-prosentti", reason: "Suhteuttaa voiton myyntiin, jolloin yhtiöitä voi verrata." },
      {
        id: "vapaa-kassavirta",
        reason: "Kertoo, paljonko rahaa oikeasti jää, kun investoinnit on maksettu.",
      },
      {
        id: "nettovelka-ebitda",
        reason: "Suhteuttaa velan käyttökatteeseen: montako vuotta velan maksu veisi.",
      },
      {
        id: "ev-ebitda",
        reason: "Kertoo, paljonko maksat koko yhtiöstä suhteessa käyttökatteeseen.",
      },
    ],
    links: [
      {
        title: "Käyttökatteen määritelmä ja toimialojen tyypilliset tasot",
        url: "https://fi.wikipedia.org/wiki/Käyttökate",
        sourceId: "wikipedia-fi",
        language: "fi",
        kind: "selitys",
        checkedAt: "2026-09-26",
      },
      {
        title: "EBITDA: formulas and why it can overstate profitability",
        url: "https://www.investopedia.com/terms/e/ebitda.asp",
        sourceId: "investopedia",
        language: "en",
        kind: "selitys",
        checkedAt: "2026-09-26",
      },
    ],
  },
  {
    id: "vapaa-kassavirta",
    name: "Vapaa kassavirta",
    abbreviation: "FCF",
    abbreviationExpanded: "Free Cash Flow = vapaa kassavirta",
    aliases: ["fcf", "free cash flow", "vapaa rahavirta", "kassavirta", "rahavirta"],
    category: "kannattavuus",
    level: "syventava",
    question: "Paljonko rahaa yhtiölle jää, kun investoinnit on maksettu?",
    summary:
      "Raha, joka liiketoiminnasta jää käteen, kun [[investointi|investoinnit]] on maksettu. Sillä yhtiö voi maksaa osinkoja ja lyhentää velkaa.",
    analogy:
      "Palkka, josta on vähennetty pakolliset menot ja auton korjaukset. Jäljelle jäävä summa on se, jonka voit oikeasti säästää.",
    formula: {
      words: "Liiketoiminnan kassavirta − investoinnit",
      note: "[[liiketoiminnan kassavirta|Liiketoiminnan kassavirta]] ja investoinnit löytyvät yhtiön rahavirtalaskelmasta. Palvelut laskevat luvun hieman eri tavoin.",
    },
    example:
      "Liiketoiminnasta tulee rahaa 50 milj. € ja investoinnit ovat 20 milj. €. Vapaa kassavirta = 50 − 20 = 30 milj. €.",
    unit: "€",
    direction: "higher",
    directionLabel: "Suurempi = yleensä parempi",
    rules: [
      "Vaihtelee paljon vuodesta toiseen, joten katso usean vuoden keskiarvoa.",
      "Jos kassavirta jää vuosi toisensa jälkeen tulosta pienemmäksi, se on varoitusmerkki.",
      "Kasvuyhtiöllä negatiivinen luku voi johtua suurista investoinneista.",
    ],
    commonMistake:
      "”Hyvä tulos = yhtiölle tulee rahaa.” Maksamattomat laskut ja varastot voivat sitoa rahan, vaikka tulos näyttää hyvältä.",
    factors: [
      "Investoinnit ajoittuvat epätasaisesti: suuri tehdashanke voi painaa yhden vuoden kassavirran pakkaselle.",
      "Kun myynti kasvaa, rahaa sitoutuu usein varastoihin ja asiakkaiden maksamattomiin laskuihin.",
      "Kassavirtaa on vaikeampi kaunistella kirjanpidon keinoin kuin tulosta.",
    ],
    pitfalls: [
      "Yhtiö voi parantaa yhden vuoden kassavirtaa lykkäämällä välttämättömiä investointeja. Se kostautuu myöhemmin.",
      "Yritysostoja ei yleensä vähennetä vapaasta kassavirrasta, vaikka ne vievät rahaa.",
    ],
    companions: [
      {
        id: "ebitda",
        reason: "Käyttökate ennen investointeja: ero kertoo, paljonko investoinnit vievät.",
      },
      { id: "osinkosuhde", reason: "Osinko maksetaan rahasta. Riittääkö kassavirta osinkoon?" },
      { id: "kassavirtatuotto", reason: "Suhteuttaa kassavirran osakkeen hintaan." },
    ],
    links: [
      {
        title: "Kassavirran kolme osaa: toiminta, investoinnit ja rahoitus",
        url: "https://fi.wikipedia.org/wiki/Kassavirta",
        sourceId: "wikipedia-fi",
        language: "fi",
        kind: "selitys",
        checkedAt: "2026-09-26",
      },
      {
        title: "Free cash flow: how to calculate and interpret it",
        url: "https://www.investopedia.com/terms/f/freecashflow.asp",
        sourceId: "investopedia",
        language: "en",
        kind: "selitys",
        checkedAt: "2026-09-26",
      },
    ],
  },
  {
    id: "roe",
    name: "Oman pääoman tuotto",
    abbreviation: "ROE",
    abbreviationExpanded: "Return On Equity = oman pääoman tuotto",
    aliases: ["return on equity", "oman pääoman tuottoprosentti"],
    category: "kannattavuus",
    level: "syventava",
    question: "Kuinka hyvin yhtiö tekee tulosta omistajien rahalla?",
    summary:
      "Kertoo, montako prosenttia yhtiö tekee vuodessa tulosta suhteessa omistajien sijoittamaan rahaan eli [[oma pääoma|omaan pääomaan]].",
    analogy: "Kuin säästötilin korko, mutta yhtiön omistajien rahalle.",
    formula: {
      words: "Tulos ÷ oma pääoma × 100 %",
      symbols: "Nettotulos ÷ oma pääoma × 100 %",
      note: "Omana pääomana käytetään yleensä vuoden alun ja lopun keskiarvoa.",
    },
    example: "Tulos on 10 milj. € ja oma pääoma 100 milj. €. ROE = 10 ÷ 100 × 100 % = 10 %.",
    unit: "%",
    direction: "higher",
    directionLabel: "Suurempi = yleensä parempi",
    rules: [
      "Yli 10–15 % on usein hyvä (nyrkkisääntö).",
      "Velka nostaa ROE:ta, joten tarkista aina myös velkaisuus.",
      "Vakaa taso usean vuoden ajan on arvokkaampi kuin yksi hyvä vuosi.",
    ],
    commonMistake: "Korkea ROE tulkitaan laadukkuudeksi, vaikka taustalla on suuri velka.",
    factors: [
      "Velka: mitä vähemmän omaa pääomaa ja enemmän velkaa, sitä korkeampi ROE samalla tuloksella.",
      "[[osakkeiden takaisinosto|Takaisinostot]] pienentävät omaa pääomaa ja nostavat siten ROE:ta.",
      "[[kertaerä|Kertaerät]] voivat nostaa tai laskea yhden vuoden lukua.",
    ],
    pitfalls: [
      "Jos oma pääoma on hyvin pieni tai negatiivinen, ROE voi olla valtava tai mieletön luku.",
    ],
    ranges: [
      { label: "Negatiivinen", meaning: "Yhtiö tekee tappiota.", tone: "warning" },
      { label: "Alle 5 %", meaning: "Heikko tuotto.", tone: "neutral" },
      { label: "10–15 %", meaning: "Hyvä.", tone: "good" },
      {
        label: "Yli 20 %",
        meaning: "Erinomainen, tai taustalla on paljon velkaa.",
        tone: "neutral",
      },
    ],
    rangesNote: "Nyrkkisääntö. Pankeilla ja pääomavaltaisilla aloilla tasot ovat erilaiset.",
    companions: [
      { id: "pb", reason: "Korkea ROE selittää usein korkeaa P/B-lukua." },
      { id: "nettovelkaantumisaste", reason: "Kertoo, johtuuko korkea ROE velasta." },
      {
        id: "omavaraisuusaste",
        reason: "Näyttää, kuinka suuri osa yhtiöstä on rahoitettu omalla rahalla.",
      },
      {
        id: "roi",
        reason: "Tuotto koko sijoitetulle pääomalle. Suuri ero ROE:hen kertoo velasta.",
      },
    ],
    links: [
      {
        title: "Mitä oman pääoman tuotto kertoo ja miten se lasketaan",
        url: "https://www.nordnet.fi/koulu/roe",
        sourceId: "nordnet",
        language: "fi",
        kind: "selitys",
        checkedAt: "2026-09-25",
      },
      {
        title: "ROE explained: industry differences and the effect of debt",
        url: "https://www.investopedia.com/terms/r/returnonequity.asp",
        sourceId: "investopedia",
        language: "en",
        kind: "selitys",
        checkedAt: "2026-09-25",
      },
    ],
  },
  {
    id: "roi",
    name: "Sijoitetun pääoman tuotto",
    abbreviation: "ROI",
    abbreviationExpanded: "Return On Investment = sijoitetun pääoman tuotto",
    aliases: [
      "roce",
      "return on investment",
      "return on capital employed",
      "sijoitetun pääoman tuottoprosentti",
      "sijoitetun pääoman tuottoaste",
      "pääoman tuotto",
    ],
    category: "kannattavuus",
    level: "syventava",
    question:
      "Kuinka hyvin yhtiö tekee tulosta kaikella siihen sijoitetulla rahalla, myös lainarahalla?",
    summary:
      "Kuin [[ROE]], mutta mukana on myös lainaraha: tulos suhteessa [[sijoitettu pääoma|sijoitettuun pääomaan]]. Velka ei nosta lukua samalla tavalla kuin ROE:ta.",
    analogy:
      "Vuokranantajan tuotto koko asunnon hinnasta eikä vain omasta käsirahasta. Lainalla ostettu asunto voi näyttää hyvältä sijoitukselta, jos katsoo vain käsirahaa.",
    formula: {
      words: "(Tulos ennen veroja + rahoituskulut) ÷ (oma pääoma + korolliset velat) × 100 %",
      note: "ROCE lasketaan liikevoitosta, mutta tulkitaan samoin. Sijoitettuna pääomana käytetään yleensä vuoden alun ja lopun keskiarvoa.",
    },
    example:
      "Tulos ennen veroja on 8 milj. € ja rahoituskulut 2 milj. €. Omaa pääomaa on 60 milj. € ja velkaa 40 milj. €. ROI = 10 ÷ 100 × 100 % = 10 %.",
    unit: "%",
    direction: "higher",
    directionLabel: "Suurempi = yleensä parempi",
    rules: [
      "Alle 5 % on heikko ja vähintään 15 % hyvä (nyrkkisääntö).",
      "Jos ROE on paljon ROI:ta korkeampi, ero johtuu velasta.",
      "Luvun pitäisi selvästi ylittää lainojen korko.",
    ],
    commonMistake:
      "Katsotaan vain ROE:ta, eikä huomata, että korkea tuotto johtuu velasta. ROI paljastaa eron.",
    factors: [
      "Suuret investoinnit, jotka eivät vielä tuota, painavat lukua alas muutaman vuoden ajan.",
      "Pääomavaltaisilla aloilla, kuten teollisuudessa, tasot ovat luonnostaan matalampia kuin palvelualoilla.",
      "[[kertaerä|Kertaerät]] voivat nostaa tai laskea yhden vuoden lukua.",
    ],
    pitfalls: [
      "Eri palvelut käyttävät nimeä ROI, ROCE tai ROIC hieman eri kaavoilla. Vertaa vain samalla tavalla laskettuja lukuja.",
    ],
    ranges: [
      { label: "Negatiivinen", meaning: "Yhtiö tekee tappiota.", tone: "warning" },
      { label: "Alle 5 %", meaning: "Heikko tuotto.", tone: "neutral" },
      { label: "5–14 %", meaning: "Tyydyttävä.", tone: "neutral" },
      { label: "Vähintään 15 %", meaning: "Hyvä.", tone: "good" },
    ],
    rangesNote: "Nyrkkisääntö. Pääomavaltaisilla aloilla tasot ovat matalampia.",
    companions: [
      { id: "roe", reason: "Tuotto pelkälle omalle pääomalle. Suuri ero ROI:hin kertoo velasta." },
      { id: "ebit-prosentti", reason: "Kertoo, johtuuko tuotto hyvistä katteista." },
      {
        id: "nettovelkaantumisaste",
        reason: "Kertoo, kuinka paljon velkaa sijoitetussa pääomassa on.",
      },
    ],
    links: [
      {
        title: "Sijoitetun pääoman tuottoaste: kaava ja ohjearvot",
        url: "https://fi.wikipedia.org/wiki/Sijoitetun_pääoman_tuottoaste",
        sourceId: "wikipedia-fi",
        language: "fi",
        kind: "selitys",
        checkedAt: "2026-09-26",
      },
      {
        title: "ROE, ROI ja ROIC: miten velka vaikuttaa pääoman tuottoon",
        url: "https://www.inderes.fi/articles/kuinka-paaoman-tuotto-maaritellaan-esittelyssa-roe-roi-roic-ja-ronic",
        sourceId: "inderes",
        language: "fi",
        kind: "esimerkki",
        checkedAt: "2026-09-26",
      },
    ],
  },

  // ─── Per osake: Paljonko yhdelle osakkeelle kuuluu? ───────────────────────
  {
    id: "eps",
    name: "Osakekohtainen tulos",
    abbreviation: "EPS",
    abbreviationExpanded: "Earnings Per Share = tulos osaketta kohden",
    aliases: ["earnings per share", "tulos per osake", "tulos/osake"],
    category: "osakekohtaiset",
    level: "perus",
    question: "Paljonko voittoa yhtiö teki yhtä osaketta kohden?",
    summary:
      "Yhtiön [[nettotulos]] jaettuna osakkeiden määrällä. Kertoo, paljonko voittoa kuuluu jokaista omistamaasi osaketta kohden.",
    analogy:
      "Pizzan viipaleen koko: mitä enemmän viipaleita samasta pizzasta leikataan, sitä pienempi on jokainen viipale.",
    formula: {
      words: "Tulos ÷ osakkeiden määrä",
      symbols: "Nettotulos ÷ osakkeiden lkm",
      note: "Käytetään emoyhtiön omistajille kuuluvaa tulosta ja vuoden keskimääräistä osakemäärää.",
    },
    example: "Tulos on 10 milj. € ja osakkeita on 5 milj. kpl. EPS = 10 ÷ 5 = 2 € osaketta kohden.",
    unit: "€/osake",
    direction: "higher",
    directionLabel: "Suurempi = yleensä parempi",
    rules: [
      "Kehityssuunta vuosien yli on tärkeämpi kuin yksi luku.",
      "[[osakeanti|Osakeannit]] pienentävät ja takaisinostot kasvattavat EPS:ää, vaikka tulos ei muuttuisi.",
      "[[kertaerä|Kertaerät]] vääristävät. Katso myös vertailukelpoinen EPS.",
    ],
    commonMistake:
      "Verrataan eri yhtiöiden EPS-lukuja. Luku riippuu osakkeiden määrästä, joten vertaa mieluummin P/E-lukuja.",
    factors: [
      "[[laimentuminen|Laimentuminen]]: jos yhtiö laskee liikkeelle uusia osakkeita, EPS pienenee.",
      "Laimennettu EPS huomioi myös osakkeet, joita esimerkiksi johdon optioista voi syntyä.",
    ],
    pitfalls: [
      "EPS kertoo kirjanpidon tuloksen, ei sitä, paljonko yhtiölle jäi oikeasti rahaa käteen.",
    ],
    companions: [
      { id: "pe", reason: "Kertoo, paljonko maksat osakkeesta suhteessa sen EPS:ään." },
      { id: "osinko-per-osake", reason: "Paljonko EPS:stä maksetaan sinulle osinkona?" },
      { id: "osinkosuhde", reason: "Kertoo, onko osinko kestävä suhteessa tulokseen." },
    ],
    links: [
      {
        title: "Tärkeimmät tunnusluvut: EPS, P/E, osinkotuotto ja P/B",
        url: "https://www.porssisaatio.fi/osakesijoittajan-tarkeimmat-tunnusluvut/",
        sourceId: "porssisaatio",
        language: "fi",
        kind: "selitys",
        checkedAt: "2026-09-25",
      },
      {
        title: "Osakekohtaisen tuloksen lyhyt määritelmä",
        url: "https://fi.wikipedia.org/wiki/EPS_(talous)",
        sourceId: "wikipedia-fi",
        language: "fi",
        kind: "selitys",
        checkedAt: "2026-09-25",
      },
      {
        title: "EPS explained: basic vs. diluted EPS, with an example",
        url: "https://www.investopedia.com/terms/e/eps.asp",
        sourceId: "investopedia",
        language: "en",
        kind: "esimerkki",
        checkedAt: "2026-09-25",
      },
    ],
  },
  {
    id: "osinko-per-osake",
    name: "Osinko/osake",
    aliases: ["osakekohtainen osinko", "dividend per share", "dps", "osinko per osake"],
    category: "osakekohtaiset",
    level: "perus",
    question: "Paljonko rahaa saat jokaisesta omistamastasi osakkeesta?",
    summary:
      "[[osinko|Osinko]] euroina yhtä osaketta kohden. Kun kerrot sen omistamiesi osakkeiden määrällä, saat osinkotulosi ennen veroja.",
    analogy: "Kuin vuokra, jonka sijoitusasunto maksaa sinulle.",
    formula: {
      words: "Jaettavat osingot yhteensä ÷ osakkeiden määrä",
      note: "Osinko voidaan maksaa kerran vuodessa tai useammassa erässä.",
    },
    example: "Yhtiö jakaa osinkoina 10 milj. € ja osakkeita on 10 milj. kpl. Osinko/osake = 1 €.",
    unit: "€/osake",
    direction: "higher",
    directionLabel: "Suurempi = parempi, jos kestävä",
    rules: [
      "Jos osinko on suurempi kuin [[EPS]], tasoa ei voi jatkaa pitkään.",
      "Tasainen tai nouseva osinkohistoria kertoo vakaudesta.",
      "Euromäärä ei yksin kerro paljoa. Suhteuta se osakkeen hintaan.",
    ],
    commonMistake:
      "Katsotaan euromäärää ilman suhdetta osakkeen hintaan. 1 € on paljon 10 €:n osakkeelle mutta vähän 200 €:n osakkeelle.",
    factors: [
      "Yhtiön osinkopolitiikka: moni yhtiö kertoo, montako prosenttia tuloksesta se aikoo jakaa.",
      "Kasvuyhtiöt jakavat usein vähän tai eivät lainkaan, koska ne käyttävät rahan kasvuun.",
      "Osingosta maksetaan veroa, mikä pienentää käteen jäävää summaa.",
    ],
    pitfalls: [
      "Osinko voi sisältää kertaluonteisen lisäosingon, joka ei toistu seuraavana vuonna.",
    ],
    companions: [
      { id: "osinkotuotto", reason: "Suhteuttaa osingon osakkeen hintaan." },
      { id: "osinkosuhde", reason: "Kertoo, onko osingolle katetta tuloksessa." },
      { id: "eps", reason: "Osingon pitäisi yleensä olla pienempi kuin EPS." },
    ],
    links: [
      {
        title: "Mikä osinko on, kuka siitä päättää ja milloin se maksetaan",
        url: "https://fi.wikipedia.org/wiki/Osinko",
        sourceId: "wikipedia-fi",
        language: "fi",
        kind: "selitys",
        checkedAt: "2026-09-25",
      },
      {
        title: "Dividend per share: formula and what a rising DPS tells",
        url: "https://www.investopedia.com/terms/d/dividend-per-share.asp",
        sourceId: "investopedia",
        language: "en",
        kind: "selitys",
        checkedAt: "2026-09-25",
      },
    ],
  },

  // ─── Osinko: Paljonko osinkoa saan, ja onko se kestävää? ──────────────────
  {
    id: "osinkotuotto",
    name: "Osinkotuotto",
    aliases: ["osinkoprosentti", "dividend yield", "osinkotuottoprosentti"],
    category: "osinko",
    level: "perus",
    question: "Montako prosenttia osakkeen hinnasta saat vuodessa osinkona?",
    summary:
      "[[osinko|Osinko]] prosentteina osakkeen hinnasta. Kertoo, kuinka paljon sijoituksesi tuottaa vuodessa osinkoina, jos osinko pysyy samana.",
    analogy: "Kuin vuokratuotto: asunnon vuosivuokra prosentteina asunnon hinnasta.",
    formula: {
      words: "Osinko/osake ÷ osakkeen hinta × 100 %",
      symbols: "Osinko/osake ÷ kurssi × 100 %",
    },
    example: "Osinko on 1 € ja osake maksaa 25 €. Osinkotuotto = 1 ÷ 25 × 100 % = 4 %.",
    unit: "%",
    direction: "range",
    directionLabel: "Sopiva väli on paras",
    rules: [
      "Hyvin korkea tuotto voi olla ”osinkoansa”: kurssi on laskenut ongelmien takia.",
      "Tarkista [[osinkosuhde]]: onko osingolle katetta tuloksessa?",
      "Kasvuyhtiöt jakavat usein vähän osinkoa tarkoituksella.",
    ],
    commonMistake:
      "”Korkein osinkotuotto = paras osake.” Korkea tuotto voi ennakoida osingon leikkausta.",
    factors: [
      "Kun [[pörssikurssi|kurssi]] laskee, osinkotuotto nousee, vaikka osinko ei muuttuisi.",
      "Palveluiden ilmoittama osinkotuotto voi perustua viime vuoden osinkoon tai ennusteeseen.",
      "Osinko on vain osa tuotosta: myös osakkeen hinnan muutos vaikuttaa.",
    ],
    pitfalls: ["Osinkotuotto kertoo menneestä tai ennustetusta osingosta, ei takaa tulevaa."],
    ranges: [
      {
        label: "0 %",
        meaning: "Ei osinkoa. Usein kasvuyhtiö tai yhtiö, jolla on vaikeuksia.",
        tone: "neutral",
      },
      { label: "2–5 %", meaning: "Tavallinen taso monella vakaalla yhtiöllä.", tone: "neutral" },
      {
        label: "Yli 8 %",
        meaning: "Poikkeuksellisen korkea. Tarkista, onko osinko kestävä.",
        tone: "warning",
      },
    ],
    rangesNote: "Nyrkkisääntö. Tavallinen taso riippuu korkotasosta ja toimialasta.",
    companions: [
      {
        id: "osinkosuhde",
        reason: "Paljastaa osinkoansan: jaetaanko enemmän kuin tehdään tulosta?",
      },
      {
        id: "osinko-per-osake",
        reason: "Näyttää, onko osinko kasvanut vai laskenut vuosien mittaan.",
      },
      {
        id: "pe",
        reason: "Matala P/E ja korkea osinkotuotto voivat kertoa markkinoiden epäluottamuksesta.",
      },
      {
        id: "kassavirtatuotto",
        reason: "Jos osinkotuotto on kassavirtatuottoa suurempi, osinkoa ei voi jatkaa pitkään.",
      },
    ],
    links: [
      {
        title: "Tärkeimmät tunnusluvut: osinkotuotto, EPS, P/E ja P/B",
        url: "https://www.porssisaatio.fi/osakesijoittajan-tarkeimmat-tunnusluvut/",
        sourceId: "porssisaatio",
        language: "fi",
        kind: "selitys",
        checkedAt: "2026-09-25",
      },
      {
        title: "Osinkotuoton määritelmä ja tulkinta",
        url: "https://fi.wikipedia.org/wiki/Osinkotuotto",
        sourceId: "wikipedia-fi",
        language: "fi",
        kind: "selitys",
        checkedAt: "2026-09-25",
      },
      {
        title: "Dividend yield: why a high yield can be a warning sign",
        url: "https://www.investopedia.com/terms/d/dividendyield.asp",
        sourceId: "investopedia",
        language: "en",
        kind: "esimerkki",
        checkedAt: "2026-09-25",
      },
    ],
  },
  {
    id: "osinkosuhde",
    name: "Osinkosuhde",
    aliases: ["osingonjakosuhde", "payout ratio", "jakosuhde"],
    category: "osinko",
    level: "syventava",
    question: "Kuinka suuren osan voitostaan yhtiö jakaa osinkoina?",
    summary:
      "Kertoo, montako prosenttia tuloksesta maksetaan [[osinko|osinkoina]]. Paljastaa, onko osinko kestävällä pohjalla.",
    analogy: "Kuinka suuren osan palkastasi kulutat ja kuinka suuren säästät.",
    formula: {
      words: "Osinko/osake ÷ osakekohtainen tulos × 100 %",
      symbols: "Osinko/osake ÷ EPS × 100 %",
    },
    example: "Osinko on 1 € ja EPS 2 €. Osinkosuhde = 1 ÷ 2 × 100 % = 50 %.",
    unit: "%",
    direction: "range",
    directionLabel: "Sopiva väli on paras",
    rules: [
      "Noin 30–70 % on usein kestävää (nyrkkisääntö).",
      "Yli 100 %: osinkoa maksetaan enemmän kuin tehtiin tulosta. Tämä ei jatku pitkään.",
      "Kasvava yhtiö tarvitsee rahaa investointeihin, joten matala suhde voi olla järkevä.",
    ],
    commonMistake: "Katsotaan vain osinkotuottoa eikä tarkisteta, onko osingolle katetta.",
    factors: [
      "Vakailla aloilla, kuten sähköyhtiöillä, osinkosuhde voi olla korkea ilman ongelmia.",
      "Yksi huono vuosi voi nostaa suhdetta hetkellisesti, jos yhtiö haluaa pitää osingon ennallaan.",
    ],
    pitfalls: [
      "[[kertaerä|Kertaerät]] tuloksessa voivat saada osinkosuhteen näyttämään paremmalta tai huonommalta kuin se on.",
    ],
    ranges: [
      {
        label: "Alle 30 %",
        meaning: "Yhtiö käyttää suurimman osan voitosta kasvuun.",
        tone: "neutral",
      },
      { label: "30–70 %", meaning: "Usein kestävä taso.", tone: "good" },
      { label: "70–100 %", meaning: "Korkea, pelivara on pieni.", tone: "neutral" },
      {
        label: "Yli 100 %",
        meaning: "Osinko on suurempi kuin tulos. Leikkauksen riski.",
        tone: "warning",
      },
    ],
    rangesNote: "Nyrkkisääntö. Vaihtelee toimialoittain.",
    companions: [
      { id: "osinkotuotto", reason: "Kertoo, paljonko osinkoa saat suhteessa hintaan." },
      { id: "eps", reason: "Osinkosuhteen pohja: kasvaako tulos, josta osinko maksetaan?" },
      { id: "osinko-per-osake", reason: "Osingon euromäärä ja sen kehitys." },
      {
        id: "vapaa-kassavirta",
        reason: "Osinko maksetaan rahasta. Riittääkö kassavirta osinkoon?",
      },
    ],
    links: [
      {
        title: "Osinkosuhde ja miksi se voi joskus ylittää 100 %",
        url: "https://fi.wikipedia.org/wiki/Osinkosuhde",
        sourceId: "wikipedia-fi",
        language: "fi",
        kind: "selitys",
        checkedAt: "2026-09-25",
      },
      {
        title: "Payout ratio: formula, example and industry differences",
        url: "https://www.investopedia.com/terms/p/payoutratio.asp",
        sourceId: "investopedia",
        language: "en",
        kind: "esimerkki",
        checkedAt: "2026-09-25",
      },
    ],
  },

  // ─── Velka: Onko yhtiöllä liikaa velkaa? ──────────────────────────────────
  {
    id: "omavaraisuusaste",
    name: "Omavaraisuusaste",
    aliases: ["omavaraisuus", "equity ratio"],
    category: "velka",
    level: "perus",
    question: "Kuinka suuri osa yhtiön omaisuudesta on rahoitettu omalla rahalla?",
    summary:
      "Kertoo, montako prosenttia yhtiön omaisuudesta on rahoitettu omistajien rahalla eikä velalla. Mitä suurempi luku, sitä paremmin yhtiö kestää huonoja aikoja.",
    analogy: "Kuinka suuren osan asunnostasi omistat itse ja kuinka suuren osan pankki.",
    formula: {
      words: "Oma pääoma ÷ (taseen loppusumma − saadut ennakot) × 100 %",
      note: "[[saadut ennakot|Saadut ennakot]] vähennetään, koska ne eivät ole tavallista velkaa.",
    },
    example:
      "Oma pääoma on 40 milj. € ja taseen loppusumma 100 milj. €. Omavaraisuusaste = 40 ÷ 100 × 100 % = 40 %.",
    unit: "%",
    direction: "higher",
    directionLabel: "Suurempi = yleensä vakaampi",
    rules: [
      "Yli 40 % on usein vakaa ja alle 20 % heikko (nyrkkisääntö).",
      "Pankeilla ja kiinteistöyhtiöillä taso on luonnostaan matalampi.",
      "Seuraa suuntaa: laskeva omavaraisuus kertoo velan kasvusta.",
    ],
    commonMistake:
      "”Mitä korkeampi, sen parempi.” Velaton yhtiö voi jättää kasvumahdollisuuksia käyttämättä.",
    factors: [
      "[[toimiala|Toimiala]]: tasaisen kassavirran yhtiöt voivat kantaa enemmän velkaa turvallisesti.",
      "Suuret tappiot pienentävät [[oma pääoma|omaa pääomaa]] ja siten omavaraisuusastetta.",
      "Suuret osingot ja takaisinostot pienentävät omaa pääomaa.",
    ],
    pitfalls: [
      "Luku ei kerro, paljonko yhtiöllä on käteistä. Katso siksi myös nettovelkaantumisaste.",
    ],
    ranges: [
      { label: "Alle 20 %", meaning: "Heikko, paljon velkaa.", tone: "warning" },
      { label: "20–40 %", meaning: "Tyydyttävä.", tone: "neutral" },
      { label: "Yli 40 %", meaning: "Vakaa.", tone: "good" },
    ],
    rangesNote: "Nyrkkisääntö. Ei sovellu pankeille.",
    companions: [
      {
        id: "nettovelkaantumisaste",
        reason: "Huomioi myös yhtiön käteisen, joten velkakuva tarkentuu.",
      },
      { id: "roe", reason: "Matala omavaraisuus nostaa ROE:ta. Katso molemmat yhdessä." },
    ],
    links: [
      {
        title: "Laskukaava, ohjearvot ja yhteys konkurssiriskiin",
        url: "https://fi.wikipedia.org/wiki/Omavaraisuusaste",
        sourceId: "wikipedia-fi",
        language: "fi",
        kind: "selitys",
        checkedAt: "2026-09-25",
      },
    ],
  },
  {
    id: "nettovelkaantumisaste",
    name: "Nettovelkaantumisaste",
    aliases: ["gearing", "velkaantumisaste", "nettovelka / oma pääoma"],
    category: "velka",
    level: "syventava",
    question: "Paljonko yhtiöllä on velkaa suhteessa omistajien rahaan?",
    summary:
      "[[nettovelka|Nettovelka]] prosentteina [[oma pääoma|omasta pääomasta]]. Kertoo, kuinka raskas velkataakka on, kun yhtiön käteinen on ensin vähennetty veloista.",
    analogy:
      "Asuntolaina miinus säästötilisi, suhteessa siihen, kuinka suuren osan asunnosta omistat itse.",
    formula: {
      words: "(Korolliset velat − kassa) ÷ oma pääoma × 100 %",
      symbols: "Nettovelka ÷ oma pääoma × 100 %",
    },
    example:
      "Velkaa on 60 milj. €, kassaa 20 milj. € ja omaa pääomaa 80 milj. €. (60 − 20) ÷ 80 × 100 % = 50 %.",
    unit: "%",
    direction: "lower",
    directionLabel: "Pienempi = yleensä vähäriskisempi",
    rules: [
      "Alle 50 % on usein maltillinen ja yli 100 % paljon (nyrkkisääntö).",
      "Negatiivinen luku: käteistä on enemmän kuin velkaa.",
      "Velka on riskialttiimpaa, kun tulos heiluu tai korot nousevat.",
    ],
    commonMistake:
      "Velkaa pidetään aina pahana. Vakaan tuloksen yhtiö voi kantaa velkaa turvallisesti.",
    factors: [
      "Tuloksen vakaus: tasainen tulos kestää enemmän velkaa kuin vaihteleva.",
      "Korkotaso: kun korot nousevat, velan hoito käy kalliimmaksi.",
      "Velan erääntyminen: jos paljon velkaa erääntyy pian, yhtiön on saatava uutta rahoitusta.",
    ],
    pitfalls: [
      "Jos [[oma pääoma]] on hyvin pieni, luku voi näyttää valtavalta, vaikka velkaa ei olisi paljon euroina.",
    ],
    ranges: [
      { label: "Negatiivinen", meaning: "Enemmän käteistä kuin velkaa.", tone: "good" },
      { label: "0–50 %", meaning: "Maltillinen velka.", tone: "good" },
      { label: "50–100 %", meaning: "Paljon velkaa, seuraa tilannetta.", tone: "neutral" },
      { label: "Yli 100 %", meaning: "Velkaa enemmän kuin omaa pääomaa.", tone: "warning" },
    ],
    rangesNote: "Nyrkkisääntö. Kiinteistö- ja infrayhtiöillä tasot ovat usein korkeampia.",
    companions: [
      { id: "omavaraisuusaste", reason: "Toinen näkökulma velkaisuuteen, koko taseen kautta." },
      { id: "ev", reason: "Nettovelka on se osa, jolla EV eroaa markkina-arvosta." },
      { id: "roe", reason: "Paljastaa, onko korkea ROE saavutettu velalla." },
      {
        id: "nettovelka-ebitda",
        reason: "Kertoo, pystyykö yhtiö maksamaan velkansa tuloksellaan.",
      },
    ],
    links: [
      {
        title: "Laskukaava, ohjearvot ja vertailu omavaraisuusasteeseen",
        url: "https://fi.wikipedia.org/wiki/Nettovelkaantumisaste",
        sourceId: "wikipedia-fi",
        language: "fi",
        kind: "selitys",
        checkedAt: "2026-09-25",
      },
    ],
  },

  {
    id: "nettovelka-ebitda",
    name: "Nettovelka/EBITDA",
    aliases: [
      "nettovelka/käyttökate",
      "net debt to ebitda",
      "velkaantuneisuus",
      "leverage",
      "velan takaisinmaksuaika",
    ],
    category: "velka",
    level: "syventava",
    question: "Montako vuotta yhtiöltä kuluisi velkojen maksamiseen käyttökatteellaan?",
    summary:
      "[[nettovelka|Nettovelka]] jaettuna [[EBITDA|käyttökatteella]]. Kertoo, pystyykö yhtiö maksamaan velkansa tuloksellaan, eikä vain sitä, paljonko velkaa on.",
    analogy:
      "Asuntolaina, josta on vähennetty säästöt, jaettuna vuoden tuloilla ennen asumiskuluja. Mitä pienempi luku, sitä nopeammin laina olisi maksettu.",
    formula: {
      words: "Nettovelka ÷ käyttökate",
      symbols: "(Korolliset velat − kassa) ÷ EBITDA",
    },
    example: "Nettovelka on 60 milj. € ja käyttökate 30 milj. €. Nettovelka/EBITDA = 60 ÷ 30 = 2.",
    unit: "x",
    direction: "lower",
    directionLabel: "Pienempi = yleensä vähäriskisempi",
    rules: [
      "Alle 1 on vähän, 1–3 tavallinen ja yli 3 paljon (nyrkkisääntö).",
      "Vakaat alat, kuten kiinteistöt ja sähköyhtiöt, kantavat enemmän velkaa.",
      "Negatiivinen luku tarkoittaa, että [[kassa|rahaa]] on enemmän kuin velkaa.",
    ],
    commonMistake:
      "Negatiivinen luku tulkitaan huonoksi, vaikka se tarkoittaa, että yhtiöllä on enemmän rahaa kuin velkaa.",
    factors: [
      "Lainaehdoissa on usein tälle luvulle yläraja. Jos se ylittyy, pankki voi vaatia korkeampaa korkoa tai lainan takaisinmaksua.",
      "Suhdanneherkällä yhtiöllä käyttökate voi pudota nopeasti, jolloin luku nousee, vaikka velka ei kasva.",
      "Käyttökatteesta puuttuvat investoinnit, korot ja verot, joten velan maksu kestää todellisuudessa kauemmin.",
    ],
    pitfalls: [
      "Jos käyttökate on negatiivinen, lukua ei voi tulkita.",
      "Yritysoston jälkeen velka näkyy heti, mutta ostetun yhtiön käyttökate vasta vähitellen. Luku voi näyttää hetken liian korkealta.",
    ],
    ranges: [
      { label: "Negatiivinen", meaning: "Rahaa on enemmän kuin velkaa.", tone: "good" },
      { label: "Alle 1", meaning: "Vähän velkaa.", tone: "good" },
      { label: "1–3", meaning: "Tavallinen taso monella alalla.", tone: "neutral" },
      {
        label: "Yli 3",
        meaning: "Paljon velkaa. Huonona vuonna velan hoito voi käydä raskaaksi.",
        tone: "warning",
      },
    ],
    rangesNote: "Nyrkkisääntö. Vakailla aloilla velkaa on luonnostaan enemmän.",
    companions: [
      {
        id: "nettovelkaantumisaste",
        reason: "Vertaa samaa nettovelkaa omistajien rahaan eikä tulokseen.",
      },
      { id: "ebitda", reason: "Luvun jakaja: kuinka vakaa käyttökate on?" },
      { id: "omavaraisuusaste", reason: "Toinen näkökulma velkaisuuteen, koko taseen kautta." },
    ],
    links: [
      {
        title: "Net debt to EBITDA: formula, typical levels and examples",
        url: "https://www.investopedia.com/terms/n/net-debt-to-ebitda-ratio.asp",
        sourceId: "investopedia",
        language: "en",
        kind: "esimerkki",
        checkedAt: "2026-09-26",
      },
    ],
  },

  // ─── Hinta: Onko osake halpa vai kallis? ──────────────────────────────────
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
    links: [
      {
        title: "P/E-luku ja sen tulkinta laskuesimerkin kanssa",
        url: "https://www.porssisaatio.fi/osakesijoittajan-tarkeimmat-tunnusluvut/",
        sourceId: "porssisaatio",
        language: "fi",
        kind: "selitys",
        checkedAt: "2026-09-25",
      },
      {
        title: "P/E-luvun määritelmä ja käytön ongelmat",
        url: "https://fi.wikipedia.org/wiki/P/E-luku",
        sourceId: "wikipedia-fi",
        language: "fi",
        kind: "selitys",
        checkedAt: "2026-09-25",
      },
      {
        title: "P/E ratio explained: forward vs. trailing P/E, with examples",
        url: "https://www.investopedia.com/terms/p/price-earningsratio.asp",
        sourceId: "investopedia",
        language: "en",
        kind: "esimerkki",
        checkedAt: "2026-09-25",
      },
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
    links: [
      {
        title: "PEG-luvun laskeminen esimerkin avulla ja sen rajoitukset",
        url: "https://www.inderes.fi/questions-and-answers/kasvuyhtiosijoittaminen-ja-peg-luku",
        sourceId: "inderes",
        language: "fi",
        kind: "esimerkki",
        checkedAt: "2026-09-25",
      },
      {
        title: "PEG ratio: formula and why the growth estimate matters",
        url: "https://www.investopedia.com/terms/p/pegratio.asp",
        sourceId: "investopedia",
        language: "en",
        kind: "selitys",
        checkedAt: "2026-09-25",
      },
    ],
  },
  {
    id: "ev-ebit",
    name: "EV/EBIT-luku",
    abbreviation: "EV/EBIT",
    abbreviationExpanded: "Yritysarvo suhteessa liikevoittoon",
    aliases: ["ev/ebit", "ev ebit", "yritysarvo per liikevoitto"],
    category: "arvostus",
    level: "syventava",
    question: "Montako vuoden liikevoittoa maksat koko yhtiöstä velkoineen?",
    summary:
      "Kuin [[P/E]], mutta velat huomioiden: [[EV|yritysarvo]] jaettuna [[EBIT|liikevoitolla]]. Sopii hyvin eri tavoin velkaantuneiden yhtiöiden vertailuun.",
    analogy: "P/E laskettuna asunnon velattomalla hinnalla pelkän myyntihinnan sijaan.",
    formula: {
      words: "Yritysarvo ÷ liikevoitto",
      symbols: "EV ÷ EBIT",
    },
    example: "EV on 100 milj. € ja EBIT 10 milj. €. EV/EBIT = 100 ÷ 10 = 10.",
    unit: "x",
    direction: "lower",
    directionLabel: "Pienempi = yleensä halvempi",
    rules: [
      "Parempi kuin P/E, kun yhtiöillä on eri määrä velkaa.",
      "Vertaa saman [[toimiala|alan]] yhtiöihin ja yhtiön omaan historiaan.",
      "Ei toimi, jos liikevoitto on negatiivinen.",
    ],
    commonMistake:
      "Verrataan velattomia ja velkaisia yhtiöitä P/E:llä, vaikka EV/EBIT sopisi paremmin.",
    factors: [
      "[[kertaerä|Kertaerät]] liikevoitossa vääristävät lukua. Käytä mieluummin vertailukelpoista EBITiä.",
      "Nopeasti kasvavalla yhtiöllä luku on usein korkea, kuten P/E:kin.",
    ],
    pitfalls: [
      "Eri palvelut laskevat EV:n hieman eri tavoin, joten lähteiden luvut voivat poiketa toisistaan.",
    ],
    ranges: [
      {
        label: "Alle 8",
        meaning: "Halpa, tai markkinat odottavat voiton laskevan.",
        tone: "neutral",
      },
      { label: "8–15", meaning: "Tavallinen taso monella alalla.", tone: "neutral" },
      {
        label: "Yli 20",
        meaning: "Kallis, tai markkinat odottavat nopeaa kasvua.",
        tone: "warning",
      },
    ],
    rangesNote: "Nyrkkisääntö. Tasot vaihtelevat toimialoittain ja ajan mukaan.",
    companions: [
      {
        id: "pe",
        reason: "Jos P/E ja EV/EBIT eroavat paljon, velalla tai käteisellä on suuri vaikutus.",
      },
      { id: "ev", reason: "Luvun pohja: mitä koko yhtiö maksaa velkoineen." },
      { id: "ebit-prosentti", reason: "Korkea kannattavuus voi oikeuttaa korkeamman luvun." },
      { id: "ev-ebitda", reason: "Sama vertailu ennen poistoja." },
    ],
    links: [
      {
        title: "Yritysarvo ja EV/EBIT: miksi velat ja kassa pitää huomioida",
        url: "https://www.inderes.fi/articles/mika-enterprise-value-eli-ev-enta-evebit-ja-evebitda",
        sourceId: "inderes",
        language: "fi",
        kind: "esimerkki",
        checkedAt: "2026-09-25",
      },
    ],
  },
  {
    id: "ev-sales",
    name: "EV/Sales-luku",
    abbreviation: "EV/Sales",
    abbreviationExpanded: "Enterprise Value / Sales = yritysarvo suhteessa myyntiin",
    aliases: [
      "ev/s",
      "ev/sales",
      "ev/liikevaihto",
      "yritysarvo per liikevaihto",
      "enterprise value to sales",
    ],
    category: "arvostus",
    level: "syventava",
    question: "Paljonko maksat koko yhtiöstä velkoineen jokaista myyntieuroa kohden?",
    summary:
      "Kuin [[P/S]], mutta velat huomioiden: [[EV|yritysarvo]] jaettuna [[liikevaihto|liikevaihdolla]]. Toimii myös yhtiöille, jotka eivät vielä tee voittoa.",
    analogy:
      "P/S laskettuna asunnon velattomalla hinnalla: taloyhtiölainan osuus kuuluu hintaan, vaikka sitä ei makseta kaupanteossa.",
    formula: {
      words: "Yritysarvo ÷ liikevaihto",
      symbols: "EV ÷ liikevaihto",
    },
    example: "EV on 300 milj. € ja liikevaihto 150 milj. €. EV/Sales = 300 ÷ 150 = 2.",
    unit: "x",
    direction: "lower",
    directionLabel: "Pienempi = yleensä halvempi",
    rules: [
      "Parempi kuin P/S, kun yhtiöillä on eri määrä velkaa.",
      "Toimii myös yhtiöille, joilla ei vielä ole voittoa.",
      "Vertaa vain saman [[toimiala|alan]] yhtiöihin: tulkinta riippuu [[kate|katteista]].",
    ],
    commonMistake:
      "Verrataan eri alojen yhtiöitä. Ohjelmistoyhtiön EV/Sales on luonnostaan korkeampi kuin kauppaketjun.",
    factors: [
      "Kannattavuus: korkeampi [[EBIT-%]] oikeuttaa korkeamman luvun.",
      "Kasvuvauhti: nopeasti kasvavan yhtiön luku on usein korkea. Katso [[TTM-kasvu]].",
      "Jos yhtiöllä on enemmän [[kassa|käteistä]] kuin velkaa, EV/Sales on pienempi kuin P/S.",
    ],
    pitfalls: [
      "Matala luku voi kertoa vain siitä, että myynnistä ei jää juuri voittoa.",
      "Eri palvelut laskevat EV:n hieman eri tavoin, joten lähteiden luvut voivat poiketa toisistaan.",
    ],
    ranges: [
      {
        label: "Alle 1",
        meaning: "Halpa myyntiin nähden, tai kannattavuus on heikko.",
        tone: "neutral",
      },
      { label: "1–3", meaning: "Tavallinen taso monella alalla.", tone: "neutral" },
      {
        label: "Yli 5",
        meaning: "Kallis, tai markkinat odottavat nopeaa kasvua ja hyviä katteita.",
        tone: "warning",
      },
    ],
    rangesNote: "Nyrkkisääntö. Riippuu vahvasti toimialasta ja kannattavuudesta.",
    companions: [
      {
        id: "ps",
        reason: "Sama luku ilman velkoja. Suuri ero kertoo velasta tai käteisestä.",
      },
      { id: "ev", reason: "Luvun pohja: mitä koko yhtiö maksaa velkoineen." },
      { id: "ebit-prosentti", reason: "Kertoo, kuinka suuri osa myynnistä jää voitoksi." },
      { id: "ttm-kasvu", reason: "Nopea myynnin kasvu selittää usein korkeaa lukua." },
    ],
    links: [
      {
        title: "Yritysarvo (EV): miksi velat ja kassa pitää huomioida",
        url: "https://www.inderes.fi/articles/mika-enterprise-value-eli-ev-enta-evebit-ja-evebitda",
        sourceId: "inderes",
        language: "fi",
        kind: "selitys",
        checkedAt: "2026-09-26",
      },
      {
        title: "EV/Sales: formula, typical levels and comparison to P/S",
        url: "https://www.investopedia.com/terms/e/enterprisevaluesales.asp",
        sourceId: "investopedia",
        language: "en",
        kind: "selitys",
        checkedAt: "2026-09-26",
      },
    ],
  },
  {
    id: "ev-ebitda",
    name: "EV/EBITDA-luku",
    abbreviation: "EV/EBITDA",
    abbreviationExpanded: "Yritysarvo suhteessa käyttökatteeseen",
    aliases: ["ev/ebitda", "ev ebitda", "enterprise multiple", "yritysarvo per käyttökate"],
    category: "arvostus",
    level: "syventava",
    question: "Montako vuoden käyttökatetta maksat koko yhtiöstä velkoineen?",
    summary:
      "Kuin [[EV/EBIT]], mutta ennen [[poisto|poistoja]]: [[EV|yritysarvo]] jaettuna [[EBITDA|käyttökatteella]]. Yleinen vertailuluku yritysostoissa.",
    analogy: "EV/EBIT, kun koneiden ja laitteiden kulumista ei vielä ole vähennetty.",
    formula: {
      words: "Yritysarvo ÷ käyttökate",
      symbols: "EV ÷ EBITDA",
    },
    example: "EV on 240 milj. € ja käyttökate 30 milj. €. EV/EBITDA = 240 ÷ 30 = 8.",
    unit: "x",
    direction: "lower",
    directionLabel: "Pienempi = yleensä halvempi",
    rules: [
      "Sopii vertailuun, kun yhtiöt tekevät poistoja eri tavoin.",
      "Paljon koneita ja laitteita tarvitsevilla aloilla EV/EBIT on luotettavampi.",
      "Ei toimi, jos käyttökate on negatiivinen.",
    ],
    commonMistake:
      "Matalaa lukua pidetään halpana, vaikka suuret poistot syövät liikevoiton. Katso aina myös EV/EBIT.",
    factors: [
      "Vertaa saman [[toimiala|alan]] yhtiöihin ja yhtiön omaan historiaan.",
      "Nopeasti kasvavalla yhtiöllä luku on usein korkea, kuten P/E:kin.",
      "[[kertaerä|Kertaerät]] käyttökatteessa vääristävät lukua.",
    ],
    pitfalls: [
      "Matala luku voi olla arvoansa: osake näyttää halvalta, koska liiketoiminnan näkymät ovat heikot.",
      "Eri palvelut laskevat EV:n hieman eri tavoin, joten lähteiden luvut voivat poiketa toisistaan.",
    ],
    ranges: [
      {
        label: "Alle 6",
        meaning: "Halpa, tai markkinat odottavat käyttökatteen laskevan.",
        tone: "neutral",
      },
      { label: "6–12", meaning: "Tavallinen taso monella alalla.", tone: "neutral" },
      {
        label: "Yli 15",
        meaning: "Kallis, tai markkinat odottavat nopeaa kasvua.",
        tone: "warning",
      },
    ],
    rangesNote: "Nyrkkisääntö. Tasot vaihtelevat toimialoittain ja ajan mukaan.",
    companions: [
      {
        id: "ev-ebit",
        reason: "Sama poistojen jälkeen. Suuri ero kertoo raskaista investoinneista.",
      },
      { id: "ebitda", reason: "Luvun jakaja: mistä käyttökate koostuu?" },
      { id: "ev", reason: "Luvun pohja: mitä koko yhtiö maksaa velkoineen." },
    ],
    links: [
      {
        title: "Yritysarvo, EV/EBIT ja EV/EBITDA",
        url: "https://www.inderes.fi/articles/mika-enterprise-value-eli-ev-enta-evebit-ja-evebitda",
        sourceId: "inderes",
        language: "fi",
        kind: "esimerkki",
        checkedAt: "2026-09-26",
      },
      {
        title: "EV/EBITDA (enterprise multiple) and the value trap",
        url: "https://www.investopedia.com/terms/e/ev-ebitda.asp",
        sourceId: "investopedia",
        language: "en",
        kind: "selitys",
        checkedAt: "2026-09-26",
      },
    ],
  },
  {
    id: "pb",
    name: "P/B-luku",
    abbreviation: "P/B",
    abbreviationExpanded: "Price / Book = hinta suhteessa kirjanpitoarvoon",
    aliases: ["p/b", "hinta-kirjanpitoarvo", "price to book", "p/bv"],
    category: "arvostus",
    level: "syventava",
    question: "Paljonko maksat suhteessa yhtiön kirjanpidolliseen arvoon?",
    summary:
      "Osakkeen hinta suhteessa [[oma pääoma|omaan pääomaan]] osaketta kohden. Kertoo, maksatko enemmän vai vähemmän kuin kirjanpidossa näkyvä omaisuus velkojen jälkeen.",
    analogy:
      "Maksaisitko talosta enemmän vai vähemmän kuin sen tontti ja rakennus ovat kirjanpidossa arvoltaan?",
    formula: {
      words: "Osakkeen hinta ÷ oma pääoma osaketta kohden",
      symbols: "Kurssi ÷ (oma pääoma ÷ osakkeiden lkm)",
    },
    example: "Osake maksaa 20 € ja omaa pääomaa on 10 € osaketta kohden. P/B = 20 ÷ 10 = 2.",
    unit: "x",
    direction: "lower",
    directionLabel: "Pienempi = yleensä halvempi",
    rules: [
      "Alle 1: osake maksaa vähemmän kuin kirjanpidon oma pääoma.",
      "Hyödyllisin pankeille sekä kiinteistö- ja teollisuusyhtiöille.",
      "Heikko ohjelmisto- ja palveluyhtiöille, joiden arvo ei näy [[tase|taseessa]].",
    ],
    commonMistake:
      "”P/B alle 1 = varmasti alihinnoiteltu.” Syynä voi olla huono kannattavuus tai liian arvokkaaksi kirjattu omaisuus.",
    factors: [
      "Kannattavuus: yhtiö, joka tuottaa hyvin omalle pääomalleen (korkea [[ROE]]), ansaitsee korkeamman P/B:n.",
      "Kirjanpidon arvot voivat poiketa todellisista arvoista, esimerkiksi vanhojen kiinteistöjen osalta.",
    ],
    pitfalls: ["Jos yhtiön oma pääoma on negatiivinen, P/B:tä ei voi tulkita."],
    ranges: [
      {
        label: "Alle 1",
        meaning: "Halpa kirjanpitoon nähden, tai kannattavuus on heikko.",
        tone: "neutral",
      },
      { label: "1–3", meaning: "Tavallinen taso monella alalla.", tone: "neutral" },
      { label: "Yli 5", meaning: "Arvo perustuu muuhun kuin taseen omaisuuteen.", tone: "neutral" },
    ],
    rangesNote: "Nyrkkisääntö. Riippuu vahvasti toimialasta ja kannattavuudesta.",
    companions: [
      { id: "roe", reason: "Korkea ROE selittää korkean P/B:n, matala ROE matalan." },
      { id: "pe", reason: "Kertoo hinnan suhteessa tulokseen omaisuuden sijaan." },
    ],
    links: [
      {
        title: "P/B eli osakkeen hinta suhteessa omaan pääomaan",
        url: "https://www.porssisaatio.fi/osakesijoittajan-tarkeimmat-tunnusluvut/",
        sourceId: "porssisaatio",
        language: "fi",
        kind: "selitys",
        checkedAt: "2026-09-25",
      },
      {
        title: "P/B-luvun lyhyt määritelmä",
        url: "https://fi.wikipedia.org/wiki/P/B-luku",
        sourceId: "wikipedia-fi",
        language: "fi",
        kind: "selitys",
        checkedAt: "2026-09-25",
      },
      {
        title: "P/B ratio: formula, example and when it works poorly",
        url: "https://www.investopedia.com/terms/p/price-to-bookratio.asp",
        sourceId: "investopedia",
        language: "en",
        kind: "esimerkki",
        checkedAt: "2026-09-25",
      },
    ],
  },
  {
    id: "ps",
    name: "P/S-luku",
    abbreviation: "P/S",
    abbreviationExpanded: "Price / Sales = hinta suhteessa myyntiin",
    aliases: ["p/s", "hinta-myyntisuhde", "price to sales"],
    category: "arvostus",
    level: "syventava",
    question: "Paljonko maksat yhtiön jokaisesta myyntieurosta?",
    summary:
      "[[Markkina-arvo]] jaettuna [[liikevaihto|liikevaihdolla]]. Toimii myös tappiollisille yhtiöille, mutta tulkinta riippuu paljon siitä, kuinka suuri osa myynnistä jää voitoksi.",
    analogy: "Kaupan hinta suhteessa sen vuotuiseen myyntiin, ei voittoon.",
    formula: {
      words: "Markkina-arvo ÷ liikevaihto",
      note: "Saman voi laskea osaketta kohden: osakkeen hinta ÷ liikevaihto osaketta kohden.",
    },
    example: "Markkina-arvo on 200 milj. € ja liikevaihto 100 milj. €. P/S = 200 ÷ 100 = 2.",
    unit: "x",
    direction: "lower",
    directionLabel: "Pienempi = yleensä halvempi",
    rules: [
      "Toimii myös yhtiöille, joilla ei vielä ole voittoa.",
      "Tulkinta riippuu [[kate|katteista]]: kaupan alalla P/S on luonnostaan matala.",
      "Vertaa vain saman [[toimiala|alan]] yhtiöihin.",
    ],
    commonMistake:
      "Verrataan eri alojen yhtiöitä. Ohjelmistoyhtiön P/S on aina korkeampi kuin kauppaketjun.",
    factors: [
      "Kannattavuus: korkeampi [[EBIT-%]] oikeuttaa korkeamman P/S:n.",
      "Kasvuvauhti: nopeasti kasvavan yhtiön P/S on usein korkea.",
      "Velka: P/S ei huomioi velkoja. [[EV/Sales]] (EV ÷ liikevaihto) ottaa ne mukaan.",
    ],
    pitfalls: ["Matala P/S voi kertoa vain siitä, että yhtiö ei tee myynnillään juuri voittoa."],
    companions: [
      { id: "ebit-prosentti", reason: "Kertoo, kuinka suuri osa myynnistä jää voitoksi." },
      { id: "liikevaihto", reason: "Kasvaako myynti? Kasvu selittää usein korkeaa P/S:ää." },
      { id: "pe", reason: "Kun yhtiö tekee voittoa, P/E kertoo hinnan suhteessa tulokseen." },
      { id: "ev-sales", reason: "Sama vertailu velat huomioiden." },
    ],
    links: [
      {
        title: "P/S-luvun määritelmä, edut ja heikkoudet",
        url: "https://fi.wikipedia.org/wiki/P/S-luku",
        sourceId: "wikipedia-fi",
        language: "fi",
        kind: "selitys",
        checkedAt: "2026-09-25",
      },
      {
        title: "P/S ratio explained: formula and comparing within a sector",
        url: "https://www.investopedia.com/terms/p/price-to-salesratio.asp",
        sourceId: "investopedia",
        language: "en",
        kind: "selitys",
        checkedAt: "2026-09-25",
      },
    ],
  },
  {
    id: "kassavirtatuotto",
    name: "Kassavirtatuotto",
    aliases: [
      "fcf-tuotto",
      "fcf yield",
      "free cash flow yield",
      "p/fcf",
      "kassavirtatuottoprosentti",
    ],
    category: "arvostus",
    level: "syventava",
    question: "Montako prosenttia osakkeen hinnasta yhtiö tuottaa vuodessa vapaata rahaa?",
    summary:
      "[[Vapaa kassavirta]] suhteessa [[markkina-arvo|markkina-arvoon]]. Kuin P/E käänteisenä, mutta tuloksen sijaan lasketaan rahasta, joka yhtiölle oikeasti jää.",
    analogy:
      "Sijoitusasunnon vuokratuotto-%, kun vuokrasta on ensin vähennetty remontit ja muut pakolliset menot.",
    formula: {
      words: "Vapaa kassavirta ÷ markkina-arvo × 100 %",
      note: "Käänteisluku markkina-arvo ÷ vapaa kassavirta tunnetaan nimellä P/FCF, ja sitä tulkitaan kuten P/E:tä.",
    },
    example:
      "Vapaa kassavirta on 15 milj. € ja markkina-arvo 300 milj. €. Kassavirtatuotto = 15 ÷ 300 × 100 % = 5 %.",
    unit: "%",
    direction: "higher",
    directionLabel: "Suurempi = yleensä halvempi",
    rules: [
      "Suuri luku tarkoittaa, että osake on kassavirtaan nähden halpa.",
      "Laske usean vuoden keskimääräisestä kassavirrasta, koska yksi vuosi voi heilahtaa.",
      "Jos [[osinkotuotto]] on tätä suurempi, osinkoa ei voi jatkaa pitkään ilman velkaa.",
    ],
    commonMistake:
      "Yhden hyvän vuoden kassavirran perusteella osake näyttää halvalta, vaikka seuraavana vuonna investoinnit vievät rahan.",
    factors: [
      "Kasvuyhtiö investoi paljon, joten sen kassavirtatuotto on usein matala tai negatiivinen tarkoituksella.",
      "Kassavirtatuotto ei huomioi velkoja. Velkaisen yhtiön kassavirrasta osa menee lainojen hoitoon.",
    ],
    pitfalls: [
      "Kassavirtaa voi kaunistella lykkäämällä investointeja tai venyttämällä laskujen maksua. Katso usean vuoden kehitystä.",
    ],
    ranges: [
      { label: "Alle 0 %", meaning: "Yhtiö kuluttaa enemmän rahaa kuin tuottaa.", tone: "warning" },
      { label: "2–5 %", meaning: "Tavallinen taso monella alalla.", tone: "neutral" },
      {
        label: "Yli 8 %",
        meaning: "Halpa, tai markkinat odottavat kassavirran heikkenevän.",
        tone: "neutral",
      },
    ],
    rangesNote: "Nyrkkisääntö. Vertaa saman alan yhtiöihin ja korkotasoon.",
    companions: [
      { id: "vapaa-kassavirta", reason: "Luvun pohja euroina: kuinka tasainen kassavirta on?" },
      {
        id: "pe",
        reason: "Sama hinnan vertailu tulokseen. Suuri ero kertoo, ettei tulos muutu rahaksi.",
      },
      { id: "osinkotuotto", reason: "Osinko maksetaan kassavirrasta. Riittääkö se?" },
    ],
    links: [
      {
        title: "Free cash flow yield: formula and what a high yield means",
        url: "https://www.investopedia.com/terms/f/freecashflowyield.asp",
        sourceId: "investopedia",
        language: "en",
        kind: "selitys",
        checkedAt: "2026-09-26",
      },
    ],
  },
];
