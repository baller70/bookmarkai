import type React from 'react'
import ImageQualityEnhancer from './ImageQualityEnhancer'

const enhancer = new ImageQualityEnhancer()

function canProcessSrc(src: string): boolean {
  if (!src) return false
  if (src.startsWith('data:') || src.startsWith('blob:')) return true
  try {
    const u = new URL(src, window.location.href)
    return u.origin === window.location.origin
  } catch {
    return false
  }
}

/**
 * Returns an onLoad handler that enhances the image using the ImageQualityEnhancer
 * Only processes safe sources (data:, blob:, or same-origin) to avoid canvas tainting
 * Adds a data-enhanced="1" flag on the element to prevent double-processing
 */
export function enhanceOnLoad(targetSize: number) {
  return async (e: React.SyntheticEvent<HTMLImageElement>) => {
    try {
      const img = e.currentTarget
      if (!img || (img as any).dataset?.enhanced === '1') return

      const src = (img as any).currentSrc || (img as any).src || ''
      if (!canProcessSrc(src)) return

      const dataUrl = await enhancer.enhance(img, { targetSize })
      if (typeof dataUrl === 'string' && dataUrl.startsWith('data:') && dataUrl.length > 64) {
        ;(img as HTMLImageElement).src = dataUrl
        ;(img as any).dataset.enhanced = '1'
      }
    } catch {
      // Silent fail: keep original image
    }
  }
}

