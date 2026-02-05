import { z } from 'zod'
import { BaseSchema } from './base'
import type { Document } from '@ttab/elephant-api/newsdoc'

const AuthorSchema = z.object({
  _source: z.object({
    'document.meta.core_author.data.firstName': z.array(z.string()),
    'document.meta.core_author.data.lastName': z.array(z.string()),
    'document.meta.core_author.data.initials': z.array(z.string()),
    'document.meta.core_contact_info.data.email': z.array(z.string()),
    'document.meta.core_contact_info.data.city': z.array(z.string()),
    'document.meta.core_contact_info.data.country': z.array(z.string()),
    'document.rel.same_as.uri': z.array(z.string())
  })
})

const _FullAuthorSchema = BaseSchema.and(AuthorSchema)
export type IndexedAuthor = z.infer<typeof _FullAuthorSchema>

// New type for Index client response (with NewsDoc document)
export interface IndexAuthorHit {
  id: string
  score: number
  document?: Document
  source?: Record<string, { values: string[] }>
  fields?: Record<string, { values: string[] }>
  sort?: string[]
}
