import styles from "./site-chrome.module.css";

export function CampaignBrand() {
  return (
    <span className={styles.brand}>
      <span className={styles.brandNumber} aria-hidden="true">9</span>
      <strong className={styles.brandName}>劉文軒</strong>
    </span>
  );
}
