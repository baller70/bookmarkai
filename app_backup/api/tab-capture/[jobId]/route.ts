import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// In-memory storage (should match the one in ../route.ts)
const jobs = new Map();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const resolvedParams = await params;
  const { jobId } = await params;
  
  if (!jobId) {
    return NextResponse.json(
      { error: 'Job ID is required' },
      { status: 400 }
    );
  }

  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      
      const sendUpdate = () => {
        const job = jobs.get(jobId);
        if (!job) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'error', 
            message: 'Job not found' 
          })}\n\n`));
          controller.close();
          return;
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'job_update',
          job
        })}\n\n`));

        if (job.status === 'completed' || job.status === 'failed') {
          controller.close();
          return;
        }

        // Continue polling for updates
        setTimeout(sendUpdate, 1000);
      };

      // Start sending updates
      sendUpdate();
    },
    
    cancel() {
      // Cleanup if client disconnects
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 