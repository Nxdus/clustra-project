import { NextResponse } from 'next/server';
import { getUploadStatus } from '@/lib/upload-status';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const uploadId = url.searchParams.get('uploadId');

  if (!uploadId) {
    return NextResponse.json({ error: 'Upload ID is required' }, { status: 400 });
  }

  const status = getUploadStatus(uploadId) || { progress: 0, status: 'pending' };
  
  return NextResponse.json({
    ...status,
    isCompleted: status.status === 'completed'
  });
} 