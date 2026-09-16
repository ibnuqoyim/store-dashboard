export type HeroStat = {
  label: string
  value: string
}

export type TaglineFeature = {
  title: string
  description: string
}

export type StoreInfo = {
  id: string
  is_active: boolean
  name: string
  address: string
  phone: string
  email: string
  opening_hours: string
  maps_url: string | null
  maps_embed_url: string | null
  hero_kicker: string | null
  hero_title: string | null
  hero_tagline: string | null
  hero_description: string | null
  hero_images: string[]
  hero_stats: HeroStat[] | null
  tagline_heading: string | null
  tagline_subheading: string | null
  tagline_features: TaglineFeature[] | null
  tagline_quote: string | null
  contact_instagram_handle: string | null
  contact_instagram_url: string | null
  contact_whatsapp_number: string | null
  contact_whatsapp_url: string | null
  contact_email: string | null
  bank_name: string | null
  bank_account: string | null
  bank_holder: string | null
  invoice_closing_message: string | null
  invoice_closing_sub: string | null
  whatsapp_greeting_template: string | null
  currency: string | null
  locale: string | null
  modules_enabled: string[] | null
  primary_color: string | null
  logo_url: string | null
  created_at: string
  updated_at: string
}
