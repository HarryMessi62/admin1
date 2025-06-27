import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Paper,
  Divider,
  Switch,
  FormControlLabel,
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Security,
  Storage,
  Add,
  Delete,
  Edit,
  Save,
  Public,
  Shield,
  Backup,
  Restore,
  Download,
  Upload,
  Speed,
  Refresh,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '../services/api';
import type { SystemSettings, ParserSettings, IPSettings, BackupSettings, BlockedIP } from '../types/settings';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <Box
    role="tabpanel"
    hidden={value !== index}
    id={`settings-tabpanel-${index}`}
    aria-labelledby={`settings-tab-${index}`}
    sx={{ p: 3 }}
  >
    {value === index && <Box>{children}</Box>}
  </Box>
);

const Settings: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [dialogType, setDialogType] = useState<'domain' | 'proxy' | 'ip'>('domain');
  const [newValue, setNewValue] = useState('');
  const queryClient = useQueryClient();
  const [blockDuration, setBlockDuration] = useState<number | null>(null);
  const [blockReason, setBlockReason] = useState('');

  const { data: settingsData, isLoading, error } = useQuery<SystemSettings>({
    queryKey: ['settings'],
    queryFn: () => apiService.getSettings(),
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 минут
  });

  const [settings, setSettings] = useState<SystemSettings>(() => ({
    parser: {
      maxConcurrentRequests: 10,
      requestTimeout: 5000,
      articlesPerDay: 100,
      allowedDomains: [],
      blockedDomains: [],
      proxySettings: {
        enabled: false,
        proxyList: [],
        rotationInterval: 60,
      },
    },
    ip: {
      blockedIPs: [],
      autoBlockEnabled: false,
      maxRequestsPerMinute: 60,
      blockDuration: 60,
      whitelistedIPs: [],
    },
    backup: {
      autoBackupEnabled: false,
      backupSchedule: '0 0 * * *',
      backupRetentionDays: 7,
      backupLocation: '/backups',
      backupHistory: [],
    },
  }));

  useEffect(() => {
    if (settingsData) {
      setSettings(settingsData);
    }
  }, [settingsData]);

  const saveSettingsMutation = useMutation({
    mutationFn: (settings: SystemSettings) => apiService.updateSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setIsEditing(false);
    },
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleSettingChange = (section: keyof SystemSettings, field: string, value: any) => {
    // Валидация для конкретных полей
    if (field === 'maxConcurrentRequests') {
      value = Math.max(1, Math.min(50, value)); // Ограничиваем значение от 1 до 50
    }
    if (field === 'requestTimeout') {
      value = Math.max(5000, Math.min(120000, value)); // Ограничиваем значение от 5000 до 120000
    }
    if (field === 'articlesPerDay') {
      value = Math.max(10, Math.min(10000, value)); // Ограничиваем значение от 10 до 10000
    }
    if (field === 'maxRequestsPerMinute') {
      value = Math.max(1, Math.min(1000, value)); // Ограничиваем значение от 1 до 1000
    }
    if (field === 'blockDuration') {
      value = Math.max(1, Math.min(10080, value)); // Ограничиваем значение от 1 до 10080
    }

    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await apiService.updateSettings(settings);
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    } catch (error: any) {
      console.error('Ошибка при сохранении настроек:', error);
      
      // Показываем детальную ошибку пользователю
      const errorMessage = error?.response?.data?.message || 'Неизвестная ошибка';
      const validationErrors = error?.response?.data?.errors || [];
      
      alert(`Ошибка сохранения настроек: ${errorMessage}\n\n${
        validationErrors.length > 0 
          ? 'Ошибки валидации:\n' + validationErrors.map((e: any) => `• ${e.msg}`).join('\n')
          : ''
      }`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddValue = () => {
    if (!newValue) return;

    setSettings(prev => {
      const newSettings = { ...prev };
      switch (dialogType) {
        case 'domain':
          if (!prev.parser.blockedDomains.includes(newValue)) {
            newSettings.parser.blockedDomains = [...prev.parser.blockedDomains, newValue];
          }
          break;
        case 'proxy':
          if (!prev.parser.proxySettings.proxyList.includes(newValue)) {
            newSettings.parser.proxySettings.proxyList = [...prev.parser.proxySettings.proxyList, newValue];
          }
          break;
        case 'ip':
          const blockedUntil = blockDuration === null ? null : new Date(Date.now() + blockDuration * 60000).toISOString();
          const newBlockedIP: BlockedIP = {
            ip: newValue,
            reason: blockReason,
            blockedAt: new Date().toISOString(),
            blockedUntil,
          };
          if (!prev.ip.blockedIPs.some(ip => ip.ip === newValue)) {
            newSettings.ip.blockedIPs = [...prev.ip.blockedIPs, newBlockedIP];
          }
          break;
      }
      return newSettings;
    });

    setShowAddDialog(false);
    setNewValue('');
    setBlockReason('');
    setBlockDuration(60);
  };

  const handleRemoveValue = (type: 'domain' | 'proxy' | 'ip', value: string) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      switch (type) {
        case 'domain':
          newSettings.parser.blockedDomains = prev.parser.blockedDomains.filter(d => d !== value);
          break;
        case 'proxy':
          newSettings.parser.proxySettings.proxyList = prev.parser.proxySettings.proxyList.filter(p => p !== value);
          break;
        case 'ip':
          newSettings.ip.blockedIPs = prev.ip.blockedIPs.filter(ip => ip.ip !== value);
          break;
      }
      return newSettings;
    });
  };

  const handleCreateBackup = async () => {
    try {
      setIsCreatingBackup(true);
      await apiService.createBackup();
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    } catch (error) {
      console.error('Ошибка при создании резервной копии:', error);
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleRestoreBackup = async (backupPath: string) => {
    try {
      await apiService.restoreBackup(backupPath);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    } catch (error) {
      console.error('Ошибка при восстановлении из резервной копии:', error);
    }
  };

  const handleDownloadBackup = async (backupPath: string) => {
    try {
      // Извлекаем имя файла из пути
      const filename = backupPath.split('/').pop() || 'backup.tar.gz';
      await apiService.downloadBackup(filename);
    } catch (error) {
      console.error('Ошибка при скачивании резервной копии:', error);
    }
  };

  const handleChange = (path: string, value: any) => {
    const newSettings = { ...settings };
    const keys = path.split('.');
    let current: any = newSettings;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setSettings(newSettings);
  };

  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        color: '#cbd5e1'
      }}>
        <CircularProgress sx={{ mr: 2, color: '#3b82f6' }} />
        <Typography variant="h6">Загрузка настроек...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
        <Alert 
          severity="info" 
          sx={{ 
            backgroundColor: 'rgba(59, 130, 246, 0.1)', 
            border: '1px solid rgba(59, 130, 246, 0.2)',
            color: '#f8fafc',
            '& .MuiAlert-icon': { color: '#3b82f6' }
          }}
        >
          <Typography variant="h6" sx={{ mb: 1 }}>
            ⚙️ Настройки недоступны
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Система настроек находится в разработке. В данный момент отображаются настройки по умолчанию.
          </Typography>
          <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
            {(error as any)?.message || 'Эндпоинт настроек временно недоступен'}
          </Typography>
        </Alert>
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
          Настройки системы
        </Typography>
        <Typography variant="body1" sx={{ color: '#cbd5e1' }}>
          Управление параметрами парсера, IP и резервными копиями
        </Typography>
      </Box>

      {/* Кнопки управления */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
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
            Редактировать настройки
          </Button>
        ) : (
          <>
            <Button
              startIcon={<Save />}
              onClick={handleSave}
              sx={{
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                color: 'white',
                '&:hover': {
                  background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                }
              }}
            >
              Сохранить изменения
            </Button>
            <Button
              onClick={() => setIsEditing(false)}
              sx={{
                borderColor: '#ef4444',
                color: '#ef4444',
                '&:hover': {
                  borderColor: '#dc2626',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                }
              }}
            >
              Отмена
            </Button>
          </>
        )}
      </Box>

      {/* Основной контент */}
      <Paper sx={{ 
        backgroundColor: '#1e293b',
        border: '1px solid rgba(59, 130, 246, 0.1)',
        borderRadius: 3,
      }}>
        <Box sx={{ borderBottom: 1, borderColor: 'rgba(59, 130, 246, 0.1)' }}>
          <Tabs 
            value={currentTab} 
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': {
                color: '#cbd5e1',
                '&.Mui-selected': {
                  color: '#3b82f6',
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#3b82f6',
              },
            }}
          >
            <Tab 
              icon={<Shield />} 
              label="Управление IP" 
              sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}
            />
            <Tab 
              icon={<Backup />} 
              label="Резервные копии" 
              sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}
            />
          </Tabs>
        </Box>

        {/* Управление IP */}
        <TabPanel value={currentTab} index={0}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.ip.autoBlockEnabled}
                    onChange={(e) => handleSettingChange('ip', 'autoBlockEnabled', e.target.checked)}
                    disabled={!isEditing}
                  />
                }
                label="Автоматическая блокировка"
              />
              {settings.ip.autoBlockEnabled && (
                <>
                  <TextField
                    fullWidth
                    label="Максимум запросов в минуту"
                    type="number"
                    value={settings.ip.maxRequestsPerMinute}
                    onChange={(e) => handleSettingChange('ip', 'maxRequestsPerMinute', parseInt(e.target.value))}
                    disabled={!isEditing}
                    margin="normal"
                    helperText="Допустимые значения: от 1 до 1000"
                    inputProps={{ min: 1, max: 1000 }}
                    error={settings.ip.maxRequestsPerMinute < 1 || settings.ip.maxRequestsPerMinute > 1000}
                  />
                  <TextField
                    fullWidth
                    label="Длительность блокировки (мин)"
                    type="number"
                    value={settings.ip.blockDuration}
                    onChange={(e) => handleSettingChange('ip', 'blockDuration', parseInt(e.target.value))}
                    disabled={!isEditing}
                    margin="normal"
                    helperText="Допустимые значения: от 1 до 10080 минут (неделя)"
                    inputProps={{ min: 1, max: 10080 }}
                    error={settings.ip.blockDuration < 1 || settings.ip.blockDuration > 10080}
                  />
                </>
              )}
            </Box>

            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Заблокированные IP
              </Typography>
              <Box sx={{ mb: 3 }}>
                <Button
                  startIcon={<Add />}
                  onClick={() => {
                    setDialogType('ip');
                    setShowAddDialog(true);
                  }}
                  disabled={!isEditing}
                  variant="outlined"
                  sx={{ mb: 2 }}
                >
                  Добавить IP
                </Button>
                <List>
                  {settings.ip.blockedIPs.map((blockedIP) => (
                    <ListItem
                      key={blockedIP.ip}
                      sx={{
                        backgroundColor: 'background.paper',
                        borderRadius: 1,
                        mb: 1,
                      }}
                      secondaryAction={
                        isEditing && (
                          <IconButton
                            edge="end"
                            onClick={() => handleRemoveValue('ip', blockedIP.ip)}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        )
                      }
                    >
                      <ListItemText
                        primary={blockedIP.ip}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {blockedIP.reason}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {blockedIP.blockedUntil 
                                ? `Заблокирован до: ${new Date(blockedIP.blockedUntil).toLocaleString()}`
                                : 'Заблокирован бессрочно'}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Box>
          </Box>
        </TabPanel>

        {/* Резервные копии */}
        <TabPanel value={currentTab} index={1}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.backup.autoBackupEnabled}
                    onChange={(e) => handleSettingChange('backup', 'autoBackupEnabled', e.target.checked)}
                    disabled={!isEditing}
                  />
                }
                label="Автоматическое резервное копирование"
              />
              {settings.backup.autoBackupEnabled && (
                <>
                  <TextField
                    fullWidth
                    label="Расписание (cron)"
                    value={settings.backup.backupSchedule}
                    onChange={(e) => handleSettingChange('backup', 'backupSchedule', e.target.value)}
                    disabled={!isEditing}
                    margin="normal"
                    helperText="Например: 0 0 * * * (ежедневно в полночь)"
                  />
                  <TextField
                    fullWidth
                    label="Срок хранения (дней)"
                    type="number"
                    value={settings.backup.backupRetentionDays}
                    onChange={(e) => handleSettingChange('backup', 'backupRetentionDays', parseInt(e.target.value))}
                    disabled={!isEditing}
                    margin="normal"
                  />
                  <TextField
                    fullWidth
                    label="Путь для сохранения"
                    value={settings.backup.backupLocation}
                    onChange={(e) => handleSettingChange('backup', 'backupLocation', e.target.value)}
                    disabled={!isEditing}
                    margin="normal"
                  />
                </>
              )}
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleCreateBackup}
                  disabled={isCreatingBackup}
                  startIcon={isCreatingBackup ? <CircularProgress size={20} /> : <Add />}
                >
                  {isCreatingBackup ? 'Создание...' : 'Создать резервную копию'}
                </Button>
              </Box>
            </Box>

            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                История резервных копий
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Дата</TableCell>
                      <TableCell>Размер</TableCell>
                      <TableCell>Статус</TableCell>
                      <TableCell>Действия</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {settings.backup.backupHistory.map((backup, index) => (
                      <TableRow key={index}>
                        <TableCell>{backup.date}</TableCell>
                        <TableCell>{(backup.size / 1024 / 1024).toFixed(2)} MB</TableCell>
                        <TableCell>
                          <Chip
                            label={backup.status === 'success' ? 'Успешно' : 'Ошибка'}
                            color={backup.status === 'success' ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleRestoreBackup(backup.path)}
                              color="primary"
                            >
                              <Restore />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDownloadBackup(backup.path)}
                              color="success"
                              title="Скачать резервную копию"
                            >
                              <Download />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>
        </TabPanel>
      </Paper>

      {/* Диалог добавления значения */}
      <Dialog
        open={showAddDialog}
        onClose={() => {
          setShowAddDialog(false);
          setDialogType('domain');
          setNewValue('');
          setBlockReason('');
          setBlockDuration(60);
        }}
        PaperProps={{
          sx: {
            backgroundColor: '#1e293b',
            border: '1px solid rgba(59, 130, 246, 0.1)',
          }
        }}
      >
        <DialogTitle sx={{ color: '#f8fafc' }}>
          {dialogType === 'domain' ? 'Добавить домен' :
           dialogType === 'proxy' ? 'Добавить прокси' :
           'Добавить IP'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              autoFocus
              margin="dense"
              label={
                dialogType === 'domain' ? 'Домен' :
                dialogType === 'proxy' ? 'Прокси' :
                'IP адрес'
              }
              fullWidth
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
            />
            {dialogType === 'ip' && (
              <>
                <TextField
                  margin="dense"
                  label="Причина блокировки"
                  fullWidth
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={blockDuration === null}
                        onChange={(e) => setBlockDuration(e.target.checked ? null : 60)}
                      />
                    }
                    label="Бессрочная блокировка"
                  />
                  {blockDuration !== null && (
                    <TextField
                      margin="dense"
                      label="Длительность блокировки"
                      type="number"
                      value={blockDuration}
                      onChange={(e) => setBlockDuration(Number(e.target.value))}
                      InputProps={{
                        endAdornment: <Typography variant="caption">мин</Typography>,
                      }}
                      sx={{ width: '200px' }}
                    />
                  )}
                </Box>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowAddDialog(false);
              setDialogType('domain');
              setNewValue('');
              setBlockReason('');
              setBlockDuration(60);
            }}
            sx={{ color: '#cbd5e1' }}
          >
            Отмена
          </Button>
          <Button
            onClick={handleAddValue}
            disabled={!newValue || (dialogType === 'ip' && !blockReason)}
            sx={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(135deg, #1d4ed8 0%, #0891b2 100%)',
              }
            }}
          >
            Добавить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings; 