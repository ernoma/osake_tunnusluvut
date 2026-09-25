import type { Category } from "./types.ts";

export const categories: Category[] = [
  {
    id: "koko",
    shortName: "Koko",
    question: "Kuinka iso yhtiö on?",
    description:
      "Näistä luvuista näet yhtiön koon. Ne eivät yksinään kerro, onko osake hyvä tai huono.",
    order: 1,
  },
  {
    id: "kannattavuus",
    shortName: "Kannattavuus",
    question: "Tekeekö yhtiö hyvin rahaa?",
    description: "Näistä luvuista näet, jääkö myynnistä voittoa ja kuinka tehokkaasti.",
    order: 2,
  },
  {
    id: "osakekohtaiset",
    shortName: "Per osake",
    question: "Paljonko yhdelle osakkeelle kuuluu?",
    description: "Yhtiön tulos ja osinko jaettuna osakkeiden määrällä.",
    order: 3,
  },
  {
    id: "osinko",
    shortName: "Osinko",
    question: "Paljonko osinkoa saan, ja onko se kestävää?",
    description: "Osinko on yhtiön voitosta omistajille maksettava osuus.",
    order: 4,
  },
  {
    id: "velka",
    shortName: "Velka",
    question: "Onko yhtiöllä liikaa velkaa?",
    description: "Velka ei ole aina pahasta, mutta liian suuri velka tekee yhtiöstä haavoittuvan.",
    order: 5,
  },
  {
    id: "arvostus",
    shortName: "Hinta",
    question: "Onko osake halpa vai kallis?",
    description:
      "Näissä luvuissa osakkeen hintaa verrataan yhtiön tulokseen, myyntiin tai omaisuuteen. Halpa ei aina tarkoita hyvää.",
    order: 6,
  },
];
