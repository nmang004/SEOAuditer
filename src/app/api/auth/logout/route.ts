import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:8080';

export async function POST(request: NextRequest) {
  console.log('POST /api/auth/logout called');
  
  try {
    const authHeader = request.headers.get('authorization');
    
    // Call backend logout endpoint if it exists
    if (authHeader) {
      console.log('Attempting to logout on backend:', `${BACKEND_URL}/api/auth/logout`);
      const response = await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
      });

      if (response.ok) {
        console.log('Backend logout successful');
      } else {
        console.log('Backend logout failed, but continuing with frontend logout');
      }
    }
    
    // Return success regardless of backend response
    // The main logout happens on the frontend by clearing localStorage
    return NextResponse.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
  } catch (error) {
    console.error('POST /api/auth/logout error:', error);
    // Still return success since logout is mainly handled on frontend
    return NextResponse.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
  }
} 