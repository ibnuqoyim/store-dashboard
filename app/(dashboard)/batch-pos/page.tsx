import { Metadata } from 'next';
import { createClient } from '@/utils/supabase/server';
import BatchPosLayoutClient from '@/components/BatchPosLayoutClient';
import { mapDbOrderToBatchOrder, ORDER_ITEMS_SELECT, DbOrderRow } from '@/lib/batch-pos-data';

export const metadata: Metadata = {
  title: 'Batch POS & Production Summary | Store Dashboard',
  description: 'Point of Sale per Batch Order & Kalkulasi Adonan Dapur Real-time',
};

export const revalidate = 0;

export default async function BatchPosPage() {
  const supabase = await createClient();

  const { data: storeInfo } = await supabase.from('store_info').select('modules_enabled').single();
  const hasAdonan = (storeInfo?.modules_enabled ?? []).includes('adonan');

  const [batchesResult, customersResult, productsResult, doughsResult] = await Promise.all([
    supabase.from('batch_po').select('id, name, description, created_at').order('created_at', { ascending: false }),
    supabase.from('customers').select('id, name, phone, address, default_courier').order('name'),
    hasAdonan
      ? supabase.from('products').select('id, name, price, dough_id, adonan(name)').eq('is_active', true).order('name')
      : supabase.from('products').select('id, name, price').eq('is_active', true).order('name'),
    hasAdonan
      ? supabase.from('adonan').select('id, name').order('name')
      : Promise.resolve({ data: [] }),
  ]);

  const batchList = batchesResult.data || [];
  const activeBatchId = batchList[0]?.id ?? null;

  const ordersResult = activeBatchId
    ? await supabase.from('orders').select(ORDER_ITEMS_SELECT).eq('po_id', activeBatchId).order('created_at', { ascending: false })
    : { data: [] };

  const catalog = (productsResult.data || []).map((p) => {
    const product = p as { id: string; name: string; price: number; dough_id?: string | null; adonan?: { name: string } | { name: string }[] | null };
    const adonan = Array.isArray(product.adonan) ? product.adonan[0] : product.adonan;
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      doughId: product.dough_id ?? null,
      doughName: adonan?.name ?? null,
    };
  });

  const batchOrders = ((ordersResult.data || []) as unknown as DbOrderRow[]).map(mapDbOrderToBatchOrder);

  return (
    <BatchPosLayoutClient
      initialBatchList={batchList}
      initialActiveBatchId={activeBatchId}
      initialCustomers={customersResult.data || []}
      initialCatalog={catalog}
      initialOrders={batchOrders}
      doughs={doughsResult.data || []}
    />
  );
}
