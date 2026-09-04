import Image from "next/image";

import { PolicyCard } from "@/components/policy-card";
import { ShareButton } from "@/components/share-button";
import { SiteHeader } from "@/components/site-header";
import { ButtonLink } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { policyPillars } from "@/lib/policies";

function ArrowRight() {
  return (
    <svg
      aria-hidden="true"
      data-icon="inline-end"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="top">
        <section className="relative isolate overflow-hidden bg-foreground text-white lg:min-h-[calc(82svh-72px)]">
          <div className="relative h-[43svh] min-h-[310px] lg:absolute lg:inset-0 lg:h-auto lg:min-h-0">
            <Image
              src="/images/liu-wen-hsuan-hero.png"
              alt="劉文軒候選人形象照"
              fill
              priority
              sizes="100vw"
              className="object-cover object-[69%_center] sm:object-[65%_center] lg:object-center"
            />
          </div>

          <div className="relative mx-auto flex max-w-[1440px] items-end px-5 pb-12 pt-8 sm:px-8 sm:pb-16 sm:pt-10 lg:min-h-[calc(82svh-72px)] lg:items-start lg:px-12 lg:pb-20 lg:pt-28 xl:pt-32">
            <div className="max-w-[840px] animate-rise lg:w-[58%]">
              <h1 className="text-[2.45rem] font-black leading-[1.08] tracking-[-0.06em] sm:text-[3.5rem] lg:text-[clamp(4.3rem,5.1vw,5.2rem)] lg:leading-[1.03]">
                科技人的務實，
                <br />
                讓城市馬上更好。
              </h1>

              <div className="mt-8 flex items-end gap-4 sm:mt-10 sm:gap-7">
                <p className="font-display text-[clamp(3.2rem,6vw,5.9rem)] font-black leading-none tracking-[-0.07em]">
                  劉文軒
                </p>
                <p className="mb-1 border-b-2 border-primary pb-2 text-sm font-bold tracking-[0.12em] text-primary sm:mb-2 sm:text-lg">
                  台灣民眾黨
                </p>
              </div>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:gap-4">
                <ButtonLink href="#about" className="sm:min-w-48">
                  認識文軒
                  <ArrowRight />
                </ButtonLink>
                <ButtonLink href="#policies" variant="dark" className="sm:min-w-48">
                  6F 政見
                  <ArrowRight />
                </ButtonLink>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="scroll-mt-24 bg-background px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <div className="mx-auto grid max-w-[1344px] gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:items-start lg:gap-20">
            <div>
              <p className="font-display text-sm font-black tracking-[0.2em] text-primary">LIU WEN-HSUAN</p>
              <h2 className="mt-5 text-[clamp(2.6rem,4.2vw,4rem)] font-black leading-[1.05] tracking-[-0.06em] text-foreground">
                六個 <span className="text-primary">F</span>，
                <br />
                讓改變真正發生
              </h2>
            </div>

            <div className="grid gap-9 border-l-2 border-primary pl-6 sm:pl-10 lg:mt-3">
              <p className="max-w-3xl text-xl font-bold leading-[1.8] tracking-[-0.02em] text-foreground sm:text-2xl">
                把科技方法帶進公共服務，把居民每天遇到的問題，拆成可以追蹤、可以協調、可以落實的行動。
              </p>
              <p className="max-w-3xl text-base leading-[1.9] text-muted-foreground sm:text-lg">
                從通勤、停車、通學安全，到長照、基礎建設、環境治理與路口韌性；劉文軒以推動、爭取、改善、監督和跨層級協調，回應生活裡真正需要解決的事。
              </p>
              <div className="flex items-center gap-4 text-sm font-bold tracking-[0.08em]">
                <span className="h-0.5 w-10 bg-accent" />
                <span>劉文軒｜台灣民眾黨</span>
              </div>
            </div>
          </div>
        </section>

        <section id="policies" className="scroll-mt-20 bg-background px-5 pb-24 sm:px-8 lg:px-12 lg:pb-32">
          <div className="mx-auto max-w-[1344px]">
            <div className="flex flex-col gap-8 border-y border-border py-10 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="font-display text-sm font-black tracking-[0.2em] text-primary">ACTION POLICIES</p>
                <h2 className="mt-3 text-[clamp(2.8rem,5vw,5.3rem)] font-black leading-none tracking-[-0.06em]">
                  <span className="text-primary">6F</span> 行動政見
                </h2>
              </div>
              <p className="max-w-md text-base leading-[1.8] text-muted-foreground">
                六個面向，十八項具體行動。每一項都對準日常的不便與地方治理的缺口。
              </p>
            </div>

            <nav aria-label="6F 政見快速索引" className="policy-index">
              {policyPillars.map((pillar) => (
                <a key={pillar.id} href={`#${pillar.id}`} className="policy-index__item">
                  <span>{pillar.number}</span>
                  <strong>{pillar.english}</strong>
                  <small>{pillar.chinese}</small>
                </a>
              ))}
            </nav>

            <div className="grid gap-4 lg:grid-cols-2">
              {policyPillars.map((pillar) => (
                <PolicyCard key={pillar.id} pillar={pillar} />
              ))}
            </div>
          </div>
        </section>

        <section id="action" className="scroll-mt-20 bg-foreground px-5 py-16 text-white sm:px-8 lg:px-12 lg:py-20">
          <div className="mx-auto flex max-w-[1344px] flex-col gap-10 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[clamp(2.5rem,5.5vw,5.8rem)] font-black leading-[1.04] tracking-[-0.06em]">
                城市不該等，
                <br />
                問題<span className="text-primary">現在辦</span>
              </p>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-white/65 sm:text-lg">
                把你關心的政策分享出去，讓更多人一起看見具體的地方行動。
              </p>
            </div>
            <ShareButton />
          </div>
        </section>
      </main>

      <footer className="bg-background px-5 py-10 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1344px]">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-display text-3xl font-black tracking-[-0.05em]">劉文軒</p>
              <p className="mt-2 text-sm font-bold tracking-[0.12em] text-primary">台灣民眾黨</p>
            </div>
            <nav aria-label="頁尾導覽" className="flex flex-wrap gap-x-8 gap-y-3 text-sm font-bold">
              <a href="#about" className="hover:text-primary">認識文軒</a>
              <a href="#policies" className="hover:text-primary">6F 政見</a>
              <a href="#top" className="hover:text-primary">回到頂端</a>
            </nav>
          </div>
          <Separator className="my-8" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            劉文軒政策介紹網站｜本頁內容依提供之政策資料製作。
          </p>
        </div>
      </footer>
    </>
  );
}
