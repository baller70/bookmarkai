
'use client'
export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Switch } from '../../../components/ui/switch'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { BookmarkServiceAdapter } from '../../../lib/bookmark-service-adapter'

export default function StorageSettingsPage() {
  const [userId] = useState('dev-user-fixed-id')
  const [cloudSyncEnabled, setCloudSyncEnabled] = useState(false)
  const [storageStats, setStorageStats] = useState<any>(null)
  const [adapter] = useState(() => new BookmarkServiceAdapter(userId, cloudSyncEnabled))
  
  useEffect(() => {
    loadStorageStats()
  }, [])
  
  const loadStorageStats = async () => {
    const stats = await adapter.getStorageStats()
    setStorageStats(stats)
  }
  
  const handleCloudSyncToggle = (enabled: boolean) => {
    setCloudSyncEnabled(enabled)
    adapter.setCloudSync(enabled)
    loadStorageStats()
  }
  
  const handleExport = async () => {
    const exportData = await adapter.exportBookmarks()
    const blob = new Blob([exportData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bookmarks-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bookmark Storage Settings</h1>
        <p className="text-muted-foreground">Manage how your bookmarks are stored and synced</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Storage Method</CardTitle>
          <CardDescription>
            Your bookmarks are stored locally in your browser for instant access and privacy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Cloud Backup & Sync</h3>
              <p className="text-sm text-muted-foreground">
                Sync bookmarks across devices and backup to cloud storage
              </p>
            </div>
            <Switch
              checked={cloudSyncEnabled}
              onCheckedChange={handleCloudSyncToggle}
            />
          </div>
          
          {storageStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm font-medium">Total Bookmarks</p>
                <p className="text-2xl font-bold">{storageStats.totalBookmarks}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Storage Used</p>
                <p className="text-2xl font-bold">{storageStats.storageSize}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Sync Status</p>
                <Badge variant={storageStats.cloudSyncEnabled ? "default" : "secondary"}>
                  {storageStats.cloudSyncEnabled ? "Enabled" : "Local Only"}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium">Last Sync</p>
                <p className="text-sm text-muted-foreground">
                  {storageStats.lastSync 
                    ? new Date(storageStats.lastSync).toLocaleDateString()
                    : 'Never'
                  }
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Backup & Restore</CardTitle>
          <CardDescription>
            Export your bookmarks for backup or import from another device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={handleExport}>
              Export Bookmarks
            </Button>
            <div>
              <input
                type="file"
                accept=".json"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    const text = await file.text()
                    await adapter.importBookmarks(text, 'merge')
                    loadStorageStats()
                  }
                }}
                className="hidden"
                id="import-bookmarks"
              />
              <Button variant="outline" asChild>
                <label htmlFor="import-bookmarks" className="cursor-pointer">
                  Import Bookmarks
                </label>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
