/**
 * Generic hit type for Index client responses
 * Used by simple providers that only need id and source fields
 */
export interface IndexHit {
  id: string
  score: number
  source?: Record<string, { values: string[] }>
  fields?: Record<string, { values: string[] }>
  sort?: string[]
}
