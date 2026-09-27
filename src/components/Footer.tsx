import styles from "./App.module.css";

/** Vastuuvapauslauseke ja lisenssi molempien sivujen lopussa. */
export default function Footer() {
  return (
    <footer className={styles.footer}>
      <p>
        Tämä on opas tunnuslukujen ymmärtämiseen, ei sijoitusneuvontaa eikä suositus ostaa tai myydä
        mitään arvopaperia. Sijoittamiseen liittyy aina riski, ja sijoitetun pääoman voi menettää.
      </p>
      <p>
        Sovellus tarjotaan sellaisenaan ilman takuuta sen tietojen oikeellisuudesta,
        ajantasaisuudesta tai sopivuudesta mihinkään tarkoitukseen. Tekijä ei vastaa vahingoista tai
        menetyksistä, jotka aiheutuvat sovelluksen tai sen tietojen käytöstä. Tarkista luvut aina
        alkuperäisestä lähteestä.
      </p>
      <p>Lähdekoodi on avointa, lisenssi EUPL 1.2.</p>
    </footer>
  );
}
