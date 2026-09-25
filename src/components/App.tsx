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
        <p>Sisältö on tulossa.</p>
      </main>
      <footer className={styles.footer}>
        Tämä on opas tunnuslukujen ymmärtämiseen, ei sijoitusneuvontaa. Sijoittamiseen liittyy aina
        riski.
      </footer>
    </div>
  );
}
