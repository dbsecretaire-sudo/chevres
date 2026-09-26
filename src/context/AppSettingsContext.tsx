import { createContext, useCallback, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { type AppSettings, getSettings, updateSettings } from '@/storage/settings';
import { currentYear } from '@/utils/dates';

interface AppSettingsContextValue {
  settings: AppSettings;
  loaded: boolean;
  setAnneeActive: (annee: number) => Promise<void>;
  refreshSettings: () => Promise<void>;
  patchSettings: (patch: Partial<AppSettings>) => Promise<void>;
}

const AppSettingsContext = createContext<AppSettingsContextValue | undefined>(undefined);

export function AppSettingsProvider({ children }: PropsWithChildren) {
  const [settings, setSettings] = useState<AppSettings>({ anneeActive: currentYear() });
  const [loaded, setLoaded] = useState(false);

  const refreshSettings = useCallback(async () => {
    const s = await getSettings();
    setSettings(s);
    setLoaded(true);
  }, []);

  useEffect(() => {
    // Chargement initial unique depuis AsyncStorage — pas de re-render en cascade,
    // rule react-hooks/set-state-in-effect trop stricte pour ce cas.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshSettings();
  }, [refreshSettings]);

  const setAnneeActive = useCallback(async (annee: number) => {
    const next = await updateSettings({ anneeActive: annee });
    setSettings(next);
  }, []);

  const patchSettings = useCallback(async (patch: Partial<AppSettings>) => {
    const next = await updateSettings(patch);
    setSettings(next);
  }, []);

  return (
    <AppSettingsContext.Provider value={{ settings, loaded, setAnneeActive, refreshSettings, patchSettings }}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings(): AppSettingsContextValue {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) throw new Error('useAppSettings doit être utilisé dans AppSettingsProvider');
  return ctx;
}
