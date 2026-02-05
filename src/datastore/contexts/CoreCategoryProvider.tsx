import { createContext, useCallback, useEffect, useState, type JSX } from 'react'
import { useRegistry, useRepositoryEvents } from '@/hooks'
import { useSession } from 'next-auth/react'
import { useIndexedDB } from '../hooks/useIndexedDB'
import { fetchOrRefresh } from '../lib/fetchOrRefresh'
import { type IDBCategory } from '../types'
import { type IndexHit } from '@/lib/index/schemas/common'

interface CoreCategoryProviderState {
  objects: IDBCategory[]
}

export const CoreCategoryContext = createContext<CoreCategoryProviderState>({
  objects: []
})

export const CoreCategoryProvider = ({ children }: {
  children: React.ReactNode
}): JSX.Element => {
  const documentType = 'core/category'
  const { server: { indexUrl } } = useRegistry()
  const { data } = useSession()
  const [objects, setObjects] = useState<IDBCategory[]>([])
  const IDB = useIndexedDB()

  /*
   * Get objects from objectStore, else from index and add replace objectStore objects
   */
  const getOrRefreshCache = useCallback(async (force: boolean = false): Promise<void> => {
    if (!data?.accessToken || !indexUrl || !IDB.isConnected) {
      return
    }

    const cachedObjects = await fetchOrRefresh<IDBCategory, IndexHit>(
      IDB,
      documentType,
      indexUrl,
      data.accessToken,
      force,
      (item) => {
        const { id, source } = item
        return {
          id,
          title: source?.['document.title']?.values?.[0]?.trim() || ''
        }
      }
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
    <CoreCategoryContext.Provider value={{ objects }}>
      {children}
    </CoreCategoryContext.Provider>
  )
}
