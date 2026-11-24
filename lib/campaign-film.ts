import { policyPillars } from "@/lib/policies";

type FilmChapter = {
  id: string;
  start: number;
  title: string;
  description: string;
};

const policyScenes: Record<string, { start: number; description: string }> = {
  fast: { start: 32, description: "跳蛙公車、智慧站牌與 YouBike 轉乘" },
  family: { start: 50, description: "停車資訊、行人安全與巷弄照明" },
  fair: { start: 66, description: "臨櫃溝通、照顧支持與銀髮數位課程" },
  future: { start: 82, description: "集會所修繕、智慧共桿與共融遊具" },
  fresh: { start: 100, description: "河川監測、街道與公園清潔" },
  fix: { start: 116, description: "號誌備援、人行空間與案件追蹤" },
};

export const filmChapters: FilmChapter[] = [
  { id: "intro", start: 0, title: "片頭・認識文軒", description: "竹北是科技城？" },
  ...policyPillars.flatMap(({ id, english, chinese }) => {
    const scene = policyScenes[id];
    return scene ? [{ id, title: `${english} ${chinese}`, ...scene }] : [];
  }),
  { id: "outro", start: 134, title: "片尾・舊城寫新篇", description: "六個 F 政見總覽" },
];

export function getFilmChapter(id: string) {
  return filmChapters.find((chapter) => chapter.id === id);
}

export function formatFilmTime(seconds: number) {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const remainder = String(seconds % 60).padStart(2, "0");

  return `${minutes}:${remainder}`;
}
