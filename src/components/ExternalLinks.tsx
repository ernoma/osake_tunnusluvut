import { sourcesById } from "../data/content.ts";
import type { ExternalLink } from "../data/types.ts";
import styles from "./ExternalLinks.module.css";

interface Props {
  links: ExternalLink[];
  /** Väliotsikon taso: kortin sisällä h4. */
  headingLevel?: "h3" | "h4";
}

/** "Lue lisää muualta": linkit muille sivustoille. Suomenkieliset ensin. */
export default function ExternalLinks({ links, headingLevel: Heading = "h4" }: Props) {
  if (links.length === 0) return null;
  const sorted = [...links].sort((a, b) => rank(a) - rank(b));

  return (
    <div className={styles.section}>
      <Heading className={styles.heading}>Lue lisää muualta</Heading>
      <ul className={styles.list}>
        {sorted.map((link) => (
          <li key={link.url}>
            <a
              className={styles.link}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              hrefLang={link.language}
            >
              <span className={styles.arrow} aria-hidden="true">
                ↗
              </span>
              <span lang={link.language}>{link.title}</span>
              {link.language === "en" && (
                <span className={styles.lang}>
                  <span aria-hidden="true">EN</span>
                  <span className="visually-hidden">, englanniksi</span>
                </span>
              )}
              <span className="visually-hidden"> (avautuu uuteen välilehteen)</span>
            </a>
            <span className={styles.meta}>
              {sourcesById.get(link.sourceId)?.name ?? link.sourceId} · {link.kind}
            </span>
          </li>
        ))}
      </ul>
      <p className={styles.disclaimer}>
        Ulkoiset sivut eivät ole tämän oppaan tekemiä. Niillä voi olla mainoksia tai tuotteiden
        markkinointia.
      </p>
    </div>
  );
}

const rank = (link: ExternalLink) => (link.language === "fi" ? 0 : 1);
