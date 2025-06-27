import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Avatar,
  Grid,
  Paper,
  Divider,
  Switch,
  FormControlLabel,
  Chip,
  Alert,
} from '@mui/material';
import {
  Person,
  Edit,
  Save,
  Cancel,
  Security,
  Notifications,
  Visibility,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '../services/api';

interface ProfileFormData {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  bio: string;
  phone?: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  articleComments: boolean;
  systemUpdates: boolean;
}

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    username: user?.username || '',
    email: user?.email || '',
    firstName: '',
    lastName: '',
    bio: '',
    phone: '',
  });
  
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: false,
    articleComments: true,
    systemUpdates: true,
  });

  // Запрос профиля пользователя
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => apiService.getProfile(),
    enabled: !!user?.id,
  });

  // Мутация для обновления профиля
  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileFormData) => apiService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setIsEditing(false);
    },
  });

  const handleInputChange = (field: keyof ProfileFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleNotificationChange = (field: keyof NotificationSettings) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setNotifications(prev => ({
      ...prev,
      [field]: event.target.checked,
    }));
  };

  const handleSave = () => {
    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Восстанавливаем исходные данные
    if (profileData) {
      setFormData({
        username: profileData.username || '',
        email: profileData.email || '',
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        bio: profileData.bio || '',
        phone: profileData.phone || '',
      });
    }
  };

  React.useEffect(() => {
    if (profileData) {
      setFormData({
        username: profileData.username || '',
        email: profileData.email || '',
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        bio: profileData.bio || '',
        phone: profileData.phone || '',
      });
    }
  }, [profileData]);

  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        color: '#cbd5e1'
      }}>
        <Typography variant="h6">Загрузка профиля...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Заголовок */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ 
          fontWeight: 700,
          background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          mb: 1
        }}>
          Профиль пользователя
        </Typography>
        <Typography variant="body1" sx={{ color: '#cbd5e1' }}>
          Управление настройками вашего аккаунта
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Основная информация */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ 
            p: 3, 
            backgroundColor: '#1e293b',
            border: '1px solid rgba(59, 130, 246, 0.1)',
            borderRadius: 3,
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ 
                color: '#f8fafc',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <Person /> Основная информация
              </Typography>
              
              {!isEditing ? (
                <Button
                  startIcon={<Edit />}
                  onClick={() => setIsEditing(true)}
                  sx={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
                    color: 'white',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #1d4ed8 0%, #0891b2 100%)',
                    }
                  }}
                >
                  Редактировать
                </Button>
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    startIcon={<Save />}
                    onClick={handleSave}
                    disabled={updateProfileMutation.isPending}
                    sx={{
                      background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                      color: 'white',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #15803d 0%, #14532d 100%)',
                      }
                    }}
                  >
                    Сохранить
                  </Button>
                  <Button
                    startIcon={<Cancel />}
                    onClick={handleCancel}
                    sx={{
                      background: 'rgba(107, 114, 128, 0.8)',
                      color: 'white',
                      '&:hover': {
                        background: 'rgba(75, 85, 99, 0.9)',
                      }
                    }}
                  >
                    Отмена
                  </Button>
                </Box>
              )}
            </Box>

            {updateProfileMutation.isError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Ошибка при сохранении профиля
              </Alert>
            )}

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Имя пользователя"
                  value={formData.username}
                  onChange={handleInputChange('username')}
                  disabled={!isEditing}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: isEditing ? '#334155' : '#1e293b',
                      color: '#f8fafc',
                      '& fieldset': {
                        borderColor: 'rgba(59, 130, 246, 0.3)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(59, 130, 246, 0.5)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#3b82f6',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#cbd5e1',
                    },
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  disabled={!isEditing}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: isEditing ? '#334155' : '#1e293b',
                      color: '#f8fafc',
                      '& fieldset': {
                        borderColor: 'rgba(59, 130, 246, 0.3)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(59, 130, 246, 0.5)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#3b82f6',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#cbd5e1',
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Имя"
                  value={formData.firstName}
                  onChange={handleInputChange('firstName')}
                  disabled={!isEditing}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: isEditing ? '#334155' : '#1e293b',
                      color: '#f8fafc',
                      '& fieldset': {
                        borderColor: 'rgba(59, 130, 246, 0.3)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(59, 130, 246, 0.5)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#3b82f6',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#cbd5e1',
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Фамилия"
                  value={formData.lastName}
                  onChange={handleInputChange('lastName')}
                  disabled={!isEditing}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: isEditing ? '#334155' : '#1e293b',
                      color: '#f8fafc',
                      '& fieldset': {
                        borderColor: 'rgba(59, 130, 246, 0.3)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(59, 130, 246, 0.5)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#3b82f6',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#cbd5e1',
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Телефон"
                  value={formData.phone}
                  onChange={handleInputChange('phone')}
                  disabled={!isEditing}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: isEditing ? '#334155' : '#1e293b',
                      color: '#f8fafc',
                      '& fieldset': {
                        borderColor: 'rgba(59, 130, 246, 0.3)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(59, 130, 246, 0.5)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#3b82f6',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#cbd5e1',
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="О себе"
                  value={formData.bio}
                  onChange={handleInputChange('bio')}
                  disabled={!isEditing}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: isEditing ? '#334155' : '#1e293b',
                      color: '#f8fafc',
                      '& fieldset': {
                        borderColor: 'rgba(59, 130, 246, 0.3)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(59, 130, 246, 0.5)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#3b82f6',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#cbd5e1',
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Информация о роли и статистика */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ 
            p: 3, 
            backgroundColor: '#1e293b',
            border: '1px solid rgba(59, 130, 246, 0.1)',
            borderRadius: 3,
            mb: 3
          }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Avatar sx={{
                width: 80,
                height: 80,
                margin: '0 auto',
                background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
                fontSize: '2rem',
                mb: 2
              }}>
                {user?.username?.[0]?.toUpperCase() || 'A'}
              </Avatar>
              <Typography variant="h6" sx={{ color: '#f8fafc', fontWeight: 600 }}>
                {user?.username || 'Администратор'}
              </Typography>
              <Chip
                label="Администратор"
                sx={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  color: 'white',
                  fontWeight: 600,
                  mt: 1
                }}
              />
            </Box>

            <Divider sx={{ bgcolor: 'rgba(59, 130, 246, 0.2)', mb: 3 }} />

            <Box>
              <Typography variant="subtitle2" sx={{ color: '#cbd5e1', mb: 2 }}>
                Статистика активности
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography sx={{ color: '#94a3b8' }}>Статьи создано:</Typography>
                <Typography sx={{ color: '#f8fafc', fontWeight: 600 }}>24</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography sx={{ color: '#94a3b8' }}>Дата регистрации:</Typography>
                <Typography sx={{ color: '#f8fafc', fontWeight: 600 }}>15.03.2023</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ color: '#94a3b8' }}>Последний вход:</Typography>
                <Typography sx={{ color: '#f8fafc', fontWeight: 600 }}>Сегодня</Typography>
              </Box>
            </Box>
          </Paper>

          {/* Настройки уведомлений */}
          <Paper sx={{ 
            p: 3, 
            backgroundColor: '#1e293b',
            border: '1px solid rgba(59, 130, 246, 0.1)',
            borderRadius: 3,
          }}>
            <Typography variant="h6" sx={{ 
              color: '#f8fafc',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 3
            }}>
              <Notifications /> Уведомления
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={notifications.emailNotifications}
                    onChange={handleNotificationChange('emailNotifications')}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#3b82f6',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#3b82f6',
                      },
                    }}
                  />
                }
                label={
                  <Typography sx={{ color: '#cbd5e1' }}>
                    Email уведомления
                  </Typography>
                }
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={notifications.pushNotifications}
                    onChange={handleNotificationChange('pushNotifications')}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#3b82f6',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#3b82f6',
                      },
                    }}
                  />
                }
                label={
                  <Typography sx={{ color: '#cbd5e1' }}>
                    Push уведомления
                  </Typography>
                }
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={notifications.articleComments}
                    onChange={handleNotificationChange('articleComments')}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#3b82f6',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#3b82f6',
                      },
                    }}
                  />
                }
                label={
                  <Typography sx={{ color: '#cbd5e1' }}>
                    Комментарии к статьям
                  </Typography>
                }
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={notifications.systemUpdates}
                    onChange={handleNotificationChange('systemUpdates')}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#3b82f6',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#3b82f6',
                      },
                    }}
                  />
                }
                label={
                  <Typography sx={{ color: '#cbd5e1' }}>
                    Системные обновления
                  </Typography>
                }
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}; 