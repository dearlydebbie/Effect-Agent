export const productConfig = {
  name: "Effect Lab",
  shortName: "EL",
  description: "Research, build, test, and learn from AR effects.",
  criticThresholds: { rejectBelow: 5.2, buildAtOrAbove: 7.4 },
  visualQAThresholds: { strongCandidate: 8, needsImprovement: 6.5, maxVisualIterations: 3, minimumMeaningfulImprovement: 0.25 },
} as const;
