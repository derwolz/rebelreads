/**
 * Database Population Script
 * 
 * This script populates the database with sample data including:
 * - Users (100)
 * - Authors (subset of users)
 * - Books
 * - Book Images
 * - Ratings/Reviews
 * - Reading Status (Wishlists/Completed)
 * - Followers
 * - Genre Taxonomies
 * - Book Genre Associations
 * - User Genre Preferences
 */

import { db } from "../server/db";
import { 
  users, 
  books, 
  ratings, 
  reading_status, 
  followers, 
  bookImages, 
  genreTaxonomies,
  bookGenreTaxonomies,
  userGenreViews,
  viewGenres,
  rating_preferences
} from "../shared/schema";
import { sql, eq } from "drizzle-orm";
import { hash } from "bcrypt";
import path from "path";

// Image paths for books and profiles
const BOOK_IMAGE_TYPES = ["book-detail", "background", "book-card", "grid-item", "mini", "hero"];
const BOOK_IMAGE_PATHS = {
  "book-detail": "/images/test-images/book-detail.png",
  "background": "/images/test-images/background.png",
  "book-card": "/images/test-images/book-card.png",
  "grid-item": "/images/test-images/grid-item.png",
  "mini": "/images/test-images/mini.png",
  "hero": "/images/test-images/hero.png"
};

const PROFILE_IMAGE_PATH = "/images/test-images/profile-test.jpg";

// Configuration
const NUM_USERS = 100;
const NUM_AUTHORS = 20; // Number of users who are also authors
const NUM_BOOKS_PER_AUTHOR = 5; // Average number of books per author
const NUM_GENRES = 15;
const NUM_SUBGENRES = 30;
const NUM_THEMES = 20;
const NUM_TROPES = 25;

// Lists of names, genres, and other data for generation
const FIRST_NAMES = [
  "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth",
  "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen",
  "Christopher", "Nancy", "Daniel", "Lisa", "Matthew", "Margaret", "Anthony", "Betty", "Mark", "Sandra",
  "Donald", "Ashley", "Steven", "Dorothy", "Paul", "Kimberly", "Andrew", "Emily", "Joshua", "Donna",
  "Kenneth", "Michelle", "Kevin", "Carol", "Brian", "Amanda", "George", "Melissa", "Edward", "Deborah",
  "Ronald", "Stephanie", "Timothy", "Rebecca", "Jason", "Laura", "Jeffrey", "Sharon", "Ryan", "Cynthia",
  "Jacob", "Kathleen", "Gary", "Amy", "Nicholas", "Shirley", "Eric", "Angela", "Jonathan", "Helen",
  "Stephen", "Anna", "Larry", "Brenda", "Justin", "Pamela", "Scott", "Nicole", "Brandon", "Samantha",
  "Benjamin", "Katherine", "Samuel", "Emma", "Gregory", "Ruth", "Frank", "Christine", "Alexander", "Catherine"
];

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Jones", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor",
  "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "Thompson", "Garcia", "Martinez", "Robinson",
  "Clark", "Rodriguez", "Lewis", "Lee", "Walker", "Hall", "Allen", "Young", "Hernandez", "King",
  "Wright", "Lopez", "Hill", "Scott", "Green", "Adams", "Baker", "Gonzalez", "Nelson", "Carter",
  "Mitchell", "Perez", "Roberts", "Turner", "Phillips", "Campbell", "Parker", "Evans", "Edwards", "Collins",
  "Stewart", "Sanchez", "Morris", "Rogers", "Reed", "Cook", "Morgan", "Bell", "Murphy", "Bailey",
  "Rivera", "Cooper", "Richardson", "Cox", "Howard", "Ward", "Torres", "Peterson", "Gray", "Ramirez",
  "James", "Watson", "Brooks", "Kelly", "Sanders", "Price", "Bennett", "Wood", "Barnes", "Ross",
  "Henderson", "Coleman", "Jenkins", "Perry", "Powell", "Long", "Patterson", "Hughes", "Flores", "Washington"
];

const GENRES = [
  "Fantasy", "Science Fiction", "Mystery", "Thriller", "Romance", "Historical Fiction", 
  "Literary Fiction", "Horror", "Young Adult", "Children's", "Biography", "Memoir", 
  "Self-Help", "Business", "Travel"
];

const SUBGENRES = [
  "Epic Fantasy", "Space Opera", "Hard Science Fiction", "Cyberpunk", "Cozy Mystery", 
  "Police Procedural", "Psychological Thriller", "Contemporary Romance", "Paranormal Romance",
  "Regency Romance", "Medieval History", "Military History", "Gothic Horror", "Supernatural Horror",
  "Coming of Age", "Dystopian", "Urban Fantasy", "High Fantasy", "Magical Realism",
  "Historical Mystery", "Techno-thriller", "Medical Thriller", "Space Fantasy", "Steampunk",
  "Time Travel", "Alternate History", "Dark Academia", "Comedy", "Satire", "Fairy Tale Retelling"
];

const THEMES = [
  "Redemption", "Coming of Age", "Power of Love", "Good vs Evil", "Identity", 
  "Survival", "Justice", "Betrayal", "Family", "Sacrifice", "Freedom", "Revenge", 
  "War", "Corruption", "Morality", "Truth", "Technology", "Nature", "Society", "Fate"
];

const TROPES = [
  "Chosen One", "Love Triangle", "Friends to Lovers", "Enemies to Lovers", "Unlikely Hero",
  "Fish Out of Water", "Rags to Riches", "Secret Identity", "Mentor Relationship", "Last Stand",
  "Time Loop", "Amnesia", "Fake Relationship", "Found Family", "Forbidden Love", "Redemption Arc",
  "The Quest", "Secret Society", "The Heist", "Tournament", "Undercover Mission", "Mistaken Identity",
  "Slow Burn Romance", "Second Chance", "Arranged Marriage"
];

const BOOK_FORMATS = ["Hardback", "Paperback", "eBook", "Audiobook"];

const BOOK_TITLE_PATTERNS = [
  "The [Noun] of [Noun]",
  "[Adjective] [Noun]",
  "The [Adjective] [Noun]",
  "[Noun]'s [Noun]",
  "The [Noun] [Preposition] the [Noun]",
  "[Verb]ing the [Noun]",
  "[Noun] [Preposition] [Noun]",
  "A [Noun] of [Noun] and [Noun]",
  "The Last [Noun]",
  "[Number] [Noun]s",
  "[Color] [Noun]",
];

const NOUNS = [
  "Kingdom", "Secret", "Mystery", "Quest", "Journey", "Legend", "Heart", "Shadow", "Dream", "Promise",
  "Sword", "Crown", "Dragon", "Phoenix", "River", "Mountain", "Storm", "Whisper", "Echo", "Memory",
  "Star", "Moon", "Sun", "Ocean", "Forest", "City", "House", "Garden", "Blood", "Throne", "War",
  "Peace", "Love", "Hate", "Time", "Space", "Mind", "Soul", "Body", "Life", "Death", "Beginning", "End"
];

const ADJECTIVES = [
  "Hidden", "Lost", "Forgotten", "Ancient", "Eternal", "Sacred", "Dark", "Bright", "Silent", "Whispered",
  "Broken", "Shattered", "Mended", "Cursed", "Blessed", "Haunted", "Enchanted", "Mysterious", "Secret",
  "Savage", "Wild", "Tame", "Fierce", "Gentle", "Cruel", "Kind", "Brave", "Fearful", "Wise", "Foolish"
];

const VERBS = [
  "Finding", "Seeking", "Chasing", "Hunting", "Breaking", "Building", "Creating", "Destroying",
  "Saving", "Losing", "Remembering", "Forgetting", "Stealing", "Giving", "Taking", "Hiding",
  "Revealing", "Whispering", "Shouting", "Dancing", "Fighting", "Loving", "Hating", "Living", "Dying"
];

const PREPOSITIONS = [
  "of", "in", "under", "above", "between", "beyond", "through", "without", "within", "against",
  "beside", "beneath", "among", "around", "before", "after", "during", "until", "since", "for"
];

const COLORS = [
  "Red", "Blue", "Green", "Yellow", "Purple", "Orange", "Black", "White", "Silver", "Golden",
  "Crimson", "Azure", "Emerald", "Amber", "Violet", "Russet", "Ebony", "Ivory", "Gray", "Brown"
];

const NUMBERS = [
  "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve",
  "Thirteen", "Hundred", "Thousand", "Million", "Billion", "First", "Last", "Only", "Every"
];

// Helper functions
function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateUsername(firstName: string, lastName: string): string {
  const random = Math.floor(Math.random() * 1000);
  return `${firstName.toLowerCase()}${lastName.toLowerCase()}${random}`;
}

function generateEmail(firstName: string, lastName: string): string {
  const domains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "example.com"];
  const randomDomain = getRandomElement(domains);
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${randomDomain}`;
}

function generateBookTitle(): string {
  const pattern = getRandomElement(BOOK_TITLE_PATTERNS);
  
  return pattern
    .replace("[Noun]", getRandomElement(NOUNS))
    .replace("[Noun]", getRandomElement(NOUNS))
    .replace("[Noun]", getRandomElement(NOUNS))
    .replace("[Adjective]", getRandomElement(ADJECTIVES))
    .replace("[Verb]", getRandomElement(VERBS))
    .replace("[Preposition]", getRandomElement(PREPOSITIONS))
    .replace("[Color]", getRandomElement(COLORS))
    .replace("[Number]", getRandomElement(NUMBERS));
}

function generateBookDescription(): string {
  const paragraphs = getRandomInt(2, 4);
  let description = "";
  
  for (let i = 0; i < paragraphs; i++) {
    const sentenceCount = getRandomInt(3, 8);
    const sentences = [];
    
    for (let j = 0; j < sentenceCount; j++) {
      const sentenceTemplates = [
        `The ${getRandomElement(ADJECTIVES).toLowerCase()} ${getRandomElement(NOUNS).toLowerCase()} ${getRandomElement(VERBS).toLowerCase()} ${getRandomElement(PREPOSITIONS)} the ${getRandomElement(NOUNS).toLowerCase()}.`,
        `${getRandomElement(ADJECTIVES)} and ${getRandomElement(ADJECTIVES).toLowerCase()}, the ${getRandomElement(NOUNS).toLowerCase()} ${getRandomElement(VERBS).toLowerCase()} into a world of ${getRandomElement(NOUNS).toLowerCase()}.`,
        `As the ${getRandomElement(NOUNS).toLowerCase()} ${getRandomElement(VERBS).toLowerCase()}, a ${getRandomElement(ADJECTIVES).toLowerCase()} ${getRandomElement(NOUNS).toLowerCase()} emerges.`,
        `In a ${getRandomElement(ADJECTIVES).toLowerCase()} ${getRandomElement(NOUNS).toLowerCase()}, the ${getRandomElement(NOUNS).toLowerCase()} must ${getRandomElement(VERBS).toLowerCase().replace('ing', '')}.`,
        `The ${getRandomElement(NOUNS).toLowerCase()} of ${getRandomElement(NOUNS).toLowerCase()} ${getRandomElement(VERBS).toLowerCase().replace('ing', 's')} the ${getRandomElement(ADJECTIVES).toLowerCase()} ${getRandomElement(NOUNS).toLowerCase()}.`,
      ];
      
      sentences.push(getRandomElement(sentenceTemplates));
    }
    
    description += sentences.join(" ") + "\n\n";
  }
  
  return description.trim();
}

function generateReview(): string {
  const sentenceCount = getRandomInt(3, 8);
  const sentences = [];
  
  const reviewStartTemplates = [
    "I absolutely loved this book!",
    "This was an interesting read.",
    "I had mixed feelings about this one.",
    "This book exceeded my expectations.",
    "I was disappointed by this book.",
    "This story captivated me from start to finish.",
    "I couldn't put this book down.",
    "This wasn't what I expected, but in a good way.",
    "The author really knows how to tell a story.",
    "I found this book to be quite thought-provoking."
  ];
  
  const reviewMiddleTemplates = [
    "The characters were [adjective] and [adjective].",
    "The plot was [adjective] with several [adjective] twists.",
    "The world-building was [adjective], creating a [adjective] atmosphere.",
    "The writing style was [adjective] and [adjective].",
    "I particularly enjoyed the [noun] and how it [verb] throughout the story.",
    "The [noun] between the main characters was [adjective] to follow.",
    "The author's take on [noun] was [adjective] and made me think about [noun] differently.",
    "The pacing was [adjective], which made the book [adjective] to read.",
    "The themes of [noun] and [noun] were explored in a [adjective] way."
  ];
  
  const reviewEndTemplates = [
    "I would definitely recommend this to fans of [noun].",
    "I'm looking forward to reading more from this author.",
    "This book will stay with me for a long time.",
    "I can't wait for the sequel!",
    "Overall, a [adjective] addition to the genre.",
    "If you enjoy [noun], you'll appreciate this book.",
    "Not perfect, but definitely worth the read.",
    "I'll be adding this author to my favorites list.",
    "A solid [number] out of 5 stars from me.",
    "This book deserves all the acclaim it's received."
  ];
  
  sentences.push(getRandomElement(reviewStartTemplates));
  
  for (let i = 0; i < sentenceCount - 2; i++) {
    let template = getRandomElement(reviewMiddleTemplates);
    template = template
      .replace("[adjective]", getRandomElement(ADJECTIVES).toLowerCase())
      .replace("[adjective]", getRandomElement(ADJECTIVES).toLowerCase())
      .replace("[noun]", getRandomElement(NOUNS).toLowerCase())
      .replace("[noun]", getRandomElement(NOUNS).toLowerCase())
      .replace("[verb]", getRandomElement(VERBS).toLowerCase());
    
    sentences.push(template);
  }
  
  let endTemplate = getRandomElement(reviewEndTemplates);
  endTemplate = endTemplate
    .replace("[adjective]", getRandomElement(ADJECTIVES).toLowerCase())
    .replace("[noun]", getRandomElement(NOUNS).toLowerCase())
    .replace("[number]", String(getRandomInt(3, 5)));
  
  sentences.push(endTemplate);
  
  return sentences.join(" ");
}

function generateSocialMediaLinks() {
  const platforms = ["twitter", "instagram", "facebook", "tiktok", "website", "goodreads", "medium"];
  const selectedPlatforms = getRandomElements(platforms, getRandomInt(0, 4));
  
  return selectedPlatforms.map(platform => {
    let url = "";
    switch (platform) {
      case "twitter":
        url = "https://twitter.com/user";
        break;
      case "instagram":
        url = "https://instagram.com/user";
        break;
      case "facebook":
        url = "https://facebook.com/user";
        break;
      case "tiktok":
        url = "https://tiktok.com/@user";
        break;
      case "website":
        url = "https://example.com";
        break;
      case "goodreads":
        url = "https://goodreads.com/user";
        break;
      case "medium":
        url = "https://medium.com/@user";
        break;
    }
    
    return { platform, url };
  });
}

function generateReferralLinks(): any[] {
  const retailers = [
    "Amazon", "Barnes & Noble", "IndieBound", "Apple Books", "Kobo", 
    "Google Play", "Audible", "Bookshop", "Custom"
  ];
  
  const count = getRandomInt(1, 4);
  const selectedRetailers = getRandomElements(retailers, count);
  
  return selectedRetailers.map(retailer => {
    let url = "";
    let customName = "";
    
    switch (retailer) {
      case "Amazon":
        url = "https://amazon.com/dp/" + Math.random().toString(36).substring(2, 12);
        break;
      case "Barnes & Noble":
        url = "https://barnesnobles.com";
        break;
      case "IndieBound":
        url = "https://indiebonund.com/book/" + Math.random().toString(36).substring(2, 12);
        break;
      case "Apple Books":
        url = "https://books.apple.com/us/book/id" + Math.floor(Math.random() * 9999999);
        break;
      case "Kobo":
        url = "https://kobo.com/us/en/ebook/" + Math.random().toString(36).substring(2, 12);
        break;
      case "Google Play":
        url = "https://play.google.com/store/books/details?id=" + Math.random().toString(36).substring(2, 12);
        break;
      case "Audible":
        url = "https://audible.com/pd/" + Math.random().toString(36).substring(2, 12);
        break;
      case "Bookshop":
        url = "https://bookshop.org/books/" + Math.random().toString(36).substring(2, 12);
        break;
      case "Custom":
        url = "https://" + Math.random().toString(36).substring(2, 10) + ".com";
        customName = getRandomElement(["Publisher Direct", "Author Website", "Exclusive Edition"]);
        break;
    }
    
    return { url, retailer, customName };
  });
}

function generateReviewAnalysis() {
  const sentiment = { 
    label: getRandomElement(["POSITIVE", "NEGATIVE", "NEUTRAL", "MIXED"]),
    score: parseFloat((Math.random() * 0.5 + 0.5).toFixed(2))
  };
  
  const themeCount = getRandomInt(1, 4);
  const themes = [];
  
  for (let i = 0; i < themeCount; i++) {
    themes.push({
      label: getRandomElement(THEMES),
      score: parseFloat((Math.random() * 0.6 + 0.4).toFixed(2))
    });
  }
  
  return { sentiment, themes };
}

function getWeightedRandom(min: number, max: number, weight: number): number {
  // weight between 0 and 1, higher weight means more likely to get values close to max
  return Math.round(min + (max - min) * Math.pow(Math.random(), 1 - weight));
}

// Main population function
async function populateDatabase() {
  console.log("Starting database population...");
  
  try {
    // Check if database already has data
    const userCount = await db.select({ count: sql`count(*)` }).from(users);
    if (parseInt(userCount[0].count.toString()) > 0) {
      console.log("Database already has users. Clearing existing data...");
      
      // Clear existing data
      await db.execute(sql`TRUNCATE 
        view_genres, 
        user_genre_views, 
        book_genre_taxonomies, 
        book_images, 
        rating_preferences, 
        ratings, 
        reading_status, 
        followers, 
        books, 
        users, 
        genre_taxonomies
      CASCADE`);
    }
    
    console.log("Populating database with fresh data...");
    
    // 1. Create Genre Taxonomies
    console.log("Creating genre taxonomies...");
    
    // Add genres
    const genreIds = [];
    for (const genre of GENRES) {
      const [insertedGenre] = await db.insert(genreTaxonomies).values({
        name: genre,
        description: `Books in the ${genre} genre`,
        type: "genre",
        parentId: null
      }).returning({ id: genreTaxonomies.id });
      
      genreIds.push(insertedGenre.id);
    }
    
    // Add subgenres
    const subgenreIds = [];
    for (const subgenre of SUBGENRES) {
      const randomGenreId = getRandomElement(genreIds);
      
      const [insertedSubgenre] = await db.insert(genreTaxonomies).values({
        name: subgenre,
        description: `Books in the ${subgenre} subgenre`,
        type: "subgenre",
        parentId: randomGenreId
      }).returning({ id: genreTaxonomies.id });
      
      subgenreIds.push(insertedSubgenre.id);
    }
    
    // Add themes
    const themeIds = [];
    for (const theme of THEMES) {
      const [insertedTheme] = await db.insert(genreTaxonomies).values({
        name: theme,
        description: `Books with the ${theme} theme`,
        type: "theme",
        parentId: null
      }).returning({ id: genreTaxonomies.id });
      
      themeIds.push(insertedTheme.id);
    }
    
    // Add tropes
    const tropeIds = [];
    for (const trope of TROPES) {
      const [insertedTrope] = await db.insert(genreTaxonomies).values({
        name: trope,
        description: `Books featuring the ${trope} trope`,
        type: "trope",
        parentId: null
      }).returning({ id: genreTaxonomies.id });
      
      tropeIds.push(insertedTrope.id);
    }
    
    // 2. Create Users (including authors)
    console.log("Creating users...");
    const userIds = [];
    const authorIds = [];
    
    // Hash a common password for all test users
    const commonPassword = await hash("password123", 10);
    
    for (let i = 0; i < NUM_USERS; i++) {
      const firstName = getRandomElement(FIRST_NAMES);
      const lastName = getRandomElement(LAST_NAMES);
      const isAuthor = i < NUM_AUTHORS;
      
      const userData = {
        email: generateEmail(firstName, lastName),
        username: generateUsername(firstName, lastName),
        password: commonPassword,
        newsletterOptIn: Math.random() > 0.5,
        isAuthor,
        isPro: isAuthor || Math.random() > 0.8,
        proExpiresAt: isAuthor ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null,
        authorName: isAuthor ? `${firstName} ${lastName}` : null,
        authorBio: isAuthor ? `${firstName} ${lastName} is an author who specializes in ${getRandomElement(GENRES)} and ${getRandomElement(GENRES)}.` : null,
        authorImageUrl: isAuthor ? PROFILE_IMAGE_PATH : null,
        profileImageUrl: Math.random() > 0.7 ? PROFILE_IMAGE_PATH : null,
        bio: Math.random() > 0.5 ? `Reader and fan of ${getRandomElement(GENRES)} books.` : null,
        displayName: `${firstName} ${lastName}`,
        socialMediaLinks: isAuthor ? generateSocialMediaLinks() : [],
        credits: isAuthor ? getRandomInt(100, 1000) : getRandomInt(0, 50),
        hasCompletedOnboarding: true
      };
      
      const [insertedUser] = await db.insert(users).values(userData).returning({ id: users.id });
      
      userIds.push(insertedUser.id);
      if (isAuthor) authorIds.push(insertedUser.id);
      
      // Create rating preferences for this user
      await db.insert(rating_preferences).values({
        userId: insertedUser.id,
        themes: (Math.random() * 0.3 + 0.05).toFixed(2),
        worldbuilding: (Math.random() * 0.3 + 0.05).toFixed(2),
        writing: (Math.random() * 0.3 + 0.05).toFixed(2),
        enjoyment: (Math.random() * 0.3 + 0.05).toFixed(2),
        characters: (Math.random() * 0.3 + 0.05).toFixed(2)
      });
      
      // Create genre views for this user
      if (Math.random() > 0.7) {
        const numViews = getRandomInt(1, 3);
        
        for (let j = 0; j < numViews; j++) {
          const viewName = j === 0 ? "Favorites" : `My ${getRandomElement(GENRES)}`;
          
          const [insertedView] = await db.insert(userGenreViews).values({
            userId: insertedUser.id,
            name: viewName,
            rank: j + 1,
            isDefault: j === 0
          }).returning({ id: userGenreViews.id });
          
          // Add genres to this view
          const numGenresToAdd = getRandomInt(1, 5);
          const selectedGenreIds = getRandomElements([...genreIds, ...subgenreIds, ...themeIds], numGenresToAdd);
          
          for (let k = 0; k < selectedGenreIds.length; k++) {
            await db.insert(viewGenres).values({
              viewId: insertedView.id,
              taxonomyId: selectedGenreIds[k],
              type: k < genreIds.length ? "genre" : k < (genreIds.length + subgenreIds.length) ? "subgenre" : "theme",
              rank: k + 1
            });
          }
        }
      }
    }
    
    // 3. Create follows between users and authors
    console.log("Creating follows...");
    for (const userId of userIds) {
      // Random number of authors to follow
      const numAuthorsToFollow = getRandomInt(0, Math.min(5, authorIds.length));
      const authorsToFollow = getRandomElements(authorIds, numAuthorsToFollow);
      
      for (const authorId of authorsToFollow) {
        // Don't follow yourself
        if (userId !== authorId) {
          await db.insert(followers).values({
            followerId: userId,
            followingId: authorId
          });
        }
      }
    }
    
    // 4. Create books for each author
    console.log("Creating books...");
    const bookIds = [];
    
    for (const authorId of authorIds) {
      // Random number of books for this author
      const numBooks = getRandomInt(1, NUM_BOOKS_PER_AUTHOR * 2);
      
      for (let i = 0; i < numBooks; i++) {
        const title = generateBookTitle();
        const description = generateBookDescription();
        const [authorData] = await db.select().from(users).where(eq(users.id, authorId));
        
        // Generate book data
        const bookData = {
          title,
          author: authorData.authorName,
          authorId,
          description,
          authorImageUrl: authorData.authorImageUrl,
          promoted: Math.random() > 0.8,
          pageCount: getRandomInt(150, 800),
          formats: getRandomElements(BOOK_FORMATS, getRandomInt(1, BOOK_FORMATS.length)),
          publishedDate: new Date(Date.now() - getRandomInt(0, 1825) * 24 * 60 * 60 * 1000),
          awards: Math.random() > 0.7 ? [
            `${getRandomElement(ADJECTIVES)} ${getRandomElement(NOUNS)} Award`,
            `${getRandomElement(NOUNS)} Prize ${getRandomInt(2000, 2023)}`
          ] : [],
          originalTitle: Math.random() > 0.9 ? `The Original ${title}` : null,
          series: Math.random() > 0.7 ? `The ${getRandomElement(ADJECTIVES)} ${getRandomElement(NOUNS)} Series` : null,
          setting: `${getRandomElement(ADJECTIVES)} ${getRandomElement(NOUNS)}`,
          characters: [
            `${getRandomElement(FIRST_NAMES)} ${getRandomElement(LAST_NAMES)}`,
            `${getRandomElement(FIRST_NAMES)} ${getRandomElement(LAST_NAMES)}`,
            `${getRandomElement(FIRST_NAMES)} ${getRandomElement(LAST_NAMES)}`
          ],
          isbn: `978-${getRandomInt(1000000000, 9999999999)}`,
          asin: `B${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
          language: "English",
          referralLinks: generateReferralLinks(),
          impressionCount: getRandomInt(50, 1000),
          clickThroughCount: getRandomInt(5, 200),
          lastImpressionAt: new Date(Date.now() - getRandomInt(0, 30) * 24 * 60 * 60 * 1000),
          lastClickThroughAt: new Date(Date.now() - getRandomInt(0, 60) * 24 * 60 * 60 * 1000),
          internal_details: "Generated book"
        };
        
        const [insertedBook] = await db.insert(books).values(bookData).returning({ id: books.id });
        bookIds.push(insertedBook.id);
        
        // Add images for this book
        for (const imageType of BOOK_IMAGE_TYPES) {
          await db.insert(bookImages).values({
            bookId: insertedBook.id,
            imageUrl: BOOK_IMAGE_PATHS[imageType as keyof typeof BOOK_IMAGE_PATHS],
            imageType,
            width: imageType === "background" ? 1300 : imageType === "hero" ? 1500 : imageType === "book-detail" ? 480 : imageType === "book-card" ? 256 : imageType === "grid-item" ? 56 : 48,
            height: imageType === "background" ? 1500 : imageType === "hero" ? 600 : imageType === "book-detail" ? 600 : imageType === "book-card" ? 440 : imageType === "grid-item" ? 212 : 64,
            sizeKb: getRandomInt(10, 100)
          });
        }
        
        // Add genres, subgenres, themes, and tropes to this book
        const numGenres = getRandomInt(1, 3);
        const numSubgenres = getRandomInt(1, 3);
        const numThemes = getRandomInt(1, 4);
        const numTropes = getRandomInt(1, 5);
        
        const selectedGenreIds = getRandomElements(genreIds, numGenres);
        const selectedSubgenreIds = getRandomElements(subgenreIds, numSubgenres);
        const selectedThemeIds = getRandomElements(themeIds, numThemes);
        const selectedTropeIds = getRandomElements(tropeIds, numTropes);
        
        let rank = 1;
        
        for (const genreId of selectedGenreIds) {
          await db.insert(bookGenreTaxonomies).values({
            bookId: insertedBook.id,
            taxonomyId: genreId,
            rank: rank++,
            importance: 1 / (1 + Math.log(rank))
          });
        }
        
        for (const subgenreId of selectedSubgenreIds) {
          await db.insert(bookGenreTaxonomies).values({
            bookId: insertedBook.id,
            taxonomyId: subgenreId,
            rank: rank++,
            importance: 1 / (1 + Math.log(rank))
          });
        }
        
        for (const themeId of selectedThemeIds) {
          await db.insert(bookGenreTaxonomies).values({
            bookId: insertedBook.id,
            taxonomyId: themeId,
            rank: rank++,
            importance: 1 / (1 + Math.log(rank))
          });
        }
        
        for (const tropeId of selectedTropeIds) {
          await db.insert(bookGenreTaxonomies).values({
            bookId: insertedBook.id,
            taxonomyId: tropeId,
            rank: rank++,
            importance: 1 / (1 + Math.log(rank))
          });
        }
      }
    }
    
    // 5. Create reading status (wishlists/completed books)
    console.log("Creating reading status entries...");
    for (const userId of userIds) {
      // Random number of books to add to reading status
      const numBooksToAdd = getRandomInt(0, Math.min(10, bookIds.length));
      const booksToAdd = getRandomElements(bookIds, numBooksToAdd);
      
      for (const bookId of booksToAdd) {
        const isWishlisted = Math.random() > 0.5;
        const isCompleted = Math.random() > 0.5;
        
        await db.insert(reading_status).values({
          userId,
          bookId,
          isWishlisted,
          isCompleted,
          completedAt: isCompleted ? new Date(Date.now() - getRandomInt(0, 180) * 24 * 60 * 60 * 1000) : null
        });
      }
    }
    
    // 6. Create ratings and reviews
    console.log("Creating ratings and reviews...");
    for (const bookId of bookIds) {
      // Random number of ratings for this book
      const numRatings = getRandomInt(0, 10);
      const usersToRate = getRandomElements(userIds, numRatings);
      
      for (const userId of usersToRate) {
        // Check if this user has already rated or has a reading status for this book
        const existingRatings = await db.select().from(ratings).where(sql`${ratings.userId} = ${userId} AND ${ratings.bookId} = ${bookId}`);
        
        if (existingRatings.length === 0) {
          // Add a review/rating
          const enjoyment = getWeightedRandom(1, 10, 0.7); // Bias toward higher ratings
          const writing = getWeightedRandom(1, 10, 0.7);
          const themes = getWeightedRandom(1, 10, 0.7);
          const characters = getWeightedRandom(1, 10, 0.7);
          const worldbuilding = getWeightedRandom(1, 10, 0.7);
          
          // Only some ratings have text reviews
          const hasReview = Math.random() > 0.3;
          
          await db.insert(ratings).values({
            userId,
            bookId,
            enjoyment,
            writing,
            themes,
            characters,
            worldbuilding,
            review: hasReview ? generateReview() : null,
            analysis: hasReview ? generateReviewAnalysis() : null,
            featured: Math.random() > 0.8,
            report_status: Math.random() > 0.9 ? getRandomElement(["pending", "approved", "rejected"]) : "none",
            report_reason: Math.random() > 0.9 ? "Inappropriate content" : null
          });
          
          // Make sure the user has a reading status for this book
          const existingStatus = await db.select().from(reading_status).where(sql`${reading_status.userId} = ${userId} AND ${reading_status.bookId} = ${bookId}`);
          
          if (existingStatus.length === 0) {
            await db.insert(reading_status).values({
              userId,
              bookId,
              isWishlisted: false,
              isCompleted: true,
              completedAt: new Date(Date.now() - getRandomInt(0, 90) * 24 * 60 * 60 * 1000)
            });
          } else if (!existingStatus[0].isCompleted) {
            // Update to completed
            await db.update(reading_status)
              .set({ 
                isCompleted: true, 
                completedAt: new Date(Date.now() - getRandomInt(0, 90) * 24 * 60 * 60 * 1000) 
              })
              .where(sql`${reading_status.id} = ${existingStatus[0].id}`);
          }
        }
      }
    }
    
    console.log("Database population completed successfully!");
    console.log(`Created ${NUM_USERS} users (including ${NUM_AUTHORS} authors)`);
    console.log(`Created ${bookIds.length} books`);
    console.log(`Added various genres, reviews, reading status entries, and followers`);
    
  } catch (error) {
    console.error("Error populating database:", error);
    throw error;
  }
}

// Execute the population function
populateDatabase().catch(error => {
  console.error("Failed to populate database:", error);
  process.exit(1);
});