"use client"

import * as React from "react";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { UploadCloud, Loader2, FileIcon, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { useDropzone } from 'react-dropzone';
import { cn } from "@/lib/utils";
// Dialog, DialogContent, etc. คือ component UI ของคุณเอง
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";

const fileSchema = z.object({
  file: z
    .any()
    .refine((file): file is File => file instanceof File, {
      message: "ต้องเป็นไฟล์เท่านั้น",
    })
    .refine((file: File) => ["video/mp4"].includes(file.type), {
      message: "ไฟล์ต้องเป็น MP4 เท่านั้น",
    }),
});

export function UploadDialog({ onUploadComplete }: { onUploadComplete: () => Promise<void> }) {
  const [file, setFile] = React.useState<File | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [uploadStatus, setUploadStatus] = React.useState<string>('idle');
  const [jobId, setJobId] = React.useState<string | null>(null);

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
    accept: { 'video/mp4': ['.mp4'] },
    maxFiles: 1,
    disabled: isUploading
  });

  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (jobId) {
      interval = setInterval(async () => {
        const res = await fetch(`/api/upload-status?jobId=${jobId}`);
        const data = await res.json();
        if (data.error) {
          setUploadStatus('error');
          setIsUploading(false);
          toast({
            title: "เกิดข้อผิดพลาด",
            description: data.error,
            variant: "destructive"
          });
          if (interval) clearInterval(interval);
          return;
        }

        setUploadStatus(data.status);
        setUploadProgress(data.progress);

        if (data.isCompleted) {
          if (interval) clearInterval(interval);
          setIsUploading(false);
          setIsOpen(false);
          await onUploadComplete();
          toast({
            title: "อัปโหลดสำเร็จ",
            description: "ไฟล์ของคุณพร้อมใช้งานแล้ว"
          });
        }
      }, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [jobId, onUploadComplete]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('pending');
    setUploadProgress(0);

    const uploadId = Date.now().toString();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("uploadId", uploadId);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Upload error");
      }

      const data = await response.json();
      setJobId(data.jobId);

      toast({
        title: "อัปโหลดสำเร็จ",
        description: "ระบบกำลังประมวลผลไฟล์ของคุณ กรุณารอสักครู่..."
      });

    } catch (err: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: err.message,
        variant: "destructive"
      });
      setIsUploading(false);
      setJobId(null);
    } finally {
      setFile(null);
    }
  }

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
          toast({
            title: "ไม่สามารถปิดได้",
            description: "งานกำลังอัปโหลดหรือประมวลผลอยู่",
            variant: "destructive"
          });
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-500 transition-all duration-200">
          <UploadCloud className="w-4 h-4 mr-2" />
          อัปโหลดวิดีโอ
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-white to-slate-50 dark:from-slate-950 dark:to-slate-900">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            อัปโหลดวิดีโอ
          </DialogTitle>
          <DialogDescription>
            เลือกไฟล์ MP4 ที่ต้องการอัปโหลด
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
                    <p className="text-sm font-medium">ลากและวางไฟล์ที่นี่ หรือคลิกเพื่อเลือก</p>
                    <p className="text-xs text-gray-500">รองรับเฉพาะ MP4</p>
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
                กำลังประมวลผล... {Math.round(uploadProgress)}%
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
                กำลังอัปโหลด...
              </>
            ) : (
              <>
                <FileIcon className="w-4 h-4 mr-2" />
                อัปโหลด
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}