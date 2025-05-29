import { PrismaClient } from '@prisma/client';
import { generateMockProjects, generateMockAnalyses, generateMockIssues } from '../src/utils/mockData';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding mock data...');

  // Create a mock user
  const userEmail = 'mockuser@example.com';
  const userName = 'Mock User';
  let user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: userEmail,
        name: userName,
        passwordHash: '$2b$10$mockedhash', // Use a valid bcrypt hash in real use
        subscriptionTier: 'free',
      },
    });
    console.log('Created mock user:', user.email);
  } else {
    console.log('Mock user already exists:', user.email);
  }

  // Create mock projects
  const projects = generateMockProjects(user.id, 3);
  for (const projectData of projects) {
    let project = await prisma.project.findUnique({ where: { id: projectData.id } });
    if (!project) {
      project = await prisma.project.create({ data: { ...projectData } });
      console.log('Created project:', project.name);
    }
    // Create mock analyses for each project
    const analyses = generateMockAnalyses(project.id, 2);
    for (const analysisData of analyses) {
      const crawlSession = await prisma.crawlSession.create({
        data: {
          id: analysisData.crawlSessionId,
          projectId: project.id,
          url: project.url,
          status: 'completed',
          startedAt: analysisData.createdAt,
          completedAt: new Date(),
        },
      });
      const analysis = await prisma.sEOAnalysis.create({
        data: {
          id: analysisData.id,
          crawlSessionId: crawlSession.id,
          projectId: project.id,
          overallScore: analysisData.overallScore,
          technicalScore: analysisData.technicalScore,
          contentScore: analysisData.contentScore,
          onpageScore: analysisData.onpageScore,
          uxScore: analysisData.uxScore,
          createdAt: analysisData.createdAt,
        },
      });
      // Create mock issues for each analysis
      const issues = generateMockIssues(analysis.id);
      for (const issueData of issues) {
        await prisma.sEOIssue.create({ data: { ...issueData } });
      }
      console.log(`Created analysis and issues for project: ${project.name}`);
    }
  }

  console.log('Mock data seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 