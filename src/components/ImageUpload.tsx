import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
} from '@mui/icons-material';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string, file?: File) => void;
  label?: string;
  helperText?: string;
  error?: boolean;
  disabled?: boolean;
  onError?: (error: string) => void;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  label = 'Загрузить изображение',
  helperText,
  error = false,
  disabled = false,
  onError,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>(value || '');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((file: File) => {
    setIsLoading(true);
    
    // Проверка типа файла
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      onError?.('Поддерживаются только изображения формата JPG, PNG, GIF, WebP');
      setIsLoading(false);
      return;
    }

    // Проверка размера файла (максимум 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      onError?.('Размер файла не должен превышать 10MB');
      setIsLoading(false);
      return;
    }

    // Создание локального URL для предпросмотра
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setIsLoading(false);
    
    // Вызываем onChange с локальным URL и файлом
    onChange(localUrl, file);
  }, [onChange, onError]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled || isLoading) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [disabled, isLoading, handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isLoading) {
      setIsDragOver(true);
    }
  }, [disabled, isLoading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleClick = useCallback(() => {
    if (!disabled && !isLoading) {
      fileInputRef.current?.click();
    }
  }, [disabled, isLoading]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleRemoveImage = useCallback(() => {
    setPreviewUrl('');
    onChange('');
    
    // Очищаем input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onChange]);

  // Обновляем previewUrl при изменении value
  React.useEffect(() => {
    if (value !== previewUrl) {
      setPreviewUrl(value || '');
    }
  }, [value]);

  return (
    <Box sx={{ mb: 2 }}>
      {label && (
        <Typography variant="subtitle1" sx={{ mb: 1, color: '#cbd5e1' }}>
          {label}
        </Typography>
      )}
      
      <Paper
        sx={{
          p: 3,
          border: `2px dashed ${
            error ? '#f87171' : 
            isDragOver ? '#3b82f6' : 
            'rgba(59, 130, 246, 0.3)'
          }`,
          backgroundColor: isDragOver ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
          cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: disabled || isLoading ? undefined : 'rgba(59, 130, 246, 0.1)',
            borderColor: disabled || isLoading ? undefined : '#3b82f6',
          },
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
          disabled={disabled || isLoading}
        />

        {isLoading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={40} />
            <Typography variant="body2" color="text.secondary">
              Обработка изображения...
            </Typography>
          </Box>
        ) : previewUrl ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                position: 'relative',
                maxWidth: 300,
                maxHeight: 200,
                overflow: 'hidden',
                borderRadius: 1,
                border: '1px solid rgba(59, 130, 246, 0.2)',
              }}
            >
              <img
                src={previewUrl}
                alt="Preview"
                style={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: 200,
                  objectFit: 'contain',
                }}
              />
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage();
                }}
                size="small"
                sx={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                  },
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Нажмите для изменения изображения
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CloudUploadIcon sx={{ fontSize: 48, color: '#64748b' }} />
            <Typography variant="h6" color="text.secondary" textAlign="center">
              Перетащите изображение сюда
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              или
            </Typography>
            <Button
              variant="outlined"
              startIcon={<ImageIcon />}
              onClick={(e) => e.stopPropagation()}
              sx={{
                borderColor: 'rgba(59, 130, 246, 0.3)',
                color: '#3b82f6',
                '&:hover': {
                  borderColor: '#3b82f6',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                },
              }}
            >
              Выбрать файл
            </Button>
          </Box>
        )}
      </Paper>

      {helperText && (
        <Typography variant="caption" sx={{ mt: 1, display: 'block', color: '#94a3b8' }}>
          {helperText}
        </Typography>
      )}
    </Box>
  );
}; 