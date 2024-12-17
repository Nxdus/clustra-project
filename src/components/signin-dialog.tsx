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
import { GithubIcon, LockIcon } from "lucide-react"
import SignInForm from './SignInForm'
import SignUpForm from './SignUpForm'
import { Switch } from "./ui/switch" // Import Switch component from shadcn

export function SignInDialog({ children }: { children: React.ReactNode }) {
  const t = useTranslations()
  const [showSignIn, setShowSignIn] = React.useState(true) // State to toggle between forms

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-950">
        <DialogHeader>
          <DialogTitle id="dialog-title" className="text-center text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            {showSignIn ? t('nav.signIn') : t('nav.signUp')}
          </DialogTitle>
          <DialogDescription id="dialog-description" className="text-center">
            {showSignIn ? t('auth.signInDescription') : t('auth.signUpDescription')}
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
          {/* Switch for toggling between forms */}
          <div className="flex items-center justify-center space-x-4">
            <span>{t('nav.signIn')}</span>
            <Switch checked={!showSignIn} onCheckedChange={(checked) => setShowSignIn(!checked)} />
            <span>{t('nav.signUp')}</span>
          </div>

          {/* Conditionally render forms */}
          {showSignIn ? <SignInForm /> : <SignUpForm />}

          <hr />

          {/* Buttons for signing in with external providers */}
          <Button
            onClick={() => signIn("google", {
              callbackUrl: process.env.NEXTAUTH_URL,
              redirect: true
            })}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white transition-all duration-300 hover:shadow-md group"
          >
            <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text">{t('auth.signInWithGoogle')}</span>
            <motion.span className="ml-2 text-white" whileHover={{ x: 5 }} transition={{ duration: 0.2 }}><LockIcon /></motion.span>
          </Button>
          <Button
            onClick={() => signIn("github", {
              callbackUrl: process.env.NEXTAUTH_URL,
              redirect: true
            })}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white transition-all duration-300 hover:shadow-md group"
          >
            <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text">{t('auth.signInWithGitHub')}</span>
            <motion.span className="ml-2 text-white" whileHover={{ x: 5 }} transition={{ duration: 0.2 }}><GithubIcon /></motion.span>
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
