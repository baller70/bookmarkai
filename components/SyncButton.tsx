'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Cloud, Github, Database, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import SyncService from '@/lib/sync-service'

interface SyncButtonProps {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  showStatus?: boolean
}

export function SyncButton({ variant = 'outline', size = 'default', showStatus = true }: SyncButtonProps) {
  const [syncing, setSyncing] = useState(false)
  const [lastSyncResult, setLastSyncResult] = useState<any>(null)

  const handleSync = async () => {
    setSyncing(true)
    
    try {
      const result = await SyncService.syncAll()
      setLastSyncResult(result)
      
      if (result.success) {
        toast.success('🎉 All data synced successfully!')
      } else {
        toast.error(`Sync failed: ${result.message}`)
      }
    } catch (error) {
      console.error('Sync error:', error)
      toast.error('Sync failed unexpectedly')
      setLastSyncResult({
        success: false,
        message: 'Unexpected error occurred'
      })
    } finally {
      setSyncing(false)
    }
  }

  const getSyncStatus = () => {
    const status = SyncService.getSyncStatus()
    return status
  }

  const formatLastSyncTime = (timestamp: string | null) => {
    if (!timestamp) return 'Never'
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return date.toLocaleDateString()
  }

  const status = getSyncStatus()

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={variant}
        size={size}
        onClick={handleSync}
        disabled={syncing}
        className="flex items-center gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
        {syncing ? 'Syncing...' : 'Sync All'}
      </Button>

      {showStatus && (
        <div className="flex items-center gap-1">
          {/* Sync Status Indicators */}
          <div className="flex items-center gap-1">
            <Database className="h-3 w-3 text-blue-500" />
            <Cloud className="h-3 w-3 text-green-500" />
            <Github className="h-3 w-3 text-gray-700" />
          </div>

          {/* Last Sync Status */}
          {lastSyncResult && (
            <Badge 
              variant={lastSyncResult.success ? 'default' : 'destructive'}
              className="text-xs"
            >
              {lastSyncResult.success ? (
                <CheckCircle className="h-3 w-3 mr-1" />
              ) : (
                <AlertCircle className="h-3 w-3 mr-1" />
              )}
              {lastSyncResult.success ? 'Synced' : 'Failed'}
            </Badge>
          )}

          {/* Last Sync Time */}
          {status.lastSyncTime && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatLastSyncTime(status.lastSyncTime)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Compact version for smaller spaces
export function CompactSyncButton() {
  return (
    <SyncButton 
      variant="ghost" 
      size="sm" 
      showStatus={false}
    />
  )
}

// Full status panel version
export function SyncStatusPanel() {
  const [syncing, setSyncing] = useState(false)
  const [syncHistory, setSyncHistory] = useState<any[]>([])

  const handleFullSync = async () => {
    setSyncing(true)
    
    try {
      const result = await SyncService.syncAll()
      setSyncHistory(prev => [result, ...prev.slice(0, 4)]) // Keep last 5 results
    } catch (error) {
      console.error('Sync error:', error)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="p-4 border rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Data Synchronization</h3>
        <SyncButton />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <Database className="h-6 w-6 mx-auto text-blue-500 mb-1" />
          <div className="text-sm font-medium">localStorage</div>
          <div className="text-xs text-muted-foreground">Local Cache</div>
        </div>

        <div className="text-center p-3 bg-green-50 rounded-lg">
          <Cloud className="h-6 w-6 mx-auto text-green-500 mb-1" />
          <div className="text-sm font-medium">Supabase</div>
          <div className="text-xs text-muted-foreground">Cloud Database</div>
        </div>

        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <Github className="h-6 w-6 mx-auto text-gray-700 mb-1" />
          <div className="text-sm font-medium">GitHub</div>
          <div className="text-xs text-muted-foreground">Version Control</div>
        </div>
      </div>

      {syncHistory.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Recent Sync History</h4>
          {syncHistory.slice(0, 3).map((result, index) => (
            <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <span>{result.message}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}  