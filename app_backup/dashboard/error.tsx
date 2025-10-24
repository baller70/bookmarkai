"use client";

import React from 'react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
            Something went wrong!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            An error occurred while loading the dashboard. Please try again.
          </p>
          {error.digest && (
            <p className="text-xs text-gray-500 dark:text-gray-500 text-center font-mono">
              Error ID: {error.digest}
            </p>
          )}
          <div className="flex space-x-2">
            <Button
              onClick={reset}
              className="flex-1"
              variant="default"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try again
            </Button>
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="flex-1"
            >
              <Home className="h-4 w-4 mr-2" />
              Go home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 