import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../lib/api';

interface Settings {
  system_name: string;
  voting_deadline_hour: number;
  max_votes_per_candidate: number;
  grant_expiry_days: number;
  points_for_bonus_day: number;
}

interface SettingsContextType {
  settings: Settings;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: Settings = {
  system_name: 'Sistema de Incentivo HO',
  voting_deadline_hour: 17,
  max_votes_per_candidate: 4,
  grant_expiry_days: 60,
  points_for_bonus_day: 4,
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  refreshSettings: async () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  const refreshSettings = async () => {
    try {
      const allSettings = await apiClient.getSettings();
      const settingsObj = allSettings.reduce((acc: any, setting: any) => {
        acc[setting.key] = JSON.parse(setting.value);
        return acc;
      }, {});
      
      setSettings(prev => ({ ...prev, ...settingsObj }));
    } catch (error) {
      console.warn('Error loading settings, using defaults');
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);