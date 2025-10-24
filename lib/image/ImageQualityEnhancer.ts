/*
  ImageQualityEnhancer
  - Pure, dependency-free enhancer for already-fetched images (data URL, blob URL, Blob/File, or HTMLImageElement)
  - No network requests; does not modify existing fetching logic
  - Returns enhanced image as base64 data URL (PNG, preserves transparency)
*/

export type ImageInput = string | Blob | HTMLImageElement

export interface EnhanceOptions {
  // Explicit target size (longest side) overrides automatic favicon/logo heuristics
  targetSize?: number
  // Output mime type (must be a data URL format). Defaults to PNG to preserve transparency.
  outputType?: 'image/png' | 'image/webp'
  // Sharpening options for unsharp mask
  sharpenAmount?: number // 0..1 (default 0.8)
  sharpenRadius?: 0 | 1 | 2 // kernel radius; 1 ~ 3x3 gaussian (default 1)
  sharpenThreshold?: number // 0..255 (default 2)
  // Global tweaks
  contrast?: number // fractional; +0.05 = +5% (default 0.05)
  saturation?: number // fractional; +0.03 = +3% (default 0.03)
}

export class ImageQualityEnhancer {
  async enhance(imageInput: ImageInput, options: EnhanceOptions = {}): Promise<string> {
    try {
      const img = await this.resolveToImage(imageInput)
      // Guard: if canvas would be tainted due to cross-origin, abort early with original
      if (!img || img.naturalWidth === 0 || img.naturalHeight === 0) {
        return await this.returnOriginalAsDataURL(imageInput)
      }

      const { targetW, targetH } = this.computeTargetSize(img, options)

      // Step 1: resample to target (progressive for quality, Lanczos-like feel via high smoothing + staged scaling)
      const resampled = this.progressiveResize(img, targetW, targetH)

      // Step 2: apply subtle enhancements (unsharp mask, contrast, saturation)
      const tuned = this.applyTuning(resampled,
        options.sharpenAmount ?? 0.8,
        options.sharpenRadius ?? 1,
        options.sharpenThreshold ?? 2,
        options.contrast ?? 0.05,
        options.saturation ?? 0.03,
      )

      // Step 3: export
      const outType = options.outputType ?? 'image/png'
      const dataUrl = tuned.toDataURL(outType)
      return dataUrl
    } catch {
      // Graceful degradation: on any failure, return original as base64 data URL
      return await this.returnOriginalAsDataURL(imageInput)
    }
  }

  // ============ Input normalization ============
  private async resolveToImage(input: ImageInput): Promise<HTMLImageElement | null> {
    if (typeof window === 'undefined') return null

    // If it's an HTMLImageElement and already loaded, use as-is (no new network requests)
    if (input instanceof HTMLImageElement) {
      if (input.complete && input.naturalWidth > 0) return input
      // If not complete, we avoid triggering a new network fetch; return null -> fallback
      return null
    }

    // String input: accept only data: or blob: URLs to avoid network
    if (typeof input === 'string') {
      const src = input.trim()
      if (!src.startsWith('data:') && !src.startsWith('blob:')) {
        // Do not fetch http/https; return null so we can fallback to original if possible
        return null
      }
      return await this.loadImageWithoutNetwork(src)
    }

    // Blob/File input
    if (input instanceof Blob) {
      const url = URL.createObjectURL(input)
      try {
        return await this.loadImageWithoutNetwork(url)
      } finally {
        // Revoke after loadImage resolves
        // loadImageWithoutNetwork draws into memory and returns an HTMLImageElement; objectURL can be revoked now
        // (Not strictly necessary to revoke immediately, but helps memory usage.)
        setTimeout(() => URL.revokeObjectURL(url), 0)
      }
    }

    return null
  }

  private loadImageWithoutNetwork(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous' // safe for blob/data URLs; prevents accidental tainting
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = src
    })
  }

  private async returnOriginalAsDataURL(input: ImageInput): Promise<string> {
    // Best-effort: if already a data URL string, return as-is
    if (typeof input === 'string') {
      if (input.startsWith('data:')) return input
      // If blob: URL, try to render to data URL via canvas
      if (input.startsWith('blob:')) {
        try {
          const img = await this.loadImageWithoutNetwork(input)
          const c = document.createElement('canvas')
          c.width = img.naturalWidth || 1
          c.height = img.naturalHeight || 1
          const ctx = c.getContext('2d')!
          ctx.drawImage(img, 0, 0)
          return c.toDataURL('image/png')
        } catch {}
      }
      // Otherwise, we must not fetch; return a minimal transparent PNG
      return this.emptyPng()
    }
    // Blob/File
    if (input instanceof Blob) {
      try {
        const reader = new FileReader()
        const asDataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(String(reader.result))
          reader.onerror = () => reject(new Error('read error'))
          reader.readAsDataURL(input)
        })
        return asDataUrl
      } catch {
        return this.emptyPng()
      }
    }
    // Image element
    if (input instanceof HTMLImageElement) {
      try {
        if (input.complete && input.naturalWidth > 0) {
          const c = document.createElement('canvas')
          c.width = input.naturalWidth
          c.height = input.naturalHeight
          const ctx = c.getContext('2d')!
          ctx.drawImage(input, 0, 0)
          return c.toDataURL('image/png')
        }
        // If not complete, but src is data: or blob:, return src (already local, no network)
        if (typeof input.src === 'string' && (input.src.startsWith('data:') || input.src.startsWith('blob:'))) {
          return input.src
        }
      } catch {
        // ignore
      }
      return this.emptyPng()
    }
    return this.emptyPng()
  }

  private emptyPng(): string {
    // 1x1 transparent png
    const c = document.createElement('canvas')
    c.width = 1
    c.height = 1
    return c.toDataURL('image/png')
  }

  // ============ Target sizing ============
  private computeTargetSize(img: HTMLImageElement, options: EnhanceOptions): { targetW: number; targetH: number } {
    const srcW = img.naturalWidth
    const srcH = img.naturalHeight
    if (srcW === 0 || srcH === 0) return { targetW: 1, targetH: 1 }

    // Heuristic type detection: small square (<= 32px) -> favicon
    const isSquare = Math.abs(srcW - srcH) <= 1
    const isFavicon = isSquare && Math.max(srcW, srcH) <= 32

    let targetLong = options.targetSize ?? (isFavicon ? 64 : 256)

    // Compute target while preserving aspect ratio
    // For favicons we want a 64x64 box. If not perfectly square, letterbox with transparency.
    if (isFavicon) {
      return { targetW: 64, targetH: 64 }
    }

    // For logos: ensure min dimension >= targetLong, keep aspect
    const minDim = Math.min(srcW, srcH)
    if (minDim >= targetLong) {
      // Already large enough; keep original size to avoid unnecessary scaling artifacts
      return { targetW: srcW, targetH: srcH }
    }
    const scale = targetLong / minDim
    return { targetW: Math.round(srcW * scale), targetH: Math.round(srcH * scale) }
  }

  // ============ Progressive resize with high-quality smoothing ============
  private progressiveResize(img: HTMLImageElement, targetW: number, targetH: number): HTMLCanvasElement {
    const srcW = img.naturalWidth
    const srcH = img.naturalHeight

    // Start from original
    let curCanvas = document.createElement('canvas')
    curCanvas.width = srcW
    curCanvas.height = srcH
    let ctx = curCanvas.getContext('2d')!
    this.configureCtx(ctx)

    // Draw original into canvas
    ctx.clearRect(0, 0, srcW, srcH)
    ctx.drawImage(img, 0, 0)

    // If favicon box target (exact size 64x64), letterbox into 64x64 while preserving aspect ratio
    if (targetW === 64 && targetH === 64) {
      const scale = Math.min(64 / srcW, 64 / srcH)
      const w = Math.round(srcW * scale)
      const h = Math.round(srcH * scale)
      const box = document.createElement('canvas')
      box.width = 64
      box.height = 64
      const bctx = box.getContext('2d')!
      this.configureCtx(bctx)
      const dx = Math.floor((64 - w) / 2)
      const dy = Math.floor((64 - h) / 2)
      bctx.clearRect(0, 0, 64, 64)
      bctx.drawImage(curCanvas, 0, 0, srcW, srcH, dx, dy, w, h)
      return box
    }

    // Progressive scaling up to target for logos
    const steps = Math.max(1, Math.ceil(Math.log2(Math.max(targetW / srcW, targetH / srcH))))
    let w = srcW
    let h = srcH
    for (let i = 0; i < steps; i++) {
      const nextW = i === steps - 1 ? targetW : Math.min(targetW, Math.round(w * 1.5))
      const nextH = i === steps - 1 ? targetH : Math.min(targetH, Math.round(h * 1.5))
      const nextCanvas = document.createElement('canvas')
      nextCanvas.width = nextW
      nextCanvas.height = nextH
      const nctx = nextCanvas.getContext('2d')!
      this.configureCtx(nctx)
      nctx.clearRect(0, 0, nextW, nextH)
      nctx.drawImage(curCanvas, 0, 0, w, h, 0, 0, nextW, nextH)
      curCanvas = nextCanvas
      ctx = nctx
      w = nextW
      h = nextH
    }
    return curCanvas
  }

  private configureCtx(ctx: CanvasRenderingContext2D) {
    const ctxAny = ctx as any;
    ctxAny.imageSmoothingEnabled = true;
    // High-quality smoothing yields a Lanczos-like result on modern browsers
    // (exact filter is implementation-specific but this is the best available option)
    ctxAny.imageSmoothingQuality = 'high';
  }

  // ============ Tuning (unsharp mask, contrast, saturation) ============
  private applyTuning(canvas: HTMLCanvasElement, amount: number, radius: 0 | 1 | 2, threshold: number, contrast: number, saturation: number): HTMLCanvasElement {
    const ctx = canvas.getContext('2d')!
    const { width, height } = canvas
    let imgData = ctx.getImageData(0, 0, width, height)

    // Slight contrast and saturation first
    imgData = this.adjustContrastSaturation(imgData, contrast, saturation)

    // Unsharp mask (edge-preserving via threshold)
    if (amount > 0) {
      imgData = this.unsharpMask(imgData, amount, radius, threshold)
    }

    ctx.putImageData(imgData, 0, 0)
    return canvas
  }

  private adjustContrastSaturation(data: ImageData, contrast: number, saturation: number): ImageData {
    const out = new ImageData(new Uint8ClampedArray(data.data), data.width, data.height)
    const d = out.data

    // Contrast: scale -1..+1 mapped to classic formula (approx)
    const c = Math.max(-1, Math.min(1, contrast))
    const factor = (259 * (255 * (c) + 255)) / (255 * (259 - 255 * (c)))

    // Saturation boost: mix with luma
    const s = Math.max(-1, Math.min(1, saturation))
    const sFactor = 1 + s

    for (let i = 0; i < d.length; i += 4) {
      const r = d[i]
      const g = d[i + 1]
      const b = d[i + 2]
      const a = d[i + 3]

      // Contrast
      let rc = factor * (r - 128) + 128
      let gc = factor * (g - 128) + 128
      let bc = factor * (b - 128) + 128

      // Saturation (HSL-free approximation)
      const luma = 0.2126 * rc + 0.7152 * gc + 0.0722 * bc
      rc = luma + (rc - luma) * sFactor
      gc = luma + (gc - luma) * sFactor
      bc = luma + (bc - luma) * sFactor

      d[i] = Math.max(0, Math.min(255, rc))
      d[i + 1] = Math.max(0, Math.min(255, gc))
      d[i + 2] = Math.max(0, Math.min(255, bc))
      d[i + 3] = a // preserve alpha
    }

    return out
  }

  private unsharpMask(src: ImageData, amount: number, radius: 0 | 1 | 2, threshold: number): ImageData {
    if (radius === 0) return src

    const blurred = this.gaussianBlur3x3(src, radius) // simple, fast blur

    const out = new ImageData(new Uint8ClampedArray(src.data), src.width, src.height)
    const s = src.data
    const b = blurred.data
    const d = out.data

    const amt = amount // 0..1
    const th = Math.max(0, threshold)

    for (let i = 0; i < s.length; i += 4) {
      const r = s[i], g = s[i + 1], b0 = s[i + 2]
      const rb = b[i], gb = b[i + 1], bb = b[i + 2]
      const a = s[i + 3]

      // Edge mask
      const dr = r - rb
      const dg = g - gb
      const db = b0 - bb

      // Apply only where difference exceeds threshold (edge preservation)
      const m = (Math.abs(dr) > th || Math.abs(dg) > th || Math.abs(db) > th) ? 1 : 0

      const nr = r + m * amt * (r - rb)
      const ng = g + m * amt * (g - gb)
      const nb = b0 + m * amt * (b0 - bb)

      d[i] = Math.max(0, Math.min(255, nr))
      d[i + 1] = Math.max(0, Math.min(255, ng))
      d[i + 2] = Math.max(0, Math.min(255, nb))
      d[i + 3] = a
    }

    return out
  }

  private gaussianBlur3x3(src: ImageData, radius: 1 | 2): ImageData {
    // Two-pass separable convolution using a simple gaussian approximation.
    // For radius=1: kernel [1,2,1] / 4; for radius=2: [1,4,6,4,1] / 16
    const w = src.width
    const h = src.height
    const s = src.data
    const temp = new Uint8ClampedArray(s.length)
    const out = new Uint8ClampedArray(s.length)

    const k1 = radius === 1 ? [1, 2, 1] : [1, 4, 6, 4, 1]
    const div1 = k1.reduce((a, b) => a + b, 0)

    // Horizontal pass
    const rLen = k1.length
    const rOff = Math.floor(rLen / 2)

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let rs = 0, gs = 0, bs = 0, as = 0
        for (let k = 0; k < rLen; k++) {
          const ix = Math.min(w - 1, Math.max(0, x + k - rOff))
          const idx = (y * w + ix) * 4
          const kk = k1[k]
          rs += s[idx] * kk
          gs += s[idx + 1] * kk
          bs += s[idx + 2] * kk
          as += s[idx + 3] * kk
        }
        const o = (y * w + x) * 4
        temp[o] = rs / div1
        temp[o + 1] = gs / div1
        temp[o + 2] = bs / div1
        temp[o + 3] = as / div1
      }
    }

    // Vertical pass
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let rs = 0, gs = 0, bs = 0, as = 0
        for (let k = 0; k < rLen; k++) {
          const iy = Math.min(h - 1, Math.max(0, y + k - rOff))
          const idx = (iy * w + x) * 4
          const kk = k1[k]
          rs += temp[idx] * kk
          gs += temp[idx + 1] * kk
          bs += temp[idx + 2] * kk
          as += temp[idx + 3] * kk
        }
        const o = (y * w + x) * 4
        out[o] = rs / div1
        out[o + 1] = gs / div1
        out[o + 2] = bs / div1
        out[o + 3] = as / div1
      }
    }

    return new ImageData(out, w, h)
  }
}

export default ImageQualityEnhancer

