import type { ImageProvider, NormalizedImage, SearchResult } from './types.js'

interface PixabayImage {
  id: number
  pageURL: string
  type: string
  tags: string
  previewURL: string
  previewWidth: number
  previewHeight: number
  webformatURL: string
  webformatWidth: number
  webformatHeight: number
  largeImageURL: string
  imageWidth: number
  imageHeight: number
  imageSize: number
  views: number
  downloads: number
  likes: number
  comments: number
  user_id: number
  user: string
  userImageURL: string
}

interface PixabayResponse {
  total: number
  totalHits: number
  hits: PixabayImage[]
}

export class PixabayProvider implements ImageProvider {
  name = 'pixabay'
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async search(query: string, page: number, perPage: number): Promise<SearchResult> {
    const url = new URL('https://pixabay.com/api/')
    url.searchParams.set('key', this.apiKey)
    url.searchParams.set('q', query)
    url.searchParams.set('page', page.toString())
    url.searchParams.set('per_page', perPage.toString())
    url.searchParams.set('image_type', 'photo')

    const response = await fetch(url.toString())

    if (!response.ok) {
      throw new Error(`Pixabay API error: ${response.status}`)
    }

    const data: PixabayResponse = await response.json()

    return {
      images: data.hits.map(img => this.normalize(img)),
      total: data.totalHits,
      page,
      perPage
    }
  }

  private normalize(image: PixabayImage): NormalizedImage {
    return {
      id: image.id.toString(),
      title: image.tags.split(',')[0]?.trim() || 'Untitled',
      description: image.tags,
      photographer: image.user,
      photographerUrl: `https://pixabay.com/users/${image.user}-${image.user_id}/`,
      urls: {
        thumbnail: image.previewURL,
        preview: image.webformatURL,
        full: image.largeImageURL
      },
      source: 'pixabay',
      license: 'Pixabay License (Free for commercial use)',
      attribution: `Image by ${image.user} from Pixabay`
    }
  }
}
