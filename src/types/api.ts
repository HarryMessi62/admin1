// API Types based on BackNews backend

export interface User {
  _id: string;
  username: string;
  email: string;
  role: 'super_admin' | 'user_admin';
  isActive: boolean;
  restrictions: {
    maxArticles: number;
    canDelete: boolean;
    canEdit: boolean;
    allowedDomains: string[];
  };
  stats: {
    totalArticles: number;
    lastLogin: string | null;
    loginCount: number;
  };
  accessExpiresAt?: string | null;
  profile: {
    firstName?: string;
    lastName?: string;
    description?: string;
    avatar?: string;
  };
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  articleCount?: number;
}

export interface Domain {
  _id: string;
  name: string;
  url: string;
  description?: string;
  isActive: boolean;
  settings: {
    indexationKey?: string;
    indexationBoost?: number;
    theme?: 'light' | 'dark' | 'auto';
    commentsEnabled?: boolean;
    allowFakePosts?: boolean;
  };
  stats: {
    totalArticles: number;
    totalViews: number;
    totalLikes: number;
  };
  createdAt: string;
}

export interface Article {
  _id: string;
  title: string;
  slug: string;
  content?: string;
  excerpt?: string;
  category: 'Crypto' | 'Cryptocurrencies' | 'Bitcoin' | 'Ethereum' | 'Technology' | 'Politics' | 'Economy' | 'Sports' | 'Entertainment' | 'Science' | 'Health' | 'Business' | 'World' | 'Local' | 'Opinion' | 'Other';
  tags: string[];
  hashtags: string[];
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  author?: User | null;
  domain: (Domain | string)[];
  formatting?: {
    textAlign?: string;
    fontSize?: string;
    fontFamily?: string;
    lineHeight?: string;
  };
  media?: {
    featuredImage?: {
      url?: string;
      alt?: string;
    };
    gallery?: Array<{ _id: string; id: string }>;
    videos?: Array<{ _id: string; id: string }>;
  };
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  stats: {
    views: {
      real: number;
      fake: number;
      total: number;
    };
    likes: {
      real: number;
      fake: number;
      total: number;
    };
    shares: {
      real: number;
      fake: number;
      total: number;
    };
    comments: {
      real: number;
      fake: number;
      total: number;
    };
    rating: number;
  };
  settings?: {
    commentsEnabled?: boolean;
    likesEnabled?: boolean;
    sharingEnabled?: boolean;
    indexationKey?: string;
    indexationBoost?: number;
  };
  publishedAt?: string;
  scheduledAt?: string | null;
  createdAt: string;
  updatedAt: string;
  version?: number;
  url?: string;
  readingTime?: number;
  id: string;
}

export interface DashboardData {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalArticles: number;
    publishedArticles: number;
    totalDomains: number;
    activeDomains: number;
    todayViews: number;
  };
  trends: {
    newUsersLastMonth: number;
    newArticlesLastMonth: number;
    monthlyStats?: Array<{
      name: string;
      users: number;
      articles: number;
    }>;
  };
  topAuthors: User[];
  topDomains: Domain[];
  monthlyViewsStats: Array<{
    _id: {
      year: number;
      month: number;
    };
    views: number;
  }>;
  recentArticles: Array<{
    _id: string;
    title: string;
    status: string;
    stats: {
      views: {
        total: number;
      };
      comments: {
        total: number;
      };
    };
    createdAt: string;
    publishedAt?: string;
    author: {
      username: string;
      email: string;
    };
    domain: {
      name: string;
      url: string;
    };
  }>;
}

export interface LoginRequest {
  login: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role?: 'user_admin';
  restrictions?: {
    maxArticles?: number;
    canDelete?: boolean;
    canEdit?: boolean;
    allowedDomains?: string[];
  };
  profile?: {
    description?: string;
  };
  accessExpiresAt?: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface UserActivity {
  _id: string;
  user: string;
  action: string;
  targetType?: string;
  targetId?: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

export interface UserStats {
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  totalViews: number;
  totalLikes: number;
  articlesThisMonth: number;
  averageViewsPerArticle: number;
}

export interface UserLimits {
  maxArticles: number;
  usedArticles: number;
  remainingArticles: number;
  canDelete: boolean;
  canEdit: boolean;
  allowedDomains: Domain[];
}

export interface FileUpload {
  url: string;
  filename: string;
}

export interface ArticleLike {
  liked: boolean;
  totalLikes: number;
}

// === Crypto ===
export interface CryptoPrice {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  marketCap?: number;
} 