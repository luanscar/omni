import { MediaViewer } from '@/components/conversations/media-viewer'
import { Modal } from '@/components/ui/modal'

export default async function MediaModal({
  params,
  searchParams,
}: {
  params: Promise<{ conversationId: string; mediaId: string }>
  searchParams: Promise<{ type?: string; mimeType?: string }>
}) {
  const { mediaId } = await params
  const { type, mimeType } = await searchParams

  return (
    <Modal>
      <MediaViewer 
        mediaId={mediaId} 
        type={type as 'image' | 'video' | 'audio' | undefined} 
        mimeType={mimeType} 
      />
    </Modal>
  )
}
