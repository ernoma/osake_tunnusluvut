import { metrics } from "../data/content.ts";
import { useCardNavigation } from "../hooks/useCardNavigation.ts";
import MetricGrid from "./MetricGrid.tsx";
import styles from "./App.module.css";

export default function App() {
  useCardNavigation();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Osakkeen tunnusluvut – selkokielellä</h1>
        <p className={styles.lead}>
          Mitä luku kertoo, onko suuri vai pieni arvo hyvä ja mitä kannattaa katsoa rinnalla.
        </p>
      </header>
      <main>
        <MetricGrid metrics={metrics} />
      </main>
      <footer className={styles.footer}>
        Tämä on opas tunnuslukujen ymmärtämiseen, ei sijoitusneuvontaa. Sijoittamiseen liittyy aina
        riski.
      </footer>
    </div>
  );
}
