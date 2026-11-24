import Image from "next/image";

import { CampaignHero } from "@/components/campaign-hero";
import { CampaignMotion } from "@/components/campaign-motion";
import { CampaignVideo } from "@/components/campaign-video";
import { InteractiveNeighborhood } from "@/components/interactive-neighborhood";
import { PolicySection } from "@/components/policy-section";
import { ShareButton } from "@/components/share-button";
import { ShareCardDrawer } from "@/components/share-card-drawer";
import { ShareCardLink } from "@/components/share-card-link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import neighborhoodEvening from "@/public/images/liu-neighborhood-evening.webp";

const experience = [
  { organization: "高名教育集團", role: "數學導師" },
  { organization: "新普科技", role: "硬體研發主任" },
  { organization: "新竹縣議員林碩彥服務團隊", role: "特助" },
  { organization: "反大享容器公司擴廠自救會", role: "特助" },
  { organization: "楊投高架延伸權益戶協調會", role: "召集人" },
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="top" tabIndex={-1} className="scroll-mt-20">
        <CampaignHero />

        <section id="about" aria-labelledby="about-heading" className="editorial-profile scroll-mt-20">
          <div className="site-container editorial-profile__layout">
            <div className="editorial-profile__intro">
              <p className="editorial-profile__label">認識文軒</p>
              <h2 id="about-heading" className="editorial-title">
                竹北劉文軒，
                <br />
                <span className="editorial-profile__accent">舊城寫新篇</span>
              </h2>

              <div className="editorial-profile__summary">
                <p>劉文軒有硬體研發與數學教學經驗，也曾參與地方服務。他希望運用工程方法，從居民每天遇到的問題著手。</p>
                <p>
                  <a href="#video">6F 政見影片</a>從「竹北是科技城？」問起，以街景動畫呈現通勤、巷弄照明與社區設施等議題。
                </p>
              </div>
              <InteractiveNeighborhood />
            </div>

            <div className="editorial-profile__credentials">
              <div>
                <h3>學歷</h3>
                <ul>
                  <li>
                    國立高雄科技大學電機工程系
                    <small>（原國立高雄應用科技大學）</small>
                  </li>
                  <li>國立新竹高工電機科</li>
                </ul>
              </div>
              <div>
                <h3>經歷</h3>
                <ul>
                  {experience.map(({ organization, role }) => (
                    <li key={organization} className="editorial-profile__job">
                      <span>{organization}</span>
                      <span>{role}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <CampaignVideo />
        <PolicySection />

        <section id="action" aria-labelledby="action-heading" className="editorial-action scroll-mt-20">
          <div className="editorial-action__art" aria-hidden="true">
            <Image
              src={neighborhoodEvening}
              alt=""
              fill
              sizes="(max-width: 767px) 100vw, 65vw"
            />
          </div>
          <div className="site-container">
            <div className="editorial-action__content">
              <h2 id="action-heading" className="editorial-title">
                一步一步<span className="sr-only">，</span>
                <br />
                我們並肩向前方！
              </h2>
              <p>從通勤、照顧到公園遊憩，把你關心的竹北日常做成一張小卡。</p>
              <div className="editorial-action__buttons">
                <ShareCardLink className="editorial-share-button">
                  製作竹北小卡 <span aria-hidden="true">↗</span>
                </ShareCardLink>
                <ShareButton />
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
      <CampaignMotion />
      <ShareCardDrawer />
    </>
  );
}
