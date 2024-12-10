import React from "react"
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card"
import { Progress } from "./ui/progress"
import { useSession } from "next-auth/react"
import { Rocket, HardDrive, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslations } from 'next-intl'
import { UpgradeButton } from "./upgrade-button"

interface UserStatsCardProps {
  totalStorageUsed: number
}

export function UserStatsCard({ totalStorageUsed }: UserStatsCardProps) {
  const { data: session } = useSession();
  const [userRole, setUserRole] = React.useState<string>('FREE');
  const [monthlyUploads, setMonthlyUploads] = React.useState<number>(0);
  const t = useTranslations();

  React.useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch('/api/user/info');
        const data = await response.json();
        if (response.ok) {
          setUserRole(data.role);
          setMonthlyUploads(data.monthlyUploads);
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };

    if (session?.user) {
      fetchUserInfo();
    }
  }, [session]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const limits = {
    FREE: {
      storage: 2 * 1024 * 1024 * 1024, // 2GB
      monthlyUploads: 5
    },
    PRO: {
      storage: 20 * 1024 * 1024 * 1024, // 20GB
      monthlyUploads: Infinity
    },
    ENTERPRISE: {
      storage: Infinity,
      monthlyUploads: Infinity
    }
  };

  const currentLimit = limits[userRole as keyof typeof limits];
  const storagePercentage = currentLimit.storage === Infinity 
    ? 0 
    : (totalStorageUsed / currentLimit.storage) * 100;

  const uploadPercentage = currentLimit.monthlyUploads === Infinity 
    ? 0 
    : (monthlyUploads / currentLimit.monthlyUploads) * 100;

  return (
    <Card className="h-[350px] p-6 bg-gradient-to-br from-white to-slate-50 dark:from-slate-950 dark:to-slate-900 transition-all duration-200 hover:shadow-lg">
      <CardHeader className="p-0 pb-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            {t('stats.title')}
          </CardTitle>
          <div className={cn(
            "px-3 py-1 rounded-full text-xs font-semibold",
            userRole === 'FREE' ? 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400' :
            userRole === 'PRO' ? 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400' :
            'bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400'
          )}>
            {userRole}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <HardDrive className="w-4 h-4 text-blue-500" />
            <div className="flex-1 flex justify-between items-center">
              <span className="font-medium">{t('stats.storage.title')}</span>
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full",
                storagePercentage > 80 ? 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400' : 'text-muted-foreground'
              )}>
                {formatBytes(totalStorageUsed)} / {currentLimit.storage === Infinity ? t('common.unlimited') : formatBytes(currentLimit.storage)}
              </span>
            </div>
          </div>
          {currentLimit.storage !== Infinity && (
            <div className="relative h-3">
              <Progress 
                value={storagePercentage} 
                className={cn(
                  "h-3 rounded-lg transition-all",
                  storagePercentage > 80 ? '[&>div]:bg-red-500' : '[&>div]:bg-blue-500'
                )}
              />
              {storagePercentage > 90 && (
                <div className="absolute -right-1 -top-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
              )}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Upload className="w-4 h-4 text-blue-500" />
            <div className="flex-1 flex justify-between items-center">
              <span className="font-medium">{t('stats.uploads.title')}</span>
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full",
                uploadPercentage > 80 ? 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400' : 'text-muted-foreground'
              )}>
                {monthlyUploads} / {currentLimit.monthlyUploads === Infinity ? t('common.unlimited') : currentLimit.monthlyUploads}
              </span>
            </div>
          </div>
          {currentLimit.monthlyUploads !== Infinity && (
            <div className="relative h-3">
              <Progress 
                value={uploadPercentage} 
                className={cn(
                  "h-3 rounded-lg transition-all",
                  uploadPercentage > 80 ? '[&>div]:bg-red-500' : '[&>div]:bg-blue-500'
                )}
              />
              {uploadPercentage > 90 && (
                <div className="absolute -right-1 -top-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
              )}
            </div>
          )}
        </div>

        {userRole === 'FREE' && (
          <div className="pt-2">
            <div className="p-3 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 space-y-3">
              <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                <Rocket className="w-4 h-4" />
                <span className="font-medium">{t('stats.upgrade.title')}</span>
              </div>
              <UpgradeButton isAnnual={false} variant="prominent">
                {t('stats.upgrade.button')}
              </UpgradeButton>
            </div>
          </div>
        )}

        {userRole === 'PRO' && (
          <div className="pt-2">
            <div className="p-3 rounded-lg bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 space-y-2">
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <Rocket className="w-4 h-4" />
                <span className="font-medium">{t('stats.pro.title')}</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-green-600/80 dark:text-green-400/80">
                  <div className="w-1 h-1 rounded-full bg-green-500" />
                  <span>{t('stats.pro.storage')}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-green-600/80 dark:text-green-400/80">
                  <div className="w-1 h-1 rounded-full bg-green-500" />
                  <span>{t('stats.pro.uploads')}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-green-600/80 dark:text-green-400/80">
                  <div className="w-1 h-1 rounded-full bg-green-500" />
                  <span>{t('stats.pro.domains')}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 