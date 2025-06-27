import { useState } from 'react';
import apiService from '../services/api';

interface UseImageUploadReturn {
  uploadImage: (file: File) => Promise<string>;
  isUploading: boolean;
  error: string | null;
  clearError: () => void;
}

export const useImageUpload = (): UseImageUploadReturn => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = async (file: File): Promise<string> => {
    setIsUploading(true);
    setError(null);

    try {
      // Проверка типа файла
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Поддерживаются только изображения формата JPG, PNG, GIF, WebP');
      }

      // Проверка размера файла (максимум 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB в байтах
      if (file.size > maxSize) {
        throw new Error('Размер файла не должен превышать 10MB');
      }

      const result = await apiService.uploadImage(file);
      
      // Если URL не содержит домен, добавляем базовый URL сервера
      const fullUrl = result.url.startsWith('http') 
        ? result.url 
        : `https://infocryptox.com${result.url}`;
      
      return fullUrl;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Ошибка загрузки изображения';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    uploadImage,
    isUploading,
    error,
    clearError,
  };
}; 