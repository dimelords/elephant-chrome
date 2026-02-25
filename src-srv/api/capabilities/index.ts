import type { RouteHandler } from '../../routes.js'

/**
 * Returns capabilities/features available in this deployment
 * Frontend can use this to show/hide features based on configuration
 */
export const GET: RouteHandler = async (req, { res }) => {
  const capabilities = {
    graphics: !!process.env.GRAPHIC_BASE_URL,
    imageProvider: process.env.IMAGE_API_PROVIDER || 'unsplash',
    collaboration: !!process.env.WS_URL,
    spellcheck: !!process.env.SPELLCHECK_URL
  }

  return {
    statusCode: 200,
    payload: capabilities
  }
}
