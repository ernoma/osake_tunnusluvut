import { metricsById, shortMetricName } from "../data/content.ts";
import { directionLegend, recommendedOrder } from "../data/intro.ts";
import DirectionBadge from "./DirectionBadge.tsx";
import styles from "./IntroPanel.module.css";

export const INTRO_HEADING_ID = "johdanto-otsikko";

interface Props {
  onClose: () => void;
}

/** "Aloita tästä": mitä tunnusluvut ovat, tärkein periaate ja suositeltu lukujärjestys. */
export default function IntroPanel({ onClose }: Props) {
  const steps = recommendedOrder.flatMap((id) => metricsById.get(id) ?? []);

  return (
    <section className={styles.panel} aria-labelledby={INTRO_HEADING_ID}>
      <div className={styles.top}>
        <h2 id={INTRO_HEADING_ID} className={styles.heading} tabIndex={-1}>
          Aloita tästä
        </h2>
        <button type="button" className={styles.close} onClick={onClose}>
          <span aria-hidden="true">✕ </span>Sulje johdanto
        </button>
      </div>

      <p>
        Tunnusluku tiivistää yhtiön tilinpäätöksen tai osakkeen hinnan yhdeksi luvuksi, jota on
        helppo verrata. Niitä näkee esimerkiksi pankin sovelluksessa, osakevertailusivustoilla ja
        uutisissa. Jokaisella luvulla on tässä oppaassa kortti, joka kertoo, mitä luku tarkoittaa ja
        miten sitä tulkitaan.
      </p>
      <p className={styles.principle}>
        Mikään luku ei yksin kerro, kannattaako osake ostaa. Katso aina useampaa lukua ja vertaa
        saman alan yhtiöihin.
      </p>

      <h3 className={styles.subheading}>Suositeltu lukujärjestys</h3>
      <p className={styles.hint}>
        Aloita yhtiön koosta ja kannattavuudesta, siirry sitten hintaan ja katso lopuksi velka ja
        osinko. Askel vie tunnusluvun korttiin.
      </p>
      <ol className={styles.steps}>
        {steps.map((m, i) => (
          <li key={m.id}>
            <a href={`#${m.id}`} className={styles.step}>
              <span className={styles.number} aria-hidden="true">
                {i + 1}
              </span>
              {shortMetricName(m)}
            </a>
          </li>
        ))}
      </ol>

      <h3 className={styles.subheading}>Kortin suuntamerkki</h3>
      <ul className={styles.legend}>
        {directionLegend.map(({ direction, label }) => (
          <li key={direction}>
            <DirectionBadge direction={direction} label={label} />
          </li>
        ))}
      </ul>

      <p className={styles.disclaimer}>
        Tämä on opas tunnuslukujen ymmärtämiseen, ei sijoitusneuvontaa. Sijoittamiseen liittyy aina
        riski.
      </p>
      <p className={styles.reopenNote}>
        Saat johdannon takaisin sivun yläosan linkistä ”Mitä tunnusluvut ovat?”.
      </p>
    </section>
  );
}
