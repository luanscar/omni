export interface Media {
  id: string
  fileName: string
  originalName?: string
  mimeType: string
  size: number
  publicUrl?: string
  createdAt?: string
}

export interface DownloadUrlResponse {
  url: string
  fileName: string
  mimeType: string
  originalName?: string
}

