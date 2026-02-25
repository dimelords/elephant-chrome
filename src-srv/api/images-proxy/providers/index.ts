import type { ImageProvider } from './types.js'
import { UnsplashProvider } from './unsplash.js'
import { PexelsProvider } from './pexels.js'
import { PixabayProvider } from './pixabay.js'
import { TTProvider } from './tt.js'

export type ProviderType = 'unsplash' | 'pexels' | 'pixabay' | 'tt'

export function createProvider(type: ProviderType): ImageProvider {
  switch (type) {
    case 'unsplash': {
      const apiKey = process.env.UNSPLASH_ACCESS_KEY
      if (!apiKey) {
        throw new Error('UNSPLASH_ACCESS_KEY not configured')
      }
      return new UnsplashProvider(apiKey)
    }

    case 'pexels': {
      const apiKey = process.env.PEXELS_API_KEY
      if (!apiKey) {
        throw new Error('PEXELS_API_KEY not configured')
      }
      return new PexelsProvider(apiKey)
    }

    case 'pixabay': {
      const apiKey = process.env.PIXABAY_API_KEY
      if (!apiKey) {
        throw new Error('PIXABAY_API_KEY not configured')
      }
      return new PixabayProvider(apiKey)
    }

    case 'tt': {
      const apiKey = process.env.TT_API_KEY
      const agreementId = process.env.TT_AGREEMENT_ID
      if (!apiKey || !agreementId) {
        throw new Error('TT_API_KEY and TT_AGREEMENT_ID must be configured')
      }
      return new TTProvider(apiKey, agreementId)
    }

    default:
      throw new Error(`Unknown provider type: ${type}`)
  }
}

export type { ImageProvider, NormalizedImage, SearchResult } from './types.js'
export { UnsplashProvider } from './unsplash.js'
export { PexelsProvider } from './pexels.js'
export { PixabayProvider } from './pixabay.js'
export { TTProvider } from './tt.js'
