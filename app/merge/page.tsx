import { Suspense } from 'react';
import  MergePage from './MergePage';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading comparison…</div>}>
      <MergePage />
    </Suspense>
  );
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
