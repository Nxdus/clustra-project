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
                <div className="flex flex-1 flex-col gap-8 p-8 max-w-4xl mx-auto">
                    <div className="space-y-6">
                        <h1 className="text-4xl font-bold">�� Video Streaming Platform</h1>
                        <p className="text-lg text-muted-foreground">
                            ระบบ Video Streaming Platform เป็นแพลตฟอร์มที่ให้บริการจัดการและสตรีมมิ่งวิดีโอแบบครบวงจร โดยมีจุดเด่นดังนี้:
                        </p>
                    </div>

                    <div className="space-y-8">
                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold flex items-center gap-2">
                                <span>✨</span> คุณสมบัติหลัก
                            </h2>
                            <div className="grid gap-4">
                                <div className="p-4 rounded-lg border bg-card">
                                    <h3 className="font-medium mb-2">การจัดการวิดีโอที่ยืดหยุ่น</h3>
                                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                        <li>รองรับการอัพโหลดไฟล์ MP4</li>
                                        <li>แปลงไฟล์อัตโนมัติเป็นรูปแบบ HLS สำหรับ Adaptive Streaming</li>
                                        <li>ระบบจัดการสิทธิ์การเข้าถึงแบบ Public/Private</li>
                                    </ul>
                                </div>
                                <div className="p-4 rounded-lg border bg-card">
                                    <h3 className="font-medium mb-2">ความปลอดภัยระดับสูง</h3>
                                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                        <li>การเข้ารหัส URL แบบ Signed URL สำหรับวิดีโอส่วนตัว</li>
                                        <li>ระบบจำกัด Domain (CORS) สำหรับการเข้าถึง</li>
                                        <li>การยืนยันตัวตนผ่าน OAuth 2.0</li>
                                    </ul>
                                </div>
                                <div className="p-4 rounded-lg border bg-card">
                                    <h3 className="font-medium mb-2">ระบบ Multi-tier Subscription</h3>
                                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                        <li>FREE: พื้นที่ 2GB, จำกัด 5 วิดีโอต่อเดือน</li>
                                        <li>PRO: พื้นที่ 20GB, ไม่จำกัดจำนวนวิดีโอ</li>
                                        <li>ENTERPRISE: ไม่จำกัดทั้งพื้นที่และจำนวนวิดีโอ</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold flex items-center gap-2">
                                <span>🛠</span> เทคโนโลยีที่ใช้
                            </h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-lg border bg-card">
                                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                        <li>Frontend: Next.js, TypeScript, TailwindCSS</li>
                                        <li>Backend: Node.js, Prisma ORM</li>
                                        <li>Cloud Services: AWS S3, CloudFront</li>
                                    </ul>
                                </div>
                                <div className="p-4 rounded-lg border bg-card">
                                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                        <li>Payment: Stripe Integration</li>
                                        <li>Video Processing: FFmpeg</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold flex items-center gap-2">
                                <span>💡</span> Use Cases
                            </h2>
                            <p className="text-muted-foreground">เหมาะสำหรับ:</p>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-lg border bg-card">
                                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                        <li>ผู้ให้บริการคอร์สเรียนออนไลน์</li>
                                        <li>แพลตฟอร์ม Video-on-Demand</li>
                                    </ul>
                                </div>
                                <div className="p-4 rounded-lg border bg-card">
                                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                        <li>ระบบจัดเก็บและแชร์วิดีโอภายในองค์กร</li>
                                        <li>ผู้พัฒนาที่ต้องการระบบ Video Streaming ที่ปลอดภัย</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        <div className="grid md:grid-cols-2 gap-8">
                            <section className="space-y-4">
                                <h2 className="text-2xl font-semibold flex items-center gap-2">
                                    <span>🌐</span> การรองรับภาษา
                                </h2>
                                <div className="p-4 rounded-lg border bg-card">
                                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                        <li>รองรับการแสดงผลแบบ Multi-language (ไทย/อังกฤษ)</li>
                                        <li>ระบบจัดการคำแปลแบบ JSON-based</li>
                                        <li>สามารถเพิ่มภาษาใหม่ได้ง่าย</li>
                                    </ul>
                                </div>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-semibold flex items-center gap-2">
                                    <span>📊</span> ระบบติดตามการใช้งาน
                                </h2>
                                <div className="p-4 rounded-lg border bg-card">
                                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                        <li>ติดตามปริมาณการใช้พื้นที่</li>
                                        <li>สถิติการอัพโหลดรายเดือน</li>
                                        <li>ประวัติการเข้าถึงวิดีโอ</li>
                                    </ul>
                                </div>
                            </section>
                        </div>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold flex items-center gap-2">
                                <span>🔄</span> การผสานรวมที่ยืดหยุ่น
                            </h2>
                            <p className="text-muted-foreground">สามารถใช้งานร่วมกับ Library ยอดนิยมได้ง่าย:</p>
                            <div className="grid md:grid-cols-4 gap-4">
                                <div className="p-4 rounded-lg border bg-card text-center">HLS.js</div>
                                <div className="p-4 rounded-lg border bg-card text-center">Video.js</div>
                                <div className="p-4 rounded-lg border bg-card text-center">Plyr</div>
                                <div className="p-4 rounded-lg border bg-card text-center">และ Library อื่นๆ</div>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold flex items-center gap-2">
                                <span>🎯</span> เป้าหมาย
                            </h2>
                            <p className="text-muted-foreground">แพลตฟอร์มนี้ถูกพัฒนาขึ้นเพื่อให้:</p>
                            <div className="grid gap-4">
                                <div className="p-4 rounded-lg border bg-card">
                                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                        <li>ผู้ใช้สามารถจัดการวิดีโอได้อย่างมีประสิทธิภาพ</li>
                                        <li>มี��วามปลอดภัยสูงในการจัดเก็บและส่งมอบคอนเทนต์</li>
                                        <li>รองรับการขยายตัวของธุรกิจผ่านระบบ Subscription</li>
                                        <li>ใช้งานง่ายและผสานรวมกับระบบอื่นได้อย่างยืดหยุ่น</li>
                                    </ul>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
} 