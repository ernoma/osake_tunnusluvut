// WCAG AA -kontrastit molemmissa teemoissa. jsdom ei laske tyylejä, joten värit luetaan
// suoraan tokens.css:stä ja jokainen käyttöliittymässä esiintyvä teksti–tausta-pari tarkistetaan.

import { describe, expect, it } from "vitest";
import css from "./tokens.css?raw";

type Rgb = [number, number, number];
type Palette = Record<string, Rgb>;

function block(selector: string): string {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`Valitsinta ${selector} ei löytynyt tokens.css:stä`);
  return css.slice(start, css.indexOf("}", start));
}

function palette(selector: string, base: Palette = {}): Palette {
  const colors = { ...base };
  for (const [, name = "", hex = ""] of block(selector).matchAll(
    /--color-([\w-]+):\s*#([0-9a-f]{6})/gi,
  )) {
    colors[name] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)) as Rgb;
  }
  return colors;
}

const light = palette(":root");
const dark = palette(':root[data-theme="dark"]', light);
const darkBySystem = palette(':root:not([data-theme="light"])', light);

/** color-mix(in srgb, color p%, transparent) toisen värin päällä. */
const tint = (color: Rgb, under: Rgb, p: number): Rgb =>
  color.map((c, i) => Math.round(c * p + (under[i] ?? 0) * (1 - p))) as Rgb;

function luminance(rgb: Rgb): number {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as Rgb;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: Rgb, b: Rgb): number {
  const [la, lb] = [luminance(a), luminance(b)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function color(p: Palette, name: string): Rgb {
  const rgb = p[name];
  if (!rgb) throw new Error(`Väriä --color-${name} ei löytynyt tokens.css:stä`);
  return rgb;
}

/** [kuvaus, tekstin väri, taustan väri] */
function pairs(p: Palette): [string, Rgb, Rgb][] {
  const c = (name: string) => color(p, name);
  const list: [string, Rgb, Rgb][] = [];
  for (const bg of ["bg", "surface", "inset", "surface-raised"]) {
    list.push([`teksti / ${bg}`, c("text"), c(bg)]);
    list.push([`himmeä teksti / ${bg}`, c("text-muted"), c(bg)]);
    list.push([`korostusväri / ${bg}`, c("accent"), c(bg)]);
  }
  // Suuntamerkit ja asteikko: värillinen teksti oman värinsä 10 %:n sävyn päällä.
  for (const tone of ["lower", "higher", "range", "neutral"]) {
    list.push([`suunta ${tone}`, c(tone), tint(c(tone), c("surface"), 0.1)]);
  }
  list.push(["✓-merkki", c("higher"), c("surface")]);
  list.push(["yleinen virhe", c("text"), tint(c("range"), c("surface"), 0.1)]);
  list.push(["linkin hover", c("accent"), tint(c("accent"), c("surface"), 0.1)]);
  list.push(["valittu suodatin", c("surface"), c("accent")]);
  return list;
}

describe.each([
  ["vaalea teema", light],
  ["tumma teema", dark],
  ["tumma teema järjestelmän asetuksesta", darkBySystem],
])("%s", (_, p) => {
  it.each(pairs(p))("%s täyttää AA:n (4.5:1)", (_, fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  // Painikkeiden ja kenttien reunat: WCAG 1.4.11 vaatii 3:1 vain kentän tunnistamiseen
  // tarvittavalle reunalle. Hakukenttä erottuu myös kuvakkeesta ja paikkamerkkitekstistä,
  // joten reunaa ei tarkisteta. Kohdistuksen reunus on korostusväriä.
  it("kohdistuksen reunus erottuu taustasta (3:1)", () => {
    expect(contrast(color(p, "accent"), color(p, "bg"))).toBeGreaterThanOrEqual(3);
  });
});

it("järjestelmän tumma teema ja valittu tumma teema ovat samat", () => {
  expect(darkBySystem).toEqual(dark);
});
