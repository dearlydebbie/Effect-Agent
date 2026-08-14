import type { Category, Idea, Platform } from "../types/domain";

type Seed = [string, string, Platform[], Category[], Idea["buildComplexity"], number, number, number, number, string];

const seeds: Seed[] = [
  ["Soft Window Light", "Move your face to find soft window light.", ["Snapchat", "TikTok"], ["Beauty", "Lighting", "Aesthetic camera effects"] as Category[], "Simple", 8.4, 8.1, 7.6, 7.1, "A useful beauty tool with a clear result in one second."],
  ["Lip Tone Finder", "Tap to compare four balanced lip colours.", ["Snapchat"], ["Beauty", "Makeup", "Face effects"], "Moderate", 7.7, 8.3, 7.8, 8.0, "The comparison action creates a strong save reason."],
  ["Editorial Liner", "Raise your brows to change the eyeliner shape.", ["TikTok"], ["Beauty", "Makeup", "Editorial effects"], "Moderate", 8.1, 8.7, 7.9, 7.5, "Expressive control makes a familiar format feel new."],
  ["Jewellery Light Test", "Turn your head to test silver and gold light.", ["Snapchat"], ["Beauty", "Fashion", "Face accessories" as Category], "Moderate", 7.2, 8.5, 7.3, 7.7, "It connects beauty, styling, and a simple choice."],
  ["Hair Colour Ribbons", "Swipe to add thin colour ribbons to your hair.", ["TikTok"], ["Beauty", "Hair", "Transformation"], "Complex", 8.0, 8.2, 8.1, 7.6, "The change is bold but keeps natural hair detail."],
  ["Blush Placement Guide", "Tap to compare three blush positions.", ["Snapchat", "TikTok"], ["Beauty", "Makeup", "Skin and complexion"], "Moderate", 7.5, 8.0, 7.4, 7.8, "Practical guidance gives the effect replay value."],
  ["One Word Forecast", "Open your mouth to reveal one useful word.", ["Snapchat"], ["Randomisers", "Personality"], "Simple", 8.8, 6.9, 8.5, 8.8, "Fast outcomes invite repeat use and response videos."],
  ["Tiny Kitchen Rush", "Pinch to serve the correct dish.", ["TikTok"], ["Games", "Food", "Hand effects"], "Complex", 7.9, 8.8, 8.2, 8.6, "A readable hand game with a short repeat loop."],
  ["Passport Mood", "Turn your head to pick your next travel mood.", ["Snapchat"], ["Travel", "Lifestyle", "Randomisers"], "Simple", 7.2, 7.1, 7.9, 8.1, "The result creates an easy conversation starter."],
  ["Album Cover Room", "Point at a wall to build a music cover scene.", ["Snapchat"], ["Music", "World AR", "Editorial effects"], "Complex", 7.6, 9.0, 8.0, 7.0, "World tracking gives creators a useful video set."],
  ["Green Flag Check", "Answer three short questions.", ["TikTok"], ["Dating", "Relationships", "Quizzes"], "Moderate", 8.6, 7.0, 8.7, 8.2, "A short quiz supports comments without judging the user."],
  ["Desk Creature", "Tap your desk to place a shy creature.", ["Snapchat"], ["Fantasy", "World AR", "Interactive AR"], "Complex", 7.4, 8.9, 7.7, 8.1, "A small reactive character creates an emotional hook."],
  ["Snack Court", "Show a snack to receive a playful verdict.", ["TikTok"], ["Food", "Humour", "Reaction effects"], "Moderate", 7.8, 7.7, 8.6, 7.9, "The effect gives users a repeatable reaction format."],
  ["Rain Print Camera", "Move the camera to reveal a wet print texture.", ["Snapchat", "TikTok"], ["Photo effects", "Camera texture" as Category, "Experimental"], "Moderate", 7.1, 9.1, 7.5, 6.8, "The texture is distinctive and useful for edits."],
  ["Festival Hand Trail", "Move your hand to draw a bright ribbon.", ["TikTok"], ["Music", "Hand effects", "Interactive AR"], "Moderate", 8.3, 8.4, 8.3, 8.0, "Simple movement produces a strong visual result."],
  ["Photo Booth Four", "Hold still to make four different portraits.", ["Snapchat"], ["Photo effects", "Aesthetic camera effects", "Culture"], "Moderate", 7.0, 7.8, 8.1, 7.5, "Four outputs make the effect useful for sharing."],
  ["Cloud Shape Walk", "Walk to collect the matching cloud shapes.", ["TikTok"], ["Games", "Body effects", "Fantasy"], "Complex", 7.5, 8.3, 7.9, 8.5, "Body movement creates an active and clear game loop."],
  ["Holiday Table Helper", "Scan the table to see simple place settings.", ["Snapchat"], ["Holidays", "Seasonal", "World AR"], "Complex", 6.8, 8.6, 7.0, 6.5, "It offers seasonal utility instead of decoration only."],
  ["Museum Face", "Hold a pose to become a modern portrait.", ["TikTok"], ["Culture", "Transformation", "AI effects"], "Complex", 7.9, 8.5, 8.4, 6.9, "A controlled transformation supports creative self-expression."],
  ["Beat Blink", "Blink on the beat to keep the colour moving.", ["Snapchat"], ["Music", "Games", "Face effects"], "Moderate", 8.2, 8.0, 8.1, 8.7, "A face gesture creates a quick and repeatable challenge."],
  ["Before Coffee", "Tap to compare your calm and busy mood.", ["TikTok"], ["Humour", "Lifestyle", "Reaction effects"], "Simple", 7.3, 6.8, 7.8, 7.2, "The format is familiar but easy to personalise."],
  ["Light Leak Notes", "Tap to add a short note in a film light leak.", ["Snapchat"], ["Aesthetic camera effects", "Photo effects", "Experimental"], "Simple", 6.9, 8.0, 7.2, 6.6, "A restrained camera tool can become part of a creator style."],
];

export const demoIdeas: Idea[] = seeds.map((seed, index) => ({
  id: `idea-${String(index + 1).padStart(2, "0")}`,
  title: seed[0], hook: seed[1], description: seed[9], platforms: seed[2], categories: seed[3],
  interactionType: seed[1].split(" ")[0], targetUserBehaviour: "Create and share a short video.",
  technicalApproach: seed[2].includes("Snapchat") ? "Lens Studio scene with tracked interaction." : "Effect House build pack with tracked interaction.",
  requiredAssets: ["Preview card", "Effect texture", "Interaction notes"],
  publicFacingText: [seed[1], "Try it now."], noveltyExplanation: seed[9],
  risks: ["Test tracking in low light.", "Confirm asset permissions."], buildComplexity: seed[4],
  estimatedEffort: seed[4] === "Simple" ? "2–4 hours" : seed[4] === "Moderate" ? "1–2 days" : "3–5 days",
  status: index < 3 ? "APPROVED" : index < 8 ? "SAVED" : "DRAFT", createdDate: `2026-08-${String(14 - (index % 9)).padStart(2, "0")}`,
  scores: { trend: seed[5], originality: seed[6], shareability: seed[7], replay: seed[8], potential: Number(((seed[5] + seed[6] + seed[7] + seed[8]) / 4).toFixed(1)) },
  saturation: seed[6] >= 8.5 ? "Low" : seed[6] >= 7.5 ? "Medium" : "High", recommendationReason: seed[9], demo: true,
}));
