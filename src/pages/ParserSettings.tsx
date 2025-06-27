import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  Chip,
  Autocomplete,
  Tabs,
  Tab,
  Slider,
  FormHelperText,
  CircularProgress
} from '@mui/material';
import { Save, Restore, Settings } from '@mui/icons-material';
import { apiService } from '../services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ParserSettingsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const queryClient = useQueryClient();

  // Загрузка данных
  const { data: settingsData, isLoading, error } = useQuery({
    queryKey: ['parser-settings'],
    queryFn: () => apiService.getParserSettings(),
    onSuccess: (data) => {
      console.log('Полученные данные настроек парсера:', data);
    },
    onError: (error) => {
      console.error('Ошибка загрузки настроек парсера:', error);
    }
  });

  const [formData, setFormData] = useState<any>(null);

  // Инициализация формы
  useEffect(() => {
    console.log('settingsData изменились:', settingsData);
    if (settingsData?.data?.settings) {
      console.log('Устанавливаем formData из data.settings:', settingsData.data.settings);
      setFormData(settingsData.data.settings);
    } else if (settingsData?.settings) {
      console.log('Устанавливаем formData из settings:', settingsData.settings);
      setFormData(settingsData.settings);
    } else if (settingsData) {
      console.log('Устанавливаем formData напрямую:', settingsData);
      setFormData(settingsData);
    }
  }, [settingsData]);

  // Мутация для сохранения
  const saveSettingsMutation = useMutation({
    mutationFn: (settings: any) => apiService.updateParserSettings(settings),
    onSuccess: () => {
      setSuccessMessage('Настройки успешно сохранены');
      queryClient.invalidateQueries({ queryKey: ['parser-settings'] });
      queryClient.invalidateQueries({ queryKey: ['parser-status'] });
    },
    onError: (error) => {
      console.error('Ошибка сохранения:', error);
      setErrorMessage('Ошибка сохранения настроек: ' + (error as any)?.message);
    },
  });

  // Очистка сообщений
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const handleInputChange = (section: string, field: string, value: any) => {
    if (!formData) return;
    
    setFormData((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleDomainsChange = (domains: any[]) => {
    if (!formData) return;
    
    setFormData((prev: any) => ({
      ...prev,
      domains: {
        ...prev.domains,
        targetDomains: domains.map((domain: any) => ({
          domainId: domain._id,
          name: domain.name,
          weight: 1
        }))
      }
    }));
  };

  const handleSave = () => {
    if (formData) {
      console.log('Сохраняем настройки:', formData);
      saveSettingsMutation.mutate(formData);
    }
  };

  const handleReset = () => {
    if (settingsData?.data?.settings) {
      setFormData(settingsData.data.settings);
      setSuccessMessage('Настройки сброшены к сохраненным значениям');
    } else if (settingsData?.settings) {
      setFormData(settingsData.settings);
      setSuccessMessage('Настройки сброшены к сохраненным значениям');
    } else if (settingsData) {
      setFormData(settingsData);
      setSuccessMessage('Настройки сброшены к сохраненным значениям');
    }
  };

  console.log('Состояние компонента:', { isLoading, error, settingsData, formData });

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Загрузка настроек...</Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          Ошибка загрузки настроек: {(error as any)?.message || JSON.stringify(error)}
        </Alert>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2">
            Отладочная информация:
          </Typography>
          <pre>{JSON.stringify(error, null, 2)}</pre>
        </Box>
      </Container>
    );
  }

  if (!formData) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="warning">
          Данные настроек не загружены. Отладочная информация:
        </Alert>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2">settingsData:</Typography>
          <pre>{JSON.stringify(settingsData, null, 2)}</pre>
        </Box>
      </Container>
    );
  }

  const availableDomains = settingsData?.data?.availableDomains || settingsData?.availableDomains || [];
  const availableAuthors = settingsData?.data?.availableAuthors || settingsData?.availableAuthors || [];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Settings sx={{ mr: 2 }} />
          <Typography variant="h4" component="h1">
            Настройки парсера
          </Typography>
        </Box>

        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="Основные" />
            <Tab label="Домены" />
            <Tab label="Контент" />
            <Tab label="Публикация" />
          </Tabs>
        </Box>

        {/* Основные настройки */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.parser?.enabled || false}
                    onChange={(e) => handleInputChange('parser', 'enabled', e.target.checked)}
                  />
                }
                label="Включить автоматический парсинг"
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.parser?.useRSS || false}
                    onChange={(e) => handleInputChange('parser', 'useRSS', e.target.checked)}
                  />
                }
                label="Использовать RSS парсер (рекомендуется)"
              />
              <FormHelperText>
                RSS парсер быстрее и надежнее обычного HTML парсинга. 
                Автоматически получает статьи из 8 криптовалютных источников.
              </FormHelperText>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="URL источника"
                value={formData.parser?.sourceUrl || ''}
                onChange={(e) => handleInputChange('parser', 'sourceUrl', e.target.value)}
                helperText="URL страницы с новостями для парсинга"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Периодичность</InputLabel>
                <Select
                  value={formData.parser?.schedule || '4h'}
                  label="Периодичность"
                  onChange={(e) => handleInputChange('parser', 'schedule', e.target.value)}
                >
                  <MenuItem value="15min">Каждые 15 минут</MenuItem>
                  <MenuItem value="30min">Каждые 30 минут</MenuItem>
                  <MenuItem value="1h">Каждый час</MenuItem>
                  <MenuItem value="2h">Каждые 2 часа</MenuItem>
                  <MenuItem value="4h">Каждые 4 часа</MenuItem>
                  <MenuItem value="8h">Каждые 8 часов</MenuItem>
                  <MenuItem value="12h">Каждые 12 часов</MenuItem>
                  <MenuItem value="24h">Каждые 24 часа</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Статей за запуск"
                value={formData.parser?.articlesPerRun || 5}
                onChange={(e) => handleInputChange('parser', 'articlesPerRun', parseInt(e.target.value))}
                inputProps={{ min: 1, max: 50 }}
                helperText="Количество статей для парсинга за один запуск (1-50)"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Box>
                <Typography gutterBottom>
                  Задержка между запросами: {(formData.parser?.requestDelay || 2000) / 1000} сек
                </Typography>
                <Slider
                  value={formData.parser?.requestDelay || 2000}
                  onChange={(_, value) => handleInputChange('parser', 'requestDelay', value)}
                  min={1000}
                  max={10000}
                  step={500}
                  marks={[
                    { value: 1000, label: '1с' },
                    { value: 5000, label: '5с' },
                    { value: 10000, label: '10с' }
                  ]}
                />
              </Box>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Настройки доменов */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Целевые домены для публикации
              </Typography>
              <Autocomplete
                multiple
                options={availableDomains}
                getOptionLabel={(option: any) => option.name}
                value={availableDomains.filter((domain: any) => 
                  formData.domains?.targetDomains?.some((td: any) => td.domainId === domain._id)
                ) || []}
                onChange={(_, value) => handleDomainsChange(value)}
                renderTags={(value: any, getTagProps) =>
                  value.map((option: any, index: number) => (
                    <Chip
                      variant="outlined"
                      label={option.name}
                      {...getTagProps({ index })}
                      key={option._id}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Выберите домены"
                    placeholder="Начните вводить название домена"
                    helperText="Выберите домены, на которые будут публиковаться статьи"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Стратегия распределения</InputLabel>
                <Select
                  value={formData.domains?.distributionStrategy || 'round_robin'}
                  label="Стратегия распределения"
                  onChange={(e) => handleInputChange('domains', 'distributionStrategy', e.target.value)}
                >
                  <MenuItem value="round_robin">По очереди (Round Robin)</MenuItem>
                  <MenuItem value="weighted">По весу (Weighted)</MenuItem>
                  <MenuItem value="random">Случайно (Random)</MenuItem>
                </Select>
                <FormHelperText>
                  Как распределять статьи между доменами
                </FormHelperText>
              </FormControl>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Настройки контента */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.content?.saveImages || false}
                    onChange={(e) => handleInputChange('content', 'saveImages', e.target.checked)}
                  />
                }
                label="Сохранять изображения"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Минимальная длина статьи"
                value={formData.content?.minContentLength || 500}
                onChange={(e) => handleInputChange('content', 'minContentLength', parseInt(e.target.value))}
                inputProps={{ min: 100, max: 2000 }}
                helperText="Минимальное количество символов в статье"
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Настройки публикации */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Статус по умолчанию</InputLabel>
                <Select
                  value={formData.publishing?.defaultStatus || 'draft'}
                  label="Статус по умолчанию"
                  onChange={(e) => handleInputChange('publishing', 'defaultStatus', e.target.value)}
                >
                  <MenuItem value="draft">Черновик</MenuItem>
                  <MenuItem value="published">Опубликовано</MenuItem>
                  <MenuItem value="scheduled">Запланировано</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Автор по умолчанию</InputLabel>
                <Select
                  value={formData.publishing?.defaultAuthor || ''}
                  label="Автор по умолчанию"
                  onChange={(e) => handleInputChange('publishing', 'defaultAuthor', e.target.value)}
                >
                  {availableAuthors.map((author: any) => (
                    <MenuItem key={author._id} value={author._id}>
                      {author.username}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Категория по умолчанию"
                value={formData.publishing?.defaultCategory || 'Crypto'}
                onChange={(e) => handleInputChange('publishing', 'defaultCategory', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.publishing?.autoPublish || false}
                    onChange={(e) => handleInputChange('publishing', 'autoPublish', e.target.checked)}
                  />
                }
                label="Автоматическая публикация"
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Кнопки управления */}
        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            startIcon={<Restore />}
            onClick={handleReset}
            disabled={saveSettingsMutation.isPending}
          >
            Сбросить
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSave}
            disabled={saveSettingsMutation.isPending}
          >
            {saveSettingsMutation.isPending ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </Box>

        {/* Отладочная информация */}
        <Box sx={{ mt: 4, p: 2, bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}>
          <Typography variant="h6" gutterBottom>Отладочная информация</Typography>
          <Typography variant="body2">Домены: {availableDomains.length}</Typography>
          <Typography variant="body2">Авторы: {availableAuthors.length}</Typography>
          <Typography variant="body2">FormData: {formData ? 'Загружен' : 'Не загружен'}</Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default ParserSettingsPage; 