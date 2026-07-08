export interface SubFile {
  id: string;
  filename: string;
  originalName: string;
  fileType: string;
  fileSize: number;
}

export interface FileMetadata {
  id: string;
  code: string;
  filename: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  files?: SubFile[];
  expiry: string; // ISO date string
  expiryDuration: string; // descriptive duration e.g. "10 Minutes"
  downloadLimit: number | null; // null for unlimited
  downloadCount: number;
  createdAt: string; // ISO date string
  status: 'active' | 'expired';
  isPasswordProtected: boolean;
  deleteToken: string;
}

export interface AdminStats {
  totalFiles: number;
  activeFiles: number;
  expiredFiles: number;
  totalSize: number; // in bytes
  totalDownloads: number;
}

export interface AutoHealLog {
  timestamp: string;
  type: 'database_corruption' | 'storage_mismatch' | 'expired_cleanup' | 'integrity_verification';
  description: string;
  repaired: boolean;
}

export interface AutoHealStatus {
  status: string;
  engineActive: boolean;
  systemIntegrity: string;
  metrics: {
    databaseNodeCount: number;
    diskFileBlockCount: number;
    verifiedAt: string;
  };
  logs: AutoHealLog[];
}
