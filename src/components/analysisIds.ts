// Analyysinäkymän elementtien id:t. Näkymä siirtää kohdistuksen niihin luvun lisäämisen jälkeen.

/** Tunnusluvun otsikko analyysissa. */
export const rowHeadingId = (metricId: string) => `analyysi-${metricId}`;

/** Puuttuvan tunnusluvun Lisää-painike. */
export const addButtonId = (metricId: string) => `puuttuu-${metricId}`;
