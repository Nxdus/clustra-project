interface UploadStatus {
    progress: number;
    status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
    error?: string;
  }
  
  interface GlobalWithUploadStatus {
    uploadStatus?: Map<string, UploadStatus>;
  }
  
  const globalUploadStatus = global as unknown as GlobalWithUploadStatus;
  if (!globalUploadStatus.uploadStatus) {
    globalUploadStatus.uploadStatus = new Map<string, UploadStatus>();
  }
  
  const uploadStatus = globalUploadStatus.uploadStatus;
  
  export function updateProgress(uploadId: string, progress: number, status: UploadStatus['status'] = 'processing') {
    uploadStatus.set(uploadId, { progress, status });
  }
  
  export function setError(uploadId: string, error: string) {
    uploadStatus.set(uploadId, { progress: 0, status: 'error', error });
  }
  
  export function clearProgress(uploadId: string) {
    uploadStatus.delete(uploadId);
  }
  
  export function getUploadStatus(uploadId: string): UploadStatus | undefined {
    return uploadStatus.get(uploadId);
  }