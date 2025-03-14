import { Client } from '@elastic/elasticsearch';

// Initialize the Elasticsearch client
const createElasticsearchClient = (config: {
  node: string;
  auth: {
    apiKey?: string;
    username?: string;
    password?: string;
  };
}) => {
  return new Client({
    node: config.node,
    auth: config.auth,
  });
};

// Define the book index mapping
const BOOK_INDEX_MAPPING = {
  properties: {
    id: { type: 'integer' },
    title: { 
      type: 'text',
      fields: {
        keyword: { type: 'keyword' },
        completion: { type: 'completion' }
      }
    },
    author: { 
      type: 'text',
      fields: {
        keyword: { type: 'keyword' }
      }
    },
    description: { type: 'text' },
    genres: { type: 'keyword' },
    characters: { type: 'keyword' },
    language: { type: 'keyword' },
    publishedDate: { type: 'date' },
    pageCount: { type: 'integer' },
    awards: { type: 'keyword' },
    setting: { type: 'text' }
  }
};

// Define index operations
const indexOperations = (client: Client) => ({
  // Create the book index with mapping
  async createBookIndex() {
    const indexName = 'books';
    
    const exists = await client.indices.exists({ index: indexName });
    if (!exists) {
      await client.indices.create({
        index: indexName,
        mappings: BOOK_INDEX_MAPPING
      });
    }
  },

  // Index a book document
  async indexBook(book: any) {
    return client.index({
      index: 'books',
      id: book.id.toString(),
      document: {
        id: book.id,
        title: book.title,
        author: book.author,
        description: book.description,
        genres: book.genres,
        characters: book.characters,
        language: book.language,
        publishedDate: book.publishedDate,
        pageCount: book.pageCount,
        awards: book.awards,
        setting: book.setting
      }
    });
  },

  // Search books
  async searchBooks(query: string, filters?: any) {
    const searchQuery = {
      bool: {
        must: [
          {
            multi_match: {
              query,
              fields: ['title^3', 'author^2', 'description', 'characters', 'setting']
            }
          }
        ]
      }
    };

    if (filters?.genres) {
      searchQuery.bool.must.push({
        terms: { genres: filters.genres }
      });
    }

    return client.search({
      index: 'books',
      query: searchQuery,
      highlight: {
        fields: {
          title: {},
          description: {}
        }
      }
    });
  },

  // Get search suggestions
  async getSuggestions(prefix: string) {
    return client.search({
      index: 'books',
      suggest: {
        titles: {
          prefix,
          completion: {
            field: 'title.completion',
            size: 5
          }
        }
      }
    });
  }
});

export { createElasticsearchClient, indexOperations };
