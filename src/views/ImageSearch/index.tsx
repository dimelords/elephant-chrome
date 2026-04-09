import React, { useState, useRef, useEffect, type JSX } from 'react'
import { View, ViewHeader } from '@/components'
import { type ViewMetadata } from '@/types'
import { LoaderIcon, ListEndIcon, ImageIcon } from '@ttab/elephant-ui/icons'
import useSWRInfinite from 'swr/infinite'
import { SWRConfig } from 'swr'
import { createFetcher, type NormalizedImage, type SearchResult } from './lib/fetcher'
import { useSession } from 'next-auth/react'
import InfiniteScroll from './InfiniteScroll'
import { ImageSearchInput } from './SearchInput'
import { useCapabilities } from '@/hooks'
import { useTranslation } from 'react-i18next'

const BASE_URL = import.meta.env.BASE_URL || ''

export type MediaTypes = 'image' | 'graphic'

const ImageCard = ({ image }: { image: NormalizedImage }): JSX.Element => {
  const imageRef = useRef<HTMLImageElement>(null)

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation()

    if (!imageRef.current) return

    const el = imageRef.current
    el.style.opacity = '0.5'

    // Clear any default drag data the browser might add
    e.dataTransfer.clearData()

    // For TT images, include full metadata for drag-and-drop
    if (image.source === 'tt' && image._raw) {
      const ttImage = image._raw
      const imageData = {
        byline: image.photographer || '',
        text: image.description || '',
        href: image.urls.preview,
        proxy: image.urls.preview,
        width: 1024,
        height: 683
      }
      e.dataTransfer.setData('tt/visual', JSON.stringify(imageData))
    } else {
      // For other providers, set a generic image data format
      e.dataTransfer.setData('text/uri-list', image.urls.full)
      e.dataTransfer.setData('text/plain', image.title)
    }
  }

  const handleDragEnd = () => {
    if (imageRef.current) {
      imageRef.current.style.opacity = '1'
    }
  }

  return (
    <div
      className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer bg-white"
    >
      <div className="flex place-content-center bg-gray-200 dark:bg-table-focused min-h-[144px]">
        <img
          ref={imageRef}
          src={image.urls.thumbnail}
          alt={image.title}
          title={image.description}
          className="max-h-[176px] object-contain m-width-auto"
          loading="lazy"
          draggable
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        />
      </div>
      <div className="p-3">
        <p className="text-sm font-medium truncate mb-1">
          {image.title}
        </p>
        {image.photographer && (
          <p className="text-xs text-gray-500 truncate">
            {image.photographerUrl ? (
              <a
                href={image.photographerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {image.photographer}
              </a>
            ) : (
              image.photographer
            )}
          </p>
        )}
      </div>
    </div>
  )
}

const meta: ViewMetadata = {
  name: 'ImageSearch',
  path: `${import.meta.env.BASE_URL || ''}/imagesearch`,
  widths: {
    sm: 12,
    md: 8,
    lg: 6,
    xl: 4,
    '2xl': 4,
    hd: 4,
    fhd: 4,
    qhd: 4,
    uhd: 4
  }
}

export const ImageSearch = (): JSX.Element => {
  const { data: session } = useSession()

  return (
    <SWRConfig value={{ fetcher: createFetcher(session) }}>
      <ImageSearchContent />
    </SWRConfig>
  )
}

const ImageSearchContent = (): JSX.Element => {
  const [queryString, setQueryString] = useState('')
  const [mediaType, setMediaType] = useState<MediaTypes>('image')
  const { capabilities } = useCapabilities()
  const prevMediaTypeRef = useRef<MediaTypes>(mediaType)
  const { t } = useTranslation('views')

  const swr = useSWRInfinite<SearchResult, Error>(
    (index) => {
      if (!queryString) return null
      return [queryString, mediaType, index + 1] // Pages start at 1
    },
    {
      revalidateFirstPage: false
    }
  )

  const provider = swr.data?.[0]?.provider
  const total = swr.data?.[0]?.total || 0

  // Show graphics toggle if graphics capability is enabled
  const showGraphicsToggle = capabilities?.graphics ?? false

  // Automatically refresh results when media type changes (but not on initial mount)
  useEffect(() => {
    if (prevMediaTypeRef.current !== mediaType && queryString) {
      prevMediaTypeRef.current = mediaType
      swr.mutate()
    }
  }, [mediaType])

  return (
    <View.Root>
      <ViewHeader.Root>
        <ViewHeader.Title
          name='ImageSearch'
          title={t('imageSearch.title')}
          icon={ImageIcon}
        />
        <ViewHeader.Content>
          <ImageSearchInput
            setQueryString={setQueryString}
            setMediaType={setMediaType}
            showMediaTypeToggle={showGraphicsToggle}
          />
        </ViewHeader.Content>
        <ViewHeader.Action />
      </ViewHeader.Root>

      <View.Content>
        {!queryString && (
          <div className="text-gray-500 text-center py-8">
            Skriv en sökterm för att börja söka
          </div>
        )}

        {queryString && swr.data && swr.data.length > 0 && (
          <div className="mb-4 px-4 pt-4 text-sm text-gray-600">
            {total.toLocaleString()} {mediaType === 'graphic' ? 'grafik' : 'bilder'} från <span className="font-semibold capitalize">{provider}</span>
          </div>
        )}

        {queryString && (
          <div className="h-screen max-h-screen flex flex-col p-4 overflow-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <InfiniteScroll
                swr={swr}
                loadingIndicator={<LoaderIcon size='32' color='#9ca3af' strokeWidth='2' />}
                endingIndicator={<ListEndIcon size='32' color='#9ca3af' strokeWidth='2' />}
                isReachingEnd={(swr) => {
                  if (!swr.data || swr.data.length === 0) return true
                  const lastPage = swr.data[swr.data.length - 1]
                  return lastPage?.images.length === 0
                }}
              >
                {(data: SearchResult) =>
                  data.images.map((image: NormalizedImage) => (
                    <ImageCard key={image.id} image={image} />
                  ))
                }
              </InfiniteScroll>
            </div>
          </div>
        )}
      </View.Content>
    </View.Root>
  )
}

ImageSearch.meta = meta
