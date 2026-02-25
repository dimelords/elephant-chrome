import useSWR from 'swr'

interface Capabilities {
  graphics: boolean
  imageProvider: string
  collaboration: boolean
  spellcheck: boolean
}

const fetcher = async (url: string): Promise<Capabilities> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch capabilities')
  }
  return response.json()
}

/**
 * Hook to fetch server capabilities
 * Used to show/hide features based on backend configuration
 */
export function useCapabilities() {
  const baseUrl = import.meta.env.BASE_URL || ''
  const { data, error, isLoading } = useSWR<Capabilities>(
    `${baseUrl}/api/capabilities`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000 // Cache for 1 minute
    }
  )

  return {
    capabilities: data,
    isLoading,
    error
  }
}
