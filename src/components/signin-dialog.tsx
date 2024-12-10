"use client"

import { Button } from "./ui/button"
import { signIn } from "next-auth/react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "./ui/dialog"
import { motion } from "framer-motion"
import * as React from "react"
import { useTranslations } from 'next-intl'

export function SignInDialog({ children }: { children: React.ReactNode }) {
  const t = useTranslations()

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-950">
        <DialogHeader>
          <DialogTitle id="dialog-title" className="text-center text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            {t('nav.signIn')}
          </DialogTitle>
          <DialogDescription id="dialog-description">
            {t('auth.signInDescription')}
          </DialogDescription>
        </DialogHeader>
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.6,
            type: "spring",
            stiffness: 100 
          }}
        >
          <Button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white transition-all duration-300 hover:shadow-md group"
          >
            <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text">{t('auth.signInWithGoogle')}</span>
            <motion.span className="ml-2 text-white" whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>→</motion.span>
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
} 