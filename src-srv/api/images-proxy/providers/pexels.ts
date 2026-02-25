import type { ImageProvider, NormalizedImage, SearchResult } from './types.js'

interface PexelsImage {
  id: number
  width: number
  height: number
  url: string
  photographer: string
  photographer_url: string
  photographer_id: number
  avg_color: string
  src: {
    original: string
    large2x: string
    large: string
    medium: string
    small: string
    portrait: string
    landscape: string
    tiny: string
  }
  liked: boolean
  alt: string
}

interface PexelsResponse {
  page: number
  per_page: number
  photos: PexelsImage[]
  total_results: number
  next_page?: string
}

export class PexelsProvider implements ImageProvider {
  name = 'pexels'
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async search(query: string, page: number, perPage: number): Promise<SearchResult> {
    const url = new URL('https://api.pexels.com/v1/search')
    url.searchParams.set('query', query)
    url.searchParams.set('page', page.toString())
    url.searchParams.set('per_page', perPage.toString())

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': this.apiKey
      }
    })

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status}`)
    }

    const data: PexelsResponse = await response.json()

    return {
      images: data.photos.map(img => this.normalize(img)),
      total: data.total_results,
      page: data.page,
      perPage: data.per_page
    }
  }

  private normalize(image: PexelsImage): NormalizedImage {
    return {
      id: image.id.toString(),
      title: image.alt || 'Untitled',
      description: image.alt,
      photographer: image.photographer,
      photographerUrl: image.photographer_url,
      urls: {
        thumbnail: image.src.tiny,
        preview: image.src.medium,
        full: image.src.large
      },
      source: 'pexels',
      license: 'Pexels License (Free for commercial use)',
      attribution: `Photo by ${image.photographer}`
    }
  }
}
