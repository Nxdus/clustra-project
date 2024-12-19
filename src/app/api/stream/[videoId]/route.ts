import { NextResponse } from "next/server";
import { getSignedUrl } from "@aws-sdk/cloudfront-signer";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  context: { params: Promise<{ videoId: string }> }
) {
  try {
    const params = await context.params;
    const { videoId } = params;

    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const domain = origin 
      ? new URL(origin).hostname 
      : referer 
        ? new URL(referer).hostname 
        : null;

    if (!videoId) {
      return NextResponse.json({ error: "Video ID is required" }, { status: 400 });
    }

    const video = await prisma.video.findUnique({
      where: { id: videoId }
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const isLocalhost = domain?.includes('clustra.tech') || domain?.includes('124.121.20.248');
    
    if (!video.isPublic && !isLocalhost && !domain) {
      return NextResponse.json({ error: "Unauthorized domain" }, { status: 403 });
    }

    const m3u8SignedUrl = getSignedUrl({
      url: `https://${process.env.CLOUDFRONT_DOMAIN}/${video.key}`,
      keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID!,
      privateKey: process.env.CLOUDFRONT_PRIVATE_KEY!,
      dateLessThan: new Date(Date.now() + 24 * 3600 * 1000).toISOString()
    });

    const response = await fetch(m3u8SignedUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch m3u8: ${response.statusText}`);
    }
    
    let content = await response.text();

    const basePath = video.key.substring(0, video.key.lastIndexOf('/'));
    
    content = content.replace(/^(.+\.ts)$/gm, (match) => {
      const tsUrl = getSignedUrl({
        url: `https://${process.env.CLOUDFRONT_DOMAIN}/${basePath}/${match}`,
        keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID!,
        privateKey: process.env.CLOUDFRONT_PRIVATE_KEY!,
        dateLessThan: new Date(Date.now() + 24 * 3600 * 1000).toISOString()
      });
      return tsUrl;
    });

    const corsHeaders = {
      'Content-Type': 'application/vnd.apple.mpegurl',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Origin, Content-Type, Accept, Range, Authorization',
      'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Content-Type',
      'Access-Control-Max-Age': '86400',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Expires': '0'
    };

    return new Response(content, { headers: corsHeaders });

  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 