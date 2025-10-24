'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Database,
  Server,
  Shield,
  Zap
} from 'lucide-react'

interface VerificationCheck {
  id: string
  name: string
  status: 'passed' | 'failed' | 'warning'
  message: string
  details?: string
}

interface SystemStatus {
  overall: 'healthy' | 'warning' | 'error'
  checks: VerificationCheck[]
  lastRun: string
}

export function AnalyticsVerification() {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    runVerification()
  }, [])

  const runVerification = async () => {
    setRunning(true)
    setLoading(true)
    
    try {
      // Simulate verification checks
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const mockStatus: SystemStatus = {
        overall: 'healthy',
        lastRun: new Date().toLocaleString(),
        checks: [
          {
            id: 'database',
            name: 'Database Connection',
            status: 'passed',
            message: 'Database is responding normally',
            details: 'Connection time: 45ms, Query performance: Excellent'
          },
          {
            id: 'analytics',
            name: 'Analytics Data Integrity',
            status: 'passed',
            message: 'All analytics data is consistent',
            details: 'Last sync: 2 minutes ago, Data completeness: 100%'
          },
          {
            id: 'performance',
            name: 'System Performance',
            status: 'warning',
            message: 'Performance is within acceptable range',
            details: 'CPU: 72%, Memory: 68%, Response time: 1.2s'
          },
          {
            id: 'security',
            name: 'Security Checks',
            status: 'passed',
            message: 'All security protocols are active',
            details: 'SSL: Valid, Authentication: Active, Firewall: Enabled'
          },
          {
            id: 'backup',
            name: 'Data Backup Status',
            status: 'passed',
            message: 'Backups are up to date',
            details: 'Last backup: 4 hours ago, Next backup: in 4 hours'
          },
          {
            id: 'api',
            name: 'API Endpoints',
            status: 'passed',
            message: 'All API endpoints are responding',
            details: 'Response time: 200ms, Success rate: 99.8%'
          }
        ]
      }
      
      setStatus(mockStatus)
    } catch (error) {
      console.error('Verification failed:', error)
    } finally {
      setLoading(false)
      setRunning(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'passed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Passed</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Failed</Badge>
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Warning</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getOverallStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600'
      case 'warning':
        return 'text-yellow-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  if (loading && !status) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="text-center py-12">
            <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-semibold mb-2">Running System Verification</h3>
            <p className="text-gray-600">
              Checking system health and data integrity...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!status) return null

  const passedChecks = status.checks.filter(check => check.status === 'passed').length
  const warningChecks = status.checks.filter(check => check.status === 'warning').length
  const failedChecks = status.checks.filter(check => check.status === 'failed').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">System Verification</h2>
            <p className="text-sm text-gray-600">Comprehensive health check and data integrity verification</p>
          </div>
        </div>
        
        <Button 
          onClick={runVerification} 
          disabled={running}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${running ? 'animate-spin' : ''}`} />
          {running ? 'Running...' : 'Run Check'}
        </Button>
      </div>

      {/* Overall Status */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Overall System Status</h3>
              <div className={`text-2xl font-bold ${getOverallStatusColor(status.overall)}`}>
                {status.overall.charAt(0).toUpperCase() + status.overall.slice(1)}
              </div>
              <p className="text-sm text-gray-600 mt-1">Last check: {status.lastRun}</p>
            </div>
            <div className="text-right">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{passedChecks}</div>
                  <div className="text-xs text-gray-600">Passed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{warningChecks}</div>
                  <div className="text-xs text-gray-600">Warnings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{failedChecks}</div>
                  <div className="text-xs text-gray-600">Failed</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification Checks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {status.checks.map((check) => (
          <Card key={check.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {getStatusIcon(check.status)}
                  {check.name}
                </CardTitle>
                {getStatusBadge(check.status)}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 mb-2">{check.message}</p>
              {check.details && (
                <p className="text-xs text-gray-500">{check.details}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            System Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">CPU Usage</span>
                <span className="text-sm text-gray-600">72%</span>
              </div>
              <Progress value={72} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Memory Usage</span>
                <span className="text-sm text-gray-600">68%</span>
              </div>
              <Progress value={68} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Disk Usage</span>
                <span className="text-sm text-gray-600">45%</span>
              </div>
              <Progress value={45} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 