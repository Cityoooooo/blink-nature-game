/**
 * `public/` 下静态资源的最终 URL，含 Vite `base`（GitHub Pages 子路径等）。
 * @param path 以 `/` 开头的站点路径，如 `/assets/foo.png`
 */
export function publicAsset(path: string): string {
  const trimmed = path.startsWith('/') ? path.slice(1) : path
  return `${import.meta.env.BASE_URL}${trimmed}`
}
