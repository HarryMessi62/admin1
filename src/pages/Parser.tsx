import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Alert,
  Chip,
  LinearProgress,
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Divider,
  Stack,
  Badge,
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  Refresh,
  Settings,
  History,
  BugReport,
  Schedule,
  Article,
  Domain,
  Person,
  CheckCircle,
  Error as ErrorIcon,
  Warning,
  Info,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '../services/api';

interface ParserSettings {
  _id: string;
  parser: {
    enabled: boolean;
    sourceUrl: string;
    schedule: string;
    articlesPerRun: number;
    requestDelay: number;
    userAgent: string;
    requestTimeout: number;
  };
  domains: {
    targetDomains: Array<{
      domainId: string;
      name: string;
      weight: number;
    }>;
    distributionStrategy: string;
  };
  content: {
    autoFormat: boolean;
    saveImages: boolean;
    maxImageSize: number;
    minContentLength: number;
    autoExcerpt: boolean;
    excerptLength: number;
  };
  publishing: {
    defaultStatus: string;
    autoPublish: boolean;
    publishDelay: number;
    defaultAuthor: string;
    defaultCategory: string;
    defaultTags: string[];
  };
  stats: {
    totalParsed: number;
    totalSuccess: number;
    totalFailed: number;
    lastRunAt: string;
    nextRunAt: string;
  };
}

interface ParserStatus {
  enabled: boolean;
  isActive: boolean;
  nextRunAt: string;
  nextRunIn: number;
  lastRunAt: string;
  schedule: string;
  articlesPerRun: number;
  stats: {
    totalParsed: number;
    totalSuccess: number;
    totalFailed: number;
  };
}

interface Domain {
  _id: string;
  name: string;
  url: string;
}

interface Author {
  _id: string;
  username: string;
  email: string;
}

const Parser: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [showRunDialog, setShowRunDialog] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [runCount, setRunCount] = useState(5);
  const [testCount, setTestCount] = useState(5);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');
  
  const queryClient = useQueryClient();

  // Очистка сообщения об успехе через 5 секунд
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Mutations (объявляем до queries, чтобы использовать в useEffect)
  const toggleParserMutation = useMutation({
    mutationFn: (enabled: boolean) => apiService.toggleParser(enabled),
    onSuccess: (data, enabled) => {
      setSuccessMessage(`Парсер ${enabled ? 'включен' : 'отключен'}`);
      queryClient.invalidateQueries({ queryKey: ['parser-status'] });
      queryClient.invalidateQueries({ queryKey: ['parser-settings'] });
    },
    onError: (error) => {
      console.error('Ошибка переключения парсера:', error);
    },
  });

  const runParserMutation = useMutation({
    mutationFn: (count: number) => apiService.runParser(count),
    onSuccess: (data) => {
      console.log('Парсер запущен:', data);
      setSuccessMessage('Парсер запущен в ручном режиме');
      setShowRunDialog(false);
      setIsRunning(true);
      
      // Через 10 секунд обновляем данные и сбрасываем состояние
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['parser-status'] });
        queryClient.invalidateQueries({ queryKey: ['parser-history'] });
        setIsRunning(false);
      }, 10000);
    },
    onError: (error) => {
      console.error('Ошибка запуска парсера:', error);
      setIsRunning(false);
    },
  });

  const testParserMutation = useMutation({
    mutationFn: (count: number) => apiService.testParser(count),
    onSuccess: (data) => {
      console.log('Тест парсера выполнен:', data);
      setSuccessMessage('Тестирование парсера завершено');
      setTestResults(data);
    },
    onError: (error) => {
      console.error('Ошибка тестирования парсера:', error);
      setTestResults({ 
        success: false, 
        message: 'Ошибка тестирования: ' + (error as any)?.message || 'Неизвестная ошибка',
        data: null 
      });
    },
  });

  // API queries
  const { data: settingsData, isLoading: settingsLoading, error: settingsError } = useQuery<{
    settings: ParserSettings;
    availableDomains: Domain[];
    availableAuthors: Author[];
  }>({
    queryKey: ['parser-settings'],
    queryFn: () => apiService.getParserSettings(),
    refetchInterval: 60000, // Обновляем каждую минуту
    staleTime: 30000, // Данные считаются свежими 30 секунд
  });

  const { data: statusData, isLoading: statusLoading, error: statusError } = useQuery<ParserStatus>({
    queryKey: ['parser-status'],
    queryFn: () => apiService.getParserStatus(),
    refetchInterval: () => {
      // Не обновляем если идет мутация
      if (toggleParserMutation.isPending || runParserMutation.isPending || testParserMutation.isPending) {
        return false;
      }
      return isRunning ? 3000 : 15000; // Если парсер работает - каждые 3 сек, иначе каждые 15 сек
    },
    staleTime: isRunning ? 1000 : 10000,
    refetchIntervalInBackground: false, // Не обновлять в фоне
  });

  const { data: historyData, isLoading: historyLoading, error: historyError } = useQuery({
    queryKey: ['parser-history'],
    queryFn: () => apiService.getParserHistory(),
    refetchInterval: 60000, // Обновляем каждую минуту
    staleTime: 30000,
  });

  const settings = settingsData?.settings;
  const status = statusData;
  const domains = settingsData?.availableDomains || [];
  const authors = settingsData?.availableAuthors || [];

  // Форматирование времени
  const formatTime = (dateString: string) => {
    if (!dateString) return 'Никогда';
    return new Date(dateString).toLocaleString('ru-RU');
  };

  const formatTimeRemaining = (ms: number) => {
    if (!ms || ms <= 0) return 'Сейчас';
    
    const minutes = Math.floor(ms / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}д ${hours % 24}ч`;
    if (hours > 0) return `${hours}ч ${minutes % 60}м`;
    return `${minutes}м`;
  };

  const getStatusColor = (enabled: boolean, isActive: boolean) => {
    if (!enabled) return 'error';
    if (isActive) return 'success';
    return 'warning';
  };

  const getStatusText = (enabled: boolean, isActive: boolean) => {
    if (!enabled) return 'Отключен';
    if (isActive) return 'Активен';
    return 'Ожидание';
  };

  const getScheduleText = (schedule: string) => {
    const schedules: Record<string, string> = {
      '15min': 'Каждые 15 минут',
      '30min': 'Каждые 30 минут',
      '1h': 'Каждый час',
      '2h': 'Каждые 2 часа',
      '4h': 'Каждые 4 часа',
      '8h': 'Каждые 8 часов',
      '12h': 'Каждые 12 часов',
      '24h': 'Каждые 24 часа',
    };
    return schedules[schedule] || schedule;
  };

  // Показываем ошибки если есть
  const hasErrors = settingsError || statusError || historyError;
  
  if (settingsLoading || statusLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Загрузка данных парсера...</Typography>
      </Box>
    );
  }

  if (hasErrors) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Ошибка загрузки данных парсера. Проверьте подключение к серверу.
        </Alert>
        <Button 
          variant="outlined" 
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['parser-settings'] });
            queryClient.invalidateQueries({ queryKey: ['parser-status'] });
            queryClient.invalidateQueries({ queryKey: ['parser-history'] });
          }}
        >
          Попробовать снова
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Парсер новостей
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Автоматический парсинг статей с сайта cryptonews.com
      </Typography>

      {/* Уведомление об успехе */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      {/* Уведомления об ошибках */}
      {toggleParserMutation.error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => toggleParserMutation.reset()}>
          Ошибка переключения парсера: {(toggleParserMutation.error as any)?.message || 'Неизвестная ошибка'}
        </Alert>
      )}

      {runParserMutation.error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => runParserMutation.reset()}>
          Ошибка запуска парсера: {(runParserMutation.error as any)?.message || 'Неизвестная ошибка'}
        </Alert>
      )}

      {/* Статус парсера */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <Schedule color="primary" />
                <Typography variant="h6">Статус</Typography>
              </Stack>
              <Chip
                label={getStatusText(status?.enabled || false, status?.isActive || false)}
                color={getStatusColor(status?.enabled || false, status?.isActive || false)}
                size="large"
                sx={{ mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                {status?.enabled ? getScheduleText(status.schedule) : 'Парсер отключен'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <Article color="primary" />
                <Typography variant="h6">Статистика</Typography>
              </Stack>
              <Typography variant="h4" color="primary">
                {status?.stats?.totalSuccess || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Успешно из {status?.stats?.totalParsed || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <Schedule color="primary" />
                <Typography variant="h6">Следующий запуск</Typography>
              </Stack>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {formatTime(status?.nextRunAt || '')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Через {formatTimeRemaining(status?.nextRunIn || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <Schedule color="primary" />
                <Typography variant="h6">Последний запуск</Typography>
              </Stack>
              <Typography variant="body1">
                {formatTime(status?.lastRunAt || '')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Управление */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Управление парсером
          </Typography>
          
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Button
              variant={status?.enabled ? "outlined" : "contained"}
              color={status?.enabled ? "error" : "success"}
              startIcon={status?.enabled ? <Stop /> : <PlayArrow />}
              onClick={() => toggleParserMutation.mutate(!status?.enabled)}
              disabled={toggleParserMutation.isPending}
            >
              {toggleParserMutation.isPending 
                ? 'Переключение...' 
                : `${status?.enabled ? 'Остановить' : 'Запустить'} автопарсинг`
              }
            </Button>

            <Button
              variant="outlined"
              startIcon={<PlayArrow />}
              onClick={() => setShowRunDialog(true)}
              disabled={isRunning || runParserMutation.isPending}
            >
              {runParserMutation.isPending 
                ? 'Запускаю...' 
                : isRunning 
                  ? 'Выполняется...' 
                  : 'Ручной запуск'
              }
            </Button>

            <Button
              variant="outlined"
              startIcon={<BugReport />}
              onClick={() => setShowTestDialog(true)}
              disabled={testParserMutation.isPending}
            >
              {testParserMutation.isPending ? 'Тестирую...' : 'Тестировать'}
            </Button>

            <Button
              variant="outlined"
              startIcon={<Settings />}
              onClick={() => window.location.href = '/parser-settings'}
            >
              Настройки
            </Button>

            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['parser-status'] });
                queryClient.invalidateQueries({ queryKey: ['parser-history'] });
              }}
            >
              Обновить
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* История запусков */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            История запусков
          </Typography>
          
          {historyLoading ? (
            <LinearProgress />
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Время запуска</TableCell>
                    <TableCell>Статус</TableCell>
                    <TableCell>Найдено</TableCell>
                    <TableCell>Успешно</TableCell>
                    <TableCell>Ошибки</TableCell>
                    <TableCell>Длительность</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {historyData?.history?.slice(0, 10).map((run: any, index: number) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        {formatTime(run.startTime)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={run.status === 'success' ? 'Успешно' : 
                                run.status === 'partial' ? 'Частично' : 'Ошибка'}
                          color={run.status === 'success' ? 'success' : 
                                run.status === 'partial' ? 'warning' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip label={run.articlesFound || 0} variant="outlined" size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={run.articlesSuccess || 0} 
                          color="success" 
                          variant="outlined" 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={run.articlesFailed || 0} 
                          color={run.articlesFailed > 0 ? "error" : "default"} 
                          variant="outlined" 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        {run.startTime && run.endTime ? 
                          `${Math.round((new Date(run.endTime).getTime() - new Date(run.startTime).getTime()) / 1000)}с` 
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!historyData?.history || historyData.history.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography color="text.secondary" sx={{ py: 2 }}>
                          История запусков пуста
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Диалог ручного запуска */}
      <Dialog open={showRunDialog} onClose={() => setShowRunDialog(false)}>
        <DialogTitle>Ручной запуск парсера</DialogTitle>
        <DialogContent>
          <TextField
            label="Количество статей"
            type="number"
            value={runCount}
            onChange={(e) => setRunCount(Number(e.target.value))}
            fullWidth
            margin="normal"
            helperText="От 1 до 50 статей"
            inputProps={{ min: 1, max: 50 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRunDialog(false)}>Отмена</Button>
          <Button
            onClick={() => runParserMutation.mutate(runCount)}
            variant="contained"
            disabled={runParserMutation.isPending}
          >
            {runParserMutation.isPending ? 'Запускаю...' : 'Запустить'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог тестирования */}
      <Dialog 
        open={showTestDialog} 
        onClose={() => setShowTestDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Тестирование парсера</DialogTitle>
        <DialogContent>
          <TextField
            label="Количество статей для теста"
            type="number"
            value={testCount}
            onChange={(e) => setTestCount(Number(e.target.value))}
            fullWidth
            margin="normal"
            helperText="От 1 до 20 статей"
            inputProps={{ min: 1, max: 20 }}
            sx={{ mb: 2 }}
          />
          
          {testResults && (
            <Box sx={{ mt: 2 }}>
              <Alert 
                severity={testResults.success ? "success" : "error"} 
                sx={{ mb: 2 }}
              >
                {testResults.message}
              </Alert>
              
              {testResults.success && testResults.data?.articles && (
                <>
                  <Typography variant="h6" gutterBottom>
                    Найденные статьи ({testResults.data.articles.length}):
                  </Typography>
                  
                  <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>#</TableCell>
                          <TableCell>Заголовок</TableCell>
                          <TableCell>URL</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {testResults.data.articles.map((article: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell 
                              sx={{ 
                                maxWidth: 300, 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              <Tooltip title={article.title}>
                                <span>{article.title}</span>
                              </Tooltip>
                            </TableCell>
                            <TableCell>
                              <a 
                                href={article.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{ color: 'inherit', textDecoration: 'none' }}
                              >
                                <Tooltip title={article.url}>
                                  <span>{article.url.substring(0, 40)}...</span>
                                </Tooltip>
                              </a>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTestDialog(false)}>Закрыть</Button>
          <Button
            onClick={() => testParserMutation.mutate(testCount)}
            variant="contained"
            disabled={testParserMutation.isPending}
          >
            {testParserMutation.isPending ? 'Тестирую...' : 'Тестировать'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Parser; 