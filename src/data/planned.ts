// Tunnusluvut, joihin saa jo viitata (companions, [[termi]]), mutta joita ei ole vielä kirjoitettu.
// Ne näytetään käyttöliittymässä "tulossa"-tilassa. Kun tunnusluku lisätään metrics.ts:ään,
// poista se täältä (testi muistuttaa).
//
// Esimerkki: { id: "vapaa-kassavirta", name: "Vapaa kassavirta", category: "kannattavuus" }

import type { PlannedMetric } from "./types.ts";

export const planned: PlannedMetric[] = [];
