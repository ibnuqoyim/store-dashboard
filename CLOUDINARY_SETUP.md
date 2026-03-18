# Cloudinary Image Upload Setup Guide

## Overview
Images for products are now uploaded to Cloudinary and stored as public URLs in the database.

## Setup Steps

### 1. Create an Unsigned Upload Preset in Cloudinary

1. Go to your **Cloudinary Dashboard** (https://console.cloudinary.com)
2. Navigate to **Settings > Upload**
3. Scroll down to **Upload presets** section
4. Click **Add upload preset**
5. Fill in the details:
   - **Name**: `products` (or any name you prefer)
   - **Unsigned**: Toggle ON (required for client-side uploads)
   - **Folder**: `store-dashboard/products` (optional, for organization)
6. Scroll down and click **Save**

### 2. Update Environment Variable

Your cloud name is: **dwlpm2hx8** (extracted from CLOUDINARY_URL)

Update `.env` with your upload preset name:
```env
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=products
```

Replace `products` with your chosen preset name if different.

### 3. Run Database Migration

Execute the migration to add `image_url` column to products table:
```sql
-- Run this in your Supabase SQL editor
alter table products add column image_url text;
```

Or if you're using a migration tool, the migration file is at:
`migrations/20260317_add_image_url_to_products.sql`

### 4. Test the Feature

1. Go to the Products page
2. Click "Add Product" or edit an existing product
3. Click "Upload Image" button
4. Select an image file
5. The image will be uploaded to Cloudinary and the preview will appear
6. Save the product
7. The public Cloudinary URL is now stored in your database

## Features

- **Instant Upload**: Images upload directly to Cloudinary from the browser
- **Preview**: See the selected image before saving
- **Easy Changes**: Click "Change Image" to replace the image
- **Remove**: Click "Remove" to clear the image
- **Public URLs**: All images are stored as public Cloudinary URLs in `image_url` field

## Notes

- URLs are returned as `secure_url` from Cloudinary (HTTPS)
- Images are accessible from the database table as regular URLs
- No additional server-side processing needed
- Upload preset is unsigned (public), so no API credentials exposed in frontend
