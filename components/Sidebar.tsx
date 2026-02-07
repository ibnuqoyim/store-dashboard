
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ShoppingBag, Wheat, ClipboardList, Truck, LogOut, Menu, X } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import clsx from 'clsx'
import { useState } from 'react'

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Products', href: '/products', icon: ShoppingBag },
    { name: 'Adonan', href: '/adonan', icon: Wheat },
    { name: 'Orders', href: '/orders', icon: ClipboardList },
    { name: 'Deliveries', href: '/deliveries', icon: Truck },
    { name: 'Shipping', href: '/shipping', icon: Truck },
    { name: 'Invoices', href: '/invoices', icon: ClipboardList },
]

export default function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.refresh()
        router.push('/login')
    }

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false)
    }

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-gray-900 text-white rounded-md shadow-lg hover:bg-gray-800"
                aria-label="Open menu"
            >
                <Menu className="h-6 w-6" />
            </button>

            {/* Backdrop Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
                    onClick={closeMobileMenu}
                />
            )}

            {/* Sidebar */}
            <div className={clsx(
                "flex w-64 flex-col bg-gray-900 text-white min-h-screen fixed lg:static inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out",
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}>
                {/* Header with Close Button */}
                <div className="flex h-16 items-center justify-between px-4 border-b border-gray-800">
                    <h1 className="text-xl font-bold">Sourdough Store</h1>
                    <button
                        onClick={closeMobileMenu}
                        className="lg:hidden p-1 text-gray-400 hover:text-white"
                        aria-label="Close menu"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto py-4">
                    <nav className="space-y-1 px-2">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={closeMobileMenu}
                                    className={clsx(
                                        isActive
                                            ? 'bg-gray-800 text-white'
                                            : 'text-gray-400 hover:bg-gray-800 hover:text-white',
                                        'group flex items-center rounded-md px-3 py-3 text-sm font-medium transition-colors'
                                    )}
                                >
                                    <item.icon
                                        className={clsx(
                                            isActive ? 'text-white' : 'text-gray-400 group-hover:text-white',
                                            'mr-3 h-6 w-6 flex-shrink-0'
                                        )}
                                        aria-hidden="true"
                                    />
                                    {item.name}
                                </Link>
                            )
                        })}
                    </nav>
                </div>

                {/* Sign Out Button */}
                <div className="border-t border-gray-800 p-4">
                    <button
                        onClick={handleSignOut}
                        className="group flex w-full items-center rounded-md px-3 py-3 text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
                    >
                        <LogOut
                            className="mr-3 h-6 w-6 flex-shrink-0 text-gray-400 group-hover:text-white"
                            aria-hidden="true"
                        />
                        Sign Out
                    </button>
                </div>
            </div>
        </>
    )
}
