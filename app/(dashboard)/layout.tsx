
import Sidebar from '@/components/Sidebar'
import { createClient } from '@/utils/supabase/server'
import { BusinessConfigProvider } from '@/lib/business-config-context'
import { DEFAULT_CONFIG, getEnvDefaults, BusinessConfig } from '@/lib/config'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data } = await supabase.from('store_info').select('*').single()

    if (!data) {
        redirect('/setup')
    }

    // 3-layer fallback: DB value → env var → DEFAULT_CONFIG
    const env = getEnvDefaults()
    const base = { ...DEFAULT_CONFIG, ...env }

    const config: BusinessConfig = {
        name: data.name || base.name,
        phone: data.contact_whatsapp_number || data.phone || base.phone,
        currency: data.currency || base.currency,
        locale: data.locale || base.locale,
        bank_name: data.bank_name || base.bank_name,
        bank_account: data.bank_account || base.bank_account,
        bank_holder: data.bank_holder || base.bank_holder,
        invoice_closing_message: data.invoice_closing_message || base.invoice_closing_message,
        invoice_closing_sub: data.invoice_closing_sub || base.invoice_closing_sub,
        whatsapp_greeting_template: data.whatsapp_greeting_template || base.whatsapp_greeting_template,
        modules_enabled: data.modules_enabled ?? base.modules_enabled,
        primary_color: data.primary_color || base.primary_color,
        logo_url: data.logo_url || base.logo_url,
    }

    return (
        <BusinessConfigProvider config={config}>
            <style>{`:root { --color-primary: ${config.primary_color}; }`}</style>
            <div className="flex h-screen bg-gray-100">
                <Sidebar />
                <div className="flex-1 flex flex-col overflow-hidden w-full lg:w-auto">
                    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 sm:p-6 lg:p-8">
                        {children}
                    </main>
                </div>
            </div>
        </BusinessConfigProvider>
    )
}
