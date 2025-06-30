import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { 
  type User, 
  type Domain, 
  type Article, 
  type DashboardData, 
  type LoginRequest, 
  type RegisterRequest,
  type ApiResponse, 
  type PaginatedResponse, 
  type AuthResponse,
  type UserActivity,
  type UserStats,
  type UserLimits,
  type FileUpload,
  type ArticleLike,
} from '../types/api';
import type { SystemSettings as SettingsType, BlockedIP } from '../types/settings';

export type SystemSettings = SettingsType;

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = '/api';
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor для добавления токена
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Логируем запросы создания статей
      if (config.method === 'post' && config.url === '/articles') {
        console.log('🌐 INTERCEPTOR - Создание статьи, данные запроса:', config.data);
        if (config.data && typeof config.data === 'object') {
          console.log('🌐 INTERCEPTOR - Данные планирования:', config.data.scheduling);
        }
      }
      
      return config;
    });

    // Interceptor для обработки ошибок авторизации
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // window.location.href = '/login';
        } else if (error.response?.status === 429) {
          console.warn('⚠️ Rate limit exceeded. Retrying after delay...');
          // Можно добавить логику повторного запроса с задержкой
        }
        return Promise.reject(error);
      }
    );
  }

  // Аутентификация
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response: AxiosResponse<ApiResponse<AuthResponse>> = await this.api.post('/auth/login', credentials);
    return response.data.data!;
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response: AxiosResponse<ApiResponse<AuthResponse>> = await this.api.post('/auth/register', data);
    return response.data.data!;
  }

  async getCurrentUser(): Promise<User> {
    const response: AxiosResponse<ApiResponse<{ user: User }>> = await this.api.get('/auth/me');
    return response.data.data!.user;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.api.put('/auth/change-password', {
      currentPassword,
      newPassword
    });
  }

  async refreshToken(): Promise<AuthResponse> {
    const response: AxiosResponse<ApiResponse<AuthResponse>> = await this.api.post('/auth/refresh');
    return response.data.data!;
  }

  // Дашборд
  async getDashboard(): Promise<DashboardData> {
    const response: AxiosResponse<ApiResponse<DashboardData>> = await this.api.get('/admin/dashboard');
    return response.data.data!;
  }

  // Пользователи
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }): Promise<PaginatedResponse<User>> {
    const response: AxiosResponse<PaginatedResponse<User>> = await this.api.get('/admin/users', { params });
    return response.data;
  }

  async createUser(data: RegisterRequest): Promise<User> {
    const response: AxiosResponse<ApiResponse<User>> = await this.api.post('/admin/users', data);
    return response.data.data!;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const response: AxiosResponse<ApiResponse<User>> = await this.api.put(`/admin/users/${id}`, data);
    return response.data.data!;
  }

  async deleteUser(id: string): Promise<void> {
    await this.api.delete(`/admin/users/${id}`);
  }

  async toggleUserActive(id: string): Promise<User> {
    const response: AxiosResponse<ApiResponse<User>> = await this.api.patch(`/admin/users/${id}/toggle-active`);
    return response.data.data!;
  }

  // Домены
  async getDomains(params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }): Promise<PaginatedResponse<Domain>> {
    const response: AxiosResponse<ApiResponse<{ domains: Domain[], pagination: any }>> = await this.api.get('/domains', { params });
    return {
      success: response.data.success,
      data: response.data.data!.domains,
      pagination: response.data.data!.pagination
    };
  }

  async createDomain(data: Partial<Domain>): Promise<Domain> {
    const response: AxiosResponse<ApiResponse<Domain>> = await this.api.post('/domains', data);
    return response.data.data!;
  }

  async updateDomain(id: string, data: Partial<Domain>): Promise<Domain> {
    const response: AxiosResponse<ApiResponse<Domain>> = await this.api.put(`/domains/${id}`, data);
    return response.data.data!;
  }

  async deleteDomain(id: string): Promise<void> {
    await this.api.delete(`/domains/${id}`);
  }

  async getDomain(id: string): Promise<Domain> {
    const response: AxiosResponse<ApiResponse<Domain>> = await this.api.get(`/domains/${id}`);
    return response.data.data!;
  }

  async toggleDomainActive(id: string): Promise<Domain> {
    const response: AxiosResponse<ApiResponse<Domain>> = await this.api.patch(`/domains/${id}/toggle-active`);
    return response.data.data!;
  }

  async getDomainArticles(id: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Article>> {
    const response: AxiosResponse<PaginatedResponse<Article>> = await this.api.get(`/domains/${id}/articles`, { params });
    return response.data;
  }

  async getPublicDomains(): Promise<Domain[]> {
    const response: AxiosResponse<ApiResponse<Domain[]>> = await this.api.get('/domains/public/list');
    return response.data.data!;
  }

  // Статьи
  async getArticles(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    category?: string;
    author?: string;
    domain?: string;
  }): Promise<PaginatedResponse<Article>> {
    const response: AxiosResponse<ApiResponse<{ articles: Article[], pagination: any }>> = await this.api.get('/articles', { params });
    return {
      success: response.data.success,
      data: response.data.data!.articles,
      pagination: response.data.data!.pagination
    };
  }

  async getMyArticles(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<PaginatedResponse<Article>> {
    const response: AxiosResponse<ApiResponse<{ articles: Article[], pagination: any }>> = await this.api.get('/articles/my/list', { params });
    return {
      success: response.data.success,
      data: response.data.data!.articles,
      pagination: response.data.data!.pagination
    };
  }

  async createArticle(data: Partial<Article>): Promise<Article> {
    console.log('🌐 API Service - Отправляем данные статьи на сервер:', data);
    console.log('🌐 API Service - Данные планирования:', (data as any).scheduling);
    
    const response: AxiosResponse<ApiResponse<Article>> = await this.api.post('/articles', data);
    
    console.log('🌐 API Service - Ответ сервера:', response.data);
    console.log('🌐 API Service - Статус созданной статьи:', response.data.data!.status);
    
    return response.data.data!;
  }

  async updateArticle(id: string, data: Partial<Article>): Promise<Article> {
    const response: AxiosResponse<ApiResponse<Article>> = await this.api.put(`/articles/${id}`, data);
    return response.data.data!;
  }

  async deleteArticle(id: string): Promise<void> {
    await this.api.delete(`/articles/${id}`);
  }

  async getArticle(slug: string): Promise<Article> {
    const response: AxiosResponse<ApiResponse<Article>> = await this.api.get(`/articles/${slug}`);
    return response.data.data!;
  }

  async getArticleForEdit(id: string): Promise<Article> {
    try {
      console.log('🔍 Попытка загрузить статью для редактирования, ID:', id);
      
      // Пробуем получить статью через стандартный endpoint
      const response: AxiosResponse<ApiResponse<Article>> = await this.api.get(`/articles/edit/${id}`);
      console.log('✅ Статья успешно загружена:', response.data);
      return response.data.data!;
    } catch (error: any) {
      console.log('❌ Ошибка при загрузке через /articles/edit/, пробуем альтернативы...', error.response?.status);
      
      if (error.response?.status === 404) {
        // Пробуем через обычный articles endpoint
        try {
          const response: AxiosResponse<ApiResponse<Article>> = await this.api.get(`/articles/${id}`);
          console.log('✅ Статья найдена через /articles/', response.data);
          return response.data.data!;
        } catch (error2: any) {
          console.log('❌ Ошибка /articles/, пробуем /admin/articles/', error2.response?.status);
          
          // Пробуем через admin endpoint
          try {
            const response: AxiosResponse<ApiResponse<Article>> = await this.api.get(`/admin/articles/${id}`);
            console.log('✅ Статья найдена через /admin/articles/', response.data);
    return response.data.data!;
          } catch (error3: any) {
            console.log('❌ Ошибка /admin/articles/', error3.response?.status);
            
            // Последняя попытка - через getMyArticles и поиск по ID
            try {
              console.log('🔍 Пробуем найти статью через getMyArticles...');
              const myArticlesResponse = await this.getMyArticles({ limit: 1000 });
              const foundArticle = myArticlesResponse.data.find((article: Article) => article._id === id);
              
              if (foundArticle) {
                console.log('✅ Статья найдена в списке пользователя:', foundArticle);
                return foundArticle;
              }
              
              throw new Error(`Статья с ID ${id} не найдена`);
            } catch (error4: any) {
              console.error('❌ Все попытки загрузки статьи не удались:', error4);
              throw new Error(`Не удается загрузить статью с ID ${id}. Проверьте правильность ID или обратитесь к администратору.`);
            }
          }
        }
      } else {
        throw error;
      }
    }
  }

  async likeArticle(id: string): Promise<ArticleLike> {
    const response: AxiosResponse<ApiResponse<ArticleLike>> = await this.api.post(`/articles/${id}/like`);
    return response.data.data!;
  }

  async getArticleCategories(): Promise<string[]> {
    const response: AxiosResponse<ApiResponse<string[]>> = await this.api.get('/articles/meta/categories');
    return response.data.data!;
  }

  async getPopularArticles(params?: {
    limit?: number;
    days?: number;
  }): Promise<Article[]> {
    const response: AxiosResponse<ApiResponse<Article[]>> = await this.api.get('/articles/meta/popular', { params });
    return response.data.data!;
  }

  // Администрирование статей
  async getAdminArticles(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    category?: string;
    author?: string;
    domain?: string;
  }): Promise<PaginatedResponse<Article>> {
    const response: AxiosResponse<ApiResponse<{ articles: Article[], pagination: any }>> = await this.api.get('/admin/articles', { params });
    return {
      success: response.data.success,
      data: response.data.data!.articles,
      pagination: response.data.data!.pagination
    };
  }

  async deleteAdminArticle(id: string): Promise<void> {
    await this.api.delete(`/admin/articles/${id}`);
  }

  // Загрузка файлов
  async uploadImage(file: File): Promise<FileUpload> {
    const formData = new FormData();
    formData.append('image', file);
    
    const response: AxiosResponse<ApiResponse<FileUpload>> = await this.api.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data!;
  }

  async uploadVideo(file: File): Promise<FileUpload> {
    const formData = new FormData();
    formData.append('video', file);
    
    const response: AxiosResponse<ApiResponse<FileUpload>> = await this.api.post('/upload/video', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data!;
  }

  async deleteFile(filename: string): Promise<void> {
    await this.api.delete(`/upload/delete/${filename}`);
  }

  async uploadMultipleImages(files: File[]): Promise<FileUpload[]> {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    
    const response: AxiosResponse<ApiResponse<FileUpload[]>> = await this.api.post('/upload/multiple-images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data!;
  }

  async getUploadedFiles(): Promise<{ files: string[] }> {
    const response: AxiosResponse<ApiResponse<{ files: string[] }>> = await this.api.get('/upload/files');
    return response.data.data!;
  }

  // Статистика пользователей
  async getUserDashboard(): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/user/dashboard');
    return response.data.data!;
  }

  async getUserProfile(): Promise<User> {
    const response: AxiosResponse<ApiResponse<User>> = await this.api.get('/user/profile');
    return response.data.data!;
  }

  async updateUserProfile(data: Partial<User>): Promise<User> {
    const response: AxiosResponse<ApiResponse<User>> = await this.api.put('/user/profile', data);
    return response.data.data!;
  }

  async getAllowedDomains(): Promise<Domain[]> {
    const response: AxiosResponse<ApiResponse<{ domains: Domain[] }>> = await this.api.get('/user/allowed-domains');
    return response.data.data!.domains;
  }

  async getUserArticleStats(): Promise<UserStats> {
    const response: AxiosResponse<ApiResponse<UserStats>> = await this.api.get('/user/articles/stats');
    return response.data.data!;
  }

  async getUserActivity(params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<UserActivity>> {
    const response: AxiosResponse<PaginatedResponse<UserActivity>> = await this.api.get('/user/activity', { params });
    return response.data;
  }

  async getUserLimits(): Promise<UserLimits> {
    const response: AxiosResponse<ApiResponse<UserLimits>> = await this.api.get('/user/limits');
    return response.data.data!;
  }

  // Settings (для super_admin)
  async updateDomainSettings(domainId: string, settings: any): Promise<Domain> {
    const response: AxiosResponse<ApiResponse<Domain>> = await this.api.put(`/domains/${domainId}`, { settings });
    return response.data.data!;
  }

  async getSystemSettings(): Promise<any> {
    // В реальной системе это может быть отдельный endpoint для системных настроек
    // Пока возвращаем настройки из доменов
    const response: AxiosResponse<PaginatedResponse<Domain>> = await this.api.get('/domains');
    return { domains: response.data.data };
  }

  // Methods for Profile component
  async getProfile(): Promise<User> {
    return this.getUserProfile();
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    return this.updateUserProfile(data);
  }

  // Methods for Settings component
  async getSettings(): Promise<SystemSettings> {
    try {
      console.log('🔍 Загружаем настройки системы...');
      const response: AxiosResponse<ApiResponse<SystemSettings>> = await this.api.get('/admin/settings');
      console.log('✅ Настройки успешно загружены:', response.data.data);
      return response.data.data!;
    } catch (error: any) {
      console.error('❌ Ошибка загрузки настроек:', error);
      throw error;
    }
  }

  async updateSettings(settings: SystemSettings): Promise<SystemSettings> {
    try {
      console.log('🔄 Обновляем настройки системы...', settings);
      const response: AxiosResponse<ApiResponse<SystemSettings>> = await this.api.put('/admin/settings', settings);
      console.log('✅ Настройки успешно обновлены:', response.data.data);
      return response.data.data!;
    } catch (error: any) {
      console.error('❌ Ошибка обновления настроек:', error);
      throw error;
    }
  }

  // Резервные копии
  async createBackup(): Promise<{ path: string; date: string }> {
    const response = await this.api.post('/admin/backup/create');
    return response.data;
  }

  async restoreBackup(backupPath: string): Promise<void> {
    await this.api.post('/admin/backup/restore', { path: backupPath });
  }

  async getBackupHistory(): Promise<{
    date: string;
    size: number;
    status: 'success' | 'failed';
    path: string;
  }[]> {
    const response = await this.api.get('/admin/backup/history');
    return response.data;
  }

  async downloadBackup(filename: string): Promise<void> {
    const response = await this.api.get(`/admin/backup/download/${filename}`, {
      responseType: 'blob',
    });
    
    // Создаем URL для скачивания
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  // Управление IP
  async blockIP(ip: string, duration: number | null, reason: string): Promise<void> {
    await this.api.post('/admin/ip/block', { 
      ip, 
      duration, // null для бессрочной блокировки
      reason 
    });
  }

  async unblockIP(ip: string): Promise<void> {
    await this.api.post('/admin/ip/unblock', { ip });
  }

  async getBlockedIPs(): Promise<BlockedIP[]> {
    const response = await this.api.get('/admin/ip/blocked');
    return response.data;
  }



  async addBlockedDomain(domain: string): Promise<void> {
    await this.api.post('/admin/parser/block-domain', { domain });
  }

  async removeBlockedDomain(domain: string): Promise<void> {
    await this.api.post('/admin/parser/unblock-domain', { domain });
  }

  async updateProxyList(proxies: string[]): Promise<void> {
    await this.api.put('/admin/parser/proxies', { proxies });
  }

  // Новые методы для парсера новостей
  async getParserSettings(): Promise<any> {
    const response = await this.api.get('/admin/parser/settings');
    return response.data;
  }

  async updateParserSettings(settings: any): Promise<any> {
    const response = await this.api.put('/admin/parser/settings', settings);
    return response.data;
  }

  async getParserStatus(): Promise<any> {
    const response = await this.api.get('/admin/parser/status');
    return response.data.data;
  }

  async runParser(count?: number): Promise<any> {
    const response = await this.api.post('/admin/parser/run', { count });
    return response.data.data;
  }

  async testParser(count: number): Promise<any> {
    const response = await this.api.get(`/admin/parser/test?count=${count}`);
    return response.data.data;
  }

  async getParserHistory(params?: { page?: number; limit?: number }): Promise<any> {
    const response = await this.api.get('/admin/parser/history', { params });
    return response.data.data;
  }

  async toggleParser(enabled: boolean): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/admin/parser/toggle', { enabled });
    return response.data.data!;
  }

  // SEO и Sitemap
  async refreshSitemap(): Promise<{ success: boolean; message: string; timestamp: string }> {
    const response: AxiosResponse<ApiResponse<{ success: boolean; message: string; timestamp: string }>> = await this.api.post('/sitemap/refresh');
    return response.data.data!;
  }

  // Админские методы для управления лайками и комментариями
  async getArticleLikes(articleId: string): Promise<{ totalLikes: number; stats: any }> {
    const response: AxiosResponse<{ articleId: string; totalLikes: number; userLiked: boolean; stats: any }> = await this.api.get(`/likes/article/${articleId}`);
    return { totalLikes: response.data.totalLikes, stats: response.data.stats };
  }

  async getArticleComments(articleId: string, params?: { page?: number; limit?: number }): Promise<{
    comments: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const response: AxiosResponse<{
      comments: any[];
      total: number;
      page: number;
      totalPages: number;
    }> = await this.api.get(`/comments/article/${articleId}`, { params });
    return response.data;
  }

  async updateArticleLikes(articleId: string, likes: { real?: number; fake?: number }): Promise<void> {
    await this.api.put(`/admin/articles/${articleId}/likes`, likes);
  }

  async addAdminComment(articleId: string, data: { userEmail: string; text: string }): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post(`/admin/articles/${articleId}/comments`, {
      userId: 'admin',
      userEmail: data.userEmail,
      text: data.text
    });
    return response.data.data!;
  }

  async deleteAdminComment(commentId: string): Promise<void> {
    await this.api.delete(`/admin/comments/${commentId}`);
  }

  async updateArticleStats(articleId: string, stats: {
    likes?: { total?: number; real?: number; fake?: number };
    comments?: { total?: number; real?: number; fake?: number };
  }): Promise<void> {
    await this.api.put(`/admin/articles/${articleId}/stats`, stats);
  }

  /*
   * ПОДКЛЮЧЕННЫЕ ЭНДПОИНТЫ БЭКЕНДА:
   * 
   * AUTH ROUTES (/auth):
   * ✅ POST /auth/register - register()
   * ✅ POST /auth/login - login()
   * ✅ GET /auth/me - getCurrentUser()
   * ✅ PUT /auth/change-password - changePassword()
   * ✅ POST /auth/refresh - refreshToken()
   * 
   * ADMIN ROUTES (/admin):
   * ✅ GET /admin/dashboard - getDashboard()
   * ✅ GET /admin/users - getUsers()
   * ✅ POST /admin/users - createUser()
   * ✅ PUT /admin/users/:id - updateUser()
   * ✅ PATCH /admin/users/:id/toggle-active - toggleUserActive()
   * ✅ DELETE /admin/users/:id - deleteUser()
   * ✅ GET /admin/articles - getAdminArticles()
   * ✅ DELETE /admin/articles/:id - deleteAdminArticle()
   * 
   * DOMAIN ROUTES (/domains):
   * ✅ GET /domains - getDomains()
   * ✅ POST /domains - createDomain()
   * ✅ GET /domains/:id - getDomain()
   * ✅ PUT /domains/:id - updateDomain()
   * ✅ PATCH /domains/:id/toggle-active - toggleDomainActive()
   * ✅ DELETE /domains/:id - deleteDomain()
   * ✅ GET /domains/:id/articles - getDomainArticles()
   * ✅ GET /domains/public/list - getPublicDomains()
   * 
   * ARTICLE ROUTES (/articles):
   * ✅ GET /articles/meta/categories - getArticleCategories()
   * ✅ GET /articles/meta/popular - getPopularArticles()
   * ✅ GET /articles/my/list - getMyArticles()
   * ✅ GET /articles - getArticles()
   * ✅ GET /articles/:slug - getArticle()
   * ✅ POST /articles - createArticle()
   * ✅ GET /articles/:id/edit - getArticleForEdit()
   * ✅ PUT /articles/:id - updateArticle()
   * ✅ DELETE /articles/:id - deleteArticle()
   * ✅ POST /articles/:id/like - likeArticle()
   * 
   * UPLOAD ROUTES (/upload):
   * ✅ POST /upload/image - uploadImage()
   * ✅ POST /upload/video - uploadVideo()
   * ✅ POST /upload/multiple-images - uploadMultipleImages()
   * ✅ DELETE /upload/delete/:filename - deleteFile()
   * ✅ GET /upload/files - getUploadedFiles()
   * 
   * USER ROUTES (/user):
   * ✅ GET /user/dashboard - getUserDashboard()
   * ✅ GET /user/profile - getUserProfile()
   * ✅ PUT /user/profile - updateUserProfile()
   * ✅ GET /user/allowed-domains - getAllowedDomains()
   * ✅ GET /user/articles/stats - getUserArticleStats()
   * ✅ GET /user/activity - getUserActivity()
   * ✅ GET /user/limits - getUserLimits()
   */
}

export const apiService = new ApiService();
export default apiService; 