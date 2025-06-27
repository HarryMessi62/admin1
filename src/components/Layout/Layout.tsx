import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Avatar,
  useTheme,
  useMediaQuery,
  CssBaseline,
  Collapse,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  InputAdornment,
  CircularProgress,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Article as ArticleIcon,
  Domain as DomainIcon,
  Settings as SettingsIcon,
  AccountCircle as AccountCircleIcon,
  Logout as LogoutIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  RssFeed as ParserIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import apiService from '../../services/api';
import type { Article } from '../../types/api';

const drawerWidth = 280;

interface LayoutProps {
  children: React.ReactNode;
}

interface NavigationItem {
  text: string;
  icon: React.ReactElement;
  path: string;
  roles?: string[];
}

const navigationItems: NavigationItem[] = [
  {
    text: 'Дашборд',
    icon: <DashboardIcon />,
    path: '/admin/dashboard',
  },
  {
    text: 'Пользователи',
    icon: <PeopleIcon />,
    path: '/admin/users',
    roles: ['super_admin'],
  },
  {
    text: 'Статьи',
    icon: <ArticleIcon />,
    path: '/admin/articles',
  },
  {
    text: 'Домены',
    icon: <DomainIcon />,
    path: '/admin/domains',
  },
  {
    text: 'Парсер новостей',
    icon: <ParserIcon />,
    path: '/admin/parser',
    roles: ['super_admin'],
  },
  {
    text: 'Настройки',
    icon: <SettingsIcon />,
    path: '/admin/settings',
    roles: ['super_admin'],
  },
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [articlesOpen, setArticlesOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Article[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
    handleMenuClose();
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleSearchOpen = () => {
    setSearchOpen(true);
  };

  const handleSearchClose = () => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleArticleClick = (articleId: string) => {
    navigate(`/admin/articles/edit/${articleId}`);
    handleSearchClose();
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const filteredNavItems = navigationItems.filter(item => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role);
  });

  // Поиск статей с дебаунсом
  useEffect(() => {
    if (!searchQuery.trim() || !searchOpen) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setIsSearching(true);
        const isAdmin = user?.role === 'super_admin';
        const searchData = isAdmin 
          ? await apiService.getAdminArticles({ search: searchQuery, limit: 10 })
          : await apiService.getMyArticles({ search: searchQuery, limit: 10 });
        
        setSearchResults(searchData.data || []);
      } catch (error) {
        console.error('Ошибка поиска:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchOpen, user?.role]);

  // Горячая клавиша Ctrl+K для поиска
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'k') {
        event.preventDefault();
        handleSearchOpen();
      }
      if (event.key === 'Escape' && searchOpen) {
        handleSearchClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

  const drawer = (
    <Box sx={{ 
      height: '100%',
      background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
      borderRight: '1px solid rgba(59, 130, 246, 0.1)'
    }}>
      <Box sx={{ 
        p: 3,
        background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #06b6d4 100%)',
        borderBottom: '1px solid rgba(59, 130, 246, 0.2)'
      }}>
        <Typography variant="h5" sx={{ 
          fontWeight: 700,
          color: 'white',
          textAlign: 'center',
          letterSpacing: '-0.5px'
        }}>
          🚀 BackNews
        </Typography>
        <Typography variant="body2" sx={{ 
          color: 'rgba(255,255,255,0.8)',
          textAlign: 'center',
          mt: 0.5
        }}>
          Admin Panel
        </Typography>
      </Box>

      <Box sx={{ p: 2 }}>
        <List sx={{ p: 0 }}>
          {filteredNavItems.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                selected={isActive(item.path)}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  borderRadius: 3,
                  py: 1.5,
                  px: 2,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&.Mui-selected': {
                    background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #1d4ed8 0%, #0891b2 100%)',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    transform: 'translateX(4px)',
                  },
                }}
              >
                <ListItemIcon sx={{ 
                  color: isActive(item.path) ? 'white' : '#3b82f6',
                  minWidth: 40
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  sx={{ 
                    '& .MuiTypography-root': {
                      fontWeight: isActive(item.path) ? 600 : 500,
                      fontSize: '0.95rem'
                    }
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 3, borderColor: 'rgba(59, 130, 246, 0.1)' }} />

        {/* Информация о пользователе */}
        <Box sx={{ 
          p: 2, 
          borderRadius: 3,
          background: 'rgba(59, 130, 246, 0.05)',
          border: '1px solid rgba(59, 130, 246, 0.1)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Avatar sx={{ 
              width: 32, 
              height: 32, 
              mr: 1.5,
              background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)',
              fontSize: '0.9rem',
              fontWeight: 600
            }}>
              {user?.username?.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#f8fafc' }}>
                {user?.username}
              </Typography>
              <Typography variant="caption" sx={{ color: '#cbd5e1' }}>
                {user?.role === 'super_admin' ? 'Супер Админ' : 'Администратор'}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#0f172a' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(59, 130, 246, 0.1)',
          boxShadow: '0 1px 20px rgba(0, 0, 0, 0.3)',
        }}
      >
        <Toolbar sx={{ minHeight: '70px !important' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6" noWrap component="div" sx={{ 
              fontWeight: 600,
              color: '#f8fafc',
              mr: 3
            }}>
              BackNews Admin
            </Typography>
            
            {/* Функциональный поиск в header */}
            <Box 
              onClick={handleSearchOpen}
              sx={{ 
              display: { xs: 'none', sm: 'flex' },
              alignItems: 'center',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              borderRadius: 3,
              px: 2,
              py: 1,
              border: '1px solid rgba(59, 130, 246, 0.2)',
              minWidth: 300,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
              }
              }}
            >
              <SearchIcon sx={{ color: '#3b82f6', mr: 1 }} />
              <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
                Поиск статей, комментариев... (Ctrl+K)
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ 
              display: { xs: 'none', sm: 'block' },
              color: '#cbd5e1',
              fontWeight: 500
            }}>
              {user?.username}
            </Typography>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenuOpen}
              color="inherit"
            >
              <Avatar sx={{ 
                width: 40, 
                height: 40,
                background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)',
                fontWeight: 600
              }}>
                {user?.username?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
          </Box>
          
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: {
                backgroundColor: '#1e293b',
                border: '1px solid rgba(59, 130, 246, 0.1)',
                mt: 1,
                borderRadius: 2,
                minWidth: 200
              }
            }}
          >
            <MenuItem 
              onClick={() => { navigate('/admin/profile'); handleMenuClose(); }}
              sx={{
                py: 1.5,
                '&:hover': {
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                }
              }}
            >
              <ListItemIcon>
                <AccountCircleIcon fontSize="small" sx={{ color: '#3b82f6' }} />
              </ListItemIcon>
              <ListItemText sx={{ color: '#f8fafc' }}>Профиль</ListItemText>
            </MenuItem>
            <MenuItem 
              onClick={handleLogout}
              sx={{
                py: 1.5,
                '&:hover': {
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                }
              }}
            >
              <ListItemIcon>
                <LogoutIcon fontSize="small" sx={{ color: '#ef4444' }} />
              </ListItemIcon>
              <ListItemText sx={{ color: '#f8fafc' }}>Выйти</ListItemText>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              backgroundColor: '#0f172a',
              borderRight: 'none'
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              backgroundColor: '#0f172a',
              borderRight: 'none'
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: '#0f172a',
          backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(37, 99, 235, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(6, 182, 212, 0.1) 0%, transparent 50%)',
        }}
      >
        <Toolbar sx={{ minHeight: '70px !important' }} />
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      </Box>

      {/* Диалог поиска */}
      <Dialog
        open={searchOpen}
        onClose={handleSearchClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#1e293b',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: 3,
            maxHeight: '80vh',
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          pb: 1
        }}>
          <Typography variant="h6" sx={{ color: '#f8fafc', fontWeight: 600 }}>
            🔍 Поиск статей
          </Typography>
          <IconButton onClick={handleSearchClose} sx={{ color: '#94a3b8' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Введите запрос для поиска статей..."
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(59, 130, 246, 0.05)',
                borderRadius: 3,
                '& fieldset': {
                  borderColor: 'rgba(59, 130, 246, 0.2)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(59, 130, 246, 0.3)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#3b82f6',
                },
              },
              '& .MuiInputBase-input': {
                color: '#f8fafc',
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#3b82f6' }} />
                </InputAdornment>
              ),
              endAdornment: isSearching ? (
                <InputAdornment position="end">
                  <CircularProgress size={20} sx={{ color: '#3b82f6' }} />
                </InputAdornment>
              ) : null,
            }}
          />

          {/* Результаты поиска */}
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            {searchQuery && !isSearching && searchResults.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4, color: '#94a3b8' }}>
                <Typography variant="body2">
                  По запросу "{searchQuery}" ничего не найдено
                </Typography>
              </Box>
            )}

            {searchResults.map((article) => (
              <Card
                key={article._id}
                onClick={() => handleArticleClick(article._id)}
                sx={{
                  mb: 2,
                  backgroundColor: 'rgba(59, 130, 246, 0.05)',
                  border: '1px solid rgba(59, 130, 246, 0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    transform: 'translateY(-1px)',
                  }
                }}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" sx={{ 
                      color: '#f8fafc', 
                      fontWeight: 600,
                      fontSize: '1rem',
                      lineHeight: 1.3,
                      flex: 1,
                      mr: 2
                    }}>
                      {article.title}
                    </Typography>
                    <Chip
                      label={article.status === 'published' ? 'Опубликовано' : 
                            article.status === 'draft' ? 'Черновик' : 
                            article.status === 'scheduled' ? 'Запланировано' : article.status}
                      size="small"
                      color={article.status === 'published' ? 'success' : 
                             article.status === 'draft' ? 'default' : 
                             article.status === 'scheduled' ? 'info' : 'default'}
                      sx={{ flexShrink: 0 }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ 
                    color: '#94a3b8', 
                    mb: 1,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {article.excerpt || 'Нет описания'}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    {article.category && (
                      <Chip 
                        label={article.category} 
                        size="small" 
                        variant="outlined"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    )}
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      {new Date(article.createdAt).toLocaleDateString('ru-RU')}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>

          {searchQuery && (
            <Divider sx={{ mt: 2, mb: 2, borderColor: 'rgba(59, 130, 246, 0.1)' }} />
          )}
          
          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', textAlign: 'center' }}>
            💡 Совет: используйте Ctrl+K для быстрого открытия поиска
          </Typography>
        </DialogContent>
      </Dialog>
    </Box>
  );
}; 