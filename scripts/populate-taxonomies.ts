import { pool } from "../server/db";

const SAMPLE_TAXONOMIES = [
  // Genres
  { name: "Fiction", description: "Made-up stories and narratives", type: "genre", parentId: null },
  { name: "Science Fiction", description: "Stories with futuristic technology or science themes", type: "genre", parentId: null },
  { name: "Fantasy", description: "Stories with magical or supernatural elements", type: "genre", parentId: null },
  { name: "Romance", description: "Stories centered on romantic relationships", type: "genre", parentId: null },
  { name: "Mystery", description: "Stories involving puzzles or crimes to be solved", type: "genre", parentId: null },
  { name: "Thriller", description: "Suspenseful, exciting stories", type: "genre", parentId: null },
  
  // Subgenres
  { name: "Space Opera", description: "Grand space adventures", type: "subgenre", parentId: 2 },
  { name: "Cyberpunk", description: "High tech, low life", type: "subgenre", parentId: 2 },
  { name: "Hard Science Fiction", description: "Science fiction with emphasis on scientific accuracy", type: "subgenre", parentId: 2 },
  { name: "Epic Fantasy", description: "Fantasy with grand, sweeping scope", type: "subgenre", parentId: 3 },
  { name: "Urban Fantasy", description: "Fantasy in modern urban settings", type: "subgenre", parentId: 3 },
  { name: "Historical Romance", description: "Romance set in historical periods", type: "subgenre", parentId: 4 },
  { name: "Contemporary Romance", description: "Romance set in the present day", type: "subgenre", parentId: 4 },
  { name: "Paranormal Romance", description: "Romance with supernatural elements", type: "subgenre", parentId: 4 },
  { name: "Cozy Mystery", description: "Gentle, often humorous mysteries", type: "subgenre", parentId: 5 },
  { name: "Police Procedural", description: "Mysteries focusing on police work", type: "subgenre", parentId: 5 },
  
  // Themes
  { name: "Coming of Age", description: "Growing up and maturing", type: "theme", parentId: null },
  { name: "Redemption", description: "Character seeking forgiveness", type: "theme", parentId: null },
  { name: "Justice", description: "Right vs. wrong, fairness", type: "theme", parentId: null },
  { name: "Mortality", description: "Dealing with death and impermanence", type: "theme", parentId: null },
  { name: "Love", description: "Romantic or platonic emotional attachment", type: "theme", parentId: null },
  { name: "Identity", description: "Understanding oneself and one's place", type: "theme", parentId: null },
  { name: "Power", description: "Acquisition, use, or consequences of power", type: "theme", parentId: null },
  { name: "Family", description: "Blood relationships and chosen family", type: "theme", parentId: null },
  { name: "Betrayal", description: "Breaking trust or loyalty", type: "theme", parentId: null },
  { name: "Freedom", description: "Liberation from constraints", type: "theme", parentId: null },
  { name: "Death", description: "End of life and its implications", type: "theme", parentId: null },
  
  // Tropes
  { name: "The Chosen One", description: "A character destined for greatness", type: "trope", parentId: null },
  { name: "Fish Out of Water", description: "Character placed in unfamiliar surroundings", type: "trope", parentId: null },
  { name: "Enemies to Lovers", description: "Adversaries becoming romantic partners", type: "trope", parentId: null },
  { name: "Hidden Heir", description: "Character discovers royal/important lineage", type: "trope", parentId: null },
  { name: "Reluctant Hero", description: "Character forced into heroic role", type: "trope", parentId: null },
  { name: "Love Triangle", description: "Three characters in romantic entanglement", type: "trope", parentId: null },
  { name: "Secret Identity", description: "Character conceals true self", type: "trope", parentId: null },
  { name: "Forbidden Love", description: "Romance between incompatible partners", type: "trope", parentId: null },
  { name: "Tragic Hero", description: "Noble character with fatal flaw", type: "trope", parentId: null },
  { name: "The Mentor", description: "Wise guide who helps protagonist", type: "trope", parentId: null },
  { name: "Found Family", description: "Unrelated characters forming familial bonds", type: "trope", parentId: null },
  { name: "Unreliable Narrator", description: "Storyteller whose credibility is compromised", type: "trope", parentId: null }
];

async function populateTaxonomies() {
  const client = await pool.connect();
  
  try {
    
    
    // Check if we already have taxonomies
    const checkResult = await client.query('SELECT COUNT(*) FROM genre_taxonomies');
    const count = parseInt(checkResult.rows[0].count);
    
    
    
    if (count > 0) {
      
      return;
    }
    
    // Insert all taxonomies
    
    
    // Begin transaction
    await client.query('BEGIN');
    
    for (const taxonomy of SAMPLE_TAXONOMIES) {
      await client.query(
        `INSERT INTO genre_taxonomies (name, description, type, "parentId", "createdAt", "updatedAt") 
         VALUES ($1, $2, $3, $4, NOW(), NOW())`,
        [taxonomy.name, taxonomy.description, taxonomy.type, taxonomy.parentId]
      );
    }
    
    // Commit transaction
    await client.query('COMMIT');
    
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error populating taxonomies:", error);
  } finally {
    client.release();
    process.exit(0);
  }
}

populateTaxonomies();