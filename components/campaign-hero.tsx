import Image from "next/image";

import { CampaignCityscape } from "@/components/campaign-cityscape";
import { ShareCardLink } from "@/components/share-card-link";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import portrait from "@/public/images/liu-wen-hsuan-portrait.webp";

export function CampaignHero() {
  return (
    <section className="campaign-hero" aria-labelledby="campaign-heading">
      <CampaignCityscape className="campaign-hero__city" />
      <div className="campaign-hero__layout">
        <div className="campaign-copy">
          <p className="campaign-kicker">
            <span className="campaign-mark"><span>#</span>FFFFFF</span>
            <span className="campaign-role">硬體研發主任</span>
          </p>
          <p className="campaign-slogan">會做事！</p>
          <div className="campaign-identity">
            <p className="campaign-vote">
              <span className="campaign-vote__label">投票日請投</span>
              <strong className="campaign-number">9</strong>
              <span className="campaign-vote__suffix">號</span>
            </p>
            <h1 id="campaign-heading" className="campaign-name">劉文軒</h1>
          </div>
          <p className="campaign-district">
            <span>竹北市第十一屆市民代表選舉・第二選區</span>
            <span className="campaign-endorsement">台灣民眾黨推薦</span>
          </p>
          <div className="campaign-actions">
            <ButtonLink href="#policies">
              6F 政見
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14m-6-6 6 6 6-6" />
              </svg>
            </ButtonLink>
            <ShareCardLink className={buttonClasses("outline", "default")}>
              竹北小卡
            </ShareCardLink>
            <ButtonLink href="/game" variant="outline">
              街區跑酷
            </ButtonLink>
          </div>
        </div>

        <figure className="campaign-portrait">
          <Image
            src={portrait}
            alt="穿著白襯衫、手托下巴的劉文軒"
            loading="eager"
            fetchPriority="high"
            sizes="(max-width: 767px) 88vw, (max-width: 1728px) 53vw, 900px"
          />
          <figcaption>一步一步 我們並肩向前方！</figcaption>
        </figure>
      </div>
    </section>
  );
}
