import type { RouteHandler } from '../../../routes.js'
import { createProvider, type ProviderType } from '../providers/index.js'

/**
 * Universal image search proxy
 * Switches between different image providers based on IMAGE_API_PROVIDER env variable
 * Normalizes all responses to a common format
 */
export const GET: RouteHandler = async (req, { res }) => {
  // Get configured provider from environment
  const providerType = (process.env.IMAGE_API_PROVIDER || 'unsplash') as ProviderType

  // Get query parameters
  const query = req.query as Record<string, string>
  const q = query.q || ''
  const page = parseInt(query.page || '1', 10)
  const perPage = parseInt(query.per_page || '10', 10)
  const mediaType = query.media_type // 'image' or 'graphic'

  try {
    // Create provider instance
    const provider = createProvider(providerType)

    // Search using the configured provider
    const result = await provider.search(q, page, perPage, mediaType)

    // Set cache header
    res.setHeader('Cache-Control', 'public, max-age=300')

    // Return normalized result
    return {
      statusCode: 200,
      payload: {
        ...result,
        provider: providerType
      }
    }
  } catch (error) {
    console.error(`Image provider (${providerType}) error:`, error)

    const errorMessage = error instanceof Error ? error.message : String(error)

    return {
      statusCode: 500,
      payload: {
        error: `Image search failed: ${errorMessage}`,
        provider: providerType
      }
    }
  }
}
