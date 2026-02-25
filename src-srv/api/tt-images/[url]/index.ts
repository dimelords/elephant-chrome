import { pipeline } from 'stream/promises'
import type { RouteHandler } from '../../../routes.js'

/**
 * Proxy for TT image URLs
 * TT's image servers require authentication and have CORS restrictions
 * This proxy fetches images server-side and streams them to the client
 */
export const GET: RouteHandler = async (req, { res }) => {
  const imageId = req.params.url
  console.log('tt-images handler: received request for', imageId)

  if (!imageId) {
    return {
      statusCode: 400,
      statusMessage: 'Image ID required'
    }
  }

  // Get TT API credentials
  const apiKey = process.env.TT_API_KEY
  if (!apiKey) {
    console.error('tt-images: TT_API_KEY not configured')
    return {
      statusCode: 500,
      statusMessage: 'TT API key not configured'
    }
  }

  // TT image URLs follow pattern:
  // https://beta.tt.se/media/image/{id}
  // https://thumbnail.tt.se/media/image/{id}

  // Determine base URL from image ID
  let baseUrl = 'https://beta.tt.se'
  if (imageId.includes('Thumbnail')) {
    baseUrl = 'https://thumbnail.tt.se'
  }

  // Add API key as query parameter
  const imageUrl = new URL(`${baseUrl}/media/image/${imageId}`)
  imageUrl.searchParams.set('ak', apiKey)

  console.log('tt-images: fetching from', imageUrl.toString())

  try {
    // Fetch image from TT with API key authentication
    const imageRes = await fetch(imageUrl.toString(), {
      headers: {
        'User-Agent': 'elephant-chrome/1.0'
      }
    })

    console.log('tt-images: TT server response status', imageRes.status, imageRes.statusText)

    if (!imageRes.ok || imageRes.status >= 400) {
      console.error('tt-images: TT server error', imageRes.status, imageRes.statusText)
      return {
        statusCode: imageRes.status,
        statusMessage: `TT image server error: ${imageRes.statusText}`
      }
    }

    // Set response headers
    const contentType = imageRes.headers.get('content-type')
    if (contentType) res.setHeader('Content-Type', contentType)

    const contentLength = imageRes.headers.get('content-length')
    if (contentLength) res.setHeader('Content-Length', contentLength)

    // Cache for 1 hour
    res.setHeader('Cache-Control', 'public, max-age=3600')

    if (!imageRes.body) {
      return {
        statusCode: 500,
        statusMessage: 'Failed to stream image'
      }
    }

    // Stream the image to client
    await pipeline(imageRes.body, res)

    return {
      statusCode: 202,
      statusMessage: 'OK'
    }
  } catch (error) {
    console.error('TT image proxy error:', error)
    return {
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
