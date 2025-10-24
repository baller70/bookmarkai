import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'edge';

interface CapturedTab {
  id: number;
  url: string;
  title: string;
  favicon?: string;
  status: 'queued' | 'processing' | 'saved' | 'duplicate' | 'failed';
  error?: string;
}

interface BrowserLauncherPrefs {
  duplicateHandling: 'skip' | 'overwrite' | 'keepBoth';
  maxTabs: 40;
  autoTag: true;
  autoCategorize: true;
  undoWindowSecs: 8;
}

interface TabCaptureRequest {
  tabs: CapturedTab[];
  prefs: BrowserLauncherPrefs;
}

// In-memory storage for demo purposes
const jobs = new Map();

export async function POST(request: NextRequest) {
  try {
    const body: TabCaptureRequest = await request.json();
    const { tabs, prefs } = body;

    // Validate request
    if (!tabs || !Array.isArray(tabs) || tabs.length === 0) {
      return NextResponse.json(
        { error: 'Invalid tabs data' },
        { status: 400 }
      );
    }

    if (tabs.length > prefs.maxTabs) {
      return NextResponse.json(
        { error: `Too many tabs. Maximum allowed: ${prefs.maxTabs}` },
        { status: 400 }
      );
    }

    // Create job
    const jobId = uuidv4();
    const job = {
      id: jobId,
      tabs: tabs.map(tab => ({ ...tab, status: 'queued' })),
      total: tabs.length,
      processed: 0,
      saved: 0,
      duplicates: 0,
      failed: 0,
      status: 'processing',
      startedAt: new Date().toISOString(),
      prefs
    };

    jobs.set(jobId, job);

    // Start processing in background (mock implementation)
    processTabsAsync(jobId);

    return NextResponse.json({ jobId });
  } catch (error) {
    console.error('Tab capture error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Mock background processing
async function processTabsAsync(jobId: string) {
  const job = jobs.get(jobId);
  if (!job) return;

  for (let i = 0; i < job.tabs.length; i++) {
    const tab = job.tabs[i];
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Mock processing logic
    const isDuplicate = Math.random() < 0.1; // 10% chance of duplicate
    const isFailed = Math.random() < 0.05; // 5% chance of failure
    
    if (isFailed) {
      tab.status = 'failed';
      tab.error = 'Failed to process bookmark';
      job.failed++;
    } else if (isDuplicate && job.prefs.duplicateHandling === 'skip') {
      tab.status = 'duplicate';
      job.duplicates++;
    } else {
      tab.status = 'saved';
      job.saved++;
    }
    
    job.processed++;
    
    // Update job
    jobs.set(jobId, job);
  }
  
  job.status = 'completed';
  jobs.set(jobId, job);
}

export async function GET() {
  return NextResponse.json({ message: 'Tab capture API endpoint' });
} 