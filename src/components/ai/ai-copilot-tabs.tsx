'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AISmartTagPage } from './ai-smart-tag-page';
import { AIFilterPage } from './ai-filter-page';
import { AIPredictionPage } from './ai-prediction-page';
import { AIAlliancesPage } from './ai-alliances-page';
import { AIForecastPage } from './ai-forecast-page';
import AILearningPathPage from './ai-learning-path-page';

interface TabDef {
  value: string;
  label: string;
}

const tabs: TabDef[] = [
  { value: 'smart-tag', label: 'AI Smart Tag' },
  { value: 'filter', label: 'AI Filter' },
  { value: 'prediction', label: 'AI Prediction' },
  { value: 'alliances', label: 'AI Alliances' },
  { value: 'forecast', label: 'AI Forecast' },
  { value: 'learning-path', label: 'AI Learning Path' },
];

export function AICopilotTabs() {
  const [activeTab, setActiveTab] = useState('smart-tag');

  return (
    <>
      {/* Tabs Navigation - matches DNA Profile structure */}
      <div className="w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-6 bg-gray-100 dark:bg-gray-800">
                {tabs.map((tab) => (
                  <TabsTrigger 
                    key={tab.value} 
                    value={tab.value} 
                    className="text-xs lg:text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>
      
      {/* Content Container - matches DNA Profile structure */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="smart-tag" className="mt-0">
            <AISmartTagPage />
          </TabsContent>

          <TabsContent value="filter" className="mt-0">
            <AIFilterPage />
          </TabsContent>

          <TabsContent value="prediction" className="mt-0">
            <AIPredictionPage />
          </TabsContent>

          <TabsContent value="alliances" className="mt-0">
            <AIAlliancesPage />
          </TabsContent>

          <TabsContent value="forecast" className="mt-0">
            <AIForecastPage />
          </TabsContent>

          <TabsContent value="learning-path" className="mt-0">
            <AILearningPathPage />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
} 