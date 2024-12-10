import { Card, CardHeader, CardTitle, CardContent } from "./ui/card"
import { DomainManager } from "./domain-manager"
import { useTranslations } from 'next-intl'

export function DomainCard() {
  const t = useTranslations()
  
  return (
    <Card className="h-[350px] p-6 bg-gradient-to-br from-white to-slate-50 dark:from-slate-950 dark:to-slate-900 transition-all duration-200 hover:shadow-lg">
      <CardHeader className="p-0 pb-6">
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
          {t('domain.manage')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <DomainManager />
      </CardContent>
    </Card>
  )
} 