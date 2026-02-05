import type { Session } from 'next-auth'
import { toast } from 'sonner'

/**
 * Normalized image format from unified proxy
 * Works with any provider: Unsplash, Pexels, Pixabay, TT
 */
export interface NormalizedImage {
  id: string
  title: string
  description?: string
  photographer?: string
  photographerUrl?: string
  urls: {
    thumbnail: string
    preview: string
    full: string
  }
  source: 'unsplash' | 'pexels' | 'pixabay' | 'tt'
  license?: string
  attribution?: string
}

export interface SearchResult {
  images: NormalizedImage[]
  total: number
  page: number
  perPage: number
  provider: string
}

/**
 * Fetcher using unified image proxy
 * Supports multiple providers via IMAGE_API_PROVIDER env variable
 * Keeps all API keys secure on the server
 */
export const createFetcher = (session: Session | null) =>
  async ([queryString, mediaType, page]: [queryString: string, mediaType: string, page: number]): Promise<SearchResult> => {
    if (!session) {
      toast.error('Kan inte autentisera mot bildtjänsten')
      throw new Error('ImageSearch Error: No session for user')
    }

    const PER_PAGE = 12

    // Build unified proxy URL
    const proxyUrl = new URL(`${import.meta.env.BASE_URL || ''}/api/images-proxy/search`, window.location.origin)
    proxyUrl.searchParams.set('q', queryString)
    proxyUrl.searchParams.set('page', page.toString())
    proxyUrl.searchParams.set('per_page', PER_PAGE.toString())

    // Add media type for TT provider (images vs graphics)
    if (mediaType) {
      proxyUrl.searchParams.set('media_type', mediaType)
    }

    const response = await fetch(proxyUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`
      }
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      toast.error(`Bildtjänsten svarar inte: ${error.error || response.statusText}`)
      throw new Error(`Image API Error: ${response.status}`)
    }

    return await response.json()
  }
