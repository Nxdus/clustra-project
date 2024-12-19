'use client'

import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { DocsSidebar } from "@/components/docs-sidebar"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { useLocale } from "next-intl"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function DocPage() {
    const locale = useLocale()
    return (
        <SidebarProvider>
            <DocsSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b">
                    <div className="flex items-center gap-2 px-3">
                        <SidebarTrigger />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem className="hidden md:block">
                                    <BreadcrumbLink href="#">Documentation</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>Introduction</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                        <Link href={`/${locale}`} className="absolute right-4">
                            <Button
                                variant="outline"
                                size="icon"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </header>

                <main className="flex flex-1 flex-col gap-8 p-8 max-w-4xl mx-auto">
                    <article className="space-y-20">
                        <section className="space-y-4">
                            <h1 className="text-4xl font-bold">
                                Introduction
                            </h1>
                            <p className="text-lg text-muted-foreground">
                                Clustra - Video Conversion ให้บริการแปลงไฟล์วิดีโอ MP4 เป็น M3U8 ได้อย่างสะดวกและรวดเร็ว
                                พร้อมทั้งจัดเก็บไฟล์ของคุณบนระบบคลาวด์ และสร้างลิงก์สำหรับแชร์วิดีโอในรูปแบบ HLS
                                อีกทั้งยังสามารถตั้งค่าความปลอดภัยของลิงก์สตรีมมิ่งเพื่อกำหนดสิทธิ์การเข้าถึงได้อย่างยืดหยุ่น
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold">FAQ</h2>
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="item-1">
                                    <AccordionTrigger>
                                        <h3 className="font-medium">M3U8 คืออะไร?</h3>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <p>
                                            M3U8 เป็นไฟล์สำหรับการสตรีมวิดีโอแบบ HLS (HTTP Live Streaming) ซึ่งเป็นมาตรฐานที่พัฒนาโดย Apple
                                            โดยภายในไฟล์ M3U8 จะประกอบด้วยลิงก์ไปยังวิดีโอชิ้นเล็ก ๆ (Segments)
                                            เพื่อให้การสตรีมสามารถรับมือกับความไม่เสถียรของเครือข่ายและส่งมอบประสบการณ์ที่ราบรื่นต่อผู้รับชม
                                        </p>
                                        <p>
                                            ไฟล์ M3U8 ถูกนำมาใช้อย่างแพร่หลายในแพลตฟอร์มสตรีมมิ่ง
                                            เช่น เว็บไซต์สตรีมวิดีโอ แอปพลิเคชัน และบริการ OTT
                                            และยังรองรับการปรับคุณภาพของวิดีโออัตโนมัติตามความเร็วอินเทอร์เน็ต (Adaptive Streaming)
                                            เพื่อการเล่นวิดีโอที่ต่อเนื่องและมีคุณภาพ
                                        </p>
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="item-2">
                                    <AccordionTrigger>
                                        <h3 className="font-medium">HLS คืออะไร?</h3>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <p>
                                            HLS หรือ HTTP Live Streaming เป็นโปรโตคอลที่พัฒนาโดย Apple
                                            เพื่อส่งมอบวิดีโอผ่านอินเทอร์เน็ตอย่างมีประสิทธิภาพ
                                            HLS จะทำการแบ่งวิดีโอออกเป็นส่วนย่อย ๆ (Segments) และใช้ไฟล์ Playlist (เช่น M3U8)
                                            ในการกำหนดลำดับการเล่น ผู้ชมสามารถรับชมวิดีโอด้วยคุณภาพที่ปรับตามความเร็วอินเทอร์เน็ต (Adaptive Bitrate Streaming)
                                            ทำให้การสตรีมลื่นไหลแม้ในกรณีที่เครือข่ายไม่เสถียร
                                        </p>
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="item-3">
                                    <AccordionTrigger>
                                        <h3 className="font-medium">ไลบรารีที่รองรับ HLS มีอะไรบ้าง?</h3>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <p className="mb-2">
                                            ในการเล่นวิดีโอ HLS บนเว็บไซต์หรือแอปพลิเคชัน
                                            คุณสามารถใช้ไลบรารีดังต่อไปนี้เพื่อให้การใช้งานเป็นไปอย่างสะดวกและมีประสิทธิภาพ:
                                        </p>
                                        <ul className="list-disc list-inside space-y-2">
                                            <li>
                                                <strong>HLS.js</strong> - ไลบรารี JavaScript ขนาดเล็ก
                                                สำหรับการเล่น HLS บนเบราว์เซอร์ที่ไม่รองรับ HLS โดยตรง เช่น Chrome และ Firefox
                                            </li>
                                            <li>
                                                <strong>Video.js</strong> - Media Player ยอดนิยม
                                                รองรับ HLS ผ่าน Plugin videojs-http-streaming (VHS) และสามารถปรับแต่ง UI ได้หลากหลาย
                                            </li>
                                            <li>
                                                <strong>Shaka Player</strong> - ไลบรารีจาก Google
                                                รองรับทั้ง HLS และ DASH โดยเน้นการจัดการ DRM และคุณสมบัติขั้นสูง
                                            </li>
                                            <li>
                                                <strong>Clappr</strong> - Media Player แบบ Open Source
                                                ที่รองรับ HLS และปรับแต่งได้ง่ายเพื่อตอบโจทย์การใช้งานที่หลากหลาย
                                            </li>
                                            <li>
                                                <strong>Plyr</strong> - Media Player น้ำหนักเบาและสวยงาม
                                                รองรับ HLS ผ่าน HLS.js
                                            </li>
                                        </ul>
                                        <p className="mt-2">
                                            การใช้ไลบรารีเหล่านี้จะช่วยให้คุณสามารถเพิ่มความสามารถในการสตรีมวิดีโอ HLS
                                            และปรับแต่งการแสดงผลให้เหมาะสมกับแพลตฟอร์มของคุณมากขึ้น
                                        </p>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </section>
                    </article>
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
} 