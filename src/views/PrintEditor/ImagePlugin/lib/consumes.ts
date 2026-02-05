import { type TBConsumesFunction } from '@ttab/textbit'
import { CONFIG } from '../config'

export const consumes: TBConsumesFunction = ({ input }) => {
  // Handle direct file drops (drag file from computer)
  if (input.data instanceof File) {
    const { size, type } = input.data

    if (!['image/png', 'image/jpg', 'image/jpeg', 'image/gif'].includes(type)) {
      return [false]
    }

    // Hardcoded limit on 50 MB
    if (size / 1024 / 1024 > CONFIG.maxSizeInMb) {
      console.info(`Image is too large, ${size / 1024 / 1024}, max ${CONFIG.maxSizeInMb} Mb allowed`)
      return [false]
    }

    return [true, 'core/image']
  }

  // Handle image drops from ImageSearch (tt/visual format)
  if (input.type === 'tt/visual' && typeof input.data === 'string') {
    try {
      const imageData = JSON.parse(input.data)
      if (imageData.href || imageData.proxy) {
        return [true, 'core/image']
      }
    } catch {
      return [false]
    }
  }

  // Handle generic image drops from other providers (text/uri-list)
  if (input.type === 'text/uri-list' && typeof input.data === 'string') {
    // Check if it's an image URL
    if (input.data.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return [true, 'core/image']
    }
  }

  return [false]
}
