import { v4 as uuidv4 } from 'uuid';

export function generateMockProjects(userId: string, count: number) {
  const projects = [];
  const sampleUrls = [
    'https://example-ecommerce.com',
    'https://myblog.com',
    'https://company-site.com',
    'https://portfolio.dev',
    'https://news-site.com',
  ];

  for (let i = 0; i < count; i++) {
    projects.push({
      id: uuidv4(),
      userId,
      name: `Project ${i + 1}`,
      url: sampleUrls[i % sampleUrls.length],
      currentScore: Math.floor(Math.random() * 40) + 60, // 60-100
      issueCount: Math.floor(Math.random() * 20) + 1,
      lastScanDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      status: 'active',
      scanFrequency: 'manual',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  return projects;
}

export function generateMockIssues(analysisId: string) {
  const issueTypes = [
    'Missing meta description',
    'Title tag too long',
    'Missing alt text on images',
    'Slow page load speed',
    'Missing canonical URL',
    'Duplicate content detected',
    'Poor mobile usability',
    'Missing structured data',
  ];
  const severities = ['critical', 'high', 'medium', 'low'];
  const categories = ['technical', 'content', 'onpage', 'ux'];

  return issueTypes.map((type, index) => ({
    id: uuidv4(),
    analysisId,
    type,
    severity: severities[index % severities.length],
    title: `${type} - ${Math.floor(Math.random() * 10) + 1} pages affected`,
    description: `This issue affects SEO performance by...`,
    recommendation: `To fix this issue, you should...`,
    category: categories[index % categories.length],
    status: 'new',
    affectedPages: Math.floor(Math.random() * 20) + 1,
    createdAt: new Date(),
  }));
}

export function generateMockAnalyses(projectId: string, count: number) {
  const analyses = [];
  for (let i = 0; i < count; i++) {
    const analysisId = uuidv4();
    analyses.push({
      id: analysisId,
      projectId,
      crawlSessionId: uuidv4(),
      overallScore: Math.floor(Math.random() * 40) + 60,
      technicalScore: Math.floor(Math.random() * 40) + 60,
      contentScore: Math.floor(Math.random() * 40) + 60,
      onpageScore: Math.floor(Math.random() * 40) + 60,
      uxScore: Math.floor(Math.random() * 40) + 60,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      issues: generateMockIssues(analysisId),
    });
  }
  return analyses;
}

export function generateMockUser(email: string, name: string) {
  return {
    id: uuidv4(),
    email,
    name,
    passwordHash: 'mocked-hash',
    subscriptionTier: 'free',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
} 