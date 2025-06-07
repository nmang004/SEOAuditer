export async function GET() {
  return Response.json({ 
    message: "Simple test working",
    timestamp: new Date().toISOString() 
  })
} 