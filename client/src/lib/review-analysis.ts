import { pipeline, Pipeline } from '@xenova/transformers';

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

let classifier: Pipeline | null = null;
let zeroShotClassifier: Pipeline | null = null;

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

async function loadModel(task: 'sentiment-analysis' | 'zero-shot-classification', model: string) {
  console.log(`Loading ${task} model: ${model}`);
  try {
    const pipe = await pipeline(task, model);
    console.log(`Successfully loaded ${task} model`);
    return pipe;
  } catch (error) {
    console.error(`Error loading ${task} model:`, error);
    throw new Error(`Failed to load ${task} model: ${error instanceof Error ? error.message : String(error)}`);
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
    throw new Error(`Failed to initialize models: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function analyzeReview(text: string): Promise<ReviewAnalysis> {
  console.log('Starting review analysis...');

  try {
    await initializeModels();

    if (!classifier || !zeroShotClassifier) {
      throw new Error('Models not properly initialized');
    }

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
    throw new Error(`Failed to analyze review: ${error instanceof Error ? error.message : String(error)}`);
  }
}