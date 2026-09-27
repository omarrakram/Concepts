import { CairoMode } from '../sections/CairoMode';
import { Door } from '../sections/Door';
import { Drawer } from '../sections/Drawer';
import { LockerRoom } from '../sections/LockerRoom';
import { MoodSelector } from '../sections/MoodSelector';
import { PjoyRoom } from '../sections/PjoyRoom';
import { Stores } from '../sections/Stores';
import { Wall } from '../sections/Wall';
import { Wardrobe } from '../sections/Wardrobe';

/** The house, room by room. */
export function Home() {
  return (
    <main id="main">
      <Door />
      <MoodSelector />
      <Wardrobe />
      <PjoyRoom />
      <CairoMode />
      <LockerRoom />
      <Drawer />
      <Wall />
      <Stores />
    </main>
  );
}
