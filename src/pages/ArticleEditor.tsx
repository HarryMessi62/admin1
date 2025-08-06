import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  IconButton,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import apiService from '../services/api';
import { type Article, type Domain } from '../types/api';
import { useAuth } from '../hooks/useAuth';
import { RichTextEditor } from '../components/RichTextEditor';
import { ImageUpload } from '../components/ImageUpload';
import { ArticleStatsManager } from '../components/ArticleStatsManager';
import { useImageUpload } from '../hooks/useImageUpload';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import ruLocale from 'date-fns/locale/ru';

const articleSchema = yup.object().shape({
  title: yup.string().required('Заголовок обязателен').max(200, 'Максимум 200 символов'),
  excerpt: yup.string().default('').max(300, 'Максимум 300 символов'),
  content: yup.string().required('Содержание обязательно').min(100, 'Минимум 100 символов'),
  category: yup.string().required('Категория обязательна'),
  domain: yup.array().of(yup.string().required()).min(1, 'Необходимо выбрать хотя бы один домен').required('Домен обязателен'),
  status: yup.string().oneOf(['draft', 'published', 'scheduled', 'archived']).required(),
  featuredImage: yup.string().default(''),
  tags: yup.array().of(yup.string().required()).default([]),
  scheduledAt: yup.date().nullable().optional(),
});

const categories = [
  'Crypto', 'Cryptocurrencies', 'Bitcoin', 'Ethereum', 'Technology', 
  'Politics', 'Economy', 'Sports', 'Entertainment', 'Science', 
  'Health', 'Business', 'World', 'Local', 'Opinion', 'Other'
] as const;

type CategoryType = typeof categories[number];

interface ArticleFormData {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  domain: string[];
  tags: string[];
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  featuredImage: string;
  scheduledAt: Date | null;
}

export const ArticleEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newTag, setNewTag] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const { uploadImage, isUploading: isImageUploading } = useImageUpload();
  
  const isEditing = Boolean(id);

  // Получение статьи для редактирования
  const { data: article, isLoading: articleLoading, error: articleError } = useQuery({
    queryKey: ['article', id],
    queryFn: async () => {
      console.log('🔍 Загружаем статью для редактирования, ID:', id);
      try {
        const result = await apiService.getArticleForEdit(id!);
        console.log('✅ Статья загружена:', result);
        return result;
      } catch (error) {
        console.error('❌ Ошибка загрузки статьи:', error);
        throw error;
      }
    },
    enabled: isEditing && !!id,
    retry: 2,
  });

  // Получение доменов
  const { data: domainsData } = useQuery({
    queryKey: ['domains-for-editor'],
    queryFn: async () => {
      if (user?.role === 'super_admin') {
        const result = await apiService.getDomains({ limit: 1000 });
        return result;
      } else {
        const domains = await apiService.getAllowedDomains();
        return { success: true, data: domains, pagination: null };
      }
    },
    enabled: !!user?.role,
  });

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ArticleFormData>({
    resolver: yupResolver(articleSchema) as any,
    defaultValues: {
      title: '',
      excerpt: '',
      content: '',
      category: 'Other',
      domain: [],
      tags: [],
      status: 'published',
      featuredImage: '',
      scheduledAt: null,
    },
  });

  const watchedTitle = watch('title');

  // Заполнение формы при редактировании
  useEffect(() => {
    if (article && isEditing) {
      console.log('🔍 Loaded article for editing:', article);
      
      // Получаем данные статьи
      const articleData = article;
      console.log('🔍 Actual article data:', articleData);
      
      // Обработка массива доменов
      let domainIds: string[] = [];
      if (Array.isArray(articleData.domain)) {
        domainIds = articleData.domain.map(d => 
          typeof d === 'string' ? d : (d?._id || '')
        ).filter(Boolean);
      } else if (articleData.domain) {
        // Поддержка старых статей с одиночным доменом
        const singleDomainId = typeof articleData.domain === 'string' 
          ? articleData.domain 
          : (articleData.domain?._id || '');
        if (singleDomainId) {
          domainIds = [singleDomainId];
        }
      }
      
      console.log('🔍 Setting domain IDs:', domainIds);
      
      const formData = {
        title: articleData.title || '',
        excerpt: articleData.excerpt || '',
        content: articleData.content || '',
        category: articleData.category || 'Other',
        domain: domainIds,
        tags: articleData.tags || [],
        status: articleData.status || 'draft',
        featuredImage: articleData.media?.featuredImage?.url || '',
        scheduledAt: articleData.scheduledAt ? new Date(articleData.scheduledAt) : null,
      };
      
      console.log('🔍 Form data to reset:', formData);

      // Используем setTimeout чтобы убедиться что форма готова
      setTimeout(() => {
        reset(formData);
        console.log('🔍 Form reset completed');
        
        // Сбрасываем выбранный файл при редактировании
        setSelectedImageFile(null);
      }, 100);
    }
  }, [article, isEditing, reset]);

  // Мутации
  const createArticleMutation = useMutation({
    mutationFn: (data: ArticleFormData) => {
      console.log('🔍 Данные формы перед отправкой:', data);
      console.log('🔍 Статус в данных формы:', data.status);
      
      // Подготавливаем данные планирования на основе статуса
      const scheduling = {
        publishNow: data.status === 'published',
        scheduleDate: data.status === 'scheduled' ? data.scheduledAt : null
      };
      
      const articleData = {
        title: data.title,
        excerpt: data.excerpt,
        content: data.content,
        category: data.category as Article['category'],
        domain: data.domain,
        tags: data.tags,
        scheduling: scheduling,
        media: {
          featuredImage: data.featuredImage ? {
            url: data.featuredImage,
            alt: data.title,
          } : undefined
        },
        scheduledAt: data.status === 'scheduled' ? data.scheduledAt : null
      };
      
      console.log('🔍 Итоговые данные для API:', articleData);
      console.log('🔍 Данные планирования:', scheduling);
      
      return apiService.createArticle(articleData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      setShowSuccessMessage(true);
      setTimeout(() => navigate('/admin/articles'), 2000);
    },
  });

  const updateArticleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ArticleFormData }) => {
      const articleData = {
        title: data.title,
        excerpt: data.excerpt,
        content: data.content,
        category: data.category as Article['category'],
        domain: data.domain,
        tags: data.tags,
        status: data.status,
        scheduling: {
          publishNow: data.status === 'published',
          scheduleDate: data.status === 'scheduled' ? data.scheduledAt : null,
        },
        media: {
          featuredImage: data.featuredImage ? {
            url: data.featuredImage,
            alt: data.title,
          } : undefined
        },
        scheduledAt: data.status === 'scheduled' ? data.scheduledAt : null
      };
      console.log('🔄 Отправляем запрос на обновление статьи:', { id, articleData });
      return apiService.updateArticle(id, articleData);
    },
    onSuccess: (result) => {
      console.log('✅ Статья успешно обновлена:', result);
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['article', id] });
      setShowSuccessMessage(true);
      setTimeout(() => navigate('/admin/articles'), 2000);
    },
    onError: (error) => {
      console.error('❌ Ошибка при обновлении статьи:', error);
    },
  });

  const onSubmit = async (data: ArticleFormData) => {
    try {
      console.log('🚀 Отправка формы:', { isEditing, id, data });
      console.log('🚀 Статус из формы:', data.status);
      console.log('🚀 Все значения формы:', watch());
      
      let finalData = { ...data };

      // Если есть выбранный файл изображения, загружаем его на сервер
      if (selectedImageFile) {
        try {
          console.log('📤 Загружаем изображение:', selectedImageFile.name);
          const uploadedImageUrl = await uploadImage(selectedImageFile);
          console.log('✅ Изображение загружено:', uploadedImageUrl);
          finalData.featuredImage = uploadedImageUrl;
        } catch (error) {
          console.error('❌ Ошибка загрузки изображения:', error);
          // Продолжаем с локальным URL если загрузка не удалась
        }
      }

      console.log('📝 Итоговые данные для отправки:', finalData);
      console.log('📝 Статус в итоговых данных:', finalData.status);

    if (isEditing && id) {
        console.log('✏️ Обновляем статью с ID:', id);
        updateArticleMutation.mutate({ id, data: finalData });
    } else {
        console.log('🆕 Создаем новую статью');
        console.log('🆕 Статус при создании:', finalData.status);
        createArticleMutation.mutate(finalData);
      }
    } catch (error) {
      console.error('❌ Ошибка сохранения статьи:', error);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      const currentTags = watch('tags') || [];
      if (!currentTags.includes(newTag.trim())) {
        setValue('tags', [...currentTags, newTag.trim()]);
      setNewTag('');
    }
    }
  };

  const handleRemoveTag = (indexToRemove: number) => {
    const currentTags = watch('tags') || [];
    setValue('tags', currentTags.filter((_, index) => index !== indexToRemove));
  };

  if (articleLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography>Загрузка статьи...</Typography>
      </Box>
    );
  }

  if (articleError) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '50vh', gap: 2 }}>
        <Typography variant="h5" color="error">❌ Ошибка загрузки статьи</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 600 }}>
          {(articleError as any)?.message || 'Не удалось загрузить статью для редактирования'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 600, fontStyle: 'italic' }}>
          ID статьи: {id}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 600, fontStyle: 'italic' }}>
          Возможные причины: статья не существует, нет прав доступа, или неправильный ID
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Button 
            variant="contained" 
            onClick={() => navigate('/admin/articles')}
          >
            Вернуться к списку статей
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => window.location.reload()}
          >
            Обновить страницу
          </Button>
        </Box>
      </Box>
    );
  }

  // Получаем домены из ответа API
  const domains = domainsData?.data || [];

  return (
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => navigate('/admin/articles')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
            {isEditing ? '✏️ Редактирование статьи' : '📝 Создание статьи'}
          </Typography>
            <Button
              variant="contained"
          startIcon={
            (createArticleMutation.isPending || updateArticleMutation.isPending) ? 
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                  },
                }}
              />
            </Box> : <SaveIcon />
          }
              onClick={handleSubmit(onSubmit)}
          disabled={createArticleMutation.isPending || updateArticleMutation.isPending || isImageUploading || (!domains || domains.length === 0)}
            >
          {(createArticleMutation.isPending || updateArticleMutation.isPending || isImageUploading) 
            ? (isImageUploading ? 'Загружаем изображение...' : (isEditing ? 'Обновляем...' : 'Создаем...')) 
            : (isEditing ? 'Обновить' : 'Создать')
          }
            </Button>
      </Box>

      {/* Информация об обязательных полях */}
      {!isEditing && (
        <Alert 
          severity="info" 
          sx={{ 
            mb: 3, 
            backgroundColor: 'rgba(59, 130, 246, 0.1)', 
            border: '1px solid rgba(59, 130, 246, 0.2)',
            '& .MuiAlert-message': {
              width: '100%'
            }
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            📋 Для создания статьи обязательно заполните:
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2 }}>
            <li>🏷️ <strong>Заголовок</strong> (максимум 200 символов)</li>
            <li>📝 <strong>Содержание</strong> (минимум 100 символов)</li>
            <li>📂 <strong>Категория</strong></li>
            <li>🌐 <strong>Домен</strong> (выберите из доступных)</li>
          </Box>
          <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
            💡 Остальные поля необязательны, но помогут улучшить статью
          </Typography>
        </Alert>
      )}

      {/* Ошибки валидации */}
      {Object.keys(errors).length > 0 && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            ❌ Исправьте следующие ошибки:
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2 }}>
            {Object.entries(errors).map(([field, error]) => {
              if (typeof error === 'object' && error?.message) {
                const fieldNames: { [key: string]: string } = {
                  title: 'Заголовок',
                  content: 'Содержание',
                  category: 'Категория',
                  domain: 'Домен',
                  excerpt: 'Краткое описание',
                };
                return (
                  <li key={field}>
                    <strong>{fieldNames[field] || field}:</strong> {error.message}
                  </li>
                );
              }
              return null;
            })}
        </Box>
        </Alert>
      )}

      {/* Проблемы с доменами */}
      {(!domains || domains.length === 0) && (
        <Alert 
          severity="warning" 
          sx={{ 
            mb: 3,
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.2)'
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            ⚠️ Нет доступных доменов
          </Typography>
          <Typography variant="body2">
            {user?.role === 'super_admin' 
              ? 'Сначала создайте домены в разделе "Домены"' 
              : 'Обратитесь к администратору для получения доступа к доменам'
            }
          </Typography>
        </Alert>
      )}

      {/* Сообщение об успехе */}
      {showSuccessMessage && (
        <Alert 
          severity="success" 
          sx={{ 
            mb: 3,
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.2)'
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            ✅ {isEditing ? 'Статья успешно обновлена!' : 'Статья успешно создана!'}
          </Typography>
          <Typography variant="body2">
            Перенаправляем вас к списку статей...
          </Typography>
        </Alert>
      )}

      {/* Ошибки создания/обновления */}
      {(createArticleMutation.isError || updateArticleMutation.isError) && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            ❌ Ошибка при {isEditing ? 'обновлении' : 'создании'} статьи
          </Typography>
          <Typography variant="body2">
            {(createArticleMutation.error as any)?.message || (updateArticleMutation.error as any)?.message || 
             'Произошла неизвестная ошибка. Попробуйте еще раз.'}
          </Typography>
        </Alert>
      )}

        {/* Форма */}
        <form onSubmit={handleSubmit(onSubmit)}>
            {/* Основная информация */}
        <Paper sx={{ p: 3, mb: 3, backgroundColor: '#1e293b', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#f8fafc' }}>
                  📄 Основная информация
                </Typography>
                
                <Controller
                  name="title"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                label="Заголовок статьи *"
                      fullWidth
                      margin="normal"
                      error={!!errors.title}
                      helperText={errors.title?.message}
                      placeholder="Введите привлекательный заголовок..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(59, 130, 246, 0.05)',
                    '& fieldset': { borderColor: 'rgba(59, 130, 246, 0.2)' },
                    '&:hover fieldset': { borderColor: 'rgba(59, 130, 246, 0.4)' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                  },
                  '& .MuiInputLabel-root': { color: '#cbd5e1' },
                  '& .MuiInputBase-input': { color: '#f8fafc' }
                }}
                    />
                  )}
                />

                <Controller
            name="excerpt"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Краткое описание"
                      fullWidth
                      margin="normal"
                      multiline
                      rows={2}
                error={!!errors.excerpt}
                helperText={errors.excerpt?.message || 'Краткое описание для предварительного просмотра'}
                      placeholder="Напишите краткое описание статьи..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(59, 130, 246, 0.05)',
                    '& fieldset': { borderColor: 'rgba(59, 130, 246, 0.2)' },
                    '&:hover fieldset': { borderColor: 'rgba(59, 130, 246, 0.4)' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                  },
                  '& .MuiInputLabel-root': { color: '#cbd5e1' },
                  '& .MuiInputBase-input': { color: '#f8fafc' }
                }}
                    />
                  )}
                />

                <Controller
                  name="featuredImage"
                  control={control}
                  render={({ field }) => (
                    <ImageUpload
                      value={field.value || ''}
                  onChange={(url: string, file?: File) => {
                        field.onChange(url);
                        if (file) {
                          setSelectedImageFile(file);
                        }
                      }}
                      label="🖼️ Изображение-превью статьи"
                      helperText="Перетащите изображение сюда или нажмите для выбора файла (JPG, PNG, GIF, WebP). Загрузка на сервер произойдет при сохранении статьи."
                  onError={(error: string) => {
                        console.error('Image upload error:', error);
                      }}
                    />
                  )}
                />
        </Paper>

        {/* Содержание статьи */}
        <Paper sx={{ p: 3, mb: 3, backgroundColor: '#1e293b', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#f8fafc' }}>
            📝 Содержание статьи *
                  </Typography>
                  <Alert severity="info" sx={{ mb: 2, backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
            💡 Используйте панель инструментов для форматирования текста. Кнопка "Предпросмотр" покажет, как будет выглядеть статья.
                  </Alert>
                  <Controller
                    name="content"
                    control={control}
                    render={({ field }) => (
                      <Box>
                        <RichTextEditor
                          value={field.value || ''}
                          onChange={field.onChange}
                          placeholder="Начните писать содержание статьи..."
                          featuredImage={watch('featuredImage')}
                          title={watch('title')}
                        />
                        {errors.content && (
                          <Typography 
                            variant="caption" 
                            color="error" 
                            sx={{ mt: 1, display: 'block' }}
                          >
                            {errors.content.message}
                          </Typography>
                        )}
                      </Box>
                    )}
                  />
              </Paper>

        {/* Управление лайками и комментариями (только при редактировании) */}
        {isEditing && article && (
          <Paper sx={{ p: 3, mb: 3, backgroundColor: '#1e293b', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#f8fafc' }}>
              📊 Управление лайками и комментариями
            </Typography>
            <ArticleStatsManager 
              articleId={article._id}
              initialStats={article}
            />
          </Paper>
        )}

        {/* Настройки публикации */}
        <Paper sx={{ p: 3, mb: 3, backgroundColor: '#1e293b', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#f8fafc' }}>
                  ⚙️ Настройки публикации
                </Typography>

                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => {
                    console.log('🎛️ STATUS FIELD - Текущее значение:', field.value);
                    console.log('🎛️ STATUS FIELD - Все значения формы:', watch());
                    
                    return (
                      <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel sx={{ color: '#cbd5e1' }}>Статус *</InputLabel>
                        <Select 
                          {...field} 
                          label="Статус *"
                          onChange={(e) => {
                            console.log('🎛️ STATUS CHANGE - Новое значение:', e.target.value);
                            field.onChange(e);
                          }}
                          sx={{
                            backgroundColor: 'rgba(59, 130, 246, 0.05)',
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(59, 130, 246, 0.2)' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(59, 130, 246, 0.4)' },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                            '& .MuiSelect-select': { color: '#f8fafc' }
                          }}
                        >
                          <MenuItem value="draft">📝 Черновик</MenuItem>
                          <MenuItem value="published">✅ Опубликовано</MenuItem>
                          <MenuItem value="scheduled">⏰ Запланировано</MenuItem>
                          <MenuItem value="archived">📦 Архив</MenuItem>
                        </Select>
                      </FormControl>
                    );
                  }}
                />

                {watch('status') === 'scheduled' && (
                  <Controller
                    name="scheduledAt"
                    control={control}
                    render={({ field }) => (
                      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ruLocale}>
                        <DateTimePicker
                          label="Дата публикации"
                          value={field.value}
                          onChange={field.onChange}
                          slotProps={{ textField: { fullWidth: true, sx:{ mb:2 } } }}
                        />
                      </LocalizationProvider>
                    )}
                  />
                )}

                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel sx={{ color: '#cbd5e1' }}>Категория *</InputLabel>
                <Select 
                  {...field} 
                  label="Категория *" 
                  error={!!errors.category}
                  sx={{
                    backgroundColor: 'rgba(59, 130, 246, 0.05)',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(59, 130, 246, 0.2)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(59, 130, 246, 0.4)' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                    '& .MuiSelect-select': { color: '#f8fafc' }
                  }}
                >
                        {categories.map(category => (
                          <MenuItem key={category} value={category}>{category}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />

                <Controller
                  name="domain"
                  control={control}
                  render={({ field }) => (
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#cbd5e1' }}>Домены *</InputLabel>
                <Select 
                  {...field} 
                  multiple
                  label="Домены *" 
                  error={!!errors.domain}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((value) => {
                        const domain = domains?.find((d: any) => d._id === value);
                        return (
                          <Chip 
                            key={value} 
                            label={domain?.name || value} 
                            size="small"
                            sx={{ 
                              backgroundColor: 'rgba(59, 130, 246, 0.1)',
                              color: '#f8fafc'
                            }}
                          />
                        );
                      })}
                    </Box>
                  )}
                  sx={{
                    backgroundColor: 'rgba(59, 130, 246, 0.05)',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(59, 130, 246, 0.2)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(59, 130, 246, 0.4)' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                    '& .MuiSelect-select': { color: '#f8fafc' }
                  }}
                >
                        {domains && domains.length > 0 ? (
                          domains.map((domain: any) => (
                            <MenuItem key={domain._id} value={domain._id}>
                              {domain.name}
                            </MenuItem>
                          ))
                        ) : (
                          <MenuItem value="" disabled>
                            {user?.role === 'super_admin' ? 'Загрузка доменов...' : 'Нет доступных доменов'}
                          </MenuItem>
                        )}
                      </Select>
                    </FormControl>
                  )}
                />
        </Paper>

        {/* Теги */}
        <Paper sx={{ p: 3, mb: 3, backgroundColor: '#1e293b', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#f8fafc' }}>
                  🏷️ Теги
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    size="small"
                    placeholder="Добавить тег"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
              sx={{
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(59, 130, 246, 0.05)',
                  '& fieldset': { borderColor: 'rgba(59, 130, 246, 0.2)' },
                  '&:hover fieldset': { borderColor: 'rgba(59, 130, 246, 0.4)' },
                  '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                },
                '& .MuiInputBase-input': { color: '#f8fafc' }
              }}
            />
            <Button 
              onClick={handleAddTag} 
              variant="contained"
              sx={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #2563eb 0%, #0891b2 100%)',
                }
              }}
            >
                    <AddIcon />
            </Button>
                </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {(watch('tags') || []).map((tag, index) => (
                    <Chip
                key={index}
                label={tag}
                onDelete={() => handleRemoveTag(index)}
                sx={{
                  backgroundColor: 'rgba(59, 130, 246, 0.2)',
                  color: '#f8fafc',
                  '& .MuiChip-deleteIcon': { color: '#f8fafc' }
                }}
                    />
                  ))}
                </Box>
              </Paper>

        {/* Информация о состоянии */}
              {isDirty && (
          <Alert 
            severity="warning" 
            sx={{ 
              mb: 3,
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.2)'
            }}
          >
                  У вас есть несохраненные изменения
                </Alert>
              )}
        </form>
      </Box>
  );
}; 