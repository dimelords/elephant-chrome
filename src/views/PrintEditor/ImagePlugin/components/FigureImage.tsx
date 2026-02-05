import type { Repository } from '@/shared/Repository'
import type { AttachmentDetails } from '@ttab/elephant-api/repository'
import { TextbitElement, type TBComponentProps, Transforms, type Descendant } from '@ttab/textbit'
import { Crop } from '@ttab/textbit-plugins'
import { useEffect, useRef, useState, type JSX } from 'react'
import { parseCropString, parseFocusString } from '../lib/utils'
import { useSession } from 'next-auth/react'

/**
 * Render a "handout" image using a retreived signed download url.
 */

export const FigureImage = ({ editor, children, rootNode, options }: TBComponentProps & {
  options: {
    repository: Repository
    accessToken: string
  }
}): JSX.Element => {
  const { properties = {} } = TextbitElement.isBlock(rootNode) ? rootNode : {}

  const focusStr = properties?.focus as string || undefined
  const cropStr = properties?.crop as string || undefined
  const crop = parseCropString(cropStr)
  const focus = parseFocusString(focusStr)

  const { repository: repository } = options
  const { uploadId, uri }: { uploadId?: string, uri?: string } = properties
  const imgContainerRef = useRef<HTMLDivElement>(null)
  const [attachmentDetails, setAttachmentDetails] = useState<AttachmentDetails | null>(null)
  const { data: session } = useSession()

  // Fetch attachment details for uploaded images
  useEffect(() => {
    if (!repository || !session || !uploadId) {
      return
    }

    if (!imgContainerRef?.current) {
      return
    }

    repository.getAttachmentDetails(uploadId, session?.accessToken)
      .then((details) => {
        setAttachmentDetails(details)
      })
      .catch((ex) => {
        console.error(ex)
      })
  }, [session, repository, uploadId])

  // Determine image source: uploaded file or direct URI
  // Only use URI if it's a valid HTTP(S) URL, not core:// scheme
  const isValidHttpUrl = uri?.startsWith('http://') || uri?.startsWith('https://')
  const imageSrc = attachmentDetails?.downloadLink || (isValidHttpUrl ? uri : undefined)

  return (
    <div contentEditable={false}>
      <div ref={imgContainerRef} className='relative rounded-xs overflow-hidden'>
        {imageSrc ? (
          <img width='100%' src={imageSrc} alt={properties?.title as string || 'Image'} />
        ) : (
          <div className='w-full h-48 bg-gray-200 flex items-center justify-center'>
            <span className='text-gray-500'>Loading image...</span>
          </div>
        )}

        {!!imageSrc
          && (
            <>
              {/* Overlay with cutout for crop area */}
              {crop && <Crop.VisualCrop crop={crop} />}

              {/* Focus point indicator */}
              {focus && <Crop.VisualFocus focus={focus} />}

              <Crop.Dialog
                src={imageSrc}
                area={crop}
                point={focus}
                onChange={({ crop, focus }) => {
                  const n = editor.children.findIndex((child: Descendant) => child.id === rootNode?.id)
                  if (n < 0) {
                    return
                  }

                  // Convert back to string format for storage
                  const cropString = crop ? `${crop.x} ${crop.y} ${crop.w} ${crop.h}` : undefined
                  const focusString = focus ? `${focus.x} ${focus.y}` : undefined

                  Transforms.setNodes(
                    editor,
                    {
                      properties: {
                        ...rootNode?.properties,
                        crop: cropString,
                        focus: focusString
                      }
                    },
                    { at: [n] }
                  )
                }}
              />
            </>
          )}
      </div>
      {children}
    </div>
  )
}
