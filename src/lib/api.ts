import { FileMetadata, AdminStats, AutoHealStatus } from "../types";

export const formatBytes = (bytes: number, decimals = 1): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const uploadFile = async (
  files: File | File[],
  expiry: string,
  downloadLimit: string,
  password?: string,
  codeType: 'numeric' | 'alphanumeric' = 'numeric',
  onProgress?: (percent: number, speed: string, eta: string) => void
): Promise<{ file: FileMetadata; deleteToken: string }> => {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    if (Array.isArray(files)) {
      files.forEach(f => {
        formData.append('files', f);
      });
    } else {
      formData.append('files', files);
    }
    formData.append('expiry', expiry);
    formData.append('downloadLimit', downloadLimit);
    if (password) formData.append('password', password);
    formData.append('codeType', codeType);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload', true);

    const startTime = Date.now();

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100);
        const now = Date.now();
        const duration = (now - startTime) / 1000; // in seconds
        
        if (duration > 0) {
          const speedBps = e.loaded / duration; // bytes per second
          const speedStr = formatSpeed(speedBps);
          
          const remainingBytes = e.total - e.loaded;
          const etaSecs = Math.round(remainingBytes / speedBps);
          const etaStr = etaSecs > 60 
            ? `${Math.floor(etaSecs / 60)}m ${etaSecs % 60}s` 
            : `${etaSecs}s`;
            
          onProgress(percent, speedStr, etaStr);
        } else {
          onProgress(percent, "Calculating...", "Calculating...");
        }
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          resolve(res);
        } catch (err) {
          reject(new Error("Failed to parse upload response."));
        }
      } else {
        try {
          const errorRes = JSON.parse(xhr.responseText);
          reject(new Error(errorRes.error || "Upload failed."));
        } catch (err) {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network connection error."));
    };

    xhr.send(formData);
  });
};

const formatSpeed = (bps: number): string => {
  if (bps > 1024 * 1024) {
    return `${(bps / (1024 * 1024)).toFixed(1)} MB/s`;
  }
  return `${(bps / 1024).toFixed(1)} KB/s`;
};

// Fetch single file info
export const fetchFileInfo = async (code: string): Promise<FileMetadata> => {
  const res = await fetch(`/api/file/${encodeURIComponent(code)}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Error ${res.status}: Failed to load file.`);
  }
  return res.json();
};

// Request/Trigger download stream
export const downloadFile = async (code: string, password?: string, fileId?: string): Promise<void> => {
  const res = await fetch(`/api/download/${encodeURIComponent(code)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ password, fileId })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Download failed.');
  }

  // Handle the response as a file stream trigger
  const disposition = res.headers.get('Content-Disposition');
  let filename = 'download';
  if (disposition && disposition.indexOf('attachment') !== -1) {
    const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
    const matches = filenameRegex.exec(disposition);
    if (matches != null && matches[1]) { 
      filename = decodeURIComponent(matches[1].replace(/['"]/g, ''));
    }
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

// Delete early using code & deleteToken
export const deleteFileEarly = async (code: string, deleteToken: string): Promise<void> => {
  const res = await fetch(`/api/file/delete/${encodeURIComponent(code)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ deleteToken })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to delete file.');
  }
};

// Get Admin stats and logs
export const fetchAdminStats = async (): Promise<{ stats: AdminStats; files: FileMetadata[] }> => {
  const res = await fetch('/api/admin/stats');
  if (!res.ok) {
    throw new Error('Failed to retrieve admin stats.');
  }
  return res.json();
};

// Admin delete file override
export const adminDeleteFile = async (code: string): Promise<void> => {
  const res = await fetch(`/api/admin/file/${encodeURIComponent(code)}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to delete file by admin.');
  }
};

// Get real-time system self-healing statistics
export const fetchAutoHealStatus = async (): Promise<AutoHealStatus> => {
  const res = await fetch('/api/health/auto-heal');
  if (!res.ok) {
    throw new Error('Failed to retrieve self-healing metrics.');
  }
  return res.json();
};
