import { Metadata } from 'next';
import BatchPosLayoutClient from '@/components/BatchPosLayoutClient';

export const metadata: Metadata = {
  title: 'Batch POS & Production Summary | Store Dashboard',
  description: 'Point of Sale per Batch Order & Kalkulasi Adonan Dapur Real-time',
};

export const revalidate = 0;

export default async function BatchPosPage() {
  return <BatchPosLayoutClient />;
}
