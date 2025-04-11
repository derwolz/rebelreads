import { db } from "../server/db";
import { preferenceTaxonomies } from "../shared/schema";

async function populatePreferenceTaxonomies() {
  try {
    console.log("Checking if preference taxonomies exist...");
    
    const existingTaxonomies = await db.select().from(preferenceTaxonomies);
    
    if (existingTaxonomies.length > 0) {
      console.log(`Found ${existingTaxonomies.length} existing preference taxonomies. Skipping...`);
      return;
    }
    
    console.log("No taxonomies found. Adding sample preference taxonomies...");
    
    // Define genre taxonomies
    const genres = [
      { name: "Science Fiction", description: "Speculative fiction with scientific themes", taxonomyType: "genre" },
      { name: "Fantasy", description: "Fiction with magical or supernatural elements", taxonomyType: "genre" },
      { name: "Mystery", description: "Fiction centered around solving a mystery or crime", taxonomyType: "genre" },
      { name: "Romance", description: "Stories focused on romantic relationships", taxonomyType: "genre" },
      { name: "Thriller", description: "Suspenseful, fast-paced fiction", taxonomyType: "genre" },
      { name: "Horror", description: "Fiction designed to frighten or disturb", taxonomyType: "genre" },
      { name: "Literary Fiction", description: "Character-driven fiction with a focus on style", taxonomyType: "genre" },
      { name: "Historical Fiction", description: "Fiction set in the past", taxonomyType: "genre" }
    ];
    
    // Define theme taxonomies
    const themes = [
      { name: "Love", description: "Romantic or platonic emotional attachment", taxonomyType: "theme" },
      { name: "Death", description: "End of life and its implications", taxonomyType: "theme" },
      { name: "Redemption", description: "Recovery from sin, error or evil", taxonomyType: "theme" },
      { name: "Coming of Age", description: "Transition from youth to adulthood", taxonomyType: "theme" },
      { name: "Power", description: "Influence and control over others", taxonomyType: "theme" },
      { name: "Identity", description: "Discovery or crisis of self", taxonomyType: "theme" }
    ];
    
    // Define trope taxonomies
    const tropes = [
      { name: "Chosen One", description: "A character destined for greatness", taxonomyType: "trope" },
      { name: "Fish Out of Water", description: "Character placed in an unfamiliar setting", taxonomyType: "trope" },
      { name: "Love Triangle", description: "Romantic tension between three characters", taxonomyType: "trope" },
      { name: "Hero's Journey", description: "Character's transformative adventure", taxonomyType: "trope" },
      { name: "Unreliable Narrator", description: "Narrator whose credibility is compromised", taxonomyType: "trope" }
    ];
    
    // Insert all taxonomies
    const allTaxonomies = [...genres, ...themes, ...tropes];
    
    for (const taxonomy of allTaxonomies) {
      await db.insert(preferenceTaxonomies).values({
        name: taxonomy.name,
        description: taxonomy.description,
        taxonomyType: taxonomy.taxonomyType,
        isActive: true
      });
    }
    
    console.log(`Successfully added ${allTaxonomies.length} preference taxonomies`);
  } catch (error) {
    console.error("Error populating preference taxonomies:", error);
  } finally {
    process.exit(0);
  }
}

populatePreferenceTaxonomies();