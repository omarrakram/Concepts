import { lazy, Suspense } from 'react';
import { useClaimCenter } from './chrome';

const MobileDressUp = lazy(() => import('../../features/dressup/ui/MobileDressUp'));

function Loading() {
  useClaimCenter({ label: 'LOADING', disabled: true, run: () => {} });
  return (
    <p className="m-meta" role="status">
      Loading DRESSUP.EXE...
    </p>
  );
}

/** Mobile DRESSUP.EXE: its own lazy chunk, loaded only when opened from MENU. */
export function MDressUp({ close }: { close: () => void }) {
  return (
    <Suspense fallback={<Loading />}>
      <MobileDressUp close={close} />
    </Suspense>
  );
}
