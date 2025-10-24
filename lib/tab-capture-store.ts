import { mkdir, readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

export type CapturedTab = {
  id: number
  url: string
  title: string
  favicon?: string
  status: 'queued' | 'processing' | 'saved' | 'duplicate' | 'failed'
  error?: string
}

export type BrowserLauncherPrefs = {
  duplicateHandling: 'skip' | 'overwrite' | 'keepBoth'
  maxTabs: number
  autoTag: boolean
  autoCategorize: boolean
  undoWindowSecs: number
}

export type LauncherJob = {
  id: string
  tabs: CapturedTab[]
  total: number
  processed: number
  saved: number
  duplicates: number
  failed: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  startedAt: string
  eta?: number
  prefs: BrowserLauncherPrefs
}

const baseDir = join(process.cwd(), 'data', 'tab-capture')

async function ensureDir() {
  await mkdir(baseDir, { recursive: true })
}

function jobPath(jobId: string) {
  return join(baseDir, `${jobId}.json`)
}

export async function createJob(tabs: CapturedTab[], prefs: BrowserLauncherPrefs): Promise<LauncherJob> {
  await ensureDir()
  const jobId = uuidv4()
  const job: LauncherJob = {
    id: jobId,
    tabs: tabs.map(tab => ({ ...tab, status: 'queued' as const })),
    total: tabs.length,
    processed: 0,
    saved: 0,
    duplicates: 0,
    failed: 0,
    status: 'processing',
    startedAt: new Date().toISOString(),
    prefs,
  }
  await writeFile(jobPath(jobId), JSON.stringify(job, null, 2))
  return job
}

export async function getJob(jobId: string): Promise<LauncherJob | null> {
  try {
    const data = await readFile(jobPath(jobId), 'utf-8')
    return JSON.parse(data) as LauncherJob
  } catch {
    return null
  }
}

export async function saveJob(job: LauncherJob): Promise<void> {
  await ensureDir()
  await writeFile(jobPath(job.id), JSON.stringify(job, null, 2))
}

export async function updateTab(jobId: string, updater: (job: LauncherJob) => void | Promise<void>): Promise<LauncherJob | null> {
  const job = await getJob(jobId)
  if (!job) return null
  await Promise.resolve(updater(job))
  await saveJob(job)
  return job
}
