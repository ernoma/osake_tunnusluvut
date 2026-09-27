import { inderes } from "./inderes.ts";
import { kauppalehti } from "./kauppalehti.ts";
import { nordnet } from "./nordnet.ts";
import { nordnetSek } from "./nordnetSek.ts";
import { tilinpaatos } from "./tilinpaatos.ts";
import { tilinpaatosIfrs } from "./tilinpaatosIfrs.ts";
import { yahoo } from "./yahoo.ts";

export type { ExtractionFixture } from "./types.ts";

export const fixtures = [
  nordnet,
  inderes,
  kauppalehti,
  yahoo,
  tilinpaatos,
  tilinpaatosIfrs,
  nordnetSek,
];
