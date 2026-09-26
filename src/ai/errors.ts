// Tekoälyhaun virheet ja niiden viestit käyttäjälle (suunnitelman kohta 11.2). Erillään
// extract.ts:stä, koska rajapinnan kirjasto ladataan vasta, kun käyttäjä aloittaa haun.

/** Liitetyn tekstin enimmäispituus merkkeinä. */
export const MAX_TEXT_LENGTH = 30_000;

export type ExtractionErrorKind =
  | "ei-avainta"
  | "liian-pitka"
  | "avain"
  | "hylatty"
  | "liikaa-pyyntoja"
  | "ruuhka"
  | "verkko"
  | "kasittely"
  | "ei-lukuja"
  | "keskeytetty";

/** Virhe, jonka viesti näytetään käyttäjälle sellaisenaan. Ei koskaan sisällä avainta. */
export class ExtractionError extends Error {
  readonly kind: ExtractionErrorKind;

  constructor(kind: ExtractionErrorKind, message: string) {
    super(message);
    this.name = "ExtractionError";
    this.kind = kind;
  }
}

/** Vakioviestit. Hylätyn pyynnön viestissä on rajapinnan antama syy (extract.ts). */
export const ERROR_MESSAGES: Record<Exclude<ExtractionErrorKind, "hylatty">, string> = {
  "ei-avainta": "Anna ensin API-avain.",
  "liian-pitka": `Teksti on liian pitkä (yli ${MAX_TEXT_LENGTH.toLocaleString("fi-FI")} merkkiä). Valitse sivulta vain tunnuslukuosio ja kopioi se.`,
  avain: "API-avain ei kelpaa. Tarkista avain.",
  "liikaa-pyyntoja": "Liian monta pyyntöä. Yritä hetken kuluttua uudelleen.",
  ruuhka: "Palvelu on ruuhkautunut. Yritä uudelleen.",
  verkko: "Yhteys ei toiminut. Tarkista verkkoyhteys.",
  kasittely:
    "Tekoäly ei pystynyt käsittelemään tekstiä. Kokeile lyhyempää tekstiä tai syötä luvut itse.",
  "ei-lukuja": "Tekstistä ei löytynyt tunnuslukuja. Kopioitko sivun tunnuslukuosion?",
  keskeytetty: "Haku keskeytettiin.",
};

export function extractionError(kind: Exclude<ExtractionErrorKind, "hylatty">): ExtractionError {
  return new ExtractionError(kind, ERROR_MESSAGES[kind]);
}
