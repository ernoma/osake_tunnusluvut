import { metrics } from "../data/content.ts";
import MetricCard from "./MetricCard.tsx";
import styles from "./App.module.css";

export default function App() {
  return (
    <div className={styles.page}>
      <header>
        <h1>Osakkeen tunnusluvut – selkokielellä</h1>
        <p className={styles.lead}>
          Mitä luku kertoo, onko suuri vai pieni arvo hyvä ja mitä kannattaa katsoa rinnalla.
        </p>
      </header>
      <main>
        {/* Kategoriaryhmät ja kysymysotsikot tulevat vaiheessa 5 (MetricGrid). */}
        <h2 className="visually-hidden">Tunnusluvut</h2>
        <div className={styles.cards}>
          {metrics.map((m) => (
            <MetricCard key={m.id} metric={m} />
          ))}
        </div>
      </main>
      <footer className={styles.footer}>
        Tämä on opas tunnuslukujen ymmärtämiseen, ei sijoitusneuvontaa. Sijoittamiseen liittyy aina
        riski.
      </footer>
    </div>
  );
}
