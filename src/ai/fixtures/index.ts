import { inderes } from "./inderes.ts";
import { kauppalehti } from "./kauppalehti.ts";
import { nordnet } from "./nordnet.ts";
import { tilinpaatos } from "./tilinpaatos.ts";
import { yahoo } from "./yahoo.ts";

export type { ExtractionFixture } from "./types.ts";

export const fixtures = [nordnet, inderes, kauppalehti, yahoo, tilinpaatos];
