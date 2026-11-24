import Image from "next/image";
import Link from "next/link";

import { PolicyCard } from "@/components/policy-card";
import { policyPillars } from "@/lib/policies";
import neighborhood from "@/public/images/liu-neighborhood-day.webp";

import styles from "./policies.module.css";

export function PolicySection() {
  return (
    <section id="policies" aria-labelledby="policies-heading" className={styles.section}>
      <div className="site-container">
        <div className={styles.heading}>
          <h2 id="policies-heading" className="editorial-title">
            <span className={styles.headingAccent}>6F</span> 行動政見
            <svg
              className={styles.headingStamp}
              viewBox="0 0 64 64"
              fill="none"
              stroke="currentColor"
              strokeWidth="4.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M32.6 4.5C48 4.4 59.8 16.5 59.5 31.8c-.2 15.4-12.4 27.9-27.8 27.7C16.6 59.3 4.5 47.2 4.5 32S16.9 4.8 32.6 4.5Z" />
              <path d="M33 6.2 32 57.7M32.6 29.3 13 47.1" />
            </svg>
          </h2>
          <p className={styles.description}>
            選舉公報列出的六個面向、十八項具體行動。
            <Link href="/game" className={styles.gameLink}>玩 6F 街區跑酷 <span aria-hidden="true">↗</span></Link>
          </p>
          <Image
            src={neighborhood}
            alt=""
            sizes="(min-width: 1024px) 24vw, 1px"
            className={styles.headingArt}
          />
        </div>

        <nav aria-label="6F 政見快速索引">
          <ul className={styles.index}>
            {policyPillars.map((pillar) => (
              <li key={pillar.id}>
                <a href={`#${pillar.id}`} className={styles.indexLink}>
                  <span className={styles.indexName}>
                    <strong>{pillar.chinese}</strong>
                    <span lang="en">{pillar.english}</span>
                  </span>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={styles.indexArrow}
                  >
                    <path d="m5 5 10 10m-8 0h8V7" />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.cards}>
          {policyPillars.map((pillar) => (
            <PolicyCard key={pillar.id} pillar={pillar} />
          ))}
        </div>
      </div>
    </section>
  );
}
