export interface PageAnalysis {
  url: string;
  statusCode: number;
  title?: string;
  meta?: any;
  content?: any;
  headings?: any;
  links?: any;
  images?: any;
  schema?: any;
  performance?: any;
  security?: any;
  accessibility?: any;
  seoIssues?: any;
  [key: string]: any;
} 