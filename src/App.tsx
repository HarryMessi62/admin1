import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/ru';

import { AuthProvider, useAuth } from './hooks/useAuth';
import { Layout } from './components/Layout/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Users } from './pages/Users';
import { Articles } from './pages/Articles';
import { ArticleEditor } from './pages/ArticleEditor';
import { Domains } from './pages/Domains';
import { DomainSettings } from './pages/DomainSettings';
import { Profile } from './pages/Profile';
import Settings from './pages/Settings';
import Parser from './pages/Parser';
import ParserSettings from './pages/ParserSettings';


// Создаем темную сине-черную тему Material-UI
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#2563eb', // синий
      light: '#3b82f6',
      dark: '#1d4ed8',
    },
    secondary: {
      main: '#06b6d4', // циан
      light: '#22d3ee',
      dark: '#0891b2',
    },
    background: {
      default: '#0f172a', // очень темный синий
      paper: '#1e293b', // темно-синий
    },
    surface: '#334155', // средний темно-синий
    text: {
      primary: '#f8fafc',
      secondary: '#cbd5e1',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 600 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 500 },
    h6: { fontWeight: 500 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#1e293b',
          border: '1px solid rgba(59, 130, 246, 0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e293b',
          border: '1px solid rgba(59, 130, 246, 0.1)',
        },
      },
    },
  },
});

// Создаем экземпляр QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 минут
      cacheTime: 10 * 60 * 1000, // 10 минут
      refetchInterval: false, // Отключаем автоматическое обновление
    },
  },
});

// Компонент для защищенных роутов
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

// Компонент для роутов только для авторизованных пользователей
const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
};

// Основные роуты приложения
const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route
        path="/admin/login"
        element={
          <AuthRoute>
            <Login />
          </AuthRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute>
            <Layout>
              <Users />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/articles"
        element={
          <ProtectedRoute>
            <Layout>
              <Articles />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/articles/new"
        element={
          <ProtectedRoute>
            <Layout>
              <ArticleEditor />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/articles/edit/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <ArticleEditor />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/domains"
        element={
          <ProtectedRoute>
            <Layout>
              <Domains />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/domain-settings"
        element={
          <ProtectedRoute>
            <Layout>
              <DomainSettings />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/parser"
        element={
          <ProtectedRoute>
            <Layout>
              <Parser />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/parser-settings"
        element={
          <ProtectedRoute>
            <Layout>
              <ParserSettings />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute>
            <Layout>
              <Settings />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/profile"
        element={
          <ProtectedRoute>
            <Layout>
              <Profile />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
          <CssBaseline />
          <AuthProvider>
            <Router>
              <AppRoutes />
            </Router>
          </AuthProvider>
          {/* {process.env.NODE_ENV === 'development' && (
            <ReactQueryDevtools initialIsOpen={false} />
          )} */}
        </LocalizationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
