import { readTriStore, writeTriStore } from './storage-service'

const TABLE = 'linkpilot_settings'
const KEY = 'auto_processing'

type AutoProcessing = any // adjust as needed

export async function getAutoProcessingSettings(userId: string): Promise<AutoProcessing> {
  return readTriStore<AutoProcessing>({
    userId,
    key: KEY,
    supabaseTable: TABLE,
    defaultValue: {},
  })
}

export async function saveAutoProcessingSettings(userId: string, data: AutoProcessing) {
  return writeTriStore<AutoProcessing>({
    userId,
    key: KEY,
    supabaseTable: TABLE,
    defaultValue: {},
    value: data,
  })
} 