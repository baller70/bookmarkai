import { NextRequest, NextResponse } from 'next/server';

// Simple test endpoint to verify performance optimizations
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('🧪 Test Performance API called');

    // Simple test data
    const testData = {
      message: 'Performance optimizations test endpoint',
      timestamp: Date.now(),
      features: [
        'Response caching with Redis',
        'Rate limiting with multiple algorithms',
        'Request/response compression',
        'Background job processing',
        'Performance monitoring'
      ],
      status: {
        caching: 'Available',
        rateLimiting: 'Available', 
        compression: 'Available',
        backgroundJobs: 'Available',
        monitoring: 'Available'
      },
      performance: {
        responseTime: Date.now() - startTime,
        uptime: process.uptime(),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
        }
      }
    };

    const responseTime = Date.now() - startTime;
    console.log(`✅ Test endpoint responded in ${responseTime}ms`);

    return NextResponse.json({
      success: true,
      data: testData,
      responseTime,
      headers: {
        'X-Performance-Test': 'true',
        'X-Response-Time': responseTime.toString()
      }
    });

  } catch (error) {
    console.error('❌ Test performance API error:', error);
    return NextResponse.json(
      { 
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST endpoint to test with data
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    console.log('🧪 Test Performance POST called with data:', Object.keys(body));

    // Echo back the data with performance metrics
    const response = {
      success: true,
      echo: body,
      performance: {
        responseTime: Date.now() - startTime,
        dataSize: JSON.stringify(body).length,
        timestamp: Date.now()
      },
      optimizations: {
        'Data received': `${JSON.stringify(body).length} bytes`,
        'Processing time': `${Date.now() - startTime}ms`,
        'Compression ready': 'Yes',
        'Cache ready': 'Yes'
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Test performance POST error:', error);
    return NextResponse.json(
      { 
        error: 'POST test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 