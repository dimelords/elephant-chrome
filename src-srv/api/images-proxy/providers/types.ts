/**
 * Common image format that all providers normalize to
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
  // Optional raw data for provider-specific features (e.g., drag-and-drop)
  _raw?: any
}

export interface SearchResult {
  images: NormalizedImage[]
  total: number
  page: number
  perPage: number
}

/**
 * Provider interface - each image API implements this
 */
export interface ImageProvider {
  name: string
  search(query: string, page: number, perPage: number, mediaType?: string): Promise<SearchResult>
}
