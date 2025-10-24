import React from 'react';

interface NewHeaderComponentProps {
  onBack: () => void;
  onRunAnalysis: () => void;
  analyzing: boolean;
  title: string;
}

export const NewHeaderComponent: React.FC<NewHeaderComponentProps> = ({
  onBack,
  onRunAnalysis,
  analyzing,
  title,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-card backdrop-blur-sm border-b border-gray-200 dark:border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-2" onClick={onBack}>
              <span>Back to Dashboard</span>
            </button>
            <div className="h-6 w-px bg-gray-300" />
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold">{title}</h1>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="flex items-center gap-2" onClick={onRunAnalysis} disabled={analyzing}>
              <span>{analyzing ? 'Analyzing...' : 'Run Analysis'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}; 