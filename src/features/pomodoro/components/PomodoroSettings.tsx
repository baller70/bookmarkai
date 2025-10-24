'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  Settings, 
  Clock, 
  Volume2, 
  Bell, 
  Smartphone,
  Save,
  RotateCcw
} from 'lucide-react';
import { PomodoroSettings as PomodoroSettingsType } from '../types';

interface PomodoroSettingsProps {
  settings: PomodoroSettingsType;
  updateSettings: (settings: Partial<PomodoroSettingsType>) => void;
  defaultSettings: PomodoroSettingsType;
}

export default function PomodoroSettings({
  settings,
  updateSettings,
  defaultSettings
}: PomodoroSettingsProps) {
  const [localSettings, setLocalSettings] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);

  const handleSettingChange = (key: keyof PomodoroSettingsType, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateSettings(localSettings);
    setHasChanges(false);
  };

  const handleReset = () => {
    setLocalSettings(defaultSettings);
    setHasChanges(true);
  };

  const handleResetToDefault = () => {
    updateSettings(defaultSettings);
    setLocalSettings(defaultSettings);
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">SETTINGS</h2>
          <p className="text-gray-600">Customize your Pomodoro experience</p>
        </div>
        {hasChanges && (
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              RESET
            </Button>
            <Button onClick={handleSave} className="bg-green-500 hover:bg-green-600">
              <Save className="w-4 h-4 mr-2" />
              SAVE CHANGES
            </Button>
          </div>
        )}
      </div>

      {/* Timer Duration Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>TIMER DURATIONS</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Work Duration (minutes)
              </label>
              <Input
                type="number"
                min="1"
                max="60"
                value={localSettings.workDuration}
                onChange={(e) => handleSettingChange('workDuration', parseInt(e.target.value) || 25)}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">Recommended: 25 minutes</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Short Break (minutes)
              </label>
              <Input
                type="number"
                min="1"
                max="30"
                value={localSettings.shortBreakDuration}
                onChange={(e) => handleSettingChange('shortBreakDuration', parseInt(e.target.value) || 5)}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">Recommended: 5 minutes</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Long Break (minutes)
              </label>
              <Input
                type="number"
                min="1"
                max="60"
                value={localSettings.longBreakDuration}
                onChange={(e) => handleSettingChange('longBreakDuration', parseInt(e.target.value) || 15)}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">Recommended: 15 minutes</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Long Break Interval
            </label>
            <div className="flex items-center space-x-4">
              <Input
                type="number"
                min="2"
                max="10"
                value={localSettings.longBreakInterval}
                onChange={(e) => handleSettingChange('longBreakInterval', parseInt(e.target.value) || 4)}
                className="w-24"
              />
              <span className="text-sm text-gray-600">
                Take a long break after every {localSettings.longBreakInterval} work sessions
              </span>
            </div>
          </div>
        </CardContent>
      </Card>      {/* Auto-Start Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>AUTO-START SETTINGS</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Auto-start breaks
              </label>
              <p className="text-xs text-gray-500">
                Automatically start break timers when work sessions end
              </p>
            </div>
            <Switch
              checked={localSettings.autoStartBreaks}
              onCheckedChange={(checked) => handleSettingChange('autoStartBreaks', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Auto-start work sessions
              </label>
              <p className="text-xs text-gray-500">
                Automatically start work timers when breaks end
              </p>
            </div>
            <Switch
              checked={localSettings.autoStartWork}
              onCheckedChange={(checked) => handleSettingChange('autoStartWork', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Sound & Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Volume2 className="w-5 h-5" />
            <span>SOUND & NOTIFICATIONS</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Enable sound alerts
              </label>
              <p className="text-xs text-gray-500">
                Play sound when timer completes
              </p>
            </div>
            <Switch
              checked={localSettings.soundEnabled}
              onCheckedChange={(checked) => handleSettingChange('soundEnabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Enable notifications
              </label>
              <p className="text-xs text-gray-500">
                Show browser notifications when timer completes
              </p>
            </div>
            <Switch
              checked={localSettings.notificationsEnabled}
              onCheckedChange={(checked) => handleSettingChange('notificationsEnabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Ticking sound
              </label>
              <p className="text-xs text-gray-500">
                Play ticking sound during timer countdown
              </p>
            </div>
            <Switch
              checked={localSettings.tickingSound}
              onCheckedChange={(checked) => handleSettingChange('tickingSound', checked)}
            />
          </div>

          {localSettings.soundEnabled && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alarm Sound
                </label>
                <select
                  value={localSettings.alarmSound}
                  onChange={(e) => handleSettingChange('alarmSound', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="bell">Bell</option>
                  <option value="chime">Chime</option>
                  <option value="beep">Beep</option>
                  <option value="ding">Ding</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Volume: {Math.round(localSettings.alarmVolume * 100)}%
                </label>
                <Slider
                  value={[localSettings.alarmVolume]}
                  onValueChange={([value]) => handleSettingChange('alarmVolume', value)}
                  max={1}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Reset to Defaults */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700">RESET SETTINGS</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700 font-medium">
                Reset all settings to default values
              </p>
              <p className="text-xs text-red-600">
                This action cannot be undone
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleResetToDefault}
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              RESET TO DEFAULTS
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}