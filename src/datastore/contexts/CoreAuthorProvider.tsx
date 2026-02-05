import { createContext, useCallback, useEffect, useState, type JSX } from 'react'
import { useRegistry, useRepositoryEvents } from '@/hooks'
import { useSession } from 'next-auth/react'
import { useIndexedDB } from '../hooks/useIndexedDB'
import { fetchOrRefresh } from '../lib/fetchOrRefresh'
import { type IDBAuthor } from '../types'
import { type IndexAuthorHit } from '@/lib/index/schemas/author'

interface CoreAuthorProviderState {
  objects: IDBAuthor[]
}

export const CoreAuthorContext = createContext<CoreAuthorProviderState>({
  objects: []
})

export const CoreAuthorProvider = ({ children }: {
  children: React.ReactNode
}): JSX.Element => {
  const documentType = 'core/author'
  const { server: { indexUrl } } = useRegistry()
  const { data } = useSession()
  const [objects, setObjects] = useState<IDBAuthor[]>([])
  const IDB = useIndexedDB()

  /*
   * Get objects from objectStore, else from index and add replace objectStore objects
   */
  const getOrRefreshCache = useCallback(async (force: boolean = false): Promise<void> => {
    if (!data?.accessToken || !indexUrl || !IDB.isConnected) {
      return
    }

    const cachedObjects = await fetchOrRefresh<IDBAuthor, IndexAuthorHit>(
      IDB,
      documentType,
      indexUrl,
      data.accessToken,
      force,
      (item) => {
        console.log(item)
        const { id, source } = item
        return {
          id,
          name: source?.['document.title']?.values?.[0]?.trim() || '',
          firstName: source?.['document.meta.core_author.data.firstName']?.values?.[0]?.trim() || '',
          lastName: source?.['document.meta.core_author.data.lastName']?.values?.[0]?.trim() || '',
          initials: source?.['document.meta.core_author.data.initials']?.values?.[0]?.trim() || '',
          email: source?.['document.meta.core_contact_info.data.email']?.values?.[0]?.trim() || '',
          sub: source?.['document.rel.same_as.uri']?.values
            ?.find((m: string) => m?.startsWith('core://user/sub'))?.trim() || ''
        }
      },
      'sv-se' // Authors have language-specific indices
    )

    if (Array.isArray(cachedObjects) && cachedObjects.length) {
      setObjects(cachedObjects)
    }
  }, [data?.accessToken, indexUrl, IDB])


  /**
   * Get and refresh object store cache if necessary on first load
   */
  useEffect(() => {
    void getOrRefreshCache()
  }, [getOrRefreshCache])


  /**
   * Listen to events to know when something have happened.
   * Then just clear and refresh the object store cache.
   */
  useRepositoryEvents(documentType, () => {
    getOrRefreshCache(true).catch((ex) => {
      console.error(ex)
    })
  })

  return (
    <CoreAuthorContext.Provider value={{ objects }}>
      {children}
    </CoreAuthorContext.Provider>
  )
}
