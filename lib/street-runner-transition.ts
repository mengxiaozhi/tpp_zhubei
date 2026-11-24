import { runnerStageLength, stageCount } from "./street-runner";

export function getRunnerDistrictBlend(distance: number) {
  const position = Math.min(stageCount, Math.max(0, distance / runnerStageLength));
  const boundary = Math.round(position);
  if (boundary === 0) return { outgoing: 0, incoming: 0, blend: 0 };
  if (boundary >= stageCount) return { outgoing: stageCount - 1, incoming: stageCount - 1, blend: 0 };

  const elapsed = Math.min(1, Math.max(0, (position - boundary + 0.16) / 0.29));
  return {
    outgoing: boundary - 1,
    incoming: boundary,
    blend: elapsed * elapsed * (3 - 2 * elapsed),
  };
}
