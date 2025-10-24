"use client";
export const dynamic = 'force-dynamic'

import React, { createContext, useContext, useReducer, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Monitor, 
  DownloadCloud, 
  RotateCcw,
  Save,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
  Chrome,
  Folder,
  Zap,
  Clock,
  Settings,
  Info,
  Play,
  Globe
} from 'lucide-react';
import { supabase } from '@/lib/supabase'
import { getAISetting, saveAISetting } from '@/lib/user-settings-service'

// Types
interface BrowserLauncherPrefs {
  duplicateHandling: 'skip' | 'overwrite' | 'keepBoth';
  maxTabs: number;
  autoTag: boolean;
  autoCategorize: boolean;
  undoWindowSecs: number;
}

interface CapturedTab {
  id: number;
  url: string;
  title: string;
  favicon?: string;
  status: 'queued' | 'processing' | 'saved' | 'duplicate' | 'failed';
  error?: string;
}

interface LauncherJob {
  id: string;
  tabs: CapturedTab[];
  total: number;
  processed: number;
  saved: number;
  duplicates: number;
  failed: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  startedAt: string;
  eta?: number;
}

// Default preferences
const defaultPrefs: BrowserLauncherPrefs = {
  duplicateHandling: 'skip',
  maxTabs: 40,
  autoTag: true,
  autoCategorize: true,
  undoWindowSecs: 8
};

// Context
interface BrowserLauncherState {
  prefs: BrowserLauncherPrefs;
  currentJob: LauncherJob | null;
  showCaptureModal: boolean;
  capturedTabs: CapturedTab[];
  hasUnsavedChanges: boolean;
  isExtensionInstalled: boolean;
}

type BrowserLauncherAction = 
  | { type: 'SET_PREFS'; payload: Partial<BrowserLauncherPrefs> }
  | { type: 'SET_CURRENT_JOB'; payload: LauncherJob | null }
  | { type: 'SHOW_CAPTURE_MODAL'; payload: { tabs: CapturedTab[]; show: boolean } }
  | { type: 'SET_UNSAVED_CHANGES'; payload: boolean }
  | { type: 'SET_EXTENSION_INSTALLED'; payload: boolean }
  | { type: 'UPDATE_TAB_STATUS'; payload: { tabId: number; status: CapturedTab['status']; error?: string } }
  | { type: 'RESET_TO_DEFAULTS' };

const BrowserLauncherContext = createContext<{
  state: BrowserLauncherState;
  dispatch: React.Dispatch<BrowserLauncherAction>;
  savePreferences: (prefs: BrowserLauncherPrefs) => Promise<void>;
} | null>(null);

// Reducer
const browserLauncherReducer = (state: BrowserLauncherState, action: BrowserLauncherAction): BrowserLauncherState => {
  switch (action.type) {
    case 'SET_PREFS':
      return {
        ...state,
        prefs: { ...state.prefs, ...action.payload },
        hasUnsavedChanges: true
      };
    
    case 'SET_CURRENT_JOB':
      return {
        ...state,
        currentJob: action.payload
      };
    
    case 'SHOW_CAPTURE_MODAL':
      return {
        ...state,
        showCaptureModal: action.payload.show,
        capturedTabs: action.payload.tabs
      };
    
    case 'SET_UNSAVED_CHANGES':
      return {
        ...state,
        hasUnsavedChanges: action.payload
      };
    
    case 'SET_EXTENSION_INSTALLED':
      return {
        ...state,
        isExtensionInstalled: action.payload
      };
    
    case 'UPDATE_TAB_STATUS':
      return {
        ...state,
        currentJob: state.currentJob ? {
          ...state.currentJob,
          tabs: state.currentJob.tabs.map(tab => 
            tab.id === action.payload.tabId 
              ? { ...tab, status: action.payload.status, error: action.payload.error }
              : tab
          ),
          processed: state.currentJob.processed + (action.payload.status !== 'queued' ? 1 : 0),
          saved: state.currentJob.saved + (action.payload.status === 'saved' ? 1 : 0),
          duplicates: state.currentJob.duplicates + (action.payload.status === 'duplicate' ? 1 : 0),
          failed: state.currentJob.failed + (action.payload.status === 'failed' ? 1 : 0)
        } : null
      };
    
    case 'RESET_TO_DEFAULTS':
      return {
        ...state,
        prefs: defaultPrefs,
        hasUnsavedChanges: false
      };
    
    default:
      return state;
  }
};

// Custom hook
const useBrowserLauncher = () => {
  const context = useContext(BrowserLauncherContext);
  if (!context) {
    throw new Error('useBrowserLauncher must be used within BrowserLauncherProvider');
  }
  return context;
};

// Hook for launcher job management
const useLauncherJob = (jobId: string | null) => {
  const { dispatch } = useBrowserLauncher();
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const source = new EventSource(`/api/tab-capture/${jobId}`);
    
    source.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'job_update') {
        dispatch({ type: 'SET_CURRENT_JOB', payload: data.job });
      } else if (data.type === 'tab_update') {
        dispatch({ 
          type: 'UPDATE_TAB_STATUS', 
          payload: { 
            tabId: data.tabId, 
            status: data.status, 
            error: data.error 
          } 
        });
      }
    };

    source.onerror = () => {
      console.error('SSE connection error');
    };

    setEventSource(source);

    return () => {
      source.close();
      setEventSource(null);
    };
  }, [jobId, dispatch]);

  return { eventSource };
};

// Progress donut hook (shared with Bulk Uploader)
const useProgressDonut = (total: number, done: number) => {
  const percentage = total > 0 ? Math.round((done / total) * 100) : 0;
  const eta = total > 0 && done > 0 ? Math.round(((total - done) / done) * 2) : null; // Rough ETA in seconds
  
  return { percentage, eta };
};

// Components
const UnsavedChangesBar: React.FC = () => {
  const { state, dispatch, savePreferences } = useBrowserLauncher();

  if (!state.hasUnsavedChanges) return null;

  const handleReset = () => {
    dispatch({ type: 'RESET_TO_DEFAULTS' });
    toast.success('Settings reset to defaults');
  };

  const handleSave = async () => {
    await savePreferences(state.prefs);
    dispatch({ type: 'SET_UNSAVED_CHANGES', payload: false });
  };

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4 mb-6 shadow-sm" role="alert" aria-live="polite">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-amber-500 mr-3" />
          <div>
            <span className="text-sm font-semibold text-amber-800">
              Unsaved Changes
            </span>
            <p className="text-xs text-amber-700 mt-1">
              Your browser launcher preferences have been modified
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleReset}
            className="text-amber-800 border-amber-300 hover:bg-amber-100"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
          <Button 
            size="sm" 
            onClick={handleSave}
            className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
          >
            <Save className="h-4 w-4 mr-1" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

const ExtensionInstallCard: React.FC = () => {
  const { state } = useBrowserLauncher();

  if (state.isExtensionInstalled) return null;

  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardHeader>
        <CardTitle className="flex items-center text-blue-900">
          <Chrome className="h-5 w-5 mr-2" />
          Install Browser Extension
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-blue-800">
          To capture tabs from your browser, you'll need to install the LinkPilot Browser Extension.
        </p>
        
        <div className="bg-white rounded-lg p-4 border border-blue-200">
          <h4 className="font-medium text-sm mb-2 text-blue-900">Quick Setup:</h4>
          <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
            <li>Download the extension from the Chrome Web Store</li>
            <li>Click "Add to Chrome" and confirm permissions</li>
            <li>Pin the extension to your toolbar for easy access</li>
            <li>Use Alt+Shift+B (Cmd+Shift+B on Mac) to capture tabs</li>
          </ol>
        </div>

        <div className="flex items-center space-x-3">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <ExternalLink className="h-4 w-4 mr-2" />
            Install Extension
          </Button>
          <Button variant="outline" size="sm">
            <Info className="h-4 w-4 mr-2" />
            View Instructions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const CaptureModal: React.FC = () => {
  const { state, dispatch } = useBrowserLauncher();

  const handleConfirm = async () => {
    if (state.capturedTabs.length > state.prefs.maxTabs) {
      toast.error(`Too many tabs! Maximum is ${state.prefs.maxTabs}, but ${state.capturedTabs.length} were captured.`);
      return;
    }

    try {
      const response = await fetch('/api/tab-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tabs: state.capturedTabs,
          prefs: state.prefs
        })
      });

      const data = await response.json();
      
      if (data.jobId) {
        const newJob: LauncherJob = {
          id: data.jobId,
          tabs: state.capturedTabs,
          total: state.capturedTabs.length,
          processed: 0,
          saved: 0,
          duplicates: 0,
          failed: 0,
          status: 'processing',
          startedAt: new Date().toISOString()
        };

        dispatch({ type: 'SET_CURRENT_JOB', payload: newJob });
        dispatch({ type: 'SHOW_CAPTURE_MODAL', payload: { tabs: [], show: false } });
        
        toast.success(`Started processing ${state.capturedTabs.length} tabs`);
      }
    } catch (error) {
      toast.error('Failed to start tab processing');
      console.error('Tab capture error:', error);
    }
  };

  const handleCancel = () => {
    dispatch({ type: 'SHOW_CAPTURE_MODAL', payload: { tabs: [], show: false } });
  };

  return (
    <Dialog open={state.showCaptureModal} onOpenChange={() => handleCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Folder className="h-5 w-5 mr-2" />
            Confirm Tab Capture
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">
              {state.capturedTabs.length}
            </div>
            <p className="text-sm text-muted-foreground">
              tabs captured from your browser
            </p>
          </div>

          {state.capturedTabs.length > state.prefs.maxTabs && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center">
                <XCircle className="h-4 w-4 text-red-500 mr-2" />
                <span className="text-sm font-medium text-red-800">
                  Too many tabs!
                </span>
              </div>
              <p className="text-xs text-red-700 mt-1">
                Maximum allowed: {state.prefs.maxTabs}. Please close some tabs and try again.
              </p>
            </div>
          )}

          <div className="bg-muted rounded-lg p-3">
            <div className="flex items-center justify-between text-xs">
              <span>Duplicate handling:</span>
              <Badge variant="outline">{state.prefs.duplicateHandling}</Badge>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={state.capturedTabs.length > state.prefs.maxTabs}
              className="flex-1"
            >
              <DownloadCloud className="h-4 w-4 mr-2" />
              Import Tabs
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ProgressDonut: React.FC = () => {
  const { state } = useBrowserLauncher();
  
  if (!state.currentJob || state.currentJob.status === 'completed') return null;

  const percentage = state.currentJob.total > 0 ? Math.round((state.currentJob.processed / state.currentJob.total) * 100) : 0;
  const eta = state.currentJob.total > 0 && state.currentJob.processed > 0 ? Math.round(((state.currentJob.total - state.currentJob.processed) / state.currentJob.processed) * 2) : null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-2">
      <Card className="shadow-xl border-primary/20 bg-white/95 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-muted">
                <div 
                  className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin"
                  style={{
                    background: `conic-gradient(from 0deg, hsl(var(--primary)) ${percentage}%, transparent ${percentage}%)`
                  }}
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold">{percentage}%</span>
              </div>
            </div>
            
            <div className="min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="font-medium text-sm">Processing tabs...</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {state.currentJob.processed} of {state.currentJob.total} completed
              </div>
              {eta && (
                <div className="text-xs text-muted-foreground flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  ~{eta}s remaining
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const TabStatusPill: React.FC<{ tab: CapturedTab }> = ({ tab }) => {
  const getStatusConfig = (status: CapturedTab['status']) => {
    switch (status) {
      case 'queued':
        return { icon: Clock, color: 'bg-gray-100 text-gray-700 border-gray-200', label: 'Queued' };
      case 'processing':
        return { icon: Loader2, color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Processing' };
      case 'saved':
        return { icon: CheckCircle, color: 'bg-green-100 text-green-700 border-green-200', label: 'Saved' };
      case 'duplicate':
        return { icon: AlertCircle, color: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'Duplicate' };
      case 'failed':
        return { icon: XCircle, color: 'bg-red-100 text-red-700 border-red-200', label: 'Failed' };
    }
  };

  const config = getStatusConfig(tab.status);
  const Icon = config.icon;

  return (
    <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex-shrink-0">
        {tab.favicon ? (
          <img src={tab.favicon} alt="" className="w-4 h-4" />
        ) : (
          <Monitor className="w-4 h-4 text-muted-foreground" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{tab.title}</div>
        <div className="text-xs text-muted-foreground truncate">{tab.url}</div>
        {tab.error && (
          <div className="text-xs text-red-600 mt-1">{tab.error}</div>
        )}
      </div>
      
      <Badge variant="outline" className={`${config.color} text-xs`}>
        <Icon className={`h-3 w-3 mr-1 ${tab.status === 'processing' ? 'animate-spin' : ''}`} />
        {config.label}
      </Badge>
    </div>
  );
};

const JobProgress: React.FC = () => {
  const { state } = useBrowserLauncher();

  if (!state.currentJob) return null;

  const job = state.currentJob;
  const isCompleted = job.status === 'completed';

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Zap className="h-5 w-5 mr-2 text-primary" />
            Current Job
          </div>
          <div className="flex items-center space-x-2">
            {isCompleted ? (
              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Completed
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
                <Play className="h-3 w-3 mr-1" />
                Processing
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary">{job.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{job.saved}</div>
            <div className="text-xs text-muted-foreground">Saved</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">{job.duplicates}</div>
            <div className="text-xs text-muted-foreground">Duplicates</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">{job.failed}</div>
            <div className="text-xs text-muted-foreground">Failed</div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Progress</span>
            <span>{job.processed} / {job.total}</span>
          </div>
          <Progress value={(job.processed / job.total) * 100} className="h-2" />
        </div>

        <div className="max-h-64 overflow-y-auto space-y-2">
          {job.tabs.map((tab) => (
            <TabStatusPill key={tab.id} tab={tab} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const SettingsPanel: React.FC = () => {
  const { state, dispatch } = useBrowserLauncher();

  const handlePrefsChange = (key: keyof BrowserLauncherPrefs, value: any) => {
    dispatch({ type: 'SET_PREFS', payload: { [key]: value } });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Settings className="h-5 w-5 mr-2" />
          Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm font-medium">Duplicate Handling</Label>
          <Select 
            value={state.prefs.duplicateHandling} 
            onValueChange={(value) => handlePrefsChange('duplicateHandling', value)}
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="skip">Skip duplicates</SelectItem>
              <SelectItem value="overwrite">Overwrite existing</SelectItem>
              <SelectItem value="keepBoth">Keep both versions</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Max tabs per capture:</span>
            <Badge variant="outline">{state.prefs.maxTabs}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Auto-tagging:</span>
            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
              Enabled
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Auto-categorization:</span>
            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
              Enabled
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Undo window:</span>
            <Badge variant="outline">{state.prefs.undoWindowSecs} seconds</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const WaitingCard: React.FC = () => {
  const { state } = useBrowserLauncher();

  if (!state.isExtensionInstalled || state.currentJob) return null;

  return (
    <Card className="text-center py-12">
      <CardContent>
        <div className="max-w-md mx-auto">
          <div className="mb-6">
            <Monitor className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              Ready to capture tabs
            </h3>
            <p className="text-sm text-muted-foreground">
              Use the browser extension or keyboard shortcut to capture your current tabs and convert them into bookmarks.
            </p>
          </div>
          
          <div className="bg-muted rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <kbd className="px-2 py-1 bg-white rounded text-xs font-mono border">Alt</kbd>
              <span className="text-xs">+</span>
              <kbd className="px-2 py-1 bg-white rounded text-xs font-mono border">Shift</kbd>
              <span className="text-xs">+</span>
              <kbd className="px-2 py-1 bg-white rounded text-xs font-mono border">B</kbd>
            </div>
            <p className="text-xs text-muted-foreground">
              Keyboard shortcut to capture tabs
            </p>
          </div>

          <Button variant="outline" className="text-sm">
            <Info className="h-4 w-4 mr-2" />
            View Extension Guide
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Provider component
const BrowserLauncherProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(browserLauncherReducer, {
    prefs: defaultPrefs,
    currentJob: null,
    showCaptureModal: false,
    capturedTabs: [],
    hasUnsavedChanges: false,
    isExtensionInstalled: false
  });

  // Check if extension is installed
  useEffect(() => {
    const checkExtension = () => {
      dispatch({ type: 'SET_EXTENSION_INSTALLED', payload: true });
    };
    checkExtension();
  }, []);

  // Listen for messages from extension
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'tabs:capture') {
        const tabs: CapturedTab[] = event.data.tabs.map((tab: any, index: number) => ({
          id: index,
          url: tab.url,
          title: tab.title,
          favicon: tab.favIconUrl,
          status: 'queued' as const
        }));
        
        dispatch({ type: 'SHOW_CAPTURE_MODAL', payload: { tabs, show: true } });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Use launcher job hook if we have a current job
  const jobId = state.currentJob?.id || null;
  
  useEffect(() => {
    if (!jobId) return;

    const source = new EventSource(`/api/tab-capture/${jobId}`);
    
    source.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'job_update') {
        dispatch({ type: 'SET_CURRENT_JOB', payload: data.job });
      } else if (data.type === 'tab_update') {
        dispatch({ 
          type: 'UPDATE_TAB_STATUS', 
          payload: { 
            tabId: data.tabId, 
            status: data.status, 
            error: data.error 
          } 
        });
      }
    };

    source.onerror = () => {
      console.error('SSE connection error');
    };

    return () => {
      source.close();
    };
  }, [jobId, dispatch]);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        try {
          const remote = await getAISetting(user.id, 'browser_launcher') as any
          dispatch({ type: 'SET_PREFS', payload: remote as Partial<BrowserLauncherPrefs> })
          dispatch({ type: 'SET_UNSAVED_CHANGES', payload: false })
        } catch (error) {
          console.error('Failed to load browser launcher settings:', error)
        }
      }
    })()
  }, [])

  const savePreferences = async (prefs: BrowserLauncherPrefs) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      try {
        await saveAISetting(user.id, 'browser_launcher', prefs as any)
        toast.success('Browser launcher preferences saved')
      } catch (error) {
        console.error('Failed to save browser launcher preferences:', error)
        toast.error('Failed to save preferences')
      }
    }
  }

  return (
    <BrowserLauncherContext.Provider value={{ state, dispatch, savePreferences }}>
      {children}
    </BrowserLauncherContext.Provider>
  );
};

// Main component
export default function BrowserLauncherPage() {
  return (
    <BrowserLauncherProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="container mx-auto py-8 px-4 max-w-6xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
              Browser Launcher
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Capture tabs from your browser and automatically convert them into organized, tagged bookmarks
            </p>
          </div>

          <UnsavedChangesBar />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <ExtensionInstallCard />
              <JobProgress />
              <WaitingCard />
            </div>

            {/* Settings Sidebar */}
            <div className="lg:col-span-1">
              <SettingsPanel />
            </div>
          </div>

          <CaptureModal />
          <ProgressDonut />
        </div>
      </div>
    </BrowserLauncherProvider>
  );
} 