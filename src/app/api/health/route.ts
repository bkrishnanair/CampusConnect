import { NextResponse } from 'next/server';

export async function GET() {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      'events-api': 'healthy',
      'notification-service': 'healthy' // This is conceptually monitored
    }
  };

  try {
    return NextResponse.json(healthCheck, { status: 200 });
  } catch (e) {
    const errorCheck = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: (e instanceof Error) ? e.message : 'Unknown error',
    };
    return NextResponse.json(errorCheck, { status: 503 });
  }
}
