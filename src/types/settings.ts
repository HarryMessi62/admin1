export interface ParserSettings {
  maxConcurrentRequests: number;
  requestTimeout: number;
  articlesPerDay: number;
  allowedDomains: string[];
  blockedDomains: string[];
  proxySettings: {
    enabled: boolean;
    proxyList: string[];
    rotationInterval: number;
  };
}

export interface BlockedIP {
  ip: string;
  blockedUntil: string | null;
  reason: string;
  blockedAt: string;
}

export interface IPSettings {
  blockedIPs: BlockedIP[];
  autoBlockEnabled: boolean;
  maxRequestsPerMinute: number;
  blockDuration: number;
  whitelistedIPs: string[];
}

export interface BackupSettings {
  autoBackupEnabled: boolean;
  backupSchedule: string; // cron expression
  backupRetentionDays: number;
  backupLocation: string;
  lastBackupDate?: string;
  backupHistory: {
    date: string;
    size: number;
    status: 'success' | 'failed';
    path: string;
  }[];
}

export interface SystemSettings {
  parser: ParserSettings;
  ip: IPSettings;
  backup: BackupSettings;
} 