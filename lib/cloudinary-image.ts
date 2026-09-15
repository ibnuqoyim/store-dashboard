/**
 * Shared Cloudinary helpers. Extracted from the inline copy in ProductList.tsx
 * so any component that renders a product photo (POS catalog, product list,
 * etc.) resizes/optimizes it the same way instead of loading the original.
 */
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
