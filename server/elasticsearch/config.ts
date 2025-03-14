import { Config } from '@elastic/elasticsearch';

export interface ElasticsearchConfig {
  node: string;
  auth: {
    apiKey?: string;
    username?: string;
    password?: string;
  };
}

export const getElasticsearchConfig = (): ElasticsearchConfig => {
  const config: ElasticsearchConfig = {
    node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
    auth: {}
  };

  // Prefer API key authentication if available
  if (process.env.ELASTICSEARCH_API_KEY) {
    config.auth.apiKey = process.env.ELASTICSEARCH_API_KEY;
  } 
  // Fall back to username/password authentication
  else if (process.env.ELASTICSEARCH_USERNAME && process.env.ELASTICSEARCH_PASSWORD) {
    config.auth.username = process.env.ELASTICSEARCH_USERNAME;
    config.auth.password = process.env.ELASTICSEARCH_PASSWORD;
  }

  return config;
};
