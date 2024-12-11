"use client"

import { useScroll, motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { LogOut, FileVideo, Play, Cloud, ChevronUp } from "lucide-react"
import { SignInDialog } from "@/components/signin-dialog"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useState } from "react"
import { useLocale } from "next-intl"
import { Switch } from "@/components/ui/switch"
import LanguageSwitcher from "@/components/LanguageSwitcher"
import { useTranslations } from 'next-intl'
import { UpgradeButton } from "@/components/upgrade-button"
import Image from 'next/image';

export default function Page() {
    const locale = useLocale()
    const { data: session } = useSession()
    const { scrollY } = useScroll()
    const [isAnnual, setIsAnnual] = useState(false)
    const t = useTranslations()

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        })
    }

    return (
        <div className="min-h-screen">
            {/* Navbar */}
            <motion.nav
                className="fixed w-full z-50 border-b bg-white/80 backdrop-blur-md"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <motion.div
                        className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 text-transparent bg-clip-text cursor-pointer"
                        whileHover={{ scale: 1.05 }}
                        onClick={scrollToTop}
                    >
                        Clustra
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="flex items-center gap-4"
                    >
                        {session ? (
                            <>
                                <LanguageSwitcher />
                                <Link href="/dashboard">
                                    <Button className="bg-blue-600 hover:bg-blue-500">{t('nav.dashboard')}</Button>
                                </Link>
                                <Button
                                    variant="outline"
                                    onClick={() => signOut({ callbackUrl: '/' })}
                                    className="flex items-center gap-2"
                                >
                                    <LogOut className="w-4 h-4" />
                                    {t('nav.signOut')}
                                </Button>
                            </>
                        ) : (
                            <>
                                <LanguageSwitcher />
                                <SignInDialog>
                                    <Button size="lg" className="bg-blue-600 hover:bg-blue-500">
                                        {t('nav.signIn')}
                                    </Button>
                                </SignInDialog>
                            </>
                        )}
                    </motion.div>
                </div>
            </motion.nav>

            {/* Hero Section */}
            <section className="relative pt-40 pb-24">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(at_top_right,_#3b82f620_0%,_transparent_50%)]" />
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(at_top_left,_#2563eb20_0%,_transparent_50%)]" />
                <div className="absolute inset-0">
                    <Image
                        src="/grid.svg"
                        alt="Grid Background"
                        fill
                        priority
                        className="object-center object-repeat [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"
                    />
                </div>

                <div className="container relative mx-auto px-4">
                    <div className="max-w-5xl mx-auto text-center space-y-8">
                        <motion.h1
                            className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight md:leading-snug bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent px-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7 }}
                        >
                            {t('hero.title')}
                        </motion.h1>

                        <motion.p
                            className="text-xl text-muted-foreground"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.2 }}
                        >
                            {t('hero.description')}
                        </motion.p>

                        <motion.div
                            className="flex justify-center gap-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.4 }}
                        >
                            {session ? (
                                <Link href={`/${locale}/dashboard`}>
                                    <Button size="lg" className="bg-blue-600 hover:bg-blue-500">
                                        {t('hero.startFree')}
                                    </Button>
                                </Link>
                            ) : (
                                <SignInDialog>
                                    <Button size="lg" className="bg-blue-600 hover:bg-blue-500">
                                        {t('hero.startFree')}
                                    </Button>
                                </SignInDialog>
                            )}
                            <Link href={`/${locale}/docs`}>
                                <Button variant="outline" size="lg" className="border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-950">
                                    {t('hero.learnMore')}
                                </Button>
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 relative">
                <div className="container mx-auto px-4">
                    {/* Features Header */}
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                            {t('features.title')}
                        </h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            {t('features.description')}
                        </p>
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <Card className="bg-white/50 backdrop-blur-sm border-blue-100 dark:border-blue-900">
                            <CardHeader>
                                <FileVideo className="w-12 h-12 text-blue-500 mb-4" />
                                <CardTitle>{t('features.upload.title')}</CardTitle>
                                <CardDescription>{t('features.upload.description')}</CardDescription>
                            </CardHeader>
                        </Card>
                        <Card className="bg-white/50 backdrop-blur-sm border-blue-100 dark:border-blue-900">
                            <CardHeader>
                                <Play className="w-12 h-12 text-blue-500 mb-4" />
                                <CardTitle>{t('features.convert.title')}</CardTitle>
                                <CardDescription>{t('features.convert.description')}</CardDescription>
                            </CardHeader>
                        </Card>
                        <Card className="bg-white/50 backdrop-blur-sm border-blue-100 dark:border-blue-900">
                            <CardHeader>
                                <Cloud className="w-12 h-12 text-blue-500 mb-4" />
                                <CardTitle>{t('features.store.title')}</CardTitle>
                                <CardDescription>{t('features.store.description')}</CardDescription>
                            </CardHeader>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="py-24 relative bg-gradient-to-b from-gray-50/50 to-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                            {t('pricing.title')}
                        </h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            {t('pricing.description')}
                        </p>
                        <div className="flex items-center justify-center gap-4 mt-6">
                            <span className={isAnnual ? "text-muted-foreground" : "font-medium"}>
                                {t('pricing.monthly')}
                            </span>
                            <Switch checked={isAnnual} onCheckedChange={setIsAnnual} />
                            <span className={!isAnnual ? "text-muted-foreground" : "font-medium"}>
                                {t('pricing.annually')}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                        {/* Free Plan */}
                        <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col min-h-[400px] hover:border-blue-200">
                            <CardHeader className="flex-1 flex flex-col p-8">
                                <div className="flex-1">
                                    <CardTitle className="text-2xl font-bold bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-transparent">
                                        {t('pricing.free.title')}
                                    </CardTitle>
                                    <CardDescription>{t('pricing.free.description')}</CardDescription>
                                    <div className="mt-4 flex items-baseline">
                                        <span className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">$0</span>
                                        <span className="ml-1 text-sm font-medium text-muted-foreground">/mo</span>
                                    </div>
                                    <ul className="mt-4 space-y-3 text-sm">
                                        <li className="flex items-center text-muted-foreground">
                                            <span className="text-green-500 mr-2">✓</span>
                                            {t('pricing.free.features.storage')}
                                        </li>
                                        <li className="flex items-center text-muted-foreground">
                                            <span className="text-green-500 mr-2">✓</span>
                                            {t('pricing.free.features.convert')}
                                        </li>
                                        <li className="flex items-center text-muted-foreground">
                                            <span className="text-green-500 mr-2">✓</span>
                                            {t('pricing.free.features.domain')}
                                        </li>
                                    </ul>
                                </div>
                                <Button className="w-full mt-12 group transition-all duration-300 hover:shadow-md">
                                    {t('pricing.free.action')}
                                    <motion.span className="ml-2" whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>→</motion.span>
                                </Button>
                            </CardHeader>
                        </Card>

                        {/* Pro Plan */}
                        <Card className="relative overflow-hidden border-blue-200 dark:border-blue-800 hover:shadow-xl transition-all duration-300 flex flex-col min-h-[400px] hover:border-blue-400">
                            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
                            <CardHeader className="flex-1 flex flex-col p-8">
                                <div className="flex-1">
                                    <div className="absolute top-4 right-4">
                                        <span className="px-3 py-1 text-xs font-semibold text-blue-600 bg-blue-100 rounded-full animate-pulse">
                                            {t('pricing.popular')}
                                        </span>
                                    </div>
                                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                                        {t('pricing.pro.title')}
                                    </CardTitle>
                                    <CardDescription>{t('pricing.pro.description')}</CardDescription>
                                    <div className="mt-4 flex items-baseline">
                                        <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                                            ${isAnnual ? '29' : '39'}
                                        </span>
                                        <span className="ml-1 text-sm font-medium text-muted-foreground">/mo</span>
                                        {isAnnual && (
                                            <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-600">
                                                {t('pricing.savePercent')}
                                            </span>
                                        )}
                                    </div>
                                    <ul className="mt-4 space-y-3 text-sm">
                                        <li className="flex items-center text-muted-foreground">
                                            <span className="text-green-500 mr-2">✓</span>
                                            {t('pricing.pro.features.storage')}
                                        </li>
                                        <li className="flex items-center text-muted-foreground">
                                            <span className="text-green-500 mr-2">✓</span>
                                            {t('pricing.pro.features.convert')}
                                        </li>
                                        <li className="flex items-center text-muted-foreground">
                                            <span className="text-green-500 mr-2">✓</span>
                                            {t('pricing.pro.features.domain')}
                                        </li>
                                        <li className="flex items-center text-muted-foreground">
                                            <span className="text-green-500 mr-2">✓</span>
                                            {t('pricing.pro.features.priority')}
                                        </li>
                                    </ul>
                                </div>
                                <UpgradeButton isAnnual={isAnnual} variant="prominent">
                                    {t('pricing.pro.action')}
                                </UpgradeButton>
                            </CardHeader>
                        </Card>

                        {/* Enterprise Plan */}
                        <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col min-h-[400px] hover:border-blue-200">
                            <CardHeader className="flex-1 flex flex-col p-8">
                                <div className="flex-1">
                                    <CardTitle className="text-2xl font-bold bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-transparent">
                                        {t('pricing.enterprise.title')}
                                    </CardTitle>
                                    <CardDescription>{t('pricing.enterprise.description')}</CardDescription>
                                    <div className="mt-4">
                                        <span className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-transparent">
                                            {t('pricing.enterprise.price')}
                                        </span>
                                    </div>
                                    <ul className="mt-4 space-y-3 text-sm">
                                        <li className="flex items-center text-muted-foreground">
                                            <span className="text-green-500 mr-2">✓</span>
                                            {t('pricing.enterprise.features.unlimited')}
                                        </li>
                                        <li className="flex items-center text-muted-foreground">
                                            <span className="text-green-500 mr-2">✓</span>
                                            {t('pricing.enterprise.features.support')}
                                        </li>
                                        <li className="flex items-center text-muted-foreground">
                                            <span className="text-green-500 mr-2">✓</span>
                                            {t('pricing.enterprise.features.api')}
                                        </li>
                                        <li className="flex items-center text-muted-foreground">
                                            <span className="text-green-500 mr-2">✓</span>
                                            {t('pricing.enterprise.features.custom')}
                                        </li>
                                    </ul>
                                </div>
                                <Button variant="outline" className="w-full mt-12 group transition-all duration-300 hover:shadow-md">
                                    {t('pricing.enterprise.action')}
                                    <motion.span className="ml-2" whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>→</motion.span>
                                </Button>
                            </CardHeader>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-50 pb-6">
                <div className="mt-12 border-t border-gray-200 pt-8 space-y-4">
                    <p className="text-sm text-gray-600 text-center">
                        {t('footer.copyright')}
                    </p>
                    <p className="text-sm text-gray-600 text-center">
                        {t('footer.love').split('❤️').map((text, i) =>
                            i === 0 ? (
                                <span key={`love-text-${i}`}>{text}</span>
                            ) : (
                                <span key={`love-text-${i}`}>
                                    <span className="inline-block animate-pulse text-red-500">❤️</span>
                                    {text}
                                </span>
                            )
                        )}
                    </p>
                </div>
            </footer>

            {/* Scroll to Top Button */}
            <motion.button
                className="fixed bottom-8 right-8 p-2 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                onClick={scrollToTop}
                initial={{ opacity: 0 }}
                animate={{ opacity: scrollY.get() > 100 ? 1 : 0 }}
                whileHover={{ scale: 1.1 }}
            >
                <ChevronUp className="w-5 h-5" />
            </motion.button>
        </div>
    )
} 