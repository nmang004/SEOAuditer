import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:8080';

export async function POST(request: NextRequest) {
  console.log('POST /api/auth/register called');
  console.log('BACKEND_URL:', BACKEND_URL);
  
  try {
    const body = await request.json();
    console.log('Request body:', body);

    console.log('Attempting to fetch:', `${BACKEND_URL}/api/auth/register`);
    const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('Backend response status:', response.status);
    const data = await response.json();
    console.log('Backend response data:', data);
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('POST /api/auth/register error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 