"use client"

import React from "react"
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card"
import { UploadDialog } from "./upload-dialog"
import { VideoTable } from "./VideoTable"
import { Video } from "@/types/video"
import { Video as VideoIcon } from "lucide-react"
import { useTranslations } from 'next-intl'

interface VideoCardProps {
  videos: Video[]
  onUploadComplete: () => Promise<void>
  onDelete: (fileKey: string) => Promise<void>
  onUpdateAccess: (fileKey: string, isPublic: boolean) => Promise<void>
  onRename: () => Promise<void>
  onRefreshStats: () => Promise<void>
}

export function VideoCard({ videos, onUploadComplete, onDelete, onUpdateAccess, onRename, onRefreshStats }: VideoCardProps) {
  const t = useTranslations()
  
  return (
    <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-950 dark:to-slate-900 transition-all duration-200 hover:shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <VideoIcon className="w-5 h-5 text-blue-500" />
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
              {t('video.manage')}
            </CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('video.description')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <UploadDialog onUploadComplete={onUploadComplete} />
        </div>
      </CardHeader>
      <CardContent className="p-0 px-6 pb-6">
        <VideoTable 
          videos={videos}
          onDelete={onDelete}
          onUpdateAccess={onUpdateAccess}
          onRename={onRename}
          onRefreshStats={onRefreshStats}
        />
      </CardContent>
    </Card>
  )
} 