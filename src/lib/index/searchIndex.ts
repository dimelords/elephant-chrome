import { Index } from '@/shared/Index'
import { QueryV1 } from '@ttab/elephant-api/index'


export interface SearchIndexResult<T> {
  ok: boolean
  total: number
  hits: T[]
}

export interface SearchIndexError {
  ok: false
  errorCode: number
  errorMessage: string
  hits: never[]
}

export type SearchIndexResponse<T> = SearchIndexError | SearchIndexResult<T>

export async function searchIndex<T, TFields = Record<string, unknown>>(
  documentType: string,
  options: {
    endpoint: URL
    accessToken: string
    size?: number
    from?: number
    query?: QueryV1
    language?: string
  }
): Promise<SearchIndexResponse<T>> {
  try {
    const client = new Index(options.endpoint.href)

    const result = await client.query<T, TFields>({
      accessToken: options.accessToken,
      documentType,
      loadDocument: false,
      loadSource: true,
      size: Math.min(options.size || 100, 200),
      from: options.from || 0,
      query: options.query || QueryV1.create({
        conditions: {
          oneofKind: 'matchAll',
          matchAll: {}
        }
      })
    })
    return {
      ok: true,
      total: result.total || 0,
      hits: result.hits || []
    }
  } catch (error) {
    console.error('Search index error:', error)
    return {
      ok: false,
      errorCode: 500,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      hits: []
    }
  }
}
