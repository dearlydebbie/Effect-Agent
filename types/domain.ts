export type Platform = "Snapchat" | "TikTok";

export const categories = [
  "Beauty", "Makeup", "Skin and complexion", "Hair", "Fashion",
  "Aesthetic camera effects", "Editorial effects", "Humour", "Memes",
  "Dating", "Relationships", "Personality", "Randomisers", "Quizzes",
  "Games", "Reaction effects", "Culture", "Food", "Lifestyle", "Travel",
  "Music", "Seasonal", "Holidays", "Fantasy", "Transformation",
  "Photo effects", "AI effects", "Interactive AR", "Face effects",
  "Hand effects", "Body effects", "World AR", "Experimental",
  "Lighting", "Jewellery", "Camera texture", "Face accessories",
  "Creative beauty transformation",
] as const;

export type Category = (typeof categories)[number];
export type IdeaStatus = "DRAFT" | "SAVED" | "APPROVED" | "REJECTED";
export type JobStatus = "IDEA" | "APPROVED" | "WAITING" | "PREPARING" | "BUILDING" | "TESTING" | "NEEDS_REVIEW" | "READY" | "PUBLISHED" | "ARCHIVED" | "FAILED";
export type QAResult = "PASS" | "WARNING" | "FAIL" | "UNKNOWN" | "UNAVAILABLE";

export interface Idea {
  id: string;
  title: string;
  hook: string;
  description: string;
  platforms: Platform[];
  categories: Category[];
  interactionType: string;
  targetUserBehaviour: string;
  technicalApproach: string;
  requiredAssets: string[];
  publicFacingText: string[];
  noveltyExplanation: string;
  risks: string[];
  buildComplexity: "Simple" | "Moderate" | "Complex";
  estimatedEffort: string;
  status: IdeaStatus;
  createdDate: string;
  scores: { trend: number; originality: number; shareability: number; replay: number; potential: number };
  saturation: "Low" | "Medium" | "High";
  recommendationReason: string;
  demo: boolean;
}

export interface CriticScore {
  originality: number;
  immediateComprehension: number;
  visualAppeal: number;
  shareability: number;
  replayValue: number;
  interactionQuality: number;
  platformFit: number;
  technicalFeasibility: number;
  buildCost: number;
  monetisationPotential: number;
  strengths: string[];
  weaknesses: string[];
  reasonsToReject: string[];
  suggestedImprovements: string[];
  overallScore: number;
  recommendation: "REJECT" | "REVISE" | "BUILD";
}

export interface QACheck { id: string; name: string; result: QAResult; detail: string }

export interface PerformanceRecord {
  id: string; effectId: string; platform: Platform; date: string;
  views: number | null; opens: number | null; uses: number | null;
  videoPublishes: number | null; shares: number | null; saves: number | null;
  replays: number | null; averageSessionLength: number | null;
  country: string | null; earnings: number | null; currency: string | null;
}

export interface EarningRecord {
  id: string; platform: Platform; effect: string; programme: string;
  amount: number; currency: string; date: string;
  status: "Pending" | "Paid" | "Estimated"; notes: string;
}
