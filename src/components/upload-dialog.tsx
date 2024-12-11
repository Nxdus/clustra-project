"use client"

import * as React from "react";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { UploadCloud, Loader2, FileIcon, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { useDropzone } from 'react-dropzone';
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { useTranslations } from 'next-intl'

const fileSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => ["video/mp4"].includes(file.type), {
      message: "ไฟล์ต้องเป็น MP4 เท่านั้น",
    }),
});

export function UploadDialog({ onUploadComplete }: { onUploadComplete: () => Promise<void> }) {
  const t = useTranslations('video')
  const [file, setFile] = React.useState<File | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const controller = React.useRef<AbortController | null>(null);
  const uploadId = React.useRef<string | null>(null);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const cleanupRef = React.useRef<(() => void) | null>(null);
  const unmountedRef = React.useRef(false);
  const [uploadStatus, setUploadStatus] = React.useState<'idle' | 'uploading' | 'processing' | 'completed' | 'error'>('idle');
  const [isUploadingToServer, setIsUploadingToServer] = React.useState(false);

  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      try {
        fileSchema.parse({ file: selectedFile });
        setFile(selectedFile);
        setError(null);
      } catch (err: unknown) {
        if (err instanceof z.ZodError) {
          setError(err.errors[0].message);
        } else {
          setError("เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ");
        }
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/mp4': ['.mp4']
    },
    maxFiles: 1,
    disabled: isUploading
  });

  const checkUploadStatus = async (uploadId: string) => {
    let isActive = true;
    const intervalRef = setInterval(async () => {
      if (!isActive) return;

      try {
        const response = await fetch(`/api/upload-status?uploadId=${uploadId}`);
        const data = await response.json();

        if (!isActive) return;

        if (data.error) {
          setUploadStatus('error');
          setIsUploading(false);
          toast({
            title: "เกิดข้อผิดพลาด",
            description: data.error,
            variant: "destructive"
          });
          clearInterval(intervalRef);
          return;
        }

        setUploadProgress(data.progress);
        setUploadStatus(data.status);

        if (data.isCompleted) {
          clearInterval(intervalRef);
          setIsUploading(false);
          setIsOpen(false);
          await onUploadComplete();
          toast({
            title: t('toast.upload.success.title'),
            description: t('toast.upload.success.description')
          });
        }
      } catch (error) {
        console.error('Error checking upload status:', error);
        if (isActive) {
          clearInterval(intervalRef);
        }
      }
    }, 1000);

    return () => {
      isActive = false;
      clearInterval(intervalRef);
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setIsUploading(true)
    setIsUploadingToServer(true)

    uploadId.current = Date.now().toString()
    controller.current = new AbortController()

    try {
      cleanupRef.current = await checkUploadStatus(uploadId.current)

      const formData = new FormData()
      formData.append("file", file)
      formData.append("uploadId", uploadId.current)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        signal: controller.current.signal,
      })

      if (!response.ok) {
        const errorData = await response.json()
        
        if (errorData.code === 'UPLOAD_LIMIT_REACHED') {
          toast({
            title: t('toast.upload.limit.title'),
            description: t('toast.upload.limit.description'),
            variant: "destructive"
          })
          setIsOpen(false)
          return
        }
        
        throw new Error(errorData.message || t('upload.uploadError'))
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

    } catch (err) {
      if (err instanceof Error) {
        if (err.name === "AbortError") {
          toast({
            title: t('toast.upload.cancel.title'),
            description: t('toast.upload.cancel.description')
          })
        } else {
          toast({
            title: t('toast.upload.error.title'),
            description: err.message || t('toast.upload.error.description'),
            variant: "destructive"
          })
        }
      }
    } finally {
      if (!unmountedRef.current) {
        setIsUploadingToServer(false)
        setFile(null)
        uploadId.current = null
        if (cleanupRef.current) {
          cleanupRef.current()
          cleanupRef.current = null
        }
      }
    }
  }

  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isUploadingToServer) {
        e.preventDefault();
        e.returnValue = t('upload.leaveConfirm');
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isUploadingToServer, t]);

  React.useEffect(() => {
    return () => {
      if (controller.current) {
        controller.current.abort()
      }
      if (cleanupRef.current) {
        cleanupRef.current()
      }
    }
  }, [])

  React.useEffect(() => {
    unmountedRef.current = false
    return () => {
      unmountedRef.current = true
    }
  }, [])

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!isUploading) {
          setIsOpen(open);
          if (!open) {
            setFile(null);
            setError(null);
          }
        } else {
          const status = uploadStatus === 'processing' ? t('process.wait.converting') : t('process.wait.uploading');
          toast({
            title: t('upload.cannotClose'),
            description: status,
            variant: "destructive"
          });
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-500 transition-all duration-200">
          <UploadCloud className="w-4 h-4 mr-2" />
          {t('upload.button')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-white to-slate-50 dark:from-slate-950 dark:to-slate-900">
        <DialogHeader>
          <DialogTitle id="dialog-title" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            {t('upload.title')}
          </DialogTitle>
          <DialogDescription id="dialog-description">
            {t('upload.description')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div 
            {...getRootProps()} 
            className={cn(
              "border-2 border-dashed rounded-lg p-6 transition-all duration-200 cursor-pointer",
              isDragActive ? "border-blue-500 bg-blue-50 dark:bg-blue-950" : "border-gray-300 dark:border-gray-700",
              isUploading && "opacity-50 cursor-not-allowed"
            )}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <UploadCloud className={cn(
                "w-12 h-12",
                isDragActive ? "text-blue-500" : "text-gray-400"
              )} />
              {file ? (
                <div className="flex items-center space-x-2 bg-blue-100 dark:bg-blue-900 px-3 py-2 rounded-lg">
                  <FileIcon className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300 truncate line-clamp-1 max-w-[200px]">{file.name}</span>
                  {!isUploading && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      className="text-blue-500 hover:text-blue-600 flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{t('upload.dragDrop')}</p>
                    <p className="text-xs text-gray-500">{t('upload.supportedFormats')}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-3 rounded-lg">
              {error}
            </div>
          )}

          {isUploading && (
            <div className="space-y-2">
              <Progress 
                value={uploadProgress} 
                className="h-3 rounded-lg [&>div]:bg-blue-500"
              />
              <p className="text-sm text-center text-muted-foreground">
                {uploadStatus === 'processing' && t('upload.processingStatus', { progress: uploadProgress })}
                {uploadStatus === 'uploading' && t('upload.uploadingStatus', { progress: uploadProgress })}
                {uploadStatus === 'completed' && t('upload.completed')}
              </p>
            </div>
          )}

          <Button
            type="submit"
            disabled={!file || isUploading}
            className="w-full bg-blue-600 hover:bg-blue-500 transition-all duration-200"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {uploadStatus === 'processing' ? t('upload.processing') : t('upload.uploading')}
              </>
            ) : (
              <>
                <FileIcon className="w-4 h-4 mr-2" />
                {t('upload.uploadButton')}
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
} 