import type { ImageProvider, NormalizedImage, SearchResult } from './types.js'

interface UnsplashImage {
  id: string
  urls: {
    thumb: string
    small: string
    regular: string
    full: string
  }
  user: {
    name: string
    username: string
    links: {
      html: string
    }
  }
  description: string | null
  alt_description: string | null
}

interface UnsplashResponse {
  results: UnsplashImage[]
  total: number
  total_pages: number
}

export class UnsplashProvider implements ImageProvider {
  name = 'unsplash'
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async search(query: string, page: number, perPage: number): Promise<SearchResult> {
    const url = new URL('https://api.unsplash.com/search/photos')
    url.searchParams.set('query', query)
    url.searchParams.set('page', page.toString())
    url.searchParams.set('per_page', perPage.toString())

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Client-ID ${this.apiKey}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`)
    }

    const data: UnsplashResponse = await response.json()

    return {
      images: data.results.map(img => this.normalize(img)),
      total: data.total,
      page,
      perPage
    }
  }

  private normalize(image: UnsplashImage): NormalizedImage {
    return {
      id: image.id,
      title: image.alt_description || image.description || 'Untitled',
      description: image.description || image.alt_description || undefined,
      photographer: image.user.name,
      photographerUrl: image.user.links.html,
      urls: {
        thumbnail: image.urls.thumb,
        preview: image.urls.small,
        full: image.urls.regular
      },
      source: 'unsplash',
      license: 'Unsplash License (Free for commercial use)',
      attribution: `Photo by ${image.user.name} on Unsplash`
    }
  }
}
