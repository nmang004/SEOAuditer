import express from 'express';

// Simple health check server that runs without full config
const app = express();
const PORT = process.env.PORT || 8080;

app.get('/health', (req, res) => {
  const status = {
    status: 'partial',
    message: 'Server running but missing configuration',
    missing: [] as string[]
  };

  if (!process.env.DATABASE_URL) {
    status.missing.push('DATABASE_URL');
  }
  if (!process.env.JWT_SECRET) {
    status.missing.push('JWT_SECRET');
  }

  if (status.missing.length === 0) {
    status.status = 'ready';
    status.message = 'Server is fully configured';
  }

  res.status(status.missing.length > 0 ? 503 : 200).json(status);
});

app.listen(PORT, () => {
  console.log(`Health check server running on port ${PORT}`);
  console.log('Waiting for environment configuration...');
  
  if (!process.env.DATABASE_URL) {
    console.log('- Missing DATABASE_URL');
  }
  if (!process.env.JWT_SECRET) {
    console.log('- Missing JWT_SECRET');
  }
});

export default app;