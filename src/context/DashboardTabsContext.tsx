import React, { createContext, useContext, useState, useCallback } from 'react';

interface DashboardTab {
  teamId: number;
  teamName: string;
}

interface DashboardTabsContextType {
  openTabs: DashboardTab[];
  addTab: (teamId: number, teamName: string) => void;
  removeTab: (teamId: number) => void;
  isTabOpen: (teamId: number) => boolean;
}

const DashboardTabsContext = createContext<DashboardTabsContextType | null>(null);

export const useDashboardTabs = () => {
  const context = useContext(DashboardTabsContext);
  if (!context) {
    throw new Error('useDashboardTabs must be used within DashboardTabsProvider');
  }
  return context;
};

export function DashboardTabsProvider({ children }: { children: React.ReactNode }) {
  const [openTabs, setOpenTabs] = useState<DashboardTab[]>([]);

  const addTab = useCallback((teamId: number, teamName: string) => {
    setOpenTabs((prev) => {
      if (prev.some((tab) => tab.teamId === teamId)) {
        return prev;
      }
      const maxTabs = 3;
      if (prev.length >= maxTabs) {
        return [...prev.slice(1), { teamId, teamName }];
      }
      return [...prev, { teamId, teamName }];
    });
  }, []);

  const removeTab = useCallback((teamId: number) => {
    setOpenTabs((prev) => prev.filter((tab) => tab.teamId !== teamId));
  }, []);

  const isTabOpen = useCallback(
    (teamId: number) => {
      return openTabs.some((tab) => tab.teamId === teamId);
    },
    [openTabs]
  );

  return (
    <DashboardTabsContext.Provider value={{ openTabs, addTab, removeTab, isTabOpen }}>
      {children}
    </DashboardTabsContext.Provider>
  );
}

