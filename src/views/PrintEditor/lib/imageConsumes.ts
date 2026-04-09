import { type TBConsumesFunction } from '@ttab/textbit'

const MAX_SIZE_MB = 50

export const imageConsumes: TBConsumesFunction = ({ input }) => {
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
    if (input.data.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return [true, 'core/image']
    }
  }

  if (!(input.data instanceof File)) {
    return [false]
  }

  const { size, type } = input.data

  if (!['image/png', 'image/jpg', 'image/jpeg', 'image/gif'].includes(type)) {
    return [false]
  }

  // Hardcoded limit on 50 MB
  if (size / 1024 / 1024 > MAX_SIZE_MB) {
    console.info(`Image is too large, ${size / 1024 / 1024}, max ${MAX_SIZE_MB} Mb allowed`)
    return [false]
  }

  return [true, 'core/image']
}
