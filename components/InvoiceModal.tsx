
'use client'

import React, { useRef } from 'react'
import { X, Printer, Download } from 'lucide-react'

type InvoiceModalProps = {
    isOpen: boolean
    onClose: () => void
    order: any
}

export default function InvoiceModal({ isOpen, onClose, order }: InvoiceModalProps) {
    const contentRef = useRef<HTMLDivElement>(null)
    const [logoBase64, setLogoBase64] = React.useState<string | null>(null)
    const [logoDims, setLogoDims] = React.useState<{ width: number; height: number } | null>(null)

    React.useEffect(() => {
        const fetchLogo = async () => {
            try {
                const response = await fetch('/logo.png')
                if (!response.ok) throw new Error('Logo not found')
                const blob = await response.blob()
                const reader = new FileReader()
                reader.onloadend = () => {
                    const base64data = reader.result as string
                    console.log('Logo loaded, base64 length:', base64data.length)
                    console.log('Logo base64 prefix:', base64data.substring(0, 50))
                    setLogoBase64(base64data)

                    // Get dimensions using HTML Image to avoid jsPDF PNG metadata issues
                    const img = new Image()
                    img.onload = () => {
                        console.log('Image dimensions:', img.width, 'x', img.height)
                        setLogoDims({ width: img.width, height: img.height })
                    }
                    img.onerror = (err) => {
                        console.error('Failed to load image for dimensions:', err)
                    }
                    img.src = base64data
                }
                reader.readAsDataURL(blob)
            } catch (error) {
                console.error('Error loading logo for watermark:', error)
            }
        }
        fetchLogo()
    }, [])

    if (!isOpen || !order) return null

    const formatRupiah = (num: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)
    }

    const calculateSubtotal = () => {
        let subtotal = 0
        // Sum items
        if (order.order_items) {
            subtotal += order.order_items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
        }
        // Sum delivery
        if (order.deliveries && order.deliveries.length > 0) {
            subtotal += (order.deliveries[0].shipping_cost || 0)
        }
        return subtotal
    }

    const subtotal = calculateSubtotal()

    const handlePrint = () => {
        window.print()
    }

    const handleDownloadPdf = async () => {
        const element = contentRef.current
        if (!element) return

        // @ts-ignore
        const html2pdf = (await import('html2pdf.js')).default

        const opt = {
            margin: 10,
            filename: `Invoice-${order.invoice_number}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
        }

        // Use the chained syntax to intervene before saving
        const worker = html2pdf().set(opt).from(element).toPdf()

        worker.get('pdf').then((doc: any) => {
            if (logoBase64 && logoDims) {
                console.log('Attempting to add watermark...')
                console.log('Logo dimensions from state:', logoDims)

                const pageWidth = doc.internal.pageSize.getWidth()
                const pageHeight = doc.internal.pageSize.getHeight()

                // Use pre-calculated dimensions from HTML Image (avoids PNG metadata issues)
                try {
                    const imgWidth = logoDims.width
                    const imgHeight = logoDims.height

                    const imgRatio = imgWidth / imgHeight
                    const pageRatio = pageWidth / pageHeight

                    let renderWidth, renderHeight

                    if (imgRatio > pageRatio) {
                        renderWidth = pageWidth
                        renderHeight = pageWidth / imgRatio
                    } else {
                        renderHeight = pageHeight
                        renderWidth = pageHeight * imgRatio
                    }

                    // Center Position
                    const x = (pageWidth - renderWidth / 1.5) / 2
                    const y = (pageHeight - renderHeight / 1.5) / 2

                    console.log('Adding watermark at position:', { x, y, width: renderWidth / 1.5, height: renderHeight / 1.5 })

                    doc.saveGraphicsState()
                    doc.setGState({ opacity: 0.2 })
                    doc.addImage(logoBase64, 'PNG', x, y, renderWidth / 1.5, renderHeight / 1.5)
                    doc.restoreGraphicsState()
                    console.log('Watermark added successfully')
                } catch (error) {
                    console.error('Error adding watermark:', error)
                    console.error('Error details:', JSON.stringify(error, null, 2))
                }
            } else {
                console.log('Skipping watermark - logoBase64:', !!logoBase64, 'logoDims:', !!logoDims)
            }
        }).then(() => {
            worker.save()
        })
    }

    // Format Date
    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
        } catch (e) {
            return dateString
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto print:p-0 print:bg-white print:static print:block">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl m-4 relative print:shadow-none print:w-full print:max-w-none print:m-0 print:absolute print:top-0 print:left-0">

                {/* Actions Header - Hidden on Print */}
                <div className="flex justify-between items-center p-4 border-b print:hidden">
                    <h2 className="text-xl font-bold text-gray-800">Preview Invoice</h2>
                    <div className="flex gap-2">
                        <button onClick={handlePrint} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                            <Printer size={18} /> Print
                        </button>
                        <button onClick={handleDownloadPdf} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                            <Download size={18} /> Download PDF
                        </button>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-2">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Invoice Content */}
                <div id="invoice-content" className="p-10 bg-white text-gray-800 font-sans" ref={contentRef}>

                    {/* Header */}
                    <div className="text-right mb-10">
                        <h1 className="text-3xl text-gray-800 mb-2 font-bold">Invoice</h1>
                        <div className="text-2xl font-bold text-gray-800 mb-1">Sourdoughmu_ya!</div>
                        <div className="text-sm text-gray-600">No HP<br />087722732214</div>
                    </div>

                    {/* Info Section */}
                    <div className="flex justify-between bg-gray-100 p-5 mb-8">
                        <div>
                            <h3 className="text-sm text-gray-600 font-bold mb-2">BILL TO</h3>
                            <p className="font-bold text-sm">{order.customer_name}</p>
                            <p className="text-sm">{order.phone}</p>
                        </div>
                        <div className="text-right text-sm">
                            <div className="mb-1">
                                <span className="inline-block w-24 font-bold text-left">Invoice #</span>
                                <span className="inline-block w-32 text-left">{order.invoice_number}</span>
                            </div>
                            <div className="mb-1">
                                <span className="inline-block w-24 font-bold text-left">Date</span>
                                <span className="inline-block w-32 text-left">{formatDate(order.date)}</span>
                            </div>
                            <div className="mb-1">
                                <span className="inline-block w-24 font-bold text-left">Due date</span>
                                <span className="inline-block w-32 text-left">{formatDate(order.date)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <table className="w-full border-collapse mb-8">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="p-3 text-left text-sm font-bold border-b border-gray-200 w-[45%]">Item</th>
                                <th className="p-3 text-center text-sm font-bold border-b border-gray-200 w-[15%]">Quantity</th>
                                <th className="p-3 text-right text-sm font-bold border-b border-gray-200 w-[20%]">Price</th>
                                <th className="p-3 text-right text-sm font-bold border-b border-gray-200 w-[20%]">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.order_items?.map((item: any, idx: number) => (
                                <tr key={idx} className="border-b border-gray-100">
                                    <td className="p-3 text-sm">{item.products?.name}</td>
                                    <td className="p-3 text-center text-sm">{item.quantity}</td>
                                    <td className="p-3 text-right text-sm">{formatRupiah(item.price)}</td>
                                    <td className="p-3 text-right text-sm">{formatRupiah(item.price * item.quantity)}</td>
                                </tr>
                            ))}
                            {order.deliveries && order.deliveries.length > 0 && (
                                <tr className="border-b border-gray-100">
                                    <td className="p-3 text-sm">Shipping ({order.deliveries[0].courier_name})</td>
                                    <td className="p-3 text-center text-sm">1</td>
                                    <td className="p-3 text-right text-sm">{order.deliveries[0].shipping_cost > 0 ? formatRupiah(order.deliveries[0].shipping_cost) : '-'}</td>
                                    <td className="p-3 text-right text-sm">{order.deliveries[0].shipping_cost > 0 ? formatRupiah(order.deliveries[0].shipping_cost) : '-'}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Totals */}
                    <div className="flex flex-col items-end mb-5">
                        <div className="flex justify-end w-full max-w-xs py-2 text-sm border-b border-gray-200">
                            <div className="text-right text-gray-800 w-24 mr-10 font-bold">Subtotal</div>
                            <div className="text-right text-gray-800 w-32">{formatRupiah(subtotal)}</div>
                        </div>
                        <div className="flex justify-end w-full max-w-xs py-2 text-sm font-bold mt-2">
                            <div className="text-right text-gray-800 w-24 mr-10">Total</div>
                            <div className="text-right text-gray-800 w-32">{formatRupiah(subtotal)}</div>
                        </div>
                    </div>

                    {/* Amount Due */}
                    <div className="bg-gray-100 p-6 mb-8 flex justify-between items-center rounded-sm">
                        <div className="text-gray-800 text-lg">Amount Due</div>
                        <div className="text-3xl font-bold text-black">{formatRupiah(subtotal)}</div>
                    </div>

                    {/* Payment Info */}
                    <div className="mt-8 p-5 bg-gray-50 text-xs leading-relaxed text-gray-600 rounded-sm">
                        <p className="mb-1"><strong>Silahkan transfer ke rekening berikut :</strong></p>
                        <p className="mb-3">• BRI : 367101015884504 a.n Sintia Nensih</p>
                        <p className="mb-3">Harap megirimkan bukti transfer 1x24 jam.</p>
                        <br />
                        <p className="font-bold">Terima Kasih</p>
                        <p>Baarakallaahu fiikum</p>
                    </div>

                </div>

                <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            /* Reset body margin/padding for print */
            body {
                margin: 0;
                padding: 0;
            }
            /* Hide the modal overlay background */
            .fixed.inset-0 {
                position: static;
                background: white;
                overflow: visible;
                display: block;
            }
            /* Make the modal content full width/height and visible */
            .bg-white.rounded-lg {
                box-shadow: none;
                width: 100%;
                max-width: none;
                margin: 0;
                position: absolute;
                top: 0;
                left: 0;
            }
            /* Hide close buttons etc */
            .print\\:hidden {
                display: none !important;
            }
            /* Make invoice content visible */
            #invoice-content, #invoice-content * {
              visibility: visible;
            }
          }

          /* Force Hex colors for html2canvas compatibility */
          #invoice-content {
            background-color: #ffffff !important;
            color: #1f2937 !important;
          }
          #invoice-content .bg-white { background-color: #ffffff !important; }
          #invoice-content .text-gray-800 { color: #1f2937 !important; }
          #invoice-content .text-gray-600 { color: #4b5563 !important; }
          #invoice-content .bg-gray-100 { background-color: #f3f4f6 !important; }
          #invoice-content .bg-gray-50 { background-color: #f9fafb !important; }
          #invoice-content .border-gray-100 { border-color: #f3f4f6 !important; }
          #invoice-content .border-gray-200 { border-color: #e5e7eb !important; }
          #invoice-content .text-black { color: #000000 !important; }
        `}</style>
            </div>
        </div>
    )
}
