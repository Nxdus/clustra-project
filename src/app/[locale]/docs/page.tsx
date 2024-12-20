"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { DocsSidebar } from "@/components/docs-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useLocale, useTranslations } from "next-intl";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Metadata } from "next";

// แก้ไข type ของ generateMetadata
export async function generateMetadata(): Promise<Metadata> {
    const t = useTranslations();
  
    try {
      // Metadata object
      return {
        title: t('meta.docsTitle'),
        description: t('meta.description') || "Clustra - Simplify video streaming with MP4 to M3U8 conversion, secure URL streaming, and custom access control.",
        keywords: "Clustra, mp4 to m3u8, video converter, m3u8 generator, video streaming, URL streaming, streaming access control, domain-restricted streaming, public streaming, video hosting, microsaas video service, video file conversion, secure video streaming, video transcoding, cloud video storage, video on demand, HLS streaming, video file management, Clustra microsaas, Clustra video service",
      }
    } catch {
      return { title: 'Default Title' };
    }
  }

export default function DocPage() {
  const locale = useLocale();
  const t = useTranslations();

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
                  <BreadcrumbLink href="#">
                    {t("documentary.title")}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    {t("documentary.introduction.title")}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <Link href={`/${locale}`} className="absolute right-4">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-8 p-8 max-w-4xl mx-auto">
          <article className="space-y-20">
            <section className="space-y-4">
              <h1 className="text-4xl font-bold">
                {t("documentary.introduction.title")}
              </h1>
              <p className="text-lg text-muted-foreground">
                {t("documentary.introduction.content")}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold">
                {t("documentary.faq.title")}
              </h2>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>
                    <h3 className="font-medium">
                      {t("documentary.faq.m3u8Question")}
                    </h3>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p>{t("documentary.faq.m3u8Description")}</p>
                    <p>{t("documentary.faq.m3u8AdditionalDescription")}</p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger>
                    <h3 className="font-medium">
                      {t("documentary.faq.hlsQuestion")}
                    </h3>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p>{t("documentary.faq.hlsDescription")}</p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger>
                    <h3 className="font-medium">
                      {t("documentary.faq.libraryQuestion")}
                    </h3>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      {t("documentary.faq.libraryDesription")}
                    </p>
                    <ul className="list-disc list-inside space-y-2">
                      <li>
                        <strong>
                          {t("documentary.faq.libraryRecommend.HLSjs")}
                        </strong>
                        {t("documentary.faq.libraryRecommend.HLSjsDescription")}
                      </li>
                      <li>
                        <strong>
                          {t("documentary.faq.libraryRecommend.Videojs")}
                        </strong>
                        {t(
                          "documentary.faq.libraryRecommend.VideojsDescription"
                        )}
                      </li>
                      <li>
                        <strong>
                          {t("documentary.faq.libraryRecommend.ShakaPlayer")}
                        </strong>
                        {t(
                          "documentary.faq.libraryRecommend.ShakaPlayerDescription"
                        )}
                      </li>
                      <li>
                        <strong>
                          {t("documentary.faq.libraryRecommend.Clappr")}
                        </strong>
                        {t(
                          "documentary.faq.libraryRecommend.ClapprDescription"
                        )}
                      </li>
                      <li>
                        <strong>
                          {t("documentary.faq.libraryRecommend.Plyr")}
                        </strong>
                        {t("documentary.faq.libraryRecommend.PlyrDescription")}
                      </li>
                    </ul>
                    <p className="mt-2">
                      {t("documentary.faq.libraryAdditionalDescription")}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </section>
          </article>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
