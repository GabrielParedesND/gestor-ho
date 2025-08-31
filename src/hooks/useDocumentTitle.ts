import { useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';

export function useDocumentTitle(pageTitle?: string) {
  const { settings } = useSettings();
  
  useEffect(() => {
    const title = pageTitle 
      ? `${pageTitle} - ${settings.system_name}`
      : settings.system_name;
    
    document.title = title;
  }, [settings.system_name, pageTitle]);
}