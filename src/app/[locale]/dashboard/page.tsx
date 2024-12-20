"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { LogOut } from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"
import { VideoCard } from "@/components/VideoCard"
import { DomainCard } from "@/components/DomainCard"
import { UserStatsCard } from "@/components/UserStatsCard"
import { Video } from "@/types/video"
import { Button } from "@/components/ui/button"
import LanguageSwitcher from "@/components/LanguageSwitcher"
import { useTranslations } from 'next-intl'
import { CancelSubscriptionButton } from "@/components/cancel-subscription-button"
import axios from 'axios';

export default function Dashboard() {
  const { data: session } = useSession()
  const t = useTranslations()
  const [videos, setVideos] = React.useState<Video[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  const fetchVideos = React.useCallback(async () => {
    try {
      const response = await axios.get(`/api/videos?userId=${session?.user?.id}`, {
        headers: { 'Cache-Control': 'no-store' }
      });
      setVideos(response.data.videos || []);
      setIsLoading(false);
    } catch {
      toast({
        title: t('error.title'),
        description: t('error.fetchVideos'),
        variant: "destructive"
      });
    }
  }, [session?.user?.id, t]);

  const refreshStats = React.useCallback(async () => {
    try {
      const response = await axios.get('/api/user/info');
      setVideos(prevVideos => {
        const updatedVideos = [...prevVideos];
        return updatedVideos;
      });
    } catch (error) {
      console.error('Error refreshing stats:', error);
    }
  }, []);

  React.useEffect(() => {
    if (session?.user?.id) {
      fetchVideos()
    }
  }, [session?.user?.id, fetchVideos])

  const handleDelete = async (fileKey: string) => {
    const confirmDelete = confirm(t('confirm.deleteVideo'))
    if (!confirmDelete) return

    try {
      const response = await axios.delete(`/api/delete-file?fileKey=${fileKey}`);

      if (response.status === 200) {
        toast({
          title: t('success.deleteVideo'),
          description: t('success.deleteVideoDesc')
        })
        setVideos((prevVideos) => prevVideos.filter(video => video.fileKey !== fileKey))
        await refreshStats()
      } else {
        const { message } = response.data;
        toast({
          title: t('error.title'),
          description: message || t('error.deleteVideo'),
          variant: "destructive"
        })
      }
    } catch {
      toast({
        title: t('error.title'),
        description: t('error.serverConnection'),
        variant: "destructive"
      })
    }
  }

  const handleUpdateAccess = async (videoId: string, isPublic: boolean) => {
    try {
      const response = await axios.patch('/api/videos/access', {
        videoId,
        isPublic
      });

      if (response.status !== 200) {
        throw new Error('Failed to update access');
      }

      setVideos(prevVideos =>
        prevVideos.map(video =>
          video.id === videoId ? { ...video, isPublic } : video
        )
      );

    } catch {
      toast({
        title: t('error.title'),
        description: t('error.updateAccess'),
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <motion.nav
        className="fixed w-full z-50 border-b bg-white/80 backdrop-blur-md"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <motion.div
              className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 text-transparent bg-clip-text cursor-pointer"
              whileHover={{ scale: 1.05 }}
            >
              Clustra
            </motion.div>
          </Link>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-4"
          >
            <LanguageSwitcher />
            <Button
              variant="outline"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              {t('nav.signOut')}
            </Button>
            <CancelSubscriptionButton />
          </motion.div>
        </div>
      </motion.nav>

      <div className="pt-20 p-8 max-w-7xl mx-auto">
        <div className="grid gap-8 grid-cols-1 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.6,
              type: "spring",
              stiffness: 100
            }}
            whileHover={{ scale: 1.02 }}
          >
            <UserStatsCard totalStorageUsed={videos.reduce((acc, video) => {
              const size = typeof video.fileSize === 'number' ? video.fileSize : 0;
              return acc + size;
            }, 0)} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.6,
              type: "spring",
              stiffness: 100,
              delay: 0.1
            }}
            whileHover={{ scale: 1.02 }}
          >
            <DomainCard />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.7,
            type: "spring",
            stiffness: 80,
            delay: 0.2
          }}
          whileHover={{ y: -5 }}
          className="mt-8"
        >
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm p-4 h-48 animate-pulse" />
              ))}
            </div>
          ) : (
            <VideoCard
              videos={videos}
              onUploadComplete={fetchVideos}
              onDelete={handleDelete}
              onUpdateAccess={handleUpdateAccess}
              onRename={fetchVideos}
              onRefreshStats={refreshStats}
            />
          )}
        </motion.div>
      </div>
    </div>
  )
}

export function generateMetadata() {
  const t = useTranslations()
  return {
    title: t('meta.dashboardTitle'),
    description: t('meta.dashboardDescription'),
  }
} 