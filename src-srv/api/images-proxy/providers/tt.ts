import type { ImageProvider, NormalizedImage, SearchResult } from './types.js'

interface TTRendition {
  sizeinbytes: number
  usage: 'Preview' | 'Hires' | 'Thumbnail'
  variant: 'Normal' | 'Watermark'
  width: number
  height: number
  mimetype: string
  href: string
}

interface TTImage {
  uri: string
  type?: 'picture' | 'graphic'
  headline?: string
  description_text?: string
  byline?: string
  copyrightholder?: string
  renditions?: Record<string, TTRendition>
}

interface TTResponse {
  hits: TTImage[]
  total: number
}

export class TTProvider implements ImageProvider {
  name = 'tt'
  private apiKey: string
  private agreementId: string

  constructor(apiKey: string, agreementId: string) {
    this.apiKey = apiKey
    this.agreementId = agreementId
  }

  async search(query: string, page: number, perPage: number, mediaType?: string): Promise<SearchResult> {
    const url = new URL('https://api.tt.se/content/v1/image/search')
    url.searchParams.set('ak', this.apiKey)
    url.searchParams.set('q', query)
    url.searchParams.set('s', perPage.toString())
    url.searchParams.set('fr', ((page - 1) * perPage).toString())
    url.searchParams.set('sort', 'default:desc')
    url.searchParams.set('pubstatus[]', 'usable')
    url.searchParams.set('agr[]', this.agreementId)

    // Filter by media type if specified (image or graphic)
    if (mediaType) {
      const typeFilter = mediaType === 'graphic' ? 'graphic' : 'picture'
      url.searchParams.set('type[]', typeFilter)
    }

    const response = await fetch(url.toString())

    if (!response.ok) {
      throw new Error(`TT API error: ${response.status}`)
    }

    const data: TTResponse = await response.json()

    return {
      images: data.hits.map(img => this.normalize(img)),
      total: data.total,
      page,
      perPage
    }
  }

  private normalize(image: TTImage): NormalizedImage {
    // Find best thumbnail and preview URLs
    const renditions = image.renditions || {}
    const allRenditions = Object.values(renditions)

    // Find Normal variant renditions (not Watermark)
    const thumbnail = allRenditions.find(r => r.usage === 'Thumbnail' && r.variant === 'Normal')
    const preview = allRenditions.find(r => r.usage === 'Preview' && r.variant === 'Normal')
    const hires = allRenditions.find(r => r.usage === 'Hires' && r.variant === 'Normal')

    // Extract image ID from preview URL for proxy
    // Example: https://beta.tt.se/media/image/sdldykeEEH2Jt0_NormalPreview.jpg
    // Extract: sdldykeEEH2Jt0_NormalPreview.jpg
    const getImageId = (url: string) => {
      try {
        return new URL(url).pathname.split('/').filter(Boolean).pop() || ''
      } catch {
        return ''
      }
    }

    const previewId = preview?.href ? getImageId(preview.href) : ''
    const thumbnailId = thumbnail?.href ? getImageId(thumbnail.href) : ''
    const hiresId = hires?.href ? getImageId(hires.href) : ''

    // Use proxy URLs to avoid CORS/403 issues with TT's image servers
    // BASE_URL is for frontend routing (/elephant), but API routes are at root level
    // So we explicitly use /api/ path which is separate from BASE_URL
    const BASE_URL = process.env.BASE_URL || ''

    // Use correct proxy endpoint based on type
    const proxyEndpoint = image.type === 'graphic' ? 'graphics' : 'tt-images'

    return {
      id: image.uri,
      title: image.headline || 'Untitled',
      description: image.description_text,
      photographer: image.byline,
      photographerUrl: undefined,
      urls: {
        // API routes are at /api/, not under BASE_URL
        thumbnail: thumbnailId ? `${BASE_URL}/api/${proxyEndpoint}/${thumbnailId}` : (thumbnail?.href || ''),
        preview: previewId ? `${BASE_URL}/api/${proxyEndpoint}/${previewId}` : (preview?.href || ''),
        full: hiresId ? `${BASE_URL}/api/${proxyEndpoint}/${hiresId}` : (hires?.href || '')
      },
      source: 'tt',
      license: image.copyrightholder,
      attribution: image.byline,
      // Include original data for drag-and-drop
      _raw: image
    }
  }
}
