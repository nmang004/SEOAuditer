import { Router } from 'express';
import { prisma } from '../index';

const router = Router();

// router.use(authenticate); // Uncomment for production

// Create a new project
router.post('/', async (req, res) => {
  const { name, url, userId } = req.body;
  if (!name || !url || !userId) return res.status(400).json({ error: 'Name, URL, and userId are required' });
  try {
    const project = await prisma.project.create({ data: { name, url, userId } });
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create project', details: err?.message });
  }
});

// List all projects (optionally filter by userId)
router.get('/', async (req, res) => {
  const { userId } = req.query;
  try {
    const projects = await prisma.project.findMany({
      where: userId ? { userId: String(userId) } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch projects', details: err?.message });
  }
});

// Get a single project
router.get('/:projectId', async (req, res) => {
  const { projectId } = req.params;
  try {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch project', details: err?.message });
  }
});

export { router as projectRouter };
