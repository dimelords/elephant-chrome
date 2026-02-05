import { TwirpFetchTransport } from '@protobuf-ts/twirp-transport'
import { CheckClient } from '@ttab/elephant-api/spell'
import { meta } from './meta'
import { getCachedSession } from './getCachedSession'

export class Spellchecker {
  readonly #client: CheckClient

  constructor(repoUrl: string) {
    this.#client = new CheckClient(
      new TwirpFetchTransport({
        baseUrl: new URL('twirp', repoUrl).toString(),
        sendJson: true,
        jsonOptions: {
          ignoreUnknownFields: true
        }
      })
    )
  }

  /**
   * Spellcheck a string of texts
   *
   * @param {string[]} text - Array of strings to spellcheck
   * @param {string} documentLanguage - Language of provided document
   * @param {string[]} supportedLanguages - String array of languages supported for spellchecking
   *
   * @returns Promise<GetDocumentResponse>
   */
  async check(text: string[], documentLanguage: string, supportedLanguages: string[]): Promise<Array<Array<{
    text: string
    suggestions: Array<{
      text: string
      description: string
    }>
  }>>> {
    const session = await getCachedSession()

    if (!session?.accessToken) {
      console.warn('Spellcheck: No access token available')
      return []
    }

    if (!documentLanguage) {
      console.warn('Spellcheck: No document language provided')
      return []
    }

    // For now, documents in swedish need to be explicitly set to sv-se in order to work
    if (documentLanguage === 'sv') {
      documentLanguage = 'sv-se'
    }

    // We default language: 'en' to be british english
    if (documentLanguage === 'en') {
      documentLanguage = 'en-gb'
    }

    const language = documentLanguage.toLowerCase().replace('_', '-')

    if (!supportedLanguages.includes(documentLanguage)) {
      console.warn(documentLanguage, 'not supported, no spellchecking')
      return []
    }

    try {
      console.debug(`Spellcheck: Calling service for ${text.length} texts in ${language}`)

      const { response } = await this.#client.text({
        language,
        text,
        suggestions: true
      }, meta(session.accessToken))

      console.debug(`Spellcheck: Got response:`, response)

      // Check if we got a valid response
      if (!response) {
        console.warn(`Spellcheck: Empty response from server for language ${language}`)
        return []
      }

      console.debug(`Spellcheck: Response.misspelled length:`, response.misspelled?.length)

      const resturnResult = !Array.isArray(response?.misspelled)
        ? []
        : response.misspelled.map((misspelled) => {
          return !Array.isArray(misspelled.entries)
            ? []
            : misspelled.entries.map((entry) => {
              return {
                text: entry.text,
                suggestions: entry.suggestions || []
              }
            })
        })

      console.debug(`Spellcheck: Returning ${resturnResult.length} results`)
      return resturnResult
    } catch (err: unknown) {
      // Suppress error so we don't interrupt the system just because we can't check spelling
      let errorDetails = 'Unknown error'

      if (err instanceof Error) {
        errorDetails = err.message || err.name || 'Error object without message'
        console.error('Spellcheck error details:', {
          name: err.name,
          message: err.message,
          stack: err.stack
        })
      } else if (typeof err === 'object' && err !== null) {
        try {
          errorDetails = JSON.stringify(err)
          console.error('Spellcheck error object:', err)
        } catch {
          errorDetails = String(err)
        }
      } else {
        errorDetails = String(err)
        console.error('Spellcheck error (not an object):', err)
      }

      console.error(`Unable to check spelling (lang: ${language}, texts: ${text.length}): ${errorDetails}`)
    }

    return []
  }
}
