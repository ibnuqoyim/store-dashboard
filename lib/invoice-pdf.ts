import { format } from 'date-fns';
import { BusinessConfig, formatCurrency } from './config';

export interface InvoicePdfOrder {
  id?: string;
  invoice_number: string;
  date?: string;
  customer_name: string;
  phone?: string | null;
  shipping_fee?: number | null;
  order_items: {
    price: number;
    quantity: number;
    products?: {
      name: string;
    } | null;
    name?: string;
  }[];
  deliveries?: {
    shipping_cost?: number | null;
  }[];
}

export function mapBatchOrderToInvoicePdfOrder(order: {
  id: string;
  invoiceNumber: string;
  customerName: string;
  phone?: string | null;
  date?: string;
  shippingFee?: number | null;
  items: { name: string; price: number; qty: number }[];
}): InvoicePdfOrder {
  return {
    id: order.id,
    invoice_number: order.invoiceNumber,
    customer_name: order.customerName,
    phone: order.phone,
    date: order.date,
    shipping_fee: order.shippingFee,
    order_items: order.items.map((it) => ({
      name: it.name,
      price: it.price,
      quantity: it.qty,
    })),
  };
}

export async function generateInvoicePdf(
  order: InvoicePdfOrder,
  config: BusinessConfig,
  store?: {
    name?: string | null;
    phone?: string | null;
    bank_name?: string | null;
    bank_account?: string | null;
    bank_holder?: string | null;
    invoice_closing_message?: string | null;
    invoice_closing_sub?: string | null;
    logo_url?: string | null;
  } | null
) {
  try {
    const jsPDF = (await import('jspdf')).default;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const invoiceName = store?.name || config.name;
    const invoicePhone = store?.phone || config.phone;
    const invoiceBankName = store?.bank_name || config.bank_name || '';
    const invoiceBankAccount = store?.bank_account || config.bank_account || '';
    const invoiceBankHolder = store?.bank_holder || config.bank_holder || '';
    const invoiceClosingMsg = store?.invoice_closing_message || config.invoice_closing_message || 'Terima Kasih';
    const invoiceClosingSub = store?.invoice_closing_sub || config.invoice_closing_sub || '';
    const logoUrl = store?.logo_url || config.logo_url || null;

    if (logoUrl) {
      try {
        const response = await fetch(logoUrl);
        if (response.ok) {
          const blob = await response.blob();
          const logoBase64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = logoBase64;
          });

          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.clearRect(0, 0, canvas.width, canvas.height);
          ctx?.drawImage(img, 0, 0);
          const cleanImageData = canvas.toDataURL('image/png');

          const pageWidth = doc.internal.pageSize.getWidth();
          const pageHeight = doc.internal.pageSize.getHeight();
          const imgRatio = img.width / img.height;
          const pageRatio = pageWidth / pageHeight;
          let renderWidth, renderHeight;
          if (imgRatio > pageRatio) {
            renderWidth = pageWidth;
            renderHeight = pageWidth / imgRatio;
          } else {
            renderHeight = pageHeight;
            renderWidth = pageHeight * imgRatio;
          }
          const w = renderWidth / 1.5;
          const h = renderHeight / 1.5;
          const x = (pageWidth - w) / 2;
          const y = (pageHeight - h) / 2;

          doc.saveGraphicsState();
          interface JsPdfWithGState {
            GState: new (opts: { opacity: number }) => unknown;
          }
          doc.setGState(new (doc as unknown as JsPdfWithGState).GState({ opacity: 0.2 }));
          doc.addImage(cleanImageData, 'PNG', x, y, w, h);
          doc.restoreGraphicsState();
        }
      } catch (error) {
        console.error('Error adding watermark:', error);
      }
    }

    const fc = (amount: number) => formatCurrency(amount, config);

    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice', 200, 20, { align: 'right' });
    doc.setFontSize(16);
    doc.text(invoiceName, 200, 30, { align: 'right' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('No HP', 200, 36, { align: 'right' });
    doc.text(invoicePhone, 200, 41, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO', 10, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(order.customer_name, 10, 61);
    if (order.phone && order.phone !== '-') doc.text(order.phone, 10, 66);

    const orderDate = order.date ? new Date(order.date) : new Date();
    const formattedDate = format(orderDate, 'dd MMM yyyy');

    doc.setFont('helvetica', 'bold');
    doc.text('Invoice #', 140, 55);
    doc.text('Date', 140, 61);
    doc.text('Due date', 140, 67);
    doc.setFont('helvetica', 'normal');
    doc.text(order.invoice_number, 165, 55);
    doc.text(formattedDate, 165, 61);
    doc.text(formattedDate, 165, 67);

    let yPos = 85;
    doc.setFillColor(240, 240, 240);
    doc.rect(10, yPos - 5, 190, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Item', 12, yPos);
    doc.text('Qty', 120, yPos, { align: 'center' });
    doc.text('Price', 155, yPos, { align: 'right' });
    doc.text('Amount', 195, yPos, { align: 'right' });

    yPos += 8;
    doc.setFont('helvetica', 'normal');
    let subtotal = 0;

    order.order_items?.forEach((item) => {
      const amount = item.price * item.quantity;
      subtotal += amount;
      const itemName = item.products?.name || item.name || 'Produk';
      doc.text(itemName, 12, yPos);
      doc.text(item.quantity.toString(), 120, yPos, { align: 'center' });
      doc.text(fc(item.price), 155, yPos, { align: 'right' });
      doc.text(fc(amount), 195, yPos, { align: 'right' });
      yPos += 6;
    });

    const shippingCost =
      order.shipping_fee ??
      (order.deliveries && order.deliveries.length > 0 ? order.deliveries[0].shipping_cost || 0 : 0);

    if (shippingCost > 0 || (order.deliveries && order.deliveries.length > 0)) {
      subtotal += shippingCost;
      doc.text('Ongkir', 12, yPos);
      doc.text('1', 120, yPos, { align: 'center' });
      doc.text(shippingCost > 0 ? fc(shippingCost) : '-', 155, yPos, { align: 'right' });
      doc.text(shippingCost > 0 ? fc(shippingCost) : '-', 195, yPos, { align: 'right' });
      yPos += 6;
    }

    yPos += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Subtotal', 155, yPos, { align: 'right' });
    doc.text(fc(subtotal), 195, yPos, { align: 'right' });
    yPos += 8;
    doc.setFontSize(12);
    doc.text('Total', 155, yPos, { align: 'right' });
    doc.text(fc(subtotal), 195, yPos, { align: 'right' });

    yPos += 10;
    doc.setFillColor(240, 240, 240);
    doc.rect(10, yPos - 5, 190, 15, 'F');
    doc.setFontSize(11);
    doc.text('Amount Due', 12, yPos + 3);
    doc.setFontSize(16);
    doc.text(fc(subtotal), 195, yPos + 3, { align: 'right' });

    yPos += 25;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setFillColor(250, 250, 250);
    doc.rect(10, yPos - 3, 190, 25, 'F');
    if (invoiceBankName || invoiceBankAccount) {
      doc.setFont('helvetica', 'bold');
      doc.text('Silahkan transfer ke rekening berikut :', 12, yPos + 2);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `• ${invoiceBankName} : ${invoiceBankAccount}${invoiceBankHolder ? ` a.n ${invoiceBankHolder}` : ''}`,
        12,
        yPos + 7
      );
      yPos += 5;
    }
    doc.setFont('helvetica', 'bold');
    doc.text(invoiceClosingMsg, 12, yPos + 18);
    if (invoiceClosingSub) {
      doc.setFont('helvetica', 'normal');
      doc.text(invoiceClosingSub, 12, yPos + 22);
    }

    doc.save(`Invoice-${order.invoice_number}-${order.customer_name}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}
