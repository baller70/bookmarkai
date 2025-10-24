'use client'

import React from 'react'

export function StagewiseToolbar() {
  React.useEffect(() => {
    // Only initialize in development mode and on client side
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      // @ts-ignore - Optional stagewise toolbar
      import('@stagewise/toolbar-next').then((module) => {
        console.log('Stagewise toolbar loaded:', module);
      }).catch((error) => {
        console.warn('Failed to load stagewise toolbar:', error);
      });
    }
  }, []);

  // This component doesn't render anything visible
  return null;
}    