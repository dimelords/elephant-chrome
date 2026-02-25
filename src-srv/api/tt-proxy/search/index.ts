import type { RouteHandler } from '../../../routes.js'

/**
 * Proxy endpoint for TT Image API
 * Keeps API key server-side for security
 */
export const GET: RouteHandler = async (req, { res }) => {
  const apiKey = process.env.TT_API_KEY
  const agreementId = process.env.TT_AGREEMENT_ID
  const contentApiUrl = process.env.CONTENT_API_URL || 'https://api.tt.se'

  if (!apiKey) {
    return {
      statusCode: 500,
      payload: { error: 'TT API key not configured' }
    }
  }

  // Get query parameters from request
  const query = req.query as Record<string, string | string[]>
  const mediaType = (query.mediaType as string) || 'image'
  const q = (query.q as string) || ''
  const s = (query.s as string) || '10'
  const fr = (query.fr as string) || '0'
  const sort = (query.sort as string) || 'default:desc'

  // Build TT API URL with API key
  const ttUrl = new URL(`${contentApiUrl}/content/v1/${mediaType}/search`)
  ttUrl.searchParams.set('ak', apiKey)
  ttUrl.searchParams.set('q', q)
  ttUrl.searchParams.set('s', s)
  ttUrl.searchParams.set('fr', fr)
  ttUrl.searchParams.set('sort', sort)
  // Only search for usable images (commissioned requires admin privileges)
  ttUrl.searchParams.set('pubstatus[]', 'usable')

  if (agreementId) {
    ttUrl.searchParams.set('agr[]', agreementId)
  }

  // Get product codes from request (p[] parameter can be array)
  const productCodes = Array.isArray(query['p[]']) ? query['p[]'] : query['p[]'] ? [query['p[]']] : []
  productCodes.forEach((code: string) => {
    ttUrl.searchParams.append('p[]', code)
  })

  try {
    const response = await fetch(ttUrl.toString(), {
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      return {
        statusCode: response.status,
        payload: { error: `TT API error: ${response.status} ${response.statusText}` }
      }
    }

    const data = await response.json()

    // Set cache header before returning
    res.setHeader('Cache-Control', 'public, max-age=300')

    return {
      statusCode: 200,
      payload: data
    }
  } catch (error) {
    console.error('TT API proxy error:', error)
    return {
      statusCode: 500,
      payload: {
        error: 'Failed to fetch from TT API',
        details: error instanceof Error ? error.message : String(error)
      }
    }
  }
}
