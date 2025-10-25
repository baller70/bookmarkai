'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Sparkles, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';

interface UpgradeStats {
  total: number;
  highQuality: number;
  lowQuality: number;
  noFavicon: number;
  needsUpgrade: number;
}

export function FaviconUpgradePanel() {
  const [stats, setStats] = useState<UpgradeStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [progress, setProgress] = useState(0);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/bookmarks/upgrade-favicons');
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      } else {
        toast.error('Failed to fetch favicon stats');
      }
    } catch (error) {
      toast.error('Failed to fetch favicon stats');
    } finally {
      setIsLoading(false);
    }
  };

  const upgradeAllFavicons = async () => {
    if (!stats || stats.needsUpgrade === 0) {
      toast.info('All bookmarks already have high-quality favicons!');
      return;
    }

    setIsUpgrading(true);
    setProgress(0);

    try {
      const response = await fetch('/api/bookmarks/upgrade-favicons', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setProgress(100);
        toast.success(data.message);
        
        // Refresh stats
        await fetchStats();
      } else {
        toast.error('Failed to upgrade favicons');
      }
    } catch (error) {
      toast.error('Failed to upgrade favicons');
    } finally {
      setIsUpgrading(false);
    }
  };

  React.useEffect(() => {
    fetchStats();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          High-Quality Favicon Upgrade
        </CardTitle>
        <CardDescription>
          Upgrade all your bookmarks to use high-quality favicons and logos (256x256)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : stats ? (
          <>
            {/* Stats Display */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-xs text-muted-foreground">Total Bookmarks</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.highQuality}
                </div>
                <div className="text-xs text-muted-foreground">High Quality</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {stats.lowQuality}
                </div>
                <div className="text-xs text-muted-foreground">Low Quality</div>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {stats.noFavicon}
                </div>
                <div className="text-xs text-muted-foreground">No Favicon</div>
              </div>
            </div>

            {/* Progress Bar */}
            {isUpgrading && (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-sm text-center text-muted-foreground">
                  Upgrading favicons... {progress}%
                </p>
              </div>
            )}

            {/* Upgrade Button */}
            <div className="flex flex-col gap-2">
              {stats.needsUpgrade > 0 ? (
                <>
                  <Button
                    onClick={upgradeAllFavicons}
                    disabled={isUpgrading}
                    className="w-full"
                    size="lg"
                  >
                    {isUpgrading ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Upgrading...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Upgrade {stats.needsUpgrade} Bookmark{stats.needsUpgrade !== 1 ? 's' : ''}
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    This will fetch high-quality favicons (256x256) for all your bookmarks
                  </p>
                </>
              ) : (
                <div className="flex items-center justify-center gap-2 py-4 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">All bookmarks have high-quality favicons!</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-sm">What gets upgraded?</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Fetches 256x256 high-resolution favicons</li>
                <li>• Uses multiple sources: Clearbit, Google, DuckDuckGo</li>
                <li>• Improves bookmark card appearance</li>
                <li>• Better quality for background images</li>
              </ul>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
            <XCircle className="h-5 w-5" />
            <span>Failed to load stats</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
