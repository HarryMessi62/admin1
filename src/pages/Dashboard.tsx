import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  Paper,
  Divider,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  People,
  Article,
  Domain,
  Visibility,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import { type DashboardData } from '../types/api';
import { useAuth } from '../hooks/useAuth';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactElement;
  gradient: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, change, icon, gradient }) => {
  const isPositive = change !== undefined && change >= 0;
  
  return (
    <Card sx={{
      background: gradient,
      color: 'white',
      borderRadius: 4,
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
      }
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" sx={{ 
              opacity: 0.8, 
              fontWeight: 500,
              mb: 1,
              fontSize: '0.85rem'
            }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ 
              fontWeight: 700,
              mb: 1,
              fontSize: '2.2rem'
            }}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </Typography>
            {change !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {isPositive ? <TrendingUp fontSize="small" /> : <TrendingDown fontSize="small" />}
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {isPositive ? '+' : ''}{change}%
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar sx={{
            bgcolor: 'rgba(255, 255, 255, 0.2)',
            width: 56,
            height: 56,
            backdropFilter: 'blur(10px)',
          }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
};

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Функция для получения русского названия статуса
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'published': return 'Опубликовано';
      case 'draft': return 'Черновик';
      case 'scheduled': return 'Запланировано';
      case 'archived': return 'В архиве';
      default: return 'Неизвестно';
    }
  };

  // Функция для получения цвета статуса
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': 
        return 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
      case 'draft': 
        return 'rgba(107, 114, 128, 0.8)';
      case 'scheduled': 
        return 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
      case 'archived': 
        return 'rgba(156, 163, 175, 0.8)';
      default: 
        return 'rgba(107, 114, 128, 0.8)';
    }
  };

  // Функция для преобразования данных статистики просмотров
  const formatMonthlyStats = (monthlyStats: any) => {
    if (!monthlyStats) return [];
  
    const monthNames = [
      'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн',
      'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'
    ];
  
    if (isSuperAdmin) {
      // Логика для супер админа (группировка по месяцам)
      const last12Months = [];
      const currentDate = new Date();
      
      for (let i = 11; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthData = monthlyStats?.find((stat: any) => 
          stat._id.year === date.getFullYear() && 
          stat._id.month === date.getMonth() + 1
        );
        
        last12Months.push({
          name: monthNames[date.getMonth()],
          views: monthData?.views || 0
        });
      }
      
      return last12Months;
    } else {
      // Логика для обычного пользователя (группировка по дням)
      // Группируем данные по неделям для лучшего отображения
      const weeklyData: { [key: string]: number } = {};
      
      monthlyStats.forEach((stat: any) => {
        const date = new Date(stat._id.year, stat._id.month - 1, stat._id.day);
        const weekKey = `${stat._id.month}/${Math.ceil(stat._id.day / 7)}`;
        const weekName = `${monthNames[stat._id.month - 1]} н.${Math.ceil(stat._id.day / 7)}`;
        
        if (!weeklyData[weekName]) {
          weeklyData[weekName] = 0;
        }
        weeklyData[weekName] += stat.views || 0;
      });
  
      return Object.entries(weeklyData).map(([name, views]) => ({
        name,
        views
      })).slice(-8); // Показываем последние 8 недель
    }
  };

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => {
      // Проверяем роль пользователя и вызываем соответствующий endpoint
      if (user?.role === 'super_admin') {
        return apiService.getDashboard();
      } else {
        return apiService.getUserDashboard();
      }
    },
  });

  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        color: '#cbd5e1'
      }}>
        <Typography variant="h6">Загрузка дашборда...</Typography>
      </Box>
    );
  }

  if (!dashboardData) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="error">
          Ошибка загрузки данных дашборда
        </Typography>
      </Box>
    );
  }

  const { overview } = dashboardData || { overview: {} as any };

  // Определяем является ли пользователь супер админом
  const isSuperAdmin = user?.role === 'super_admin';
  
  // Адаптируем данные в зависимости от роли
  const adaptedOverview = isSuperAdmin 
    ? overview 
    : {
        totalUsers: overview.totalArticles || 0,  // Для обычного пользователя показываем его статьи
        totalArticles: overview.totalArticles || 0,
        activeDomains: overview.user?.allowedDomains || 0,  // Количество разрешенных доменов
        todayViews: overview.totalViews || 0,  // Общие просмотры пользователя
      };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ 
          fontWeight: 700,
          background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          mb: 1
        }}>
          {isSuperAdmin ? 'Добро пожаловать в админ панель!' : 'Добро пожаловать!'}
        </Typography>
        <Typography variant="body1" sx={{ color: '#cbd5e1' }}>
          {isSuperAdmin ? 'Управляйте контентом вашего новостного сайта' : 'Управляйте вашими статьями'}
        </Typography>
      </Box>

      {/* Статистические карточки */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          lg: 'repeat(4, 1fr)'
        },
        gap: 3,
        mb: 4
      }}>
        <Box>
          <StatsCard
            title={isSuperAdmin ? "Всего пользователей" : "Всего статей"}
            value={adaptedOverview.totalUsers}
            change={12}
            icon={isSuperAdmin ? <People /> : <Article />}
            gradient="linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)"
          />
        </Box>
        <Box>
          <StatsCard
            title={isSuperAdmin ? "Всего статей" : "Опубликованных"}
            value={isSuperAdmin ? adaptedOverview.totalArticles : overview.publishedArticles || 0}
            change={8}
            icon={<Article />}
            gradient="linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)"
          />
        </Box>
        <Box>
          <StatsCard
            title={isSuperAdmin ? "Активных доменов" : "Доступных доменов"}
            value={adaptedOverview.activeDomains}
            change={3}
            icon={<Domain />}
            gradient="linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
          />
        </Box>
        <Box>
          <StatsCard
            title={isSuperAdmin ? "Просмотры сегодня" : "Общие просмотры"}
            value={adaptedOverview.todayViews}
            change={15}
            icon={<Visibility />}
            gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
          />
        </Box>
      </Box>

      {/* Быстрые действия */}
      <Typography variant="h5" sx={{ 
        color: '#f8fafc',
        fontWeight: 600,
        mb: 2,
        mt: 4
      }}>
        Быстрые действия
      </Typography>
      
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          md: 'repeat(3, 1fr)'
        },
        gap: 3,
        mb: 4
      }}>
        <Box>
          <Paper 
            onClick={() => navigate('/articles/new')}
            sx={{ 
              p: 3, 
              backgroundColor: '#1e293b',
              border: '1px solid rgba(59, 130, 246, 0.1)',
              borderRadius: 3,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.3)'
              }
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <Avatar sx={{
                bgcolor: 'transparent',
                background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
                width: 56,
                height: 56,
                mx: 'auto',
                mb: 2
              }}>
                <Typography sx={{ fontSize: '1.5rem' }}>➕</Typography>
              </Avatar>
              <Typography variant="h6" sx={{ color: '#f8fafc', fontWeight: 600, mb: 1 }}>
                Создать статью
              </Typography>
              <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
                Напишите новую статью
              </Typography>
            </Box>
          </Paper>
        </Box>
        
        <Box>
          <Paper 
            onClick={() => navigate('/articles')}
            sx={{ 
              p: 3, 
              backgroundColor: '#1e293b',
              border: '1px solid rgba(34, 197, 94, 0.1)',
              borderRadius: 3,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.3)'
              }
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <Avatar sx={{
                bgcolor: 'transparent',
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                width: 56,
                height: 56,
                mx: 'auto',
                mb: 2
              }}>
                <Typography sx={{ fontSize: '1.5rem' }}>📄</Typography>
              </Avatar>
              <Typography variant="h6" sx={{ color: '#f8fafc', fontWeight: 600, mb: 1 }}>
                Управление статьями
              </Typography>
              <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
                Просмотреть все статьи
              </Typography>
            </Box>
          </Paper>
        </Box>
        
        <Box>
          <Paper 
            onClick={() => navigate('/settings')}
            sx={{ 
              p: 3, 
              backgroundColor: '#1e293b',
              border: '1px solid rgba(168, 85, 247, 0.1)',
              borderRadius: 3,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(168, 85, 247, 0.15)',
                border: '1px solid rgba(168, 85, 247, 0.3)'
              }
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <Avatar sx={{
                bgcolor: 'transparent',
                background: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
                width: 56,
                height: 56,
                mx: 'auto',
                mb: 2
              }}>
              <Typography sx={{ fontSize: '1.5rem' }}>⚙️</Typography>
              </Avatar>
              <Typography variant="h6" sx={{ color: '#f8fafc', fontWeight: 600, mb: 1 }}>
                Настройки
              </Typography>
              <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
                Настроить параметры сайта
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* Последние статьи и Статистика */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          md: '1fr 1fr'
        },
        gap: 3
      }}>
        <Box>
          <Paper sx={{ 
            p: 3, 
            backgroundColor: '#1e293b',
            border: '1px solid rgba(59, 130, 246, 0.1)',
            borderRadius: 3,
            height: 500
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ 
                color: '#f8fafc',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                📰 Последние статьи
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#3b82f6', 
                  cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' }
                }}
                onClick={() => navigate('/articles')}
              >
                Посмотреть все
              </Typography>
            </Box>
            
            <List sx={{ 
              p: 0, 
              maxHeight: 400, 
              overflowY: 'auto',
              overflowX: 'hidden',
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '10px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
                borderRadius: '10px',
                '&:hover': {
                  background: 'linear-gradient(135deg, #2563eb 0%, #0891b2 100%)',
                }
              },
              '&::-webkit-scrollbar-thumb:active': {
                background: 'linear-gradient(135deg, #1d4ed8 0%, #0e7490 100%)',
              },
              // Для Firefox
              scrollbarWidth: 'thin',
              scrollbarColor: '#3b82f6 rgba(59, 130, 246, 0.1)',
              // Плавная прокрутка
              scrollBehavior: 'smooth',
            }}>
              {/* Реальные данные последних статей */}
              {isLoading ? (
                // Скелетон загрузки
                Array.from({ length: 3 }).map((_, index) => (
                  <ListItem key={`skeleton-${index}`} sx={{ px: 0, py: 2 }}>
                    <ListItemText
                      primary={
                        <Box sx={{ 
                          height: 20, 
                          backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                          borderRadius: 1,
                          animation: 'pulse 1.5s ease-in-out infinite',
                          '@keyframes pulse': {
                            '0%': {
                              opacity: 0.4,
                            },
                            '50%': {
                              opacity: 0.8,
                            },
                            '100%': {
                              opacity: 0.4,
                            },
                          }
                        }} />
                      }
                      secondary={
                        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                          <Box sx={{ 
                            height: 12, 
                            width: 80,
                            backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                            borderRadius: 1,
                            animation: 'pulse 1.5s ease-in-out infinite',
                          }} />
                          <Box sx={{ 
                            height: 12, 
                            width: 100,
                            backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                            borderRadius: 1,
                            animation: 'pulse 1.5s ease-in-out infinite',
                          }} />
                        </Box>
                      }
                    />
                  </ListItem>
                ))
              ) : (dashboardData?.recentArticles || []).length === 0 ? (
                // Пустое состояние
                <Box sx={{ 
                  textAlign: 'center', 
                  py: 4,
                  color: '#cbd5e1' 
                }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    📝 Пока нет статей
                  </Typography>
                  <Typography variant="caption">
                    Начните создавать контент!
                  </Typography>
                </Box>
              ) : (dashboardData.recentArticles || []).map((article, index) => (
                <ListItem 
                  key={index} 
                  sx={{ 
                    px: 0, 
                    py: 2, 
                    borderBottom: '1px solid rgba(59, 130, 246, 0.1)',
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'rgba(59, 130, 246, 0.05)',
                      transform: 'translateX(4px)',
                      boxShadow: '0 2px 8px rgba(59, 130, 246, 0.1)',
                    },
                    '&:last-child': {
                      borderBottom: 'none',
                    }
                  }}
                  onClick={() => navigate('/articles')}
                >
                  <ListItemText
                    primary={
                      <Typography sx={{ color: '#f8fafc', fontWeight: 600, mb: 0.5 }}>
                        {article.title}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Typography sx={{ color: '#cbd5e1', fontSize: '0.8rem' }}>
                          {new Date(article.publishedAt || article.createdAt).toLocaleDateString('ru-RU')}
                        </Typography>
                        <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(59, 130, 246, 0.2)' }} />
                        <Typography sx={{ color: '#cbd5e1', fontSize: '0.8rem' }}>
                        {(article?.stats?.views?.total || 0).toLocaleString()} просмотров 
                        </Typography>
                        <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(59, 130, 246, 0.2)' }} />
                        <Typography sx={{ color: '#cbd5e1', fontSize: '0.8rem' }}>
                        {article?.stats?.comments?.total || 0} комментариев
                        </Typography>
                      </Box>
                    }
                  />
                  <Chip
                    label={getStatusLabel(article.status)}
                    size="small"
                    sx={{
                      background: getStatusColor(article.status),
                      color: 'white',
                      fontWeight: 600,
                      border: 'none'
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Box>

        <Box sx={{ width: '100%' }}>
          <Paper sx={{ 
            p: 3, 
            backgroundColor: '#1e293b',
            border: '1px solid rgba(59, 130, 246, 0.1)',
            borderRadius: 3,
            height: 500
          }}>
            <Typography variant="h6" sx={{ 
              mb: 3, 
              color: '#f8fafc',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              📊 Статистика просмотров
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
            <BarChart data={formatMonthlyStats(isSuperAdmin ? dashboardData.monthlyViewsStats : dashboardData.monthlyStats)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(59, 130, 246, 0.1)" />
                <XAxis dataKey="name" stroke="#cbd5e1" />
                <YAxis stroke="#cbd5e1" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#334155', 
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: 8,
                    color: '#f8fafc'
                  }} 
                />
                <Bar 
                  dataKey="views" 
                  fill="url(#viewsGradient)"
                  radius={[4, 4, 0, 0]}
                  name="Просмотры"
                />
                <defs>
                  <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}; 