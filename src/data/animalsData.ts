import raw from './animals.json'
import { publicAsset } from '../utils/publicAsset'

function rewriteAssetUrls<T>(value: T): T {
  if (typeof value === 'string') {
    if (value.startsWith('/assets/')) {
      return publicAsset(value) as T
    }
    return value
  }
  if (Array.isArray(value)) {
    return value.map(rewriteAssetUrls) as T
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        rewriteAssetUrls(v),
      ]),
    ) as T
  }
  return value
}

const animalsData = rewriteAssetUrls(raw) as typeof raw

export default animalsData
