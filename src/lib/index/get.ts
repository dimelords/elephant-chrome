import { searchIndex, type SearchIndexResponse } from './searchIndex'

interface SearchParams {
  page?: number
  size?: number
  language?: string
}

/**
 * @deprecated This function is deprecated and will be removed in future versions.
 * TODO: use Twirp api and wrap in a hook #ELE-1171
 */
export const get = async <T>(endpoint: URL, accessToken: string, documentType: string, params?: SearchParams): Promise<SearchIndexResponse<T>> => {
  return await searchIndex<T>(
    documentType,
    {
      endpoint,
      accessToken,
      size: params?.size || 100,
      from: (params?.page || 0) * (params?.size || 100),
      language: params?.language
    }
  )
}
