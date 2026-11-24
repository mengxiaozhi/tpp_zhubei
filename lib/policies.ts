export type Policy = {
  action: "推動" | "爭取" | "改善" | "監督" | "合作推動" | "合作爭取";
  text: string;
};

export type PolicyPillar = {
  id: string;
  number: string;
  english: string;
  chinese: string;
  theme: string;
  icon: "bus" | "home" | "accessibility" | "building" | "leaf" | "tool";
  tone: "dark" | "mint" | "light";
  policies: Policy[];
};

export const policyPillars: PolicyPillar[] = [
  {
    id: "fast",
    number: "01",
    english: "FAST",
    chinese: "效率",
    theme: "公運串接・通勤無礙",
    icon: "bus",
    tone: "dark",
    policies: [
      {
        action: "爭取",
        text: "尖峰增設直達園區與高鐵跳蛙公車，減少繞駛、縮短通勤時間。",
      },
      {
        action: "爭取",
        text: "公車站導入智慧站牌，提供即時班次資訊，降低候車焦慮。",
      },
      {
        action: "合作推動",
        text: "公車轉乘節點增設 YouBike 站點，完善大眾運輸最後一哩。",
      },
    ],
  },
  {
    id: "family",
    number: "02",
    english: "FAMILY",
    chinese: "家園",
    theme: "智慧好停・步步安心",
    icon: "home",
    tone: "mint",
    policies: [
      {
        action: "推動",
        text: "公有停車場導入動態車位資訊與多元電子支付，讓找車位更有效率。",
      },
      {
        action: "改善",
        text: "盤點交通事故熱點，增設行人穿越按鈕、行人庇護島等安全設施。",
      },
      {
        action: "推動",
        text: "盤點社區巷弄照明死角，改善路燈與夜間通行環境，讓居民安心回家。",
      },
    ],
  },
  {
    id: "fair",
    number: "03",
    english: "FAIR",
    chinese: "公平",
    theme: "跨世代・無障礙",
    icon: "accessibility",
    tone: "light",
    policies: [
      {
        action: "推動",
        text: "公所臨櫃導入 AI 語音轉文字服務，協助聽語障及高齡民眾溝通。",
      },
      {
        action: "爭取",
        text: "擴充家庭照顧者支持服務，增加喘息、照顧技巧與心理支持資源。",
      },
      {
        action: "推動",
        text: "社區銀髮數位課程，協助長輩使用手機、掛號、交通與政府線上服務。",
      },
    ],
  },
  {
    id: "future",
    number: "04",
    english: "FUTURE",
    chinese: "未來",
    theme: "基建翻新・智慧入里",
    icon: "building",
    tone: "dark",
    policies: [
      {
        action: "改善",
        text: "盤點老舊集會所，爭取漏水修繕與無障礙翻新，提升社區使用品質。",
      },
      {
        action: "推動",
        text: "適合路段導入智慧共桿，整合照明、監視與環境感測。",
      },
      {
        action: "監督",
        text: "持續升級共融式公園遊具，同步改善防護地墊與排水，打造安全遊憩環境。",
      },
    ],
  },
  {
    id: "fresh",
    number: "05",
    english: "FRESH",
    chinese: "清新",
    theme: "科技治污・乾淨市容",
    icon: "leaf",
    tone: "mint",
    policies: [
      {
        action: "合作爭取",
        text: "重點河段導入 AIoT 水位、水質感測，強化防汛與污染監測。",
      },
      {
        action: "爭取",
        text: "盤點菸蒂熱點，評估設置集中吸菸區，減少菸蒂落地，維護公共環境。",
      },
      {
        action: "爭取",
        text: "公園增設寵物拾便袋供應箱，鼓勵自主維護綠地，共創友善環境。",
      },
    ],
  },
  {
    id: "fix",
    number: "06",
    english: "FIX",
    chinese: "改革",
    theme: "拒停擺・馬上辦",
    icon: "tool",
    tone: "light",
    policies: [
      {
        action: "合作爭取",
        text: "重要路口導入號誌 UPS 備援，降低停電造成的交通癱瘓。",
      },
      {
        action: "監督",
        text: "加速纜線地下化與管線整併，要求占用人行道設施逐步退縮或遷移，還路於民。",
      },
      {
        action: "監督",
        text: "落實「路平、燈亮、水溝通」，建立案件追蹤清單，逐案追蹤到改善。",
      },
    ],
  },
];
