import React from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import apiService from '../services/api';

const loginSchema = yup.object().shape({
  login: yup.string().required('Email или имя пользователя обязательны'),
  password: yup.string().required('Пароль обязателен'),
});

interface LoginFormData {
  login: string;
  password: string;
}

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      login: '',
      password: '',
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginFormData) => {
      const authResponse = await apiService.login(credentials);
      login(authResponse.token, authResponse.user);
      return authResponse;
    },
    onSuccess: () => {
      navigate('/dashboard');
    },
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(37, 99, 235, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(6, 182, 212, 0.3) 0%, transparent 50%)',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(45deg, transparent 40%, rgba(59, 130, 246, 0.03) 50%, transparent 60%)',
          animation: 'shimmer 3s ease-in-out infinite',
        },
        '@keyframes shimmer': {
          '0%, 100%': {
            opacity: 0.5,
          },
          '50%': {
            opacity: 1,
          },
        },
      }}
    >
      <Paper
        elevation={24}
        sx={{
          p: 6,
          width: '100%',
          maxWidth: 450,
          backgroundColor: 'rgba(30, 41, 59, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: 4,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1,
              fontSize: { xs: '2rem', sm: '2.5rem' },
            }}
          >
            🚀 BackNews
          </Typography>
          <Typography
            variant="h5"
            sx={{
              color: '#f8fafc',
              fontWeight: 600,
              mb: 1,
            }}
          >
            Admin Panel
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: '#cbd5e1',
              fontWeight: 400,
            }}
          >
            Добро пожаловать в панель управления
          </Typography>
        </Box>

        {loginMutation.isError && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#fecaca',
              '& .MuiAlert-icon': {
                color: '#ef4444',
              }
            }}
          >
            Неверные учетные данные
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Controller
              name="login"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Email или имя пользователя"
                  error={!!errors.login}
                  helperText={errors.login?.message}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(59, 130, 246, 0.05)',
                      borderRadius: 3,
                      '& fieldset': {
                        borderColor: 'rgba(59, 130, 246, 0.2)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(59, 130, 246, 0.4)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#3b82f6',
                        borderWidth: 2,
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#cbd5e1',
                      '&.Mui-focused': {
                        color: '#3b82f6',
                      },
                    },
                    '& .MuiOutlinedInput-input': {
                      color: '#f8fafc',
                    },
                  }}
                />
              )}
            />

            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Пароль"
                  type="password"
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(59, 130, 246, 0.05)',
                      borderRadius: 3,
                      '& fieldset': {
                        borderColor: 'rgba(59, 130, 246, 0.2)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(59, 130, 246, 0.4)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#3b82f6',
                        borderWidth: 2,
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#cbd5e1',
                      '&.Mui-focused': {
                        color: '#3b82f6',
                      },
                    },
                    '& .MuiOutlinedInput-input': {
                      color: '#f8fafc',
                    },
                  }}
                />
              )}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loginMutation.isPending}
              sx={{
                mt: 2,
                py: 2,
                background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
                borderRadius: 3,
                fontSize: '1.1rem',
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: '0 8px 25px rgba(59, 130, 246, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1d4ed8 0%, #0891b2 100%)',
                  boxShadow: '0 12px 35px rgba(59, 130, 246, 0.5)',
                  transform: 'translateY(-2px)',
                },
                '&:active': {
                  transform: 'translateY(0)',
                },
                '&.Mui-disabled': {
                  background: 'rgba(59, 130, 246, 0.3)',
                  color: 'rgba(255, 255, 255, 0.5)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              {loginMutation.isPending ? 'Вход...' : 'Войти'}
            </Button>
          </Box>
        </form>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            © 2024 BackNews. Система управления контентом
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}; 