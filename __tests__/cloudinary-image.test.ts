import { describe, it, expect } from 'vitest'
import { isTrustedCloudinaryUrl, getResizedImageUrl } from '@/lib/cloudinary-image'

describe('lib/cloudinary-image', () => {
  describe('isTrustedCloudinaryUrl', () => {
    it('returns false for falsy or empty values', () => {
      expect(isTrustedCloudinaryUrl(null)).toBe(false)
      expect(isTrustedCloudinaryUrl(undefined)).toBe(false)
      expect(isTrustedCloudinaryUrl('')).toBe(false)
    })

    it('returns false for malformed URLs', () => {
      expect(isTrustedCloudinaryUrl('not-a-valid-url')).toBe(false)
      expect(isTrustedCloudinaryUrl('://broken')).toBe(false)
    })

    it('returns false for non-https protocols', () => {
      expect(isTrustedCloudinaryUrl('http://res.cloudinary.com/demo/image/upload/sample.jpg')).toBe(false)
      expect(isTrustedCloudinaryUrl('ftp://res.cloudinary.com/sample.jpg')).toBe(false)
    })

    it('returns false for spoofed domains attempting to mimic cloudinary', () => {
      expect(isTrustedCloudinaryUrl('https://evilcloudinary.com/sample.jpg')).toBe(false)
      expect(isTrustedCloudinaryUrl('https://cloudinary.com.attacker.com/sample.jpg')).toBe(false)
      expect(isTrustedCloudinaryUrl('https://fake-cloudinary.com')).toBe(false)
    })

    it('returns true for trusted cloudinary.com hostnames via https', () => {
      expect(isTrustedCloudinaryUrl('https://cloudinary.com/avatar.jpg')).toBe(true)
      expect(isTrustedCloudinaryUrl('https://res.cloudinary.com/my-cloud/image/upload/v123456/product.jpg')).toBe(true)
      expect(isTrustedCloudinaryUrl('https://images.sub.cloudinary.com/asset.png')).toBe(true)
    })
  })

  describe('getResizedImageUrl', () => {
    it('returns null if imageUrl is null, undefined, or empty', () => {
      expect(getResizedImageUrl(null)).toBeNull()
      expect(getResizedImageUrl(undefined)).toBeNull()
      expect(getResizedImageUrl('')).toBeNull()
    })

    it('returns the original URL untouched if not hosted on cloudinary.com', () => {
      const externalUrl = 'https://example.com/images/bread.jpg'
      expect(getResizedImageUrl(externalUrl)).toBe(externalUrl)
      expect(getResizedImageUrl(externalUrl, 100, 100)).toBe(externalUrl)
    })

    it('returns the original URL if cloudinary url does not contain exactly one /upload/ segment', () => {
      const noUpload = 'https://res.cloudinary.com/demo/image/fetch/sample.jpg'
      expect(getResizedImageUrl(noUpload)).toBe(noUpload)

      const multiUpload = 'https://res.cloudinary.com/demo/image/upload/nested/upload/sample.jpg'
      expect(getResizedImageUrl(multiUpload)).toBe(multiUpload)
    })

    it('injects default width and height transformations (40x40)', () => {
      const original = 'https://res.cloudinary.com/demo/image/upload/v12345/sample.jpg'
      const resized = getResizedImageUrl(original)
      expect(resized).toBe(
        'https://res.cloudinary.com/demo/image/upload/w_40,h_40,c_fill,q_auto,f_auto/v12345/sample.jpg'
      )
    })

    it('injects custom width and height transformations', () => {
      const original = 'https://res.cloudinary.com/demo/image/upload/v12345/sample.jpg'
      const resized = getResizedImageUrl(original, 200, 150)
      expect(resized).toBe(
        'https://res.cloudinary.com/demo/image/upload/w_200,h_150,c_fill,q_auto,f_auto/v12345/sample.jpg'
      )
    })
  })
})
