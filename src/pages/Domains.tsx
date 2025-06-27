import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Grid,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Domain as DomainIcon,
  Language as LanguageIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { DataGrid, type GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import apiService from '../services/api';
import { type Domain } from '../types/api';

const domainSchema = yup.object().shape({
  name: yup.string().required('Название домена обязательно'),
  url: yup.string().required('URL домена обязателен').url('Введите корректный URL'),
  description: yup.string(),
  isActive: yup.boolean(),
  settings: yup.object().shape({
    commentsEnabled: yup.boolean(),
    allowFakePosts: yup.boolean(),
  }),
});

interface DomainFormData {
  name: string;
  url: string;
  description?: string;
  isActive?: boolean;
  settings: {
    commentsEnabled?: boolean;
    allowFakePosts?: boolean;
  };
}

export const Domains: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Получение доменов
  const { data: domainsData, isLoading } = useQuery({
    queryKey: ['domains', page + 1, pageSize, search],
    queryFn: () => apiService.getDomains({
      page: page + 1,
      limit: pageSize,
      search: search || undefined,
    }),
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DomainFormData>({
    resolver: yupResolver(domainSchema),
    defaultValues: {
      name: '',
      url: '',
      description: '',
      isActive: true,
      settings: {
        commentsEnabled: true,
        allowFakePosts: false,
      },
    },
  });

  // Мутации
  const createDomainMutation = useMutation({
    mutationFn: (domainData: Partial<Domain>) => apiService.createDomain(domainData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      setOpenDialog(false);
      reset();
      setSnackbar({ open: true, message: 'Домен успешно создан', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Ошибка создания домена', severity: 'error' });
    },
  });

  const updateDomainMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Domain> }) => apiService.updateDomain(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      setOpenDialog(false);
      setEditingDomain(null);
      reset();
      setSnackbar({ open: true, message: 'Домен успешно обновлен', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Ошибка обновления домена', severity: 'error' });
    },
  });

  const deleteDomainMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteDomain(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      setSnackbar({ open: true, message: 'Домен успешно удален', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Ошибка удаления домена', severity: 'error' });
    },
  });

  const handleEdit = (domain: Domain) => {
    setEditingDomain(domain);
    reset({
      name: domain.name,
      url: domain.url,
      description: domain.description,
      isActive: domain.isActive,
      settings: domain.settings,
    });
    setOpenDialog(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этот домен?')) {
      deleteDomainMutation.mutate(id);
    }
  };

  const handleVisit = (url: string) => {
    window.open(url, '_blank');
  };

  const onSubmit = (data: DomainFormData) => {
    if (editingDomain) {
      updateDomainMutation.mutate({ id: editingDomain._id, data });
    } else {
      createDomainMutation.mutate(data);
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Домен',
      width: 250,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, height: '52px' }}>
          <DomainIcon color="primary" />
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              {params.value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {params.row.title}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: 'isActive',
      headerName: 'Статус',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Активен' : 'Неактивен'}
          color={params.value ? 'success' : 'error'}
          size="small"
        />
      ),
    },
    {
      field: 'stats.totalArticles',
      headerName: 'Статьи',
      width: 100,
      renderCell: (params) => params.row.stats?.totalArticles || 0,
    },
    {
      field: 'stats.totalViews',
      headerName: 'Просмотры',
      width: 120,
      renderCell: (params) => (params.row.stats?.totalViews || 0).toLocaleString(),
    },
    {
      field: 'settings.enableSeo',
      headerName: 'SEO',
      width: 80,
      renderCell: (params) => (
        <Chip
          label={params.row.settings?.enableSeo ? 'Вкл' : 'Выкл'}
          color={params.row.settings?.enableSeo ? 'success' : 'default'}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'settings.indexBySearchEngines',
      headerName: 'Индексация',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.row.settings?.indexBySearchEngines ? 'Да' : 'Нет'}
          color={params.row.settings?.indexBySearchEngines ? 'success' : 'warning'}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Создан',
      width: 120,
      renderCell: (params) => new Date(params.value).toLocaleDateString('ru-RU'),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Действия',
      width: 150,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<VisibilityIcon />}
          label="Открыть"
          onClick={() => handleVisit(params.row.name)}
        />,
        <GridActionsCellItem
          icon={<EditIcon />}
          label="Редактировать"
          onClick={() => handleEdit(params.row)}
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
          🌐 Управление доменами
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingDomain(null);
            reset();
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
          Добавить домен
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <TextField
          label="🔍 Поиск доменов"
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
          rows={domainsData?.data || []}
          columns={columns}
          loading={isLoading}
          paginationMode="server"
          rowCount={domainsData?.pagination?.total || 0}
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

      {/* Диалог создания/редактирования домена */}
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
          {editingDomain ? '✏️ Редактировать домен' : '➕ Создать домен'}
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent sx={{ backgroundColor: '#1e293b' }}>
            <Grid container spacing={3} sx={{ pt: 1 }}>
              {/* Основная информация */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ color: '#f8fafc', fontWeight: 600 }}>
                  📋 Информация о домене
                </Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
                  {editingDomain ? 'Редактирование настроек домена' : 'Создание нового домена'}
                </Typography>
              </Grid>
              
              {!editingDomain && (
                <>
                  <Grid item xs={12}>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Название домена"
                      placeholder="Мой крипто сайт"
                      error={!!errors.name}
                      helperText={errors.name?.message}
                      fullWidth
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'rgba(59, 130, 246, 0.05)',
                          borderRadius: 2,
                              color: '#f8fafc',
                            },
                            '& .MuiInputLabel-root': {
                              color: '#cbd5e1',
                            },
                      }}
                    />
                  )}
                />
              </Grid>

                  <Grid item xs={12}>
                <Controller
                  name="url"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="URL домена"
                      placeholder="https://example.com"
                      error={!!errors.url}
                      helperText={errors.url?.message}
                      fullWidth
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: 'rgba(59, 130, 246, 0.05)',
                              borderRadius: 2,
                              color: '#f8fafc',
                            },
                            '& .MuiInputLabel-root': {
                              color: '#cbd5e1',
                            },
                          }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Описание"
                      multiline
                      rows={3}
                      fullWidth
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: 'rgba(59, 130, 246, 0.05)',
                              borderRadius: 2,
                              color: '#f8fafc',
                            },
                            '& .MuiInputLabel-root': {
                              color: '#cbd5e1',
                            },
                          }}
                    />
                  )}
                />
              </Grid>
                </>
                  )}

              {editingDomain && (
              <Grid item xs={12}>
                  <Box sx={{ 
                    p: 2, 
                    backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                    borderRadius: 2,
                    border: '1px solid rgba(59, 130, 246, 0.2)'
                  }}>
                    <Typography variant="body1" sx={{ color: '#f8fafc', fontWeight: 600 }}>
                      {editingDomain.name}
                </Typography>
                    <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
                      {editingDomain.url}
                </Typography>
                  </Box>
              </Grid>
              )}

              {/* Настройки */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2, color: '#f8fafc', fontWeight: 600 }}>
                  ⚙️ Настройки домена
                </Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
                  Управление функциональностью домена
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="settings.commentsEnabled"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch 
                          {...field} 
                          checked={field.value} 
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
                        <Box>
                          <Typography sx={{ color: '#f8fafc', fontWeight: 600 }}>
                            💬 Разрешить комментарии
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                            Пользователи смогут оставлять комментарии к статьям
                          </Typography>
                        </Box>
                      }
                      sx={{ width: '100%', m: 0 }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="settings.allowFakePosts"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch 
                          {...field} 
                          checked={field.value} 
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
                        <Box>
                          <Typography sx={{ color: '#f8fafc', fontWeight: 600 }}>
                            🎭 Разрешить фейк посты
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                            Разрешить создание постов с искусственными статистиками
                          </Typography>
                        </Box>
                      }
                      sx={{ width: '100%', m: 0 }}
                    />
                  )}
                />
              </Grid>

              {!editingDomain && (
              <Grid item xs={12}>
                <Controller
                    name="isActive"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                        control={
                          <Switch 
                            {...field} 
                            checked={field.value}
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
                          <Box>
                            <Typography sx={{ color: '#f8fafc', fontWeight: 600 }}>
                              ✅ Активный домен
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                              Домен будет доступен для публикации статей
                            </Typography>
                          </Box>
                        }
                        sx={{ width: '100%', m: 0 }}
                    />
                  )}
                />
              </Grid>
              )}
            </Grid>
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
              disabled={createDomainMutation.isPending || updateDomainMutation.isPending}
              sx={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1d4ed8 0%, #0891b2 100%)',
                }
              }}
            >
              {editingDomain ? 'Обновить' : 'Создать'}
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