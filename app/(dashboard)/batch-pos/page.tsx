import { Metadata } from 'next';
import { createClient } from '@/utils/supabase/server';
import BatchPosLayoutClient from '@/components/BatchPosLayoutClient';

export const metadata: Metadata = {
  title: 'Batch POS & Production Summary | Store Dashboard',
  description: 'Point of Sale per Batch Order & Kalkulasi Adonan Dapur Real-time',
};

export const revalidate = 0;

export default async function BatchPosPage() {
  const supabase = await createClient();

  // Fetch real data from Supabase DB in parallel with strict error logging
  const [posRes, customersRes, productsRes] = await Promise.all([
    supabase
      .from('batch_po')
      .select('id, name, description, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('customers')
      .select('id, name, phone, address, default_courier')
      .order('name', { ascending: true }),
    supabase
      .from('products')
      .select('id, name, price, category, dough_recipe')
      .order('name', { ascending: true }),
  ]);

  if (posRes.error) console.error('Error fetching batch_po:', posRes.error);
  if (customersRes.error) console.error('Error fetching customers:', customersRes.error);
  if (productsRes.error) console.error('Error fetching products:', productsRes.error);

  const initialBatchPO = posRes.data || [];
  const initialCustomers = customersRes.data || [];
  const initialProducts = (productsRes.data || []).map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    category: p.category || 'General',
    doughRecipe: p.dough_recipe || undefined,
  }));

  return (
    <BatchPosLayoutClient
      initialBatchPO={initialBatchPO}
      initialCustomers={initialCustomers}
      initialProducts={initialProducts}
    />
  );
}
