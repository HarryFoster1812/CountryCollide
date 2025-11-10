import { Suspense } from 'react';
import  WorldComparePage from './comparison';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading comparison…</div>}>
      <WorldComparePage />
    </Suspense>
  );
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
