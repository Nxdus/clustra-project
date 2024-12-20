import React, { useState, useEffect, useCallback } from "react"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Trash2, Globe } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { AllowedDomain } from "@/types/domain"
import { useSession } from "next-auth/react"
import { useTranslations } from 'next-intl'
import axios from 'axios';

const ITEMS_PER_PAGE = 2;

export function DomainManager() {
  const [domain, setDomain] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [domains, setDomains] = useState<AllowedDomain[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const { data: session } = useSession()
  const [userRole, setUserRole] = React.useState<string>('FREE')
  const t = useTranslations()

  React.useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await axios.get('/api/user/info');
        const data = response.data;
        if (response.status === 200) {
          setUserRole(data.role)
        }
      } catch (error) {
        console.error('Error fetching user info:', error)
      }
    }

    if (session?.user) {
      fetchUserInfo()
    }
  }, [session])

  const domainLimits = {
    FREE: 2,
    PRO: 5,
    ENTERPRISE: Infinity
  }
  const limit = domainLimits[userRole as keyof typeof domainLimits]
  const remainingDomains = limit === Infinity ? '∞' : limit - domains.length

  const totalPages = Math.ceil(domains.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedDomains = domains.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const fetchDomains = useCallback(async () => {
    try {
      const response = await axios.get('/api/domains');
      const data = response.data;
      if (response.status !== 200) throw new Error(data.error)
      setDomains(data.domains)
    } catch {
      toast({
        title: t('error.title'),
        description: t('domain.error.fetch'),
        variant: "destructive"
      })
    }
  }, [t]);

  const handleDelete = async (domainId: string) => {
    try {
      const response = await axios.delete(`/api/domains/delete?id=${domainId}`);
      const data = response.data;
      if (response.status !== 200) throw new Error(data.error)
      
      toast({
        title: t('success.title'),
        description: t('domain.success.delete')
      })
      
      setDomains(domains.filter(d => d.id !== domainId))
    } catch (error) {
      toast({
        title: t('error.title'),
        description: error instanceof Error ? error.message : t('domain.error.delete'),
        variant: "destructive"
      })
    }
  }

  useEffect(() => {
    fetchDomains()
  }, [fetchDomains])

  const handleAddDomain = async () => {
    if (!domain.trim()) {
      toast({
        title: t('error.title'),
        description: t('domain.error.empty'),
        variant: "destructive"
      })
      return
    }

    try {
      setIsLoading(true)
      const response = await axios.post('/api/domains', {
        domain: domain.trim()
      });

      const data = response.data;

      if (response.status !== 200) {
        throw new Error(data.error || 'Failed to add domain')
      }

      toast({
        title: t('success.title'),
        description: t('domain.success.add')
      })
      
      setDomain('')
      fetchDomains()
    } catch (error) {
      toast({
        title: t('error.title'),
        description: error instanceof Error ? error.message : t('domain.error.add'),
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Globe className="w-4 h-4 text-blue-500" />
          <span className="font-medium text-muted-foreground">
            {t('domain.add.title', { count: domains.length, limit: limit === Infinity ? '∞' : limit })}
          </span>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder={t('domain.add.placeholder')}
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="h-9 text-sm bg-white dark:bg-gray-950"
          />
          <Button 
            onClick={handleAddDomain} 
            disabled={isLoading}
            size="sm"
            className="h-9 bg-blue-600 hover:bg-blue-500 transition-all duration-200"
          >
            {isLoading ? t('domain.add.loading') : t('domain.add.button')}
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 space-y-2 overflow-auto pr-1">
        {paginatedDomains.map((domain) => (
          <div 
            key={domain.id} 
            className="flex items-center justify-between py-2 px-3.5 bg-white dark:bg-gray-950 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500/70 group-hover:bg-emerald-500 transition-colors" />
              <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{domain.domain}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground/50 hover:text-red-600 hover:bg-red-100/50 dark:hover:bg-red-950/50 transition-colors h-7 w-7 p-0 opacity-0 group-hover:opacity-100"
              onClick={() => handleDelete(domain.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        {domains.length === 0 && (
          <div className="flex flex-col items-center justify-center h-[120px] text-center border rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-dashed">
            <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">{t('domain.empty.title')}</span>
            <span className="text-xs text-blue-500/80 dark:text-blue-500/60 mt-1.5">{t('domain.empty.description')}</span>
          </div>
        )}
      </div>

      {domains.length > 0 && (
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              {t('domain.total', { count: domains.length, remaining: remainingDomains })}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="h-7 px-3 text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
              >
                {t('common.previous')}
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="h-7 px-3 text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
              >
                {t('common.next')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
