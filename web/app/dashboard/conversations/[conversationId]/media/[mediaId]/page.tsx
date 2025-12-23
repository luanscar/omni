import { MediaViewer } from '@/components/conversations/media-viewer'

export default async function MediaPage({
  params,
  searchParams,
}: {
  params: Promise<{ conversationId: string; mediaId: string }>
  searchParams: Promise<{ type?: string; mimeType?: string }>
}) {
  const { conversationId, mediaId } = await params
  const { type, mimeType } = await searchParams

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <MediaViewer 
        mediaId={mediaId} 
        isFullPage 
        type={type as any} 
        mimeType={mimeType} 
      />
    </div>
  )
}
