import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { type User, type LoginRequest } from '../types/api';
import apiService from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        if (token) {
          // Сначала пробуем загрузить из localStorage
          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser);
              setUser(parsedUser);
              setIsLoading(false); // Устанавливаем загрузку завершенной сразу
              
              // Добавляем задержку перед запросом к серверу
              setTimeout(async () => {
                try {
                  const currentUser = await apiService.getCurrentUser();
                  setUser(currentUser);
                  localStorage.setItem('user', JSON.stringify(currentUser));
                } catch (error) {
                  console.error('Failed to refresh user data:', error);
                  // Если не удалось получить с сервера, используем сохраненного пользователя
                }
              }, 1000); // Задержка 1 секунда
              
              return; // Выходим, чтобы не делать немедленный запрос
            } catch (e) {
              console.error('Error parsing stored user:', e);
            }
          }
          
          // Только если нет сохраненного пользователя, делаем запрос сразу
          try {
            const currentUser = await apiService.getCurrentUser();
            setUser(currentUser);
            localStorage.setItem('user', JSON.stringify(currentUser));
          } catch (error) {
            console.error('Failed to get current user from server:', error);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (token: string, user: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isLoading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 