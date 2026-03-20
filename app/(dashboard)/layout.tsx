
import Sidebar from '@/components/Sidebar'
import { createClient } from '@/utils/supabase/server'
import { BusinessConfigProvider } from '@/lib/business-config-context'
import { DEFAULT_CONFIG, BusinessConfig } from '@/lib/config'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data } = await supabase.from('store_info').select('*').single()

    const config: BusinessConfig = data ? {
        name: data.name ?? DEFAULT_CONFIG.name,
        phone: data.contact_whatsapp_number ?? data.phone ?? DEFAULT_CONFIG.phone,
        currency: data.currency ?? DEFAULT_CONFIG.currency,
        locale: data.locale ?? DEFAULT_CONFIG.locale,
        bank_name: data.bank_name ?? DEFAULT_CONFIG.bank_name,
        bank_account: data.bank_account ?? DEFAULT_CONFIG.bank_account,
        bank_holder: data.bank_holder ?? DEFAULT_CONFIG.bank_holder,
        invoice_closing_message: data.invoice_closing_message ?? DEFAULT_CONFIG.invoice_closing_message,
        invoice_closing_sub: data.invoice_closing_sub ?? DEFAULT_CONFIG.invoice_closing_sub,
        whatsapp_greeting_template: data.whatsapp_greeting_template ?? DEFAULT_CONFIG.whatsapp_greeting_template,
        modules_enabled: data.modules_enabled ?? DEFAULT_CONFIG.modules_enabled,
    } : DEFAULT_CONFIG

    return (
        <BusinessConfigProvider config={config}>
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
