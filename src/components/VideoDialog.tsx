import * as React from "react"
import Hls, { ErrorData, Events } from 'hls.js'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogPortal, DialogDescription } from "./ui/dialog"
import { Button } from "./ui/button"
import { Play, Copy } from "lucide-react"
import { Video } from "@/types/video"
import { toast } from "@/hooks/use-toast"
import { useTranslations, useLocale } from 'next-intl'

interface VideoPlayerProps {
    video: Video;
    onError?: (error: Error) => void;
}

const VideoPlayer = React.memo(({ video, onError }: VideoPlayerProps) => {
    const videoRef = React.useRef<HTMLVideoElement>(null);
    const hlsRef = React.useRef<Hls | null>(null);
    const abortControllerRef = React.useRef<AbortController | null>(null);

    React.useEffect(() => {
        const videoElement = videoRef.current;
        if (!videoElement) return;

        // สร้าง AbortController สำหรับยกเลิก fetch
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        const videoUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/stream/${video.id}`;

        try {
            if (Hls.isSupported()) {
                const hls = new Hls({
                    enableWorker: true,
                    startLevel: -1,
                    maxBufferLength: 30,
                    maxBufferSize: 60 * 1000 * 1000,
                    manifestLoadingTimeOut: 10000,
                    manifestLoadingMaxRetry: 2,
                    levelLoadingTimeOut: 10000,
                    levelLoadingMaxRetry: 2,
                    fragLoadingTimeOut: 20000,
                    fragLoadingMaxRetry: 2,
                    // เพิ่ม xhrSetup เพื่อใช้ AbortController
                    xhrSetup: (xhr, url) => {
                        xhr.addEventListener('abort', () => {
                            console.log('XHR Aborted:', url);
                        });
                        signal.addEventListener('abort', () => {
                            xhr.abort();
                        });
                    }
                });

                hlsRef.current = hls;

                const handleError = (event: Events.ERROR, data: ErrorData) => {
                    if (signal.aborted) return;

                    if (data.fatal) {
                        switch (data.type) {
                            case Hls.ErrorTypes.NETWORK_ERROR:
                                hls.startLoad();
                                break;
                            case Hls.ErrorTypes.MEDIA_ERROR:
                                hls.recoverMediaError();
                                break;
                            default:
                                if (onError) {
                                    onError(new Error('เกิดข้อผิดพลาดในการเล่นวิดีโอ'));
                                }
                                break;
                        }
                    }
                };

                hls.on(Hls.Events.ERROR, handleError);
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    if (!signal.aborted) {
                        videoElement.play().catch((error) => {
                            console.error('ไม่สามารถเล่นวิดีโออัตโนมัติได้:', error);
                        });
                    }
                });

                hls.loadSource(videoUrl);
                hls.attachMedia(videoElement);

                return () => {
                    // ยกเลิก request ที่กำลังทำงานอยู่
                    if (abortControllerRef.current) {
                        abortControllerRef.current.abort();
                    }
                    hls.off(Hls.Events.ERROR, handleError);
                    hls.destroy();
                };
            } 
            // สำหรับ Safari
            else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
                videoElement.src = videoUrl;
                
                const handleError = () => {
                    if (!signal.aborted && onError && videoElement.error) {
                        onError(new Error(videoElement.error.message));
                    }
                };

                const handleCanPlay = () => {
                    if (!signal.aborted) {
                        videoElement.play().catch((error) => {
                            console.error('ไม่สามารถเล่นวิดีโออัตโนมัติได้:', error);
                        });
                    }
                };

                videoElement.addEventListener('error', handleError);
                videoElement.addEventListener('canplay', handleCanPlay);

                return () => {
                    // ยกเลิก request ที่กำลังทำงานอยู่
                    if (abortControllerRef.current) {
                        abortControllerRef.current.abort();
                    }
                    videoElement.removeEventListener('error', handleError);
                    videoElement.removeEventListener('canplay', handleCanPlay);
                    videoElement.src = ''; // ล้าง source เพื่อหยุดการโหลด
                };
            } 
            else {
                throw new Error('เบราว์เซอร์นี้ไม่รองรับการเล่นวิดีโอ HLS');
            }
        } catch (error) {
            if (!signal.aborted && error instanceof Error && onError) {
                onError(error);
            }
        }
    }, [video.id, onError]);

    return (
        <video
            ref={videoRef}
            className="w-full h-full rounded-md"
            controls
            playsInline
            autoPlay
            muted
            onPlay={() => {
                if (videoRef.current) {
                    videoRef.current.muted = false;
                }
            }}
        />
    );
});

VideoPlayer.displayName = 'VideoPlayer';

interface VideoDialogProps {
    video: Video
}

export function VideoDialog({ video }: VideoDialogProps) {
    const t = useTranslations('video')
    const locale = useLocale()
    const [isOpen, setIsOpen] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const handleError = React.useCallback((error: Error) => {
        setError(error.message);
        toast({
            title: t('error.title'),
            description: error.message,
            variant: "destructive"
        });
    }, [t]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600 dark:hover:text-blue-400"
                >
                    <Play className="h-4 w-4 mr-2" />
                    {t('dialog.play')}
                </Button>
            </DialogTrigger>
            <DialogPortal>
                <DialogContent className="sm:max-w-[800px] p-6 bg-gradient-to-br from-white to-slate-50 dark:from-slate-950 dark:to-slate-900">
                    <DialogHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <DialogTitle id="dialog-title" className="text-xl font-semibold">
                                    {video.displayName || video.name}
                                </DialogTitle>
                                <DialogDescription id="dialog-description">
                                    {t('dialog.watchVideo')}
                                </DialogDescription>
                            </div>
                            <div className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                                {video.isPublic ? t('dialog.public') : t('dialog.private')}
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="relative rounded-lg overflow-hidden border bg-black/95">
                        {error ? (
                            <div className="aspect-video flex flex-col items-center justify-center space-y-2 bg-red-50/95 dark:bg-red-950/50">
                                <span className="text-red-600 dark:text-red-400 font-medium">
                                    {t('dialog.error')}
                                </span>
                                <span className="text-sm text-red-500/80 dark:text-red-400/80 text-center max-w-[80%]">
                                    {error}
                                </span>
                            </div>
                        ) : (
                            <div className="aspect-video">
                                <VideoPlayer video={video} onError={handleError} />
                            </div>
                        )}
                    </div>

                    <div className="pt-4 space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">{t('dialog.m3u8Link')}</span>
                            <div className="flex-1 flex items-center gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={`${process.env.NEXT_PUBLIC_API_URL}/api/stream/${video.id}`}
                                    className="flex-1 h-8 rounded-md border border-input bg-white/50 dark:bg-slate-950/50 px-3 py-1 text-sm text-muted-foreground"
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600 dark:hover:text-blue-400"
                                    onClick={() => {
                                        navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_API_URL}/api/stream/${video.id}`);
                                        toast({
                                            title: t('dialog.copySuccess'),
                                            description: t('dialog.copyDesc')
                                        });
                                    }}
                                >
                                    <Copy className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {t('dialog.uploadedAt')} {new Intl.DateTimeFormat(locale, {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            }).format(new Date(video.uploadedAt))}
                        </div>
                    </div>
                </DialogContent>
            </DialogPortal>
        </Dialog>
    )
} 