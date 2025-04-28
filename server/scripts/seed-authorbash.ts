import { db } from "../db";
import {
  authorBashQuestions,
  authorBashResponses,
  authors,
  users
} from "@shared/schema";
import { eq, and, desc, gt, lt, not } from "drizzle-orm";
import path from "path";
import fs from "fs";

/**
 * This script will seed the AuthorBash game with a question and multiple author responses
 * It can be used to test the game functionality with various text-only, image-only, and combo responses
 */
async function seedAuthorBash() {
  console.log("Starting AuthorBash seeding...");

  try {
    // First check if there's already an active question
    const now = new Date();
    const activeQuestion = await db.query.authorBashQuestions.findFirst({
      where: and(
        eq(authorBashQuestions.isActive, true),
        lt(authorBashQuestions.startDate, now),
        gt(authorBashQuestions.endDate, now)
      ),
    });

    let questionId: number;

    // If no active question exists, create one
    if (!activeQuestion) {
      console.log("No active question found, creating one...");
      
      const [newQuestion] = await db
        .insert(authorBashQuestions)
        .values({
          question: "What book changed your perspective on life and why?",
          weekNumber: 1,
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
          isActive: true,
        })
        .returning();
      
      questionId = newQuestion.id;
      console.log(`Created new question with ID ${questionId}`);
    } else {
      questionId = activeQuestion.id;
      console.log(`Using existing question with ID ${questionId}`);
    }

    // Get authors for responses
    const authorsList = await db.query.authors.findMany({
      limit: 15,
    });

    if (authorsList.length === 0) {
      console.log("No authors found. Please create some authors first.");
      return;
    }

    console.log(`Found ${authorsList.length} authors`);

    // Create test responses
    const textOnlyResponses = [
      "The Alchemist - Taught me that my personal legend is worth pursuing no matter the obstacles.",
      "Man's Search for Meaning - Showed me that finding purpose makes any suffering bearable.",
      "Sapiens - Made me question everything I thought I knew about human history and society.",
      "Thinking, Fast and Slow - Changed how I understand my own decision-making process.",
      "The Unbearable Lightness of Being - Life is lived once, with no rehearsals.",
    ];

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), "uploads", "authorbash");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Create some fake image paths that we'll pretend exist
    const sampleImagePaths = Array(5).fill(null).map((_, i) => 
      `/api/storage/author-profiles/author_${i + 1}.jpg`
    );

    // Create mixed responses (text+image, text-only, image-only)
    let createdCount = 0;
    
    for (let i = 0; i < authorsList.length; i++) {
      const author = authorsList[i];
      
      // Check if author already has a response for this question
      const existingResponse = await db.query.authorBashResponses.findFirst({
        where: and(
          eq(authorBashResponses.authorId, author.id),
          eq(authorBashResponses.questionId, questionId)
        ),
      });
      
      if (existingResponse) {
        console.log(`Author ${author.id} already has a response, skipping...`);
        continue;
      }
      
      const responseType = i % 3; // 0: text only, 1: image only, 2: both
      
      let responseData: {
        questionId: number;
        authorId: number;
        text?: string;
        imageUrl?: string;
        retentionCount?: number;
        impressionCount?: number;
      } = {
        questionId,
        authorId: author.id,
      };
      
      // Add text for text-only and combo responses
      if (responseType === 0 || responseType === 2) {
        responseData.text = textOnlyResponses[i % textOnlyResponses.length];
      }
      
      // Add image for image-only and combo responses
      if (responseType === 1 || responseType === 2) {
        responseData.imageUrl = sampleImagePaths[i % sampleImagePaths.length];
      }
      
      // Add some random retention and impression counts
      responseData.retentionCount = Math.floor(Math.random() * 20);
      responseData.impressionCount = responseData.retentionCount + Math.floor(Math.random() * 50);
      
      const [newResponse] = await db
        .insert(authorBashResponses)
        .values(responseData)
        .returning();
      
      console.log(`Created ${responseType === 0 ? 'text-only' : responseType === 1 ? 'image-only' : 'combo'} response for author ${author.author_name}`);
      createdCount++;
    }

    console.log(`Successfully created ${createdCount} new responses`);
  } catch (error) {
    console.error("Error seeding AuthorBash data:", error);
  }
}

// Run the seed function
seedAuthorBash()
  .then(() => {
    console.log("AuthorBash seeding completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error running AuthorBash seed script:", error);
    process.exit(1);
  });