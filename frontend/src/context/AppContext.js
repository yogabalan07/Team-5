import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { getTheme } from '../styles/theme';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('ebms_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [themeMode, setThemeMode] = useState(() => {
    try {
      return localStorage.getItem('ebms_theme_mode') || 'light';
    } catch {
      return 'light';
    }
  });

  const [searchOpen, setSearchOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState(true);

  useEffect(() => {
    try {
      localStorage.setItem('ebms_theme_mode', themeMode);
    } catch {
      // ignore
    }
  }, [themeMode]);

  useEffect(() => {
    try {
      localStorage.setItem('ebms_sidebar_collapsed', String(sidebarCollapsed));
    } catch {
      // ignore
    }
  }, [sidebarCollapsed]);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const muiTheme = useMemo(() => getTheme(themeMode), [themeMode]);

  return (
    <AppContext.Provider
      value={{
        sidebarCollapsed,
        setSidebarCollapsed,
        toggleSidebar,
        theme: themeMode,
        themeMode,
        toggleTheme,
        searchOpen,
        setSearchOpen,
        previewMode,
        setPreviewMode,
      }}
    >
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};