import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  IconButton,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { DataGrid, type GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import apiService from '../services/api';
import { type User, type RegisterRequest, type Domain } from '../types/api';
import { useAuth } from '../hooks/useAuth';

const userSchema = yup.object().shape({
  username: yup.string().required('Имя пользователя обязательно').min(3, 'Минимум 3 символа'),
  email: yup.string().email('Некорректный email').required('Email обязателен'),
  password: yup.string().min(6, 'Минимум 6 символов'),
  restrictions: yup.object().shape({
    maxArticles: yup.number().min(1, 'Минимум 1').required('Обязательно'),
    canDelete: yup.boolean(),
    canEdit: yup.boolean(),
    allowedDomains: yup.array().of(yup.string()),
  }),
  profile: yup.object().shape({
    description: yup.string(),
  }),
});

interface UserFormData extends Omit<RegisterRequest, 'password'> {
  password?: string;
}

export const Users: React.FC = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Получение пользователей
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users', page + 1, pageSize, search],
    queryFn: () => apiService.getUsers({
      page: page + 1,
      limit: pageSize,
      search: search || undefined,
    }),
  });

  // Получение доменов для формы
  const { data: domainsData } = useQuery({
    queryKey: ['domains'],
    queryFn: () => apiService.getDomains({ limit: 1000 }),
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: yupResolver(userSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      restrictions: {
        maxArticles: 100,
        canDelete: true,
        canEdit: true,
        allowedDomains: [],
      },
      profile: {
        description: '',
      },
    },
  });

  // Мутации
  const createUserMutation = useMutation({
    mutationFn: (userData: RegisterRequest) => apiService.createUser(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setOpenDialog(false);
      reset();
      setSnackbar({ open: true, message: 'Пользователь успешно создан', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Ошибка создания пользователя', severity: 'error' });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) => apiService.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setOpenDialog(false);
      setEditingUser(null);
      reset();
      setSnackbar({ open: true, message: 'Пользователь успешно обновлен', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Ошибка обновления пользователя', severity: 'error' });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setSnackbar({ open: true, message: 'Пользователь успешно удален', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Ошибка удаления пользователя', severity: 'error' });
    },
  });

  const toggleUserMutation = useMutation({
    mutationFn: (id: string) => apiService.toggleUserActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setSnackbar({ open: true, message: 'Статус пользователя изменен', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Ошибка изменения статуса', severity: 'error' });
    },
  });

  const handleEdit = (user: User) => {
    setEditingUser(user);
    reset({
      username: user.username,
      email: user.email,
      restrictions: {
        ...user.restrictions,
        allowedDomains: user.restrictions?.allowedDomains?.map(domain => 
          typeof domain === 'string' ? domain : domain._id
        ) || []
      },
      profile: user.profile,
    });
    setOpenDialog(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      deleteUserMutation.mutate(id);
    }
  };

  const handleToggleActive = (id: string) => {
    toggleUserMutation.mutate(id);
  };

  const onSubmit = (data: UserFormData) => {
    if (editingUser) {
      const updateData = { ...data };
      if (!updateData.password) {
        delete updateData.password;
      }
      updateUserMutation.mutate({ id: editingUser._id, data: updateData });
    } else {
      if (!data.password) {
        setSnackbar({ open: true, message: 'Пароль обязателен для нового пользователя', severity: 'error' });
        return;
      }
      createUserMutation.mutate(data as RegisterRequest);
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'avatar',
      headerName: '',
      width: 60,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          width: '100%',
          height: '100%'
        }}>
          <Avatar sx={{ 
            width: 32, 
            height: 32,
            background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
            fontSize: '1rem',
            fontWeight: 600
          }}>
          {params.row.username.charAt(0).toUpperCase()}
        </Avatar>
        </Box>
      ),
    },
    { field: 'username', headerName: 'Пользователь', width: 150 },
    { field: 'email', headerName: 'Email', width: 200 },
    {
      field: 'isActive',
      headerName: 'Статус',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Активен' : 'Заблокирован'}
          color={params.value ? 'success' : 'error'}
          size="small"
        />
      ),
    },
    {
      field: 'articleCount',
      headerName: 'Статьи',
      width: 100,
      renderCell: (params) => params.value || 0,
    },
    {
      field: 'restrictions.maxArticles',
      headerName: 'Лимит',
      width: 100,
      renderCell: (params) => params.row.restrictions?.maxArticles || 0,
    },
    {
      field: 'stats.lastLogin',
      headerName: 'Последний вход',
      width: 150,
      renderCell: (params) => {
        const lastLogin = params.row.stats?.lastLogin;
        return lastLogin ? new Date(lastLogin).toLocaleDateString('ru-RU') : 'Никогда';
      },
    },
    {
      field: 'createdAt',
      headerName: 'Создан',
      width: 120,
      renderCell: (params) => new Date(params.value).toLocaleDateString('ru-RU'),
    },
    {
      field: 'restrictions.allowedDomains',
      headerName: 'Разрешенные домены',
      width: 200,
      renderCell: (params) => {
        const domains = params.row.restrictions?.allowedDomains || [];
        return (
          <Box sx={{ 
            display: 'flex', 
            gap: 0.5, 
            flexWrap: 'wrap',
            width: '100%',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            py: 0.5
          }}>
            {domains.map((domain: any) => (
              <Chip
                key={typeof domain === 'string' ? domain : domain._id}
                label={typeof domain === 'string' ? domain : domain.name}
                size="small"
                sx={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  color: '#3b82f6',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  height: 24,
                  '& .MuiChip-label': {
                    px: 1,
                    fontSize: '0.75rem',
                    fontWeight: 500
                  },
                  '&:hover': {
                    background: 'rgba(59, 130, 246, 0.15)',
                  }
                }}
              />
            ))}
          </Box>
        );
      },
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Действия',
      width: 150,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<EditIcon />}
          label="Редактировать"
          onClick={() => handleEdit(params.row)}
        />,
        <GridActionsCellItem
          icon={params.row.isActive ? <BlockIcon /> : <CheckCircleIcon />}
          label={params.row.isActive ? 'Заблокировать' : 'Активировать'}
          onClick={() => handleToggleActive(params.row._id)}
        />,
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Удалить"
          onClick={() => handleDelete(params.row._id)}
          showInMenu
        />,
      ],
    },
  ];

  if (currentUser?.role !== 'super_admin') {
    return (
      <Alert severity="error">
        У вас нет прав доступа к этой странице
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{
          fontWeight: 700,
          background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          👥 Управление пользователями
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingUser(null);
            reset({
              username: '',
              email: '',
              password: '',
              restrictions: {
                maxArticles: 100,
                canDelete: true,
                canEdit: true,
                allowedDomains: [],
              },
              profile: {
                description: '',
              },
            });
            setOpenDialog(true);
          }}
          sx={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
            borderRadius: 3,
            px: 3,
            py: 1.5,
            fontWeight: 600,
            textTransform: 'none',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #1d4ed8 0%, #0891b2 100%)',
              boxShadow: '0 6px 16px rgba(59, 130, 246, 0.4)',
            }
          }}
        >
          Добавить пользователя
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <TextField
          label="🔍 Поиск пользователей"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ 
            minWidth: 400,
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'rgba(59, 130, 246, 0.05)',
              borderRadius: 3,
              '&:hover': {
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
              },
              '&.Mui-focused': {
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
              }
            }
          }}
        />
      </Box>

      <Paper sx={{ 
        height: 600, 
        width: '100%',
        backgroundColor: '#1e293b',
        border: '1px solid rgba(59, 130, 246, 0.1)',
        borderRadius: 3,
        overflow: 'hidden'
      }}>
        <DataGrid
          rows={usersData?.data.users || []}
          columns={columns}
          loading={isLoading}
          paginationMode="server"
          rowCount={usersData?.data.pagination?.total || 0}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          rowsPerPageOptions={[5, 10, 25, 50]}
          getRowId={(row) => row._id}
          sx={{
            '& .MuiDataGrid-root': {
              backgroundColor: '#1e293b',
            },
            '& .MuiDataGrid-cell': {
              borderColor: 'rgba(59, 130, 246, 0.1)',
              color: '#f8fafc',
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#334155',
              borderColor: 'rgba(59, 130, 246, 0.1)',
              color: '#f8fafc',
              fontWeight: 600,
            },
            '& .MuiDataGrid-row': {
              '&:hover': {
                backgroundColor: 'rgba(59, 130, 246, 0.05)',
              },
              '&.Mui-selected': {
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
              }
            },
            '& .MuiDataGrid-footerContainer': {
              backgroundColor: '#334155',
              borderColor: 'rgba(59, 130, 246, 0.1)',
              color: '#f8fafc',
            }
          }}
        />
      </Paper>

      {/* Диалог создания/редактирования пользователя */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#1e293b',
            border: '1px solid rgba(59, 130, 246, 0.1)',
            borderRadius: 3,
          }
        }}
      >
        <DialogTitle sx={{ 
          color: '#f8fafc',
          fontWeight: 600,
          borderBottom: '1px solid rgba(59, 130, 246, 0.1)',
          pb: 2
        }}>
          {editingUser ? '✏️ Редактировать пользователя' : '➕ Создать пользователя'}
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent sx={{ backgroundColor: '#1e293b' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <Controller
                name="username"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Имя пользователя"
                    error={!!errors.username}
                    helperText={errors.username?.message}
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(59, 130, 246, 0.05)',
                        borderRadius: 2,
                      }
                    }}
                  />
                )}
              />

              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Email"
                    type="email"
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    fullWidth
                  />
                )}
              />

              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={editingUser ? 'Новый пароль (оставьте пустым, чтобы не менять)' : 'Пароль'}
                    type="password"
                    error={!!errors.password}
                    helperText={errors.password?.message}
                    fullWidth
                  />
                )}
              />

              <Controller
                name="restrictions.maxArticles"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Максимум статей"
                    type="number"
                    error={!!errors.restrictions?.maxArticles}
                    helperText={errors.restrictions?.maxArticles?.message}
                    fullWidth
                  />
                )}
              />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Controller
                  name="restrictions.canEdit"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch {...field} checked={field.value} />}
                      label="Может редактировать"
                    />
                  )}
                />

                <Controller
                  name="restrictions.canDelete"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch {...field} checked={field.value} />}
                      label="Может удалять"
                    />
                  )}
                />
              </Box>

              <Controller
                name="restrictions.allowedDomains"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Разрешенные домены</InputLabel>
                    <Select
                      {...field}
                      multiple
                      value={field.value || []}
                      label="Разрешенные домены"
                    >
                      {domainsData?.data.map((domain: Domain) => (
                        <MenuItem key={domain._id} value={domain._id}>
                          {domain.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />

              <Controller
                name="profile.description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Описание"
                    multiline
                    rows={3}
                    fullWidth
                  />
                )}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ backgroundColor: '#1e293b', borderTop: '1px solid rgba(59, 130, 246, 0.1)' }}>
            <Button 
              onClick={() => setOpenDialog(false)}
              sx={{ color: '#cbd5e1' }}
            >
              Отмена
            </Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={createUserMutation.isPending || updateUserMutation.isPending}
              sx={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1d4ed8 0%, #0891b2 100%)',
                }
              }}
            >
              {editingUser ? 'Обновить' : 'Создать'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}; 