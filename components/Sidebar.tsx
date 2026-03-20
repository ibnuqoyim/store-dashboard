
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ShoppingBag, Wheat, ClipboardList, Truck, LogOut, Menu, X, Users, FileText, MessageSquare, Settings, DollarSign, Package, Receipt, ChevronDown, ChevronRight } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import clsx from 'clsx'
import { useState } from 'react'
import { useBusinessConfig } from '@/lib/business-config-context'

interface NavigationCategory {
    name: string
    items: {
        name: string
        href: string
        icon: any
    }[]
}

const navigationCategories: NavigationCategory[] = [
    {
        name: 'Main',
        items: [
            { name: 'Dashboard', href: '/', icon: LayoutDashboard },
            { name: 'Customers', href: '/customers', icon: Users },
            { name: 'Products', href: '/products', icon: ShoppingBag },
        ]
    },
    {
        name: 'Production',
        items: [
            { name: 'Adonan', href: '/adonan', icon: Wheat },
            { name: 'Pre-Orders', href: '/batch-po', icon: FileText },
            { name: 'Inventory', href: '/inventory', icon: Package },
        ]
    },
    {
        name: 'Sales & Orders',
        items: [
            { name: 'Orders', href: '/orders', icon: ClipboardList },
            { name: 'Deliveries', href: '/deliveries', icon: Truck },
            { name: 'Shipping', href: '/shipping', icon: Truck },
        ]
    },
    {
        name: 'Financial',
        items: [
            { name: 'Financial', href: '/financial', icon: DollarSign },
            { name: 'Expenses', href: '/expenses', icon: Receipt },
        ]
    },
    {
        name: 'Settings',
        items: [
            { name: 'Testimonials', href: '/testimonials', icon: MessageSquare },
            { name: 'Store Info', href: '/store-info', icon: Settings },
        ]
    }
]

export default function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const config = useBusinessConfig()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.refresh()
        router.push('/login')
    }

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false)
    }

    const toggleCategory = (categoryName: string) => {
        setCollapsedCategories(prev => {
            const newSet = new Set(prev)
            if (newSet.has(categoryName)) {
                newSet.delete(categoryName)
            } else {
                newSet.add(categoryName)
            }
            return newSet
        })
    }

    const isCategoryActive = (category: NavigationCategory) => {
        return category.items.some(item => pathname === item.href)
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
                    <h1 className="text-xl font-bold">{config.name}</h1>
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
                        {navigationCategories.map((category) => {
                            const isCollapsed = collapsedCategories.has(category.name)
                            const categoryActive = isCategoryActive(category)
                            
                            return (
                                <div key={category.name} className="mb-2">
                                    {/* Category Header */}
                                    <button
                                        onClick={() => toggleCategory(category.name)}
                                        className={clsx(
                                            'group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                            categoryActive
                                                ? 'bg-gray-800 text-white'
                                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                        )}
                                    >
                                        <ChevronRight
                                            className={clsx(
                                                'mr-2 h-4 w-4 flex-shrink-0 transition-transform duration-200',
                                                isCollapsed ? '' : 'rotate-90',
                                                categoryActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                                            )}
                                        />
                                        <span className="flex-1 text-left">{category.name}</span>
                                    </button>
                                    
                                    {/* Category Items */}
                                    {!isCollapsed && (
                                        <div className="mt-1 ml-4 space-y-1">
                                            {category.items.map((item) => {
                                                const isActive = pathname === item.href
                                                return (
                                                    <Link
                                                        key={item.name}
                                                        href={item.href}
                                                        onClick={closeMobileMenu}
                                                        className={clsx(
                                                            'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                                            isActive
                                                                ? 'bg-gray-700 text-white'
                                                                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                                                        )}
                                                    >
                                                        <item.icon
                                                            className={clsx(
                                                                'mr-3 h-5 w-5 flex-shrink-0',
                                                                isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                                                            )}
                                                            aria-hidden="true"
                                                        />
                                                        {item.name}
                                                    </Link>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
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
