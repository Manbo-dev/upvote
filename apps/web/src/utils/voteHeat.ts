export function getVoteHeatColor(
  voteCount: number,
  maxVotes: number,
  isDark: boolean,
): { background: string; text: string; border: string } {
  const effectiveMax = Math.max(maxVotes, 1);
  const ratio = Math.min(voteCount / effectiveMax, 1);

  // Hue: 220 (blue/cold) → 0 (red/hot)
  const hue = Math.round(220 - ratio * 220);

  if (isDark) {
    const bgSaturation = Math.round(50 + ratio * 40);
    const bgLightness = Math.round(18 + ratio * 4);
    const textLightness = Math.round(60 + ratio * 15);
    return {
      background: `hsl(${hue}, ${bgSaturation}%, ${bgLightness}%)`,
      text: `hsl(${hue}, 85%, ${textLightness}%)`,
      border: `hsl(${hue}, 70%, 30%)`,
    };
  }

  const bgSaturation = Math.round(60 + ratio * 30);
  return {
    background: `hsl(${hue}, ${bgSaturation}%, 93%)`,
    text: `hsl(${hue}, 85%, 30%)`,
    border: `hsl(${hue}, 75%, 75%)`,
  };
}
