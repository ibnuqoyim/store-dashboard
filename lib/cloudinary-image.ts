/**
 * Shared Cloudinary helpers. Extracted from the inline copy in ProductList.tsx
 * so any component that renders a product photo (POS catalog, product list,
 * etc.) resizes/optimizes it the same way instead of loading the original.
 */

/**
 * True only for URLs actually served from Cloudinary's own domains. Use this
 * to gate what gets written to image_url after an upload-widget callback —
 * the widget is trusted, but validating the shape of what it hands back
 * costs nothing and stops a malformed/spoofed payload from ever reaching
 * the database or being rendered as a live <img src>.
 */
export function isTrustedCloudinaryUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  try {
    const { protocol, hostname } = new URL(url);
    return protocol === 'https:' && /(^|\.)cloudinary\.com$/.test(hostname);
  } catch {
    return false;
  }
}

export function getResizedImageUrl(
  imageUrl: string | null | undefined,
  width: number = 40,
  height: number = 40
): string | null {
  if (!imageUrl) return null;

  if (imageUrl.includes('cloudinary.com')) {
    const urlParts = imageUrl.split('/upload/');
    if (urlParts.length === 2) {
      return `${urlParts[0]}/upload/w_${width},h_${height},c_fill,q_auto,f_auto/${urlParts[1]}`;
    }
  }

  return imageUrl;
}
