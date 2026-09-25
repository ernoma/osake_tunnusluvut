# Osakesijoittamisen tunnusluvut: toteutussuunnitelma

## 1. Tavoite

Sovellus on selainpohjainen opas, jossa osakesijoittamisen tunnusluvut ja niiden tulkinta on selitetty **tavalliselle ihmiselle, joka tietää osakesijoittamisesta vähän tai ei mitään**. Sovellus ei laske lukuja eikä hae yhtiötietoja, vaan keskittyy selityksiin ja tulkintaohjeisiin.

**Kohderyhmä**

Aikuinen, joka on nähnyt tunnuslukuja esimerkiksi pankin sovelluksessa, osakevertailusivustolla tai uutisessa, mutta ei tiedä, mitä ne tarkoittavat. Hän ei tunne kirjanpidon käsitteitä, kuten omaa pääomaa, nettovelkaa tai kertaeriä. Hän haluaa tietää, **mitä luku kertoo ja pitäisikö hänen olla siitä ilahtunut vai huolissaan**. Tunnuslukujen teoria kiinnostaa häntä vähemmän.

**Onnistumisen mittarit**

1. Käyttäjä näkee **yhdellä vilkaisulla**, miten tunnuslukua tulkitaan:
   - onko suuri vai pieni arvo hyvä asia
   - miten luku lasketaan
   - mitkä seikat vaikuttavat tulkintaan
   - mitä muita tunnuslukuja kannattaa katsoa rinnalla
2. **Aloittelija ymmärtää kortin ilman muita lähteitä.** Jokainen vaikea sana on selitetty samassa näkymässä. Tätä mitataan käyttäjätestillä (kohta 7).
3. Uuden tunnusluvun lisääminen onnistuu **lisäämällä yksi tietue datatiedostoon**, eikä koodia tarvitse muuttaa.
4. Käyttöliittymä pysyy selkeänä, vaikka tunnuslukuja olisi 17 sijaan 50.

**Rajaukset (ei kuulu versioon 1)**

- Laskuri, johon syötetään omia lukuja
- Oikeiden yhtiöiden data ja rajapinnat
- Käyttäjätilit ja palvelinpuoli
- Sijoitusneuvonta: sovellus ei koskaan sano "osta" tai "myy"

## 2. Aloittelijalähtöisen suunnittelun periaatteet

Nämä periaatteet ohjaavat sekä käyttöliittymää että sisältöä. Ne ovat myös sisällön tarkistuslista (kohta 9).

| # | Periaate | Käytännössä |
|---|---|---|
| 1 | **Aloita kysymyksestä, ei termistä** | Jokaisella tunnusluvulla on arkikielinen kysymys, johon se vastaa. Esimerkiksi P/E: *"Montako vuoden tulosta maksat osakkeen hinnassa?"*. Kategoriatkin on nimetty kysymyksinä. |
| 2 | **Selitä jokainen lyhenne ja termi** | Lyhenne avataan aina (EPS = *Earnings Per Share* = osakekohtainen tulos). Vaikeat sanat on merkitty tekstiin, ja niistä aukeaa selitys sanastosta (kohta 4.3). |
| 3 | **Arkinen vertaus** | Jokaisella tunnusluvulla on vertaus, esimerkiksi EV on kuin asunnon *velaton hinta*. |
| 4 | **Esimerkki tasaluvuilla** | "Osake maksaa 20 €, ja yhtiö tekee tulosta 2 € osaketta kohden, joten P/E on 10." Ei desimaaleja eikä oikeita yhtiöitä. |
| 5 | **Suunta selkokielellä ja varauksin** | "Pienempi luku = osake on yleensä halvempi". Sanaa *yleensä* ei jätetä pois, ja halpa ei tarkoita hyvää. |
| 6 | **Varoitus yleisimmästä virheestä** | Jokaisella kortilla on yksi rivi "⚠ Yleinen virhe", koska aloittelija tekee ensin juuri sen virheen. |
| 7 | **Yksi luku ei koskaan riitä** | "Katso rinnalla" -osio on kortilla näkyvästi. Johdanto kertoo tämän periaatteen heti alussa. |
| 8 | **Nyrkkisäännöt merkitään nyrkkisäännöiksi** | Viitearvot (esim. "PEG alle 1") esitetään aina merkinnällä "suuntaa antava" ja muistutuksella, että ne vaihtelevat toimialoittain. |
| 9 | **Vähemmän on enemmän** | Perustaso näytetään ensin. Syventävät tunnusluvut ovat mukana, mutta ne on merkitty, ja ne voi piilottaa. |
| 10 | **Kirjoitustyyli** | Lauseet ovat lyhyitä (noin 20 sanaa), aktiivimuotoisia ja ilman anglismeja. Lukija puhutellaan sinä-muodossa. |

## 3. Teknologiat

| Osa-alue | Valinta | Perustelu |
|---|---|---|
| Käännös ja kehityspalvelin | **Vite** | Nopea, ja tuottaa pelkkää staattista tiedostoa |
| Käyttöliittymä | **React + TypeScript** | Tyypitetty datamalli estää puutteelliset tunnuslukutietueet |
| Tyylit | **CSS Modules** ja CSS-muuttujat (tumma ja vaalea teema) | Ei ylimääräisiä riippuvuuksia |
| Datan validointi | **Zod** | Tarkistaa tunnuslukudatan ja sanaston rakenteen testeissä |
| Haku | Oma kevyt suodatus (nimi, lyhenne, synonyymit, kysymys) | Kymmenille tietueille ei tarvita hakukirjastoa |
| Testit | **Vitest** ja **React Testing Library** | Integroituvat Viteen |
| Julkaisu | **GitHub Pages** (tai Netlify/Cloudflare Pages) | Ilmainen staattinen hosting |

Käyttöliittymän kieli on suomi. Tekstit ovat datatiedostoissa, joten myöhemmin voidaan lisätä muita kieliä.

## 4. Datamalli

### 4.1 Tunnusluku on yksi tietue

Kaikki sisältö on tiedostossa `src/data/metrics.ts`. Uusi tunnusluku lisätään lisäämällä sinne yksi olio.

```ts
// src/data/types.ts
export type Direction =
  | "higher"   // suurempi on yleensä parempi
  | "lower"    // pienempi tarkoittaa yleensä halvempaa osaketta
  | "range"    // järkevä vaihteluväli, liian suuri tai pieni on varoitusmerkki
  | "neutral"; // kuvaa kokoa, ei itsessään hyvä tai huono

export type Level = "perus" | "syventava";

export type CategoryId =
  | "koko"           // Kuinka iso yhtiö on?
  | "kannattavuus"   // Tekeekö yhtiö hyvin rahaa?
  | "osakekohtaiset" // Paljonko yhdelle osakkeelle kuuluu?
  | "osinko"         // Paljonko osinkoa saan, ja onko se kestävää?
  | "velka"          // Onko yhtiöllä liikaa velkaa?
  | "arvostus";      // Onko osake halpa vai kallis?

export interface Metric {
  id: string;                 // "pe", yksilöivä, käytetään linkeissä
  name: string;               // "P/E-luku"
  abbreviation?: string;      // "P/E"
  abbreviationExpanded?: string; // "Price / Earnings = hinta suhteessa tulokseen"
  aliases: string[];          // ["hinta-voittosuhde", "price to earnings"], hakua varten
  category: CategoryId;
  level: Level;
  question: string;           // arkikielinen kysymys, johon luku vastaa
  summary: string;            // enintään 160 merkkiä, selkokielinen selitys
  analogy: string;            // arkinen vertaus
  formula: {
    words: string;            // "Osakkeen hinta ÷ osakekohtainen tulos"
    symbols?: string;         // "Kurssi ÷ EPS"
    note?: string;            // "Tulos on yleensä viimeiseltä 12 kuukaudelta"
  };
  example: string;            // laskuesimerkki tasaluvuilla
  unit: "€" | "%" | "x" | "€/osake";
  direction: Direction;
  directionLabel: string;     // "Pienempi = yleensä halvempi"
  rules: string[];            // 1–3 tulkintasääntöä, kukin enintään 120 merkkiä
  commonMistake: string;      // yksi rivi, näkyy aina
  factors: string[];          // tulkintaan vaikuttavat seikat ("Lisää"-osio)
  pitfalls: string[];         // muut sudenkuopat ("Lisää"-osio)
  ranges?: {                  // valinnainen suuntaa antava asteikko
    label: string;            // "Alle 1"
    meaning: string;          // "Kasvuun nähden edullinen"
    tone: "good" | "neutral" | "warning";
  }[];
  rangesNote?: string;        // "Nyrkkisääntö, vaihtelee toimialoittain"
  companions: {               // mitä katsoa rinnalla
    id: string;               // viittaus toiseen tunnuslukuun
    reason: string;           // "Kertoo, onko matala P/E vain kasvun puutetta"
  }[];
  links: ExternalLink[];      // lisälukemista muilla sivustoilla, 0–3 kpl (kohta 6.7)
}

export interface ExternalLink {
  title: string;              // mitä sivulta löytyy: "Selitys ja laskuesimerkki"
  url: string;                // vain https
  sourceId: string;           // viittaus sources.ts:n sivustoon
  language: "fi" | "en";
  kind: "selitys" | "esimerkki" | "laskuri" | "video";
  checkedAt: string;          // "2026-09-25", milloin sisältö viimeksi luettu käsin
}
```

Linkkien sivustot ovat omassa tiedostossaan `src/data/sources.ts`, eikä sivuston nimeä kirjoiteta jokaiseen linkkiin erikseen:

```ts
export interface Source {
  id: string;                 // "porssisaatio"
  name: string;               // "Pörssisäätiö"
  domain: string;             // "porssisaatio.fi". Linkin osoitteen pitää olla tässä verkkotunnuksessa
  type: "neutraali" | "kaupallinen"; // kaupallinen = pankki, välittäjä, analyysitalo tms.
}
```

Kaikissa tekstikentissä sanastotermi merkitään muodossa `[[oma pääoma]]` tai `[[oma pääoma|omasta pääomasta]]`, kun tekstissä käytetään taivutettua muotoa. Käyttöliittymä muuttaa merkinnän selitettäväksi sanaksi.

### 4.2 Kategoriat ovat kysymyksiä

Kategoriat ovat tiedostossa `src/data/categories.ts`: `id`, `question`, `shortName`, `description` ja `order`. Kortin väliotsikkona näytetään kysymys ja suodattimessa lyhyt nimi.

| id | Suodattimen nimi | Väliotsikko |
|---|---|---|
| koko | Koko | Kuinka iso yhtiö on? |
| kannattavuus | Kannattavuus | Tekeekö yhtiö hyvin rahaa? |
| osakekohtaiset | Per osake | Paljonko yhdelle osakkeelle kuuluu? |
| osinko | Osinko | Paljonko osinkoa saan, ja onko se kestävää? |
| velka | Velka | Onko yhtiöllä liikaa velkaa? |
| arvostus | Hinta | Onko osake halpa vai kallis? |

### 4.3 Sanasto

Sanasto on tiedostossa `src/data/glossary.ts`. Tietueen rakenne on `{ id, term, forms[], definition, relatedMetricId? }`. Selitys on enintään kaksi lausetta arkikielellä.

Ensimmäiset termit:

- oma pääoma
- nettotulos
- nettovelka
- korollinen velka
- tase ja taseen loppusumma
- saadut ennakot
- kassa
- kertaerä
- osakeanti ja laimentuminen
- osakkeiden takaisinosto
- kate
- toimiala
- tilikausi
- ennuste
- pörssikurssi
- likviditeetti (kaupankäynnin vilkkaus)
- vähemmistöosuus

Jokaisen tunnusluvun nimi on automaattisesti myös sanastotermi. Siksi esimerkiksi tekstiin kirjoitettu `[[EPS]]` avaa EPS:n lyhyen selityksen ja linkin sen korttiin.

### 4.4 Laajennettavuuden periaatteet

- Kategoriat ja sanasto ovat dataa samalla tavalla kuin tunnusluvut.
- `companions`-kenttä voi viitata tunnuslukuun, jota ei ole vielä lisätty, esimerkiksi vapaaseen kassavirtaan. Käyttöliittymä näyttää silloin harmaan merkinnän "tulossa", ja testi listaa nämä viittaukset varoituksina, mutta build ei kaadu.
- Zod-skeema tarkistaa testeissä:
  - pakolliset kentät
  - id:iden yksilöllisyyden
  - tekstien pituusrajat
  - sen, että jokainen `[[termi]]` löytyy sanastosta tai tunnuslukujen nimistä
  - linkkien muodon ja sivustot (kohta 6.7).

  Näin kortit pysyvät tiiviinä, eikä aloittelija törmää selittämättömään sanaan.
- Uusi linkkisivusto lisätään yhdellä rivillä tiedostoon `sources.ts`. Jos sivusto vaihtaa verkkotunnusta, muutos tehdään yhteen paikkaan.

## 5. Käyttöliittymä

### 5.1 Ensimmäinen käynti: "Aloita tästä"

Sivun yläosassa on ensimmäisellä käynnillä lyhyt johdantopaneeli, jonka voi sulkea. Suljettu tila tallennetaan `localStorage`en, ja paneelin saa takaisin linkistä "Mitä tunnusluvut ovat?".

- Kolme lausetta siitä, mitä tunnusluku on: *"Tunnusluku tiivistää yhtiön tilinpäätöksen tai osakkeen hinnan yhdeksi luvuksi, jota on helppo verrata."*
- Tärkein periaate: *"Mikään luku ei yksin kerro, kannattaako osake ostaa. Katso aina useampaa lukua ja vertaa saman alan yhtiöihin."*
- **Suositeltu lukujärjestys** klikattavina askelina: Liikevaihto → EBIT → EBIT-% → EPS → P/E → Omavaraisuusaste → Osinkotuotto → Osinkosuhde. Jokainen askel vie kyseiseen korttiin.
- Suuntamerkkien selitys (kohta 5.2) pienenä selitteenä.

### 5.2 Päänäkymä: korttiruudukko

```
┌────────────────────────────────────────────────────────────────┐
│  Osakkeen tunnusluvut – selkokielellä       [🔍 Hae...]  [☾]  │
│  [Kaikki] [Koko] [Kannattavuus] [Per osake] [Osinko] [Velka]   │
│  [Hinta]                                                       │
│  [✓] Näytä myös syventävät                                     │
├────────────────────────────────────────────────────────────────┤
│ ONKO OSAKE HALPA VAI KALLIS?                                   │
│ ┌──────────────────────────────────────┐                       │
│ │ P/E-luku                PERUS        │                       │
│ │ Montako vuoden tulosta maksat        │                       │
│ │ osakkeen hinnassa?                   │                       │
│ │ [↓ Pienempi = yleensä halvempi]      │                       │
│ │                                      │                       │
│ │ Kertoo, kuinka moninkertaisen hinnan │                       │
│ │ maksat yhtiön vuoden ┄tuloksesta┄.   │  ← ┄sana┄ = sanasto   │
│ │ ┌──────────────────────────────────┐ │                       │
│ │ │ Osakkeen hinta ÷ osakekoht. tulos│ │                       │
│ │ │ 20 € ÷ 2 € = 10                  │ │                       │
│ │ └──────────────────────────────────┘ │                       │
│ │ ✓ Vertaa saman alan yhtiöihin        │                       │
│ │ ✓ Nopeasti kasvavalla yhtiöllä P/E   │                       │
│ │   on usein korkea, ja se voi olla ok │                       │
│ │ ⚠ Yleinen virhe: "Matala P/E = hyvä  │                       │
│ │   ostos". Tulos voi olla laskemassa. │                       │
│ │ Katso rinnalla: [PEG] [EPS] [EV/EBIT]│                       │
│ │                          Lisää ▾     │                       │
│ └──────────────────────────────────────┘                       │
│ Alareuna: Tämä on opas, ei sijoitusneuvontaa.                  │
└────────────────────────────────────────────────────────────────┘
```

**Kortilla näkyy aina, ilman klikkauksia** (yhden vilkaisun vaatimus):

1. **Nimi** ja tasomerkki (PERUS tai SYVENTÄVÄ). Lyhenteen selitys näkyy, kun kohdistin on nimen päällä tai nimeä napautetaan.
2. **Arkikielinen kysymys**, johon luku vastaa. Tämä on kortin tärkein rivi aloittelijalle.
3. **Suuntamerkki**, jossa on väri, ikoni ja teksti:
   - `↓ Pienempi = yleensä halvempi` (sininen)
   - `↑ Suurempi = yleensä parempi` (vihreä)
   - `↔ Sopiva väli on paras` (keltainen)
   - `● Kertoo koosta, ei hyvä tai huono` (harmaa)
4. **Selkokielinen selitys**, jossa sanastotermit on merkitty katkoviivalla.
5. **Kaava sanoin ja esimerkki tasaluvuilla** samassa laatikossa. Symbolikaava (esim. "Kurssi ÷ EPS") näkyy "Lisää"-osiossa.
6. **1–3 tulkintasääntöä** ✓-merkeillä.
7. **⚠ Yleinen virhe**, yksi rivi.
8. **"Katso rinnalla" -merkinnät**. Syy näytetään, kun kohdistin on merkinnän päällä tai merkintää pidetään painettuna. Klikkaus vierittää kyseiseen korttiin ja korostaa sen hetkeksi.

**"Lisää ▾" avaa kortin sisällä** (kortti laajenee paikallaan):

- Arkinen vertaus ("Ajattele näin: …")
- Tulkintaan vaikuttavat seikat
- Muut sudenkuopat
- Suuntaa antava asteikko värikoodattuna ja merkinnällä "nyrkkisääntö"
- Kaava symboleina ja lyhenteen selitys
- Rinnakkaistunnuslukujen perustelut kokonaisuudessaan
- **"Lue lisää muualta"**: 1–3 linkkiä muille sivustoille (kohta 6.7)

**"Lue lisää muualta" -osio:**

```
│ Lue lisää muualta                                     │
│  ↗ Selitys ja laskuesimerkki                           │
│    Pörssisäätiö · selitys                              │
│  ↗ P/E ratio explained with examples           [EN]    │
│    Investopedia · esimerkki                            │
│  Ulkoiset sivut eivät ole tämän oppaan tekemiä.        │
│  Niillä voi olla mainoksia tai tuotteiden markkinointia.│
```

- Linkkiteksti kertoo, mitä sivulta löytyy. Pelkkä sivuston nimi ei riitä.
- Linkin alla näkyvät sivuston nimi ja sisällön tyyppi (selitys, esimerkki, laskuri tai video).
- Suomenkieliset linkit ovat ensin. Englanninkielisessä linkissä on selvä **EN**-merkki, jotta aloittelija ei yllättyisi.
- Linkki avautuu uuteen välilehteen (`target="_blank" rel="noopener noreferrer"`), jotta käyttäjän paikka oppaassa säilyy. Ruudunlukijalle kerrotaan "avautuu uuteen välilehteen", ja ↗-kuvake kertoo saman näkevälle käyttäjälle.
- `noreferrer` estää kertomasta kohdesivustolle, mistä käyttäjä tuli. Sovellus ei seuraa linkkien klikkauksia.
- Osio näkyy vain, jos tunnusluvulla on linkkejä.

**Sanastotermit:** katkoviivalla alleviivattu sana avaa pienen selitysikkunan. Tietokoneella se aukeaa kohdistimen ollessa sanan päällä, mobiilissa napautuksella. Näppäimistöllä sen saa auki Enterillä ja kiinni Escillä. Jos sana on tunnusluku, ikkunassa on linkki "Siirry korttiin →".

### 5.3 Miten näkymä pysyy selkeänä, kun tunnuslukuja tulee lisää

| Ongelma lukumäärän kasvaessa | Ratkaisu |
|---|---|
| Liian monta korttia | Kortit ryhmitellään kategorioittain kysymysotsikoiden alle, ja kategoriasuodatin on korttien yläpuolella |
| Aloittelija hukkuu | "Näytä myös syventävät" -valinta. Aluksi kaikki näytetään, ja perustason kortit ovat kunkin kategorian alussa. Valinta tallennetaan selaimeen |
| Tietyn luvun löytäminen | Haku kohdistuu nimeen, lyhenteeseen, synonyymeihin ja kysymykseen. Esimerkiksi "velaton" löytää EV:n. Pikanäppäin `/` |
| Kortit venyvät | Pituusrajat skeemassa (1–3 sääntöä, selitys enintään 160 merkkiä), ja loput ovat "Lisää"-osiossa |
| Linkit vievät hukkaan | Klikkaus vierittää korttiin ja korostaa sen. Jos suodatin piilottaa kohteen, suodatin nollataan automaattisesti |
| Pitkä sivu mobiilissa | Mobiilissa kortit ovat yhdessä sarakkeessa, ja kategoriasuodatin on vaakasuunnassa vieritettävä nauha, joka pysyy näkyvissä |
| Tilan jakaminen | Suodatin, haku ja avattu kortti tallennetaan URL:iin (`#pe`, `?k=arvostus`), joten linkin voi jakaa |

**Myöhempiä laajennuksia (ei kuulu versioon 1):**

- Vertailunäkymä, jossa 2–4 valittua tunnuslukua näkyvät rinnakkain.
- Erillinen sanastosivu.
- "Tunnuslukujen kartta", joka näyttää lukujen väliset yhteydet kaaviona. Esimerkiksi EBIT → EBIT-% → EV/EBIT.

### 5.4 Komponentit

```
src/
├── data/
│   ├── types.ts            # Metric-, Direction-, Level-, CategoryId- ja GlossaryTerm-tyypit
│   ├── schema.ts           # Zod-skeemat
│   ├── categories.ts       # kategoriat kysymyksinä
│   ├── glossary.ts         # sanasto
│   ├── sources.ts          # ulkoisten linkkien sivustot
│   ├── planned.ts          # "tulossa"-tunnusluvut, joihin saa jo viitata
│   ├── richText.ts         # [[termi]]-merkintöjen jäsennys
│   ├── terms.ts            # termihakemisto: mihin [[termi]] osoittaa
│   ├── validate.ts         # koko sisällön ristiintarkistus
│   └── metrics.ts          # KAIKKI TUNNUSLUVUT
├── components/
│   ├── App.tsx
│   ├── Header.tsx          # otsikko, haku, teemavalitsin
│   ├── IntroPanel.tsx      # "Aloita tästä" ja suositeltu lukujärjestys
│   ├── FilterBar.tsx       # kategoriat ja syventävien näyttäminen
│   ├── MetricGrid.tsx      # kategoriaryhmät ja kortit
│   ├── MetricCard.tsx      # yksi kortti (tiivis tai laajennettu)
│   ├── DirectionBadge.tsx  # suuntamerkki
│   ├── FormulaBox.tsx      # kaava sanoin ja esimerkki
│   ├── CompanionChips.tsx  # rinnakkaistunnusluvut ja "tulossa"-tila
│   ├── ExternalLinks.tsx   # "Lue lisää muualta" -osio
│   ├── RangeScale.tsx      # värikoodattu asteikko
│   ├── RichText.tsx        # muuttaa [[termi]]-merkinnät GlossaryTerm-komponenteiksi
│   └── GlossaryTerm.tsx    # selitettävä sana ja selitysikkuna
├── hooks/
│   ├── useMetricFilter.ts  # haku- ja suodatuslogiikka (puhdas funktio, testattava)
│   └── useUrlState.ts      # tilan synkronointi URL:iin
└── styles/
    └── tokens.css          # värit, välit, tumma ja vaalea teema
```

### 5.5 Saavutettavuus ja ulkoasu

- **Luettavuus:** perusfontti on 17–18 px, rivinpituus enintään noin 70 merkkiä ja riviväli väljä.
- **Semantiikka:** kortit ovat `<article>`-elementtejä, laajennus on `<button aria-expanded>`, väliotsikot ovat `<h2>` ja sanastotermit ovat `<button>`-elementtejä, joihin selitysikkuna on liitetty `aria-describedby`-attribuutilla.
- **Ei pelkän värin varassa:** suunta ilmaistaan aina myös ikonilla ja tekstillä.
- **Kontrasti:** täyttää WCAG AA:n molemmissa teemoissa.
- **Näppäimistö:** kaikkea voi käyttää näppäimistöllä (Tab, Enter, Esc ja `/` hakuun).
- **Kosketus:** painikkeiden kosketusalue on vähintään 44 × 44 px.
- **Vastuuvapauslauseke:** näkyy sivun alareunassa ja johdannossa ystävällisellä sävyllä: *"Tämä on opas tunnuslukujen ymmärtämiseen, ei sijoitusneuvontaa. Sijoittamiseen liittyy aina riski."*

## 6. Sisältö: 17 tunnuslukua

Tämä on luonnos `metrics.ts`-tiedoston sisällöstä. Tekstit viimeistellään vaiheessa 3 kohdan 2 periaatteiden mukaisiksi.

**Tasot**

- **Perus:** Markkina-arvo, Liikevaihto, EBIT, EBIT-%, EPS, Osinko/osake, Osinkotuotto, Omavaraisuusaste, P/E
- **Syventävä:** EV, ROE, Osinkosuhde, Nettovelkaantumisaste, P/B, PEG, P/S, EV/EBIT

### 6.1 Koko: Kuinka iso yhtiö on?

| Tunnusluku | Kysymys | Kaava sanoin | Suunta | Tärkeimmät säännöt | ⚠ Yleinen virhe | Vertaus | Katso rinnalla |
|---|---|---|---|---|---|---|---|
| **Markkina-arvo** (perus) | Paljonko kaikki yhtiön osakkeet maksavat yhteensä? | Osakkeen hinta × osakkeiden määrä | ● Koko | Kertoo koon, ei sitä, onko osake halpa. Pienten yhtiöiden kurssit heiluvat usein enemmän. Ei huomioi velkoja. | "Iso markkina-arvo = turvallinen sijoitus" | Talon myyntihinta ilman tietoa asuntolainasta | EV (velat mukaan), Liikevaihto (→ P/S) |
| **EV, yritysarvo** (syventävä) | Paljonko koko yhtiö maksaisi velkoineen? | Markkina-arvo + nettovelka (korolliset velat − kassa) | ● Koko | Velkainen yhtiö on kalliimpi kuin markkina-arvo antaa ymmärtää. Paljon käteistä omistava yhtiö on vastaavasti halvempi. EV on pohja EV/EBIT-luvulle. | Unohdetaan velat ja verrataan pelkkiä markkina-arvoja | Asunnon **velaton hinta** = myyntihinta + taloyhtiölainan osuus | Markkina-arvo, EV/EBIT, Nettovelkaantumisaste |
| **Liikevaihto** (perus) | Paljonko yhtiö myy vuodessa? | Kaikki myyntitulot tilikauden ajalta | ● Koko (kasvu ↑) | Kasvuvauhti kertoo enemmän kuin taso. Vertaa aiempiin vuosiin. Yritysostot voivat paisuttaa kasvua. | "Suuri myynti = suuri voitto". Kulut voivat viedä kaiken | Kaupan kassaan tuleva raha ennen kuin laskut on maksettu | EBIT, EBIT-%, P/S |

### 6.2 Kannattavuus: Tekeekö yhtiö hyvin rahaa?

| Tunnusluku | Kysymys | Kaava sanoin | Suunta | Tärkeimmät säännöt | ⚠ Yleinen virhe | Vertaus | Katso rinnalla |
|---|---|---|---|---|---|---|---|
| **EBIT, liikevoitto** (perus) | Paljonko varsinainen liiketoiminta tuottaa voittoa? | Liikevaihto − liiketoiminnan kulut (ennen korkoja ja veroja) | ↑ Suurempi = parempi | Suhteuta myyntiin (EBIT-%). Kertaerät vääristävät, joten katso "vertailukelpoinen EBIT". Velat ja verot eivät vaikuta lukuun, joten sen avulla on helppo verrata yhtiöitä. | Katsotaan euromäärää eikä suhdetta yhtiön kokoon | Kahvilan voitto, kun raaka-aineet, palkat ja vuokra on maksettu mutta lainan korkoa ja veroja ei vielä | Liikevaihto, EBIT-%, EV/EBIT |
| **EBIT-%, liikevoittoprosentti** (perus) | Montako senttiä jokaisesta myydystä eurosta jää voitoksi? | EBIT ÷ liikevaihto × 100 % | ↑ Suurempi = parempi | Vertaa vain saman alan yhtiöihin. Kaupalla 3–5 % voi olla hyvä, ohjelmistoyhtiöllä 20 % tavallinen (suuntaa antava). Nouseva suunta on hyvä merkki. | Verrataan eri alojen yhtiöitä keskenään | Jos myyt 100 €:n tuotteen ja 10 € jää käteen, EBIT-% on 10 | EBIT, Liikevaihto, P/S, ROE |
| **ROE, oman pääoman tuotto** (syventävä) | Kuinka hyvin yhtiö tekee tulosta omistajien sijoittamalla rahalla? | Nettotulos ÷ oma pääoma × 100 % | ↑ Suurempi = parempi | Yli 10–15 % on usein hyvä (nyrkkisääntö). Velka nostaa ROE:ta keinotekoisesti, joten tarkista velkaisuus. Vakaa taso usean vuoden ajan on arvokkaampi kuin yksi hyvä vuosi. | Korkea ROE tulkitaan laadukkuudeksi, vaikka taustalla on suuri velka | Säästötilin korko, mutta yhtiön omalle pääomalle | P/B, Nettovelkaantumisaste, Omavaraisuusaste |

### 6.3 Per osake: Paljonko yhdelle osakkeelle kuuluu?

| Tunnusluku | Kysymys | Kaava sanoin | Suunta | Tärkeimmät säännöt | ⚠ Yleinen virhe | Vertaus | Katso rinnalla |
|---|---|---|---|---|---|---|---|
| **EPS, osakekohtainen tulos** (perus) | Paljonko voittoa yhtiö teki yhtä osaketta kohden? | Nettotulos ÷ osakkeiden määrä | ↑ Suurempi = parempi | Kehityssuunta vuosien yli on tärkeämpi kuin yksi luku. Osakeannit pienentävät ja takaisinostot kasvattavat EPS:ää, vaikka tulos ei muuttuisi. Kertaerät vääristävät. | Verrataan eri yhtiöiden EPS-lukuja, vaikka osakkeen hinnat ovat eri tasolla | Pizzan viipaleen koko: mitä enemmän viipaleita, sitä pienempi kukin on | P/E, Osinko/osake, Osinkosuhde |
| **Osinko/osake** (perus) | Paljonko rahaa saat jokaisesta omistamastasi osakkeesta? | Jaettavat osingot yhteensä ÷ osakkeiden määrä | ↑ Suurempi = parempi (kun kestävä) | Jos osinko on suurempi kuin EPS, tasoa ei voi jatkaa pitkään. Tasainen tai nouseva historia kertoo vakaudesta. | Katsotaan euromäärää ilman suhdetta osakkeen hintaan | Vuokra, jonka sijoitusasunto maksaa sinulle | Osinkotuotto, Osinkosuhde, EPS |

### 6.4 Osinko: Paljonko osinkoa saan, ja onko se kestävää?

| Tunnusluku | Kysymys | Kaava sanoin | Suunta | Tärkeimmät säännöt | ⚠ Yleinen virhe | Vertaus | Katso rinnalla |
|---|---|---|---|---|---|---|---|
| **Osinkotuotto** (perus) | Montako prosenttia osakkeen hinnasta saat vuodessa osinkona? | Osinko/osake ÷ osakkeen hinta × 100 % | ↔ Sopiva väli | Hyvin korkea tuotto voi olla "osinkoansa": kurssi on laskenut ongelmien vuoksi, ja osinkoa saatetaan leikata. Tarkista osinkosuhde. Kasvuyhtiöt jakavat usein vähän tarkoituksella. | "Korkein osinkotuotto = paras osake" | Vuokratuotto-%: vuokra suhteessa asunnon hintaan | Osinkosuhde, Osinko/osake, P/E |
| **Osinkosuhde** (syventävä) | Kuinka suuren osan voitostaan yhtiö jakaa osinkoina? | Osinko/osake ÷ EPS × 100 % | ↔ Sopiva väli | Noin 30–70 % on usein kestävää (nyrkkisääntö). Yli 100 % tarkoittaa, että osinko maksetaan enemmän kuin tehtiin tulosta, mikä ei jatku pitkään. Kasvava yhtiö tarvitsee rahaa investointeihin, joten matala suhde voi olla järkevä. | Katsotaan vain osinkotuottoa eikä tarkisteta, onko osingolle katetta | Kuinka suuren osan palkastasi kulutat ja kuinka suuren säästät | Osinkotuotto, EPS, Osinko/osake |

### 6.5 Velka: Onko yhtiöllä liikaa velkaa?

| Tunnusluku | Kysymys | Kaava sanoin | Suunta | Tärkeimmät säännöt | ⚠ Yleinen virhe | Vertaus | Katso rinnalla |
|---|---|---|---|---|---|---|---|
| **Omavaraisuusaste** (perus) | Kuinka suuri osa yhtiön omaisuudesta on hankittu omalla rahalla eikä velalla? | Oma pääoma ÷ (taseen loppusumma − saadut ennakot) × 100 % | ↑ Suurempi = yleensä vakaampi | Yli 40 % on usein vakaa ja alle 20 % heikko (nyrkkisääntö). Vaihtelee aloittain: pankeilla ja kiinteistöyhtiöillä taso on luonnostaan matalampi. Kehityssuunta kertoo, kasvaako velka. | "Mitä korkeampi, sen parempi". Hyvin korkea aste voi tarkoittaa, että yhtiö ei käytä velkaa kasvun rahoittamiseen silloinkaan, kun se olisi järkevää | Kuinka suuren osan asunnosta omistat itse ja kuinka suuren osan pankki | Nettovelkaantumisaste, ROE |
| **Nettovelkaantumisaste** (syventävä) | Kuinka paljon yhtiöllä on velkaa suhteessa omistajien rahaan, kun käteinen vähennetään? | Nettovelka ÷ oma pääoma × 100 % | ↓ Pienempi = yleensä vähäriskisempi | Alle 50 % on usein maltillinen ja yli 100 % paljon (nyrkkisääntö). Negatiivinen luku tarkoittaa, että käteistä on enemmän kuin velkaa. Velka on riskialttiimpaa, kun tulos heiluu tai korot nousevat. | Velkaa pidetään aina pahana, vaikka vakaatuloksinen yhtiö voi kantaa sitä turvallisesti | Asuntolaina miinus säästötili suhteessa siihen, mitä asunnosta omistat itse | Omavaraisuusaste, EV, ROE |

### 6.6 Hinta: Onko osake halpa vai kallis?

| Tunnusluku | Kysymys | Kaava sanoin | Suunta | Tärkeimmät säännöt | ⚠ Yleinen virhe | Vertaus | Katso rinnalla |
|---|---|---|---|---|---|---|---|
| **P/E** (perus) | Montako vuoden tulosta maksat osakkeen hinnassa? | Osakkeen hinta ÷ EPS | ↓ Pienempi = yleensä halvempi | Vertaa saman alan yhtiöihin ja yhtiön omaan historiaan. Nopeasti kasvavalla yhtiöllä korkea P/E voi olla perusteltu. Tappiollisella yhtiöllä P/E:tä ei voi käyttää. | "Matala P/E = hyvä ostos". Tulos voi olla laskemassa | Montako vuotta kioskin voitoilla kestäisi maksaa kioskin hinta | PEG, EPS, EV/EBIT |
| **EV/EBIT** (syventävä) | Montako vuoden liikevoittoa maksat koko yhtiöstä velkoineen? | EV ÷ EBIT | ↓ Pienempi = yleensä halvempi | Soveltuu P/E:tä paremmin, kun yhtiöillä on eri määrä velkaa. Vertaa saman alan yhtiöihin. Ei toimi, jos EBIT on negatiivinen. | Verrataan velattomia ja velkaisia yhtiöitä P/E:llä, vaikka EV/EBIT sopisi paremmin | P/E, mutta asunnon velattomalla hinnalla | P/E, EV, EBIT-% |
| **P/B** (syventävä) | Paljonko maksat suhteessa siihen, mitä yhtiön kirjanpidossa on omaisuutta velkojen jälkeen? | Osakkeen hinta ÷ oma pääoma per osake | ↓ Pienempi = yleensä halvempi | Alle 1 tarkoittaa, että osake maksaa vähemmän kuin kirjanpidollinen oma pääoma. Hyödyllisin pankeille, kiinteistö- ja teollisuusyhtiöille. Heikko ohjelmisto- ja palveluyhtiöille, joiden arvo ei näy taseessa. | "P/B alle 1 = varmasti alihinnoiteltu". Syynä voi olla huono kannattavuus | Maksaisitko talosta enemmän vai vähemmän kuin sen rakennusmateriaalit ja tontti ovat kirjanpidossa? | ROE, P/E |
| **PEG** (syventävä) | Onko P/E kohtuullinen, kun yhtiön kasvu otetaan huomioon? | P/E ÷ tuloksen vuotuinen kasvu-% | ↓ Pienempi = yleensä halvempi | Alle 1 on kasvuun nähden edullinen, noin 1 kohtuullinen ja yli 1 kallis (nyrkkisääntö). Luku on vain yhtä luotettava kuin kasvuennuste. Ei toimi, jos kasvu on nolla tai negatiivinen. | Kasvuennustetta pidetään varmana tietona | Kalliimpi omenapuu voi olla edullinen, jos se kasvaa nopeasti ja tuottaa enemmän | P/E, EPS |
| **P/S** (syventävä) | Paljonko maksat yhtiön jokaisesta myyntieurosta? | Markkina-arvo ÷ liikevaihto | ↓ Pienempi = yleensä halvempi | Toimii myös tappiollisille yhtiöille. Tulkinta riippuu katteista: kaupan alalla P/S on luonnostaan matala. Vertaa vain saman alan yhtiöihin. | Verrataan eri alojen yhtiöitä P/S-luvulla | Kaupan hinta suhteessa sen vuotuiseen myyntiin, ei voittoon | EBIT-%, Liikevaihto, P/E |

Kaikki `companions`-viittaukset osoittavat nyt olemassa oleviin tunnuslukuihin. Seuraavia ehdokkaita lisättäviksi ovat esimerkiksi **vapaa kassavirta**, **liikevaihdon kasvu-%** ja **ROI / ROCE**.

### 6.7 Lisälukemista: linkit muille sivustoille

Jokaisella tunnusluvulla on 1–3 linkkiä sivuille, joilla sama tunnusluku on selitetty toisin sanoin tai jossa on lisää esimerkkejä. Aloittelijalle toinen selitys auttaa usein silloin, kun ensimmäinen ei aukea. Linkit ovat opasta täydentävää lisälukemista. Oppaan oman sisällön on oltava ymmärrettävä ilman niitä.

**Lähteiden valintaperiaatteet**

| Periaate | Käytännössä |
|---|---|
| **Neutraalit lähteet ensin** | Ensisijaisia ovat voittoa tavoittelemattomat tai opetukselliset sivustot, esimerkiksi Pörssisäätiö, Osakesäästäjien Keskusliitto, Wikipedia (fi/en) ja Investopedia (en). |
| **Kaupallisista vain opetussivut** | Pankin, välittäjän tai analyysitalon (esim. Inderes, Nordnet) sivun voi valita, jos sivu on selittävä opas eikä markkinoi tuotetta tai suosittele tiettyä osaketta. Sivusto merkitään tiedostossa `sources.ts` kaupalliseksi. |
| **Suomi ensin** | Vähintään yksi suomenkielinen linkki aina kun mahdollista. Englanninkielinen lähde valitaan, jos se tuo jotain lisää, kuten useamman laskuesimerkin. |
| **Aloittelijan tasoinen** | Sivun pitää olla ymmärrettävä ilman ennakkotietoja. Akateemiset artikkelit ja ammattilaisille tarkoitetut sivut jätetään pois. |
| **Vapaasti luettava** | Ei maksumuureja, kirjautumista vaativia sivuja, keskustelupalstoja eikä kumppanuuslinkkejä (affiliate). |
| **Vain linkki, ei kopiointia** | Toisten sivustojen tekstejä ei kopioida oppaaseen. Linkkiteksti kirjoitetaan itse. |
| **Tarkistettu sisältö** | Jokainen linkki avataan ja luetaan ennen lisäämistä. Sisällön pitää olla ristiriidaton oppaan kanssa. Jos lähde esimerkiksi laskee tunnusluvun eri tavalla, linkkiä ei lisätä tai ero kerrotaan linkkitekstissä. Lukupäivä kirjataan kenttään `checkedAt`. |

Tarkat osoitteet haetaan ja tarkistetaan vaiheessa 3b. Tähän suunnitelmaan ei kirjata URL-osoitteita etukäteen, koska ne vanhenevat.

**Linkkien ylläpito**

Linkit rikkoutuvat ajan myötä: sivut siirtyvät, ja sivustot uudistuvat. Siksi:

1. Skripti `scripts/check-links.mjs` (`npm run check-links`) tarkistaa, että jokainen osoite vastaa ilman virhettä ja että uudelleenohjaukset eivät vie toiselle verkkotunnukselle. Se tulostaa ongelmalliset linkit.
2. GitHub Actions ajaa tarkistuksen kerran viikossa ja avaa issuen, jos jokin linkki on rikki. Tarkistus on erillään tavallisista testeistä, koska yksittäinen hidas tai tilapäisesti alhaalla oleva sivusto ei saa kaataa buildia.
3. Testit antavat varoituksen linkistä, jonka `checkedAt` on yli 12 kuukautta vanha. Linkin sisältö luetaan silloin uudelleen, koska sivu voi toimia teknisesti mutta sen sisältö on voinut muuttua.
4. Rikkinäinen linkki korvataan toisella tai poistetaan. Kortti toimii myös ilman linkkejä.

## 7. Toteutusvaiheet

| Vaihe | Sisältö | Valmis, kun |
|---|---|---|
| **1. Projektipohja** ✅ | `npm create vite@latest` (react-ts), ESLint, Prettier, Vitest ja kansiorakenne | `npm run dev` ja `npm test` toimivat |
| **2. Datamalli** ✅ | `types.ts`, `schema.ts`, `categories.ts` ja `glossary.ts` sekä kaksi esimerkkitunnuslukua (P/E, PEG) | Skeema- ja sanastotestit menevät läpi |
| **3. Sisältö** ✅ | Kaikki 17 tunnuslukua ja sanasto kirjoitetaan kohdan 2 periaatteiden mukaan | Validointitestit menevät läpi, ja jokainen teksti on tarkistettu kohdan 9 listalla |
| **3b. Lisälukemista-linkit** ✅ | `ExternalLink`- ja `Source`-tyypit, skeema ja tarkistukset, `sources.ts`, 1–3 linkkiä jokaiselle tunnusluvulle kohdan 6.7 periaatteiden mukaan sekä `scripts/check-links.mjs` | Jokaisella tunnusluvulla on vähintään yksi linkki, testit ja `npm run check-links` menevät läpi, ja jokainen linkki on luettu käsin |
| **4. Kortti** | `MetricCard`, `DirectionBadge`, `FormulaBox`, `CompanionChips`, `ExternalLinks`, `RichText` ja `GlossaryTerm` | Yksi kortti näyttää kaikki kohdan 5.2 tiedot, ja sanastoikkuna toimii hiirellä, kosketuksella ja näppäimistöllä |
| **5. Ruudukko ja navigointi** | `MetricGrid`, kysymysotsikot, rinnakkaislinkkien vieritys ja korostus | Linkki P/E → PEG toimii |
| **6. Johdanto** | `IntroPanel` ja suositeltu lukujärjestys | Paneelin voi sulkea ja avata uudelleen, ja askeleet vievät oikeisiin kortteihin |
| **7. Haku ja suodatus** | `FilterBar`, "Näytä myös syventävät", `useMetricFilter`, `useUrlState` ja pikanäppäin `/` | "velaton" löytää EV:n, ja URL säilyttää tilan |
| **8. Ulkoasu** | Teemat, responsiivisuus ja saavutettavuustarkistus (axe tai Lighthouse) | Lighthouse-saavutettavuus ≥ 95, toimii 375 px leveydellä |
| **9. Käyttäjätesti** | 3–5 osakesijoittamista tuntematonta testaajaa, esimerkiksi tuttavia (kohta 8) | Testaajat löytävät vastaukset tavoiteajassa, ja löydetyt ongelmat on korjattu |
| **10. Julkaisu** | GitHub Actions: testit, build ja julkaisu GitHub Pagesiin sekä viikoittainen linkkitarkistus | Sivu on julkisessa osoitteessa, ja linkkitarkistus on ajettu kerran onnistuneesti |
| **11. Ohje ylläpitäjälle** | `README.md`: "Näin lisäät uuden tunnusluvun" (mallitietue ja kohdan 9 tarkistuslista) | Uuden luvun lisääminen onnistuu ohjeen avulla ilman koodin lukemista |

## 8. Testaus

### 8.1 Automaattiset testit

- **Datatestit** (tärkeimmät, koska sisältö on sovelluksen ydin):
  - Jokainen tietue läpäisee Zod-skeeman, ja id:t ovat yksilöllisiä.
  - Tekstien pituusrajat pitävät.
  - `companions`-viittaukset osoittavat olemassa olevaan tunnuslukuun tai ovat "tulossa"-listalla, ja jälkimmäiset listataan varoituksina.
  - Tunnusluku ei viittaa itseensä.
  - Jokainen `[[termi]]` löytyy sanastosta tai tunnuslukujen nimistä.
  - Jokaisella tunnusluvulla on kysymys, vertaus, esimerkki ja yleinen virhe.
  - **Linkit:**
    - osoite on `https`
    - osoitteen verkkotunnus vastaa `sources.ts`:n sivustoa
    - sama osoite ei esiinny kahdesti saman tunnusluvun linkeissä
    - linkkejä on enintään 3
    - `checkedAt` on kelvollinen päivämäärä, joka ei ole tulevaisuudessa.

    Varoitukset: tunnusluvulla ei ole yhtään linkkiä tai ei yhtään suomenkielistä linkkiä, tai `checkedAt` on yli 12 kuukautta vanha.
- **Logiikkatestit:** haku (synonyymit, kysymykset, isot ja pienet kirjaimet, ä/ö) sekä kategoria- ja tasosuodatus.
- **Komponenttitestit:**
  - kortin laajennus
  - rinnakkaislinkin klikkaus (vieritys ja suodattimen nollaus)
  - sanastoikkunan avaus ja sulkeminen näppäimistöllä
  - johdannon sulkemisen muistaminen
  - ulkoisten linkkien `target`- ja `rel`-attribuutit sekä EN-merkki.
- **Linkkitarkistus** (`npm run check-links`, ei osa `npm test`:iä): osoitteet vastaavat, eivätkä uudelleenohjaukset vie toiselle verkkotunnukselle. Ajetaan viikoittain GitHub Actionsissa.

### 8.2 Käyttäjätesti aloittelijoilla

Testaajiksi valitaan 3–5 henkilöä, jotka eivät sijoita osakkeisiin. Tehtävät annetaan ilman opastusta:

1. "Pankkisovellus näyttää osakkeelle P/E-luvun 30. Onko se paljon vai vähän, ja mitä muuta kannattaisi tarkistaa?"
2. "Yhden osakkeen osinkotuotto on 12 %. Onko se hyvä asia?" Testaaja löytää osinkoansan ja osinkosuhteen.
3. "Mitä tarkoittaa 'oma pääoma'?" Testaaja löytää sanaston.
4. "Mikä on EV?" Testaaja löytää kortin haulla.

**Tavoite:** tehtävät 1 ja 2 onnistuvat alle minuutissa. Seurataan myös, mitkä sanat testaajat kokevat vaikeiksi. Ne lisätään sanastoon tai kirjoitetaan uudelleen.

### 8.3 Käsin testattavaa

Mobiilinäkymä, tumma teema ja näppäimistökäyttö.

## 9. Uuden tunnusluvun lisääminen (ylläpitäjän näkökulma)

1. Kopioi olemassa oleva tietue `src/data/metrics.ts`-tiedostossa ja muokkaa kentät.
2. Valitse `category`, `level` ja `direction`. Jos tarvitset uuden kategorian, lisää se `categories.ts`:ään kysymyksenä.
3. Lisää `companions` ja päivitä samalla vastaavien tunnuslukujen `companions`-listat, jos yhteys toimii molempiin suuntiin.
4. Merkitse vaikeat sanat muodossa `[[termi]]` ja lisää puuttuvat termit `glossary.ts`:ään.
5. Jos jokin muu tunnusluku viittasi tähän "tulossa"-tilaisena, viittaus aktivoituu automaattisesti.
6. Etsi 1–3 lisälukemista-linkkiä kohdan 6.7 periaatteiden mukaan ja lue ne. Jos sivusto on uusi, lisää se `sources.ts`:ään.
7. Aja `npm test` ja `npm run check-links`.

**Sisällön tarkistuslista (aloittelijan näkökulma):**

- [ ] Kysymys on arkikielinen ja ymmärrettävä ilman taustatietoja.
- [ ] Lyhenne on avattu.
- [ ] Jokainen ammattisana on joko selitetty sanastossa tai korvattu arkisanalla.
- [ ] Esimerkissä on tasalukuja, ja se tuottaa oikean tuloksen.
- [ ] Vertaus on arkinen ja suomalaiselle tuttu.
- [ ] Suuntamerkinnässä on sana "yleensä", jos suunta ei päde aina.
- [ ] Viitearvot on merkitty nyrkkisäännöiksi.
- [ ] Yleinen virhe on muotoiltu niin, että aloittelija tunnistaa itsensä.
- [ ] Mikään teksti ei kehota ostamaan tai myymään.
- [ ] Linkit on luettu, ne ovat aloittelijan tasoisia, eivätkä ne ole ristiriidassa oppaan kanssa.
- [ ] Linkkiteksti kertoo, mitä sivulta löytyy, ja mukana on suomenkielinen linkki, jos sellainen on saatavilla.

## 10. Avoimet kysymykset myöhemmin päätettäväksi

- Tarvitaanko myöhemmin laskuri? Datamalliin voi lisätä valinnaisen `inputs`-kentän ilman nykyisen rakenteen muutoksia.
- Toimialakohtaiset tyypilliset tasot (esim. EBIT-% tai P/E eri aloilla): lisätäänkö `ranges`-kenttään toimialatunniste?
- Kuvitetaanko vertaukset pienillä kuvakkeilla?
- Lisätäänkö lisälukemista-linkit myöhemmin myös sanastotermeille? Sama `ExternalLink`-rakenne sopii niihin sellaisenaan.
- Tarvitaanko englanninkielinen versio?
