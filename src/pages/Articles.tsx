import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Avatar,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Alert,
  Button,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { DataGrid, type GridColDef, GridActionsCellItem, type GridPaginationModel } from '@mui/x-data-grid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import { type Article, type User } from '../types/api';
import { useAuth } from '../hooks/useAuth';

export const Articles: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Дебаунс для поиска
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0); // Сбрасываем на первую страницу при поиске
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  // Определяем, какие статьи загружать в зависимости от роли
  const isAdmin = user?.role === 'super_admin';
  
  const { data: articlesData, isLoading } = useQuery({
    queryKey: ['articles', page + 1, pageSize, debouncedSearch, statusFilter, categoryFilter, isAdmin],
    queryFn: () => {
      const params = {
        page: page + 1,
        limit: pageSize,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
      };

      // super_admin видит все статьи, user_admin только свои
      return isAdmin 
        ? apiService.getAdminArticles(params)
        : apiService.getMyArticles(params);
    },
  });

  // Добавляем отладочную информацию
  console.log('Articles Data:', articlesData);
  console.log('Is Admin:', isAdmin);
  console.log('Current Page:', page + 1);
  console.log('Page Size:', pageSize);

  const deleteArticleMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteArticle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Вы уверены, что хотите удалить эту статью?')) {
      deleteArticleMutation.mutate(id);
    }
  };

  const handleView = (slug: string) => {
    window.open(`/article/${slug}`, '_blank');
  };

  const handleEdit = (id: string) => {
    navigate(`/admin/articles/edit/${id}`);
  };

  const getStatusColor = (status: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (status) {
      case 'published':
        return 'success';
      case 'draft':
        return 'default';
      case 'scheduled':
        return 'info';
      case 'archived':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'published':
        return 'Опубликовано';
      case 'draft':
        return 'Черновик';
      case 'scheduled':
        return 'Запланировано';
      case 'archived':
        return 'Архив';
      default:
        return status;
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'imageUrl',
      headerName: '',
      width: 80,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
        <Avatar
            src={params.row.media?.featuredImage?.url}
          sx={{ width: 40, height: 40 }}
          variant="rounded"
        >
          📄
        </Avatar>
        </Box>
      ),
    },
    { 
      field: 'title', 
      headerName: 'Заголовок', 
      width: 300,
      renderCell: (params) => (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'flex-start',
          width: '100%',
          py: 1
        }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#f8fafc' }}>
            {params.value}
          </Typography>
          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
            {params.row.excerpt || ''}
          </Typography>
        </Box>
      ),
    },
    ...(isAdmin ? [{
      field: 'author',
      headerName: 'Автор',
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          {params.row.author?.username || 'Неизвестно'}
        </Box>
      ),
    }] : []),
    {
      field: 'status',
      headerName: 'Статус',
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
        <Chip
          label={getStatusLabel(params.value)}
          color={getStatusColor(params.value)}
          size="small"
        />
        </Box>
      ),
    },
    {
      field: 'category',
      headerName: 'Категория',
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          {params.value}
        </Box>
      ),
    },
    {
      field: 'domain',
      headerName: 'Домен',
      width: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          {typeof params.value === 'object' ? params.value.name : 'Не указан'}
        </Box>
      ),
    },
    {
      field: 'views',
      headerName: 'Просмотры',
      width: 100,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          {(params.row.stats?.views?.total || 0).toLocaleString()}
          </Box>
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Дата создания',
      width: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          {new Date(params.value).toLocaleDateString('ru-RU')}
        </Box>
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Действия',
      width: 120,
      getActions: (params) => {
        const actions = [
          <GridActionsCellItem
            icon={<VisibilityIcon />}
            label="Просмотр"
            onClick={() => handleView(params.row.slug)}
          />,
        ];

        const canEdit = isAdmin || (user?._id === params.row.author?._id && user?.restrictions?.canEdit);
        if (canEdit) {
          actions.push(
            <GridActionsCellItem
              icon={<EditIcon />}
              label="Редактировать"
              onClick={() => handleEdit(params.row._id)}
            />
          );
        }

        const canDelete = isAdmin || (user?._id === params.row.author?._id && user?.restrictions?.canDelete);
        if (canDelete) {
          actions.push(
            <GridActionsCellItem
              icon={<DeleteIcon />}
              label="Удалить"
              onClick={() => handleDelete(params.row._id)}
              showInMenu
            />
          );
        }

        return actions;
      },
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
          📝 Управление статьями
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
                      onClick={() => navigate('/admin/articles/new')}
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
          Создать статью
        </Button>
      </Box>

      {/* Поиск и фильтры */}
      <Paper sx={{ 
        p: 3, 
        mb: 3,
        backgroundColor: '#1e293b',
        border: '1px solid rgba(59, 130, 246, 0.1)',
        borderRadius: 3
      }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            label="🔍 Поиск статей"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ 
              flex: 1,
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
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Статус</InputLabel>
            <Select
              value={statusFilter}
              label="Статус"
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setPage(0); // Сбрасываем на первую страницу при изменении фильтра
              }}
              sx={{
                backgroundColor: 'rgba(59, 130, 246, 0.05)',
                borderRadius: 3,
              }}
            >
              <MenuItem value="">Все</MenuItem>
              <MenuItem value="draft">Черновик</MenuItem>
              <MenuItem value="published">Опубликовано</MenuItem>
              <MenuItem value="scheduled">Запланировано</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      <Paper sx={{ 
        height: 600, 
        width: '100%',
        backgroundColor: '#1e293b',
        border: '1px solid rgba(59, 130, 246, 0.1)',
        borderRadius: 3,
        overflow: 'hidden'
      }}>
        <DataGrid
          rows={articlesData?.data || []}
          columns={columns}
          loading={isLoading}
          paginationMode="server"
          rowCount={articlesData?.pagination?.total || 0}
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(model: GridPaginationModel) => {
            console.log('Pagination changed:', model);
            setPage(model.page);
            setPageSize(model.pageSize);
          }}
          pageSizeOptions={[10, 25, 50, 100, 200, 500]}
          getRowId={(row) => row._id}
          disableRowSelectionOnClick
          sx={{
            '& .MuiDataGrid-root': {
              backgroundColor: '#1e293b',
            },
            '& .MuiDataGrid-cell': {
              borderColor: 'rgba(59, 130, 246, 0.1)',
              color: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              '&:focus': {
                outline: 'none'
              }
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#334155',
              borderColor: 'rgba(59, 130, 246, 0.1)',
              color: '#f8fafc',
              fontWeight: 600,
              '& .MuiDataGrid-columnHeader': {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '&:focus': {
                  outline: 'none'
                }
              }
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
              '& .MuiTablePagination-root': {
                color: '#f8fafc',
              },
              '& .MuiTablePagination-select': {
                color: '#f8fafc',
              },
              '& .MuiTablePagination-selectIcon': {
                color: '#f8fafc',
              },
              '& .MuiIconButton-root': {
                color: '#f8fafc',
                '&:hover': {
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                },
                '&.Mui-disabled': {
                  color: '#64748b',
                }
              }
            }
          }}
        />
      </Paper>
    </Box>
  );
}; 