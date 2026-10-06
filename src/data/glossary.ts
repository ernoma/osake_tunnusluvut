// Sanasto: vaikeat sanat selitettyinä enintään kahdella arkikielisellä lauseella.
// Tekstissä termiin viitataan perusmuodolla (term tai jokin forms-muodoista):
// [[oma pääoma]] tai [[oma pääoma|omasta pääomasta]].

import type { GlossaryTerm } from "./types.ts";

export const glossary: GlossaryTerm[] = [
  {
    id: "osake",
    term: "osake",
    forms: ["osakkeet"],
    definition:
      "Pieni omistusosuus yhtiöstä. Kun omistat osakkeen, omistat palan yhtiötä ja saat osuutesi sen jakamista osingoista.",
  },
  {
    id: "osinko",
    term: "osinko",
    forms: ["osingot"],
    definition:
      "Osa yhtiön voitosta, jonka yhtiö maksaa omistajilleen rahana. Yhtiö päättää osingosta yleensä kerran vuodessa.",
    relatedMetricId: "osinko-per-osake",
  },
  {
    id: "porssikurssi",
    term: "pörssikurssi",
    forms: ["kurssi", "osakekurssi", "osakkeen hinta"],
    definition:
      "Hinta, jolla osake vaihtaa omistajaa pörssissä juuri nyt. Kurssi muuttuu jatkuvasti kaupankäynnin mukaan.",
  },
  {
    id: "nettotulos",
    term: "nettotulos",
    forms: ["tulos", "voitto"],
    definition:
      "Yhtiön voitto, kun kaikki kulut, korot ja verot on maksettu. Tämä on se osa, joka kuuluu omistajille.",
    relatedMetricId: "eps",
  },
  {
    id: "oma-paaoma",
    term: "oma pääoma",
    definition:
      "Omistajien osuus yhtiön omaisuudesta, kun kaikki velat on vähennetty. Se koostuu omistajien sijoittamasta rahasta ja yhtiöön jätetyistä voitoista.",
    forms: [],
  },
  {
    id: "korollinen-velka",
    term: "korollinen velka",
    forms: ["korolliset velat"],
    definition:
      "Velka, josta yhtiö maksaa korkoa, esimerkiksi pankkilaina. Ostolaskut eivät ole korollista velkaa.",
  },
  {
    id: "kassa",
    term: "kassa",
    forms: ["käteinen", "rahavarat"],
    definition:
      "Yhtiön pankkitileillä ja muissa helposti rahaksi muutettavissa sijoituksissa oleva raha.",
  },
  {
    id: "nettovelka",
    term: "nettovelka",
    forms: [],
    definition:
      "[[korollinen velka|Korolliset velat]] miinus [[kassa]]. Jos yhtiöllä on enemmän rahaa kuin velkaa, nettovelka on negatiivinen.",
  },
  {
    id: "tase",
    term: "tase",
    forms: ["taseen loppusumma", "varat yhteensä"],
    definition:
      "Luettelo yhtiön omaisuudesta ja siitä, millä se on rahoitettu (oma pääoma ja velat). Taseen loppusumma eli varat yhteensä on kaiken omaisuuden yhteisarvo, ja se on sama luku kuin oma pääoma ja velat yhteensä.",
  },
  {
    id: "rahoituskulut",
    term: "rahoituskulut",
    forms: ["rahoituskulu", "korkokulut"],
    definition:
      "Kulut, jotka yhtiö maksaa rahoituksestaan, ennen kaikkea velkojen korot. Ne vähennetään tuloslaskelmassa liikevoiton jälkeen.",
  },
  {
    id: "saadut-ennakot",
    term: "saadut ennakot",
    forms: [],
    definition:
      "Asiakkaiden etukäteen maksamat rahat tuotteista, joita ei ole vielä toimitettu. Esimerkiksi laivatilauksen ennakkomaksu.",
  },
  {
    id: "kertaera",
    term: "kertaerä",
    forms: ["kertaerät"],
    definition:
      "Poikkeuksellinen tulo tai kulu, joka ei toistu, kuten tehtaan myyntivoitto tai sakko. Kertaerä voi vääristää yhden vuoden tulosta.",
  },
  {
    id: "osakeanti",
    term: "osakeanti",
    forms: ["anti"],
    definition: "Yhtiö laskee liikkeelle uusia osakkeita ja kerää niillä rahaa.",
  },
  {
    id: "laimentuminen",
    term: "laimentuminen",
    forms: ["laimennus"],
    definition:
      "Kun osakkeita tulee lisää, jokaiselle osakkeelle kuuluu pienempi osa yhtiön tuloksesta. Laimentuminen johtuu yleensä [[osakeanti|osakeannista]].",
  },
  {
    id: "takaisinosto",
    term: "osakkeiden takaisinosto",
    forms: ["takaisinosto"],
    definition:
      "Yhtiö ostaa omia osakkeitaan pörssistä ja yleensä mitätöi ne. Jäljelle jääville osakkeille kuuluu silloin suurempi osa tuloksesta.",
  },
  {
    id: "kate",
    term: "kate",
    forms: ["katteet"],
    definition:
      "Se osuus myynnistä, joka jää käteen kulujen jälkeen. Yleensä se ilmoitetaan prosentteina.",
    relatedMetricId: "ebit-prosentti",
  },
  {
    id: "toimiala",
    term: "toimiala",
    forms: ["ala"],
    definition:
      "Yhtiön liiketoiminnan laji, esimerkiksi pankit, kauppa tai ohjelmistot. Tunnuslukujen tavalliset tasot vaihtelevat paljon alojen välillä.",
  },
  {
    id: "tilikausi",
    term: "tilikausi",
    forms: [],
    definition: "Ajanjakso, jolta yhtiö laatii tilinpäätöksen, yleensä kalenterivuosi.",
  },
  {
    id: "ennuste",
    term: "ennuste",
    forms: ["ennusteet"],
    definition:
      "Arvio tulevasta, esimerkiksi analyytikon arvio ensi vuoden tuloksesta. Ennusteet menevät usein pieleen.",
  },
  {
    id: "likviditeetti",
    term: "likviditeetti",
    forms: ["kaupankäynnin vilkkaus"],
    definition:
      "Kuinka helposti osaketta voi ostaa ja myydä ilman, että hinta heilahtaa. Pienten yhtiöiden osakkeilla kaupankäynti on usein vähäistä.",
  },
  {
    id: "vahemmistoosuus",
    term: "vähemmistöosuus",
    forms: [],
    definition:
      "Osa tytäryhtiön tuloksesta tai omasta pääomasta, joka kuuluu muille kuin emoyhtiön omistajille.",
  },
  {
    id: "poisto",
    term: "poisto",
    forms: ["poistot"],
    definition:
      "Kirjanpidon kulu, jolla koneen, rakennuksen tai muun hankinnan hinta jaetaan sen käyttövuosille. Raha on maksettu jo ostohetkellä.",
  },
  {
    id: "kayttopaaoma",
    term: "käyttöpääoma",
    forms: ["käyttöpääomaan", "käyttöpääoman"],
    definition:
      "Raha, joka on sidottu varastoihin ja asiakkaiden maksamattomiin laskuihin, kun yhtiön omat maksamattomat laskut on vähennetty. Kasvu vie rahaa kassasta.",
    relatedMetricId: "liiketoiminnan-kassavirta",
  },
  {
    id: "investointi",
    term: "investointi",
    forms: ["investoinnit", "investoida"],
    definition:
      "Raha, jonka yhtiö käyttää koneisiin, rakennuksiin tai muuhun, joka tuottaa vuosien ajan. Investoinnit vähennetään vapaasta kassavirrasta.",
  },
  {
    id: "sijoitettu-paaoma",
    term: "sijoitettu pääoma",
    forms: [],
    definition:
      "[[oma pääoma|Oma pääoma]] ja [[korollinen velka|korolliset velat]] yhteensä, eli kaikki raha, jonka omistajat ja lainanantajat ovat antaneet yhtiön käyttöön.",
    relatedMetricId: "roi",
  },
  {
    id: "vuosineljannes",
    term: "vuosineljännes",
    forms: ["vuosineljännekset", "neljännes", "kvartaali"],
    definition:
      "Kolmen kuukauden jakso. Pörssiyhtiöt kertovat tuloksestaan yleensä neljännesvuosittain osavuosikatsauksessa.",
  },
];
