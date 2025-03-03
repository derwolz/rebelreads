import { pipeline } from '@xenova/transformers';

export interface ReviewAnalysis {
  sentiment: {
    label: string;
    score: number;
  };
  themes: Array<{
    label: string;
    score: number;
  }>;
}

let classifier: any = null;
let zeroShotClassifier: any = null;

const themes = [
  'character development',
  'world building',
  'plot complexity',
  'writing style',
  'emotional impact',
  'pacing',
  'dialogue',
  'themes and symbolism',
  'atmosphere',
  'originality'
];

export async function initializeModels() {
  if (!classifier) {
    classifier = await pipeline('sentiment-analysis');
  }
  if (!zeroShotClassifier) {
    zeroShotClassifier = await pipeline('zero-shot-classification');
  }
}

export async function analyzeReview(text: string): Promise<ReviewAnalysis> {
  await initializeModels();

  // Analyze sentiment
  const sentimentResult = await classifier(text);

  // Analyze themes
  const themeResult = await zeroShotClassifier(text, themes, {
    multi_label: true,
  });

  // Format themes to only include those with significant confidence
  const significantThemes = themeResult.labels
    .map((label: string, index: number) => ({
      label,
      score: themeResult.scores[index]
    }))
    .filter((theme: { score: number }) => theme.score > 0.3)
    .sort((a: { score: number }, b: { score: number }) => b.score - a.score);

  return {
    sentiment: {
      label: sentimentResult[0].label,
      score: sentimentResult[0].score
    },
    themes: significantThemes
  };
}
