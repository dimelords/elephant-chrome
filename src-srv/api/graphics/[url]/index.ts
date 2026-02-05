import { pipeline } from 'stream/promises'
import type { RouteHandler } from '../../../routes.js'

/**
 * Proxy for TT graphic URLs
 * TT's graphic servers require authentication and have CORS restrictions
 * This proxy fetches graphics server-side and streams them to the client
 */
export const GET: RouteHandler = async (req, { res }) => {
  const graphicId = req.params.url
  console.log('graphics handler: received request for', graphicId)

  if (!graphicId) {
    return {
      statusCode: 400,
      statusMessage: 'Graphic ID required'
    }
  }

  // Get TT API credentials and base URL
  const apiKey = process.env.TT_API_KEY
  const baseUrl = process.env.GRAPHIC_BASE_URL

  if (!apiKey) {
    console.error('graphics: TT_API_KEY not configured')
    return {
      statusCode: 500,
      statusMessage: 'TT API key not configured'
    }
  }

  if (!baseUrl) {
    console.error('graphics: GRAPHIC_BASE_URL not configured')
    return {
      statusCode: 500,
      statusMessage: 'Graphics not configured'
    }
  }

  // Add API key as query parameter
  const graphicUrl = new URL(`${baseUrl}/${graphicId}`)
  graphicUrl.searchParams.set('ak', apiKey)

  console.log('graphics: fetching from', graphicUrl.toString())

  try {
    // Fetch graphic from TT with API key authentication
    const graphicRes = await fetch(graphicUrl.toString(), {
      headers: {
        'User-Agent': 'elephant-chrome/1.0'
      }
    })

    console.log('graphics: TT server response status', graphicRes.status, graphicRes.statusText)

    if (!graphicRes.ok || graphicRes.status >= 400) {
      console.error('graphics: TT server error', graphicRes.status, graphicRes.statusText)
      return {
        statusCode: graphicRes.status,
        statusMessage: `TT graphics server error: ${graphicRes.statusText}`
      }
    }

    // Set response headers
    const contentType = graphicRes.headers.get('content-type')
    if (contentType) res.setHeader('Content-Type', contentType)

    const contentLength = graphicRes.headers.get('content-length')
    if (contentLength) res.setHeader('Content-Length', contentLength)

    // Cache for 1 hour
    res.setHeader('Cache-Control', 'public, max-age=3600')

    if (!graphicRes.body) {
      return {
        statusCode: 500,
        statusMessage: 'Failed to stream graphic'
      }
    }

    // Stream the graphic to client
    await pipeline(graphicRes.body, res)

    return {
      statusCode: 202,
      statusMessage: 'OK'
    }
  } catch (error) {
    console.error('TT graphic proxy error:', error)
    return {
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
