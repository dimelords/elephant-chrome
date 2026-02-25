import { lazy } from 'react'
import { type ViewMetadata } from '@/types'

const meta: ViewMetadata = {
  name: 'ImageLibrary',
  path: `${import.meta.env.BASE_URL || ''}/images`,
  widths: {
    sm: 12,
    md: 8,
    lg: 6,
    xl: 4,
    '2xl': 4,
    hd: 4,
    fhd: 4,
    qhd: 4,
    uhd: 4
  }
}

export const ImageLibrary = lazy(async () => await import('./ImageLibrary').then((m) => ({ default: m.ImageLibrary })))

ImageLibrary.meta = meta
