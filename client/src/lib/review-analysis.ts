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

async function loadModel(task: string, model: string) {
  console.log(`Loading ${task} model: ${model}`);
  try {
    return await pipeline(task, model);
  } catch (error) {
    console.error(`Error loading ${task} model:`, error);
    throw error;
  }
}

export async function initializeModels() {
  try {
    if (!classifier) {
      classifier = await loadModel(
        'sentiment-analysis',
        'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
      );
    }
    if (!zeroShotClassifier) {
      zeroShotClassifier = await loadModel(
        'zero-shot-classification',
        'Xenova/bart-large-mnli'
      );
    }
    console.log('Models initialized successfully');
  } catch (error) {
    console.error('Error initializing models:', error);
    throw error;
  }
}

export async function analyzeReview(text: string): Promise<ReviewAnalysis> {
  console.log('Starting review analysis...');

  try {
    await initializeModels();

    console.log('Analyzing sentiment...');
    const sentimentResult = await classifier(text);
    console.log('Sentiment result:', sentimentResult);

    console.log('Analyzing themes...');
    const themeResult = await zeroShotClassifier(text, themes, {
      multi_label: true,
    });
    console.log('Theme result:', themeResult);

    // Format themes to only include those with significant confidence
    const significantThemes = themeResult.labels
      .map((label: string, index: number) => ({
        label,
        score: themeResult.scores[index]
      }))
      .filter((theme: { score: number }) => theme.score > 0.3)
      .sort((a: { score: number }, b: { score: number }) => b.score - a.score);

    const analysis: ReviewAnalysis = {
      sentiment: {
        label: sentimentResult[0].label.toUpperCase(),
        score: sentimentResult[0].score
      },
      themes: significantThemes
    };

    console.log('Final analysis:', analysis);
    return analysis;
  } catch (error) {
    console.error('Analysis error:', error);
    throw error;
  }
}