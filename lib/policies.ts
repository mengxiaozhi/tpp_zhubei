export type Policy = {
  action: "推動" | "爭取" | "改善" | "監督" | "連線議員協調";
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
        action: "連線議員協調",
        text: "尖峰增設直達園區與高鐵跳蛙公車，減少繞駛。",
      },
      {
        action: "爭取",
        text: "建置電子紙智慧站牌，顯示動態消除候車焦慮。",
      },
      {
        action: "推動",
        text: "主要公車站點普及 YouBike，無縫接軌大眾運輸。",
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
        text: "公有停車場動態車位連線導引，普及電子支付。",
      },
      {
        action: "改善",
        text: "車禍熱點增設實體行人穿越按鈕與行人庇護島。",
      },
      {
        action: "監督",
        text: "學區增設實體人行道與綠底標線，確保通學安全。",
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
        text: "公所臨櫃導入 AI 語音轉文字系統，溝通零死角。",
      },
      {
        action: "爭取",
        text: "專案擴充社區日照量能，開辦銀髮族 3C 課程。",
      },
      {
        action: "連線議員協調",
        text: "擴大 0-6 歲早療補助與支持網絡，減輕家庭負擔。",
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
        text: "盤點老舊集會所，爭取漏水修繕與無障礙翻新。",
      },
      {
        action: "推動",
        text: "路燈升級智慧共桿，整合監視、微基站與環境感測。",
      },
      {
        action: "監督",
        text: "升級共融式公園遊具，同步改善防護地墊與排水。",
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
        action: "連線議員協調",
        text: "重點河段佈建 AIoT 水質與水位感測，強化防汛。",
      },
      {
        action: "推動",
        text: "車站與公園設置附蓋熄菸柱，劃定管理吸菸區。",
      },
      {
        action: "爭取",
        text: "公園增設寵物拾便袋供應箱，鼓勵自主維護綠地。",
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
        action: "爭取",
        text: "壅塞路口加裝 UPS 系統，確保跳電時號誌不癱瘓。",
      },
      {
        action: "連線議員協調",
        text: "加速市區電纜地下化，佔用人行道變電箱遷移美化。",
      },
      {
        action: "監督",
        text: "落實路平、燈亮、水溝通，科技人實幹親自追蹤。",
      },
    ],
  },
];
