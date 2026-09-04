import { PolicyIcon } from "@/components/policy-icon";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PolicyPillar } from "@/lib/policies";

export function PolicyCard({ pillar }: { pillar: PolicyPillar }) {
  const isDark = pillar.tone === "dark";

  return (
    <Card
      id={pillar.id}
      tone={pillar.tone}
      className="group scroll-mt-28 overflow-hidden p-6 sm:p-8 lg:grid lg:grid-cols-[13rem_1fr] lg:gap-7 lg:p-7"
    >
      <CardHeader className="grid grid-cols-[1fr_auto] gap-x-5 border-b border-current/15 pb-6 lg:grid-cols-1 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-7">
        <div className="min-w-0">
          <p
            className={`font-display text-[clamp(3.35rem,7vw,5.7rem)] font-black leading-[0.8] tracking-[-0.065em] lg:text-[clamp(3.35rem,4vw,4.25rem)] ${
              isDark || pillar.tone === "mint" ? "text-primary" : "text-foreground"
            }`}
          >
            {pillar.english}
          </p>
          <CardTitle className="mt-5 text-2xl tracking-[-0.03em] sm:text-[1.7rem]">
            {pillar.chinese}
          </CardTitle>
          <CardDescription className="mt-1 text-current opacity-65">
            {pillar.theme}
          </CardDescription>
        </div>
        <div
          className={`flex size-16 items-center justify-center self-end border lg:size-14 lg:self-end ${
            isDark ? "border-white/20 text-primary" : "border-foreground/15 text-foreground"
          }`}
        >
          <PolicyIcon name={pillar.icon} />
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-0 pt-2 lg:pt-0">
        {pillar.policies.map((policy, index) => (
          <div
            key={`${pillar.id}-${index}`}
            className="grid gap-3 border-b border-current/15 py-5 last:border-b-0 sm:grid-cols-[8.25rem_1fr] sm:items-start lg:grid-cols-[7rem_1fr] lg:py-4"
          >
            <Badge inverse={isDark}>{policy.action}</Badge>
            <p className="text-[15px] font-medium leading-[1.8] sm:text-base">
              {policy.text}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
