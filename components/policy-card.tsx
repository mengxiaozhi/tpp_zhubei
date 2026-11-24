import { PolicyIcon } from "@/components/policy-icon";
import { formatFilmTime, getFilmChapter } from "@/lib/campaign-film";
import type { PolicyPillar } from "@/lib/policies";

import styles from "./policies.module.css";

export function PolicyCard({ pillar }: { pillar: PolicyPillar }) {
  const chapter = getFilmChapter(pillar.id);

  return (
    <article
      id={pillar.id}
      tabIndex={-1}
      aria-labelledby={`${pillar.id}-heading`}
      className={styles.card}
    >
      <header className={styles.cardHeader}>
        <div className={styles.cardIcon}>
          <PolicyIcon name={pillar.icon} />
        </div>
        <div className={styles.cardHeading}>
          <h3 id={`${pillar.id}-heading`} className={styles.cardTitle}>
            <span lang="en" className={styles.cardWord}>
              {pillar.english}
            </span>
            <span>{pillar.chinese}</span>
          </h3>
          <p className={styles.cardTheme}>{pillar.theme}</p>
        </div>
      </header>

      <ul className={styles.actions}>
        {pillar.policies.map((policy) => (
          <li key={policy.text} className={styles.actionRow}>
            <span className={styles.actionLabel}>{policy.action}</span>
            <p>{policy.text}</p>
          </li>
        ))}
      </ul>

      {chapter && (
        <footer className={styles.cardFooter}>
          <a href={`#video-${chapter.id}`} className={styles.chapterLink}>
            <span className={styles.chapterLabel}>
              <span className={styles.chapterPrompt}>觀看片段</span>
              <span aria-hidden="true">·</span>
              <time dateTime={`PT${chapter.start}S`} className={styles.chapterTime}>
                {formatFilmTime(chapter.start)}
              </time>
              <span className="sr-only">
                ，<span lang="en">{pillar.english}</span> {pillar.chinese}
              </span>
            </span>
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={styles.chapterArrow}
            >
              <path d="M10 15V5m-4 4 4-4 4 4" />
            </svg>
          </a>
        </footer>
      )}
    </article>
  );
}
