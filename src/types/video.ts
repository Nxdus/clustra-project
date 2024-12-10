export interface Video {
  id: string
  fileKey: string
  title: string
  url: string
  uploadedAt: Date
  userId: string
  status: 'processing' | 'completed' | 'failed'
  fileSize: number
  name: string
  displayName?: string
  isPublic: boolean
} 