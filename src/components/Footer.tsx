import styles from "./App.module.css";

/** Vastuuvapauslauseke molempien sivujen lopussa. */
export default function Footer() {
  return (
    <footer className={styles.footer}>
      Tämä on opas tunnuslukujen ymmärtämiseen, ei sijoitusneuvontaa. Sijoittamiseen liittyy aina
      riski.
    </footer>
  );
}
