import { View, ViewHeader } from '@/components'
import { useDocuments } from '@/hooks/index/useDocuments'
import { ImageIcon } from '@ttab/elephant-ui/icons'
import { useState } from 'react'
import type { HitV1 } from '@ttab/elephant-api/index'

export const ImageLibrary = (): JSX.Element => {
  const [searchQuery, setSearchQuery] = useState('')

  const { data: images, isLoading, error } = useDocuments<HitV1>({
    documentType: 'core/image',
    size: 50,
    query: searchQuery
      ? {
          conditions: {
            oneofKind: 'match',
            match: {
              field: 'document.title',
              value: searchQuery
            }
          }
        }
      : {
          conditions: {
            oneofKind: 'matchAll',
            matchAll: {}
          }
        }
  })

  return (
    <View.Root>
      <ViewHeader.Root>
        <ViewHeader.Title
          name='ImageLibrary'
          title='Bildbibliotek'
          icon={ImageIcon}
        />
        <ViewHeader.Content>
          <input
            type="text"
            placeholder="Sök bilder..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border rounded"
          />
        </ViewHeader.Content>
        <ViewHeader.Action />
      </ViewHeader.Root>

      <View.Content>
        <div className="p-4">
          {isLoading && <div>Laddar bilder...</div>}
          {error && <div className="text-red-500">Fel vid laddning: {error.message}</div>}

          {!isLoading && images?.length === 0 && (
            <div className="text-gray-500 text-center py-8">
              Inga bilder hittades. Ladda upp bilder i PrintEditor genom att dra och släppa dem.
            </div>
          )}

          {images && images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image) => {
                const imageId = image.id
                const title = image.fields?.['document.title']?.values?.[0] || 'Untitled'
                const credit = image.fields?.['document.meta.core/image.data.credit']?.values?.[0]

                // For now, we'll use a placeholder since we need the asset serving endpoint
                const imageUrl = `/api/assets/${imageId}`

                return (
                  <div
                    key={imageId}
                    className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <div className="aspect-square bg-gray-200 flex items-center justify-center">
                      {/* Placeholder until asset serving is implemented */}
                      <ImageIcon className="w-16 h-16 text-gray-400" />
                      {/* Future: <img src={imageUrl} alt={title} className="w-full h-full object-cover" /> */}
                    </div>
                    <div className="p-2">
                      <p className="text-sm font-medium truncate">{title}</p>
                      {credit && (
                        <p className="text-xs text-gray-500 truncate">
                          Foto: {credit}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {images && images.length > 0 && (
            <div className="mt-4 text-sm text-gray-500 text-center">
              Visar {images.length} bilder
            </div>
          )}
        </div>
      </View.Content>
    </View.Root>
  )
}
