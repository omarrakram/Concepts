import { useStore } from '../lib/store';
import { Heart } from './Objects';

/** Wishlist = a heart sticker slapped onto the photo. */
export function Wish({ id, name, className = '' }: { id: string; name: string; className?: string }) {
  const { wish, toggleWish } = useStore();
  const on = wish.includes(id);
  return (
    <button
      type="button"
      className={`wish ${on ? 'is-on' : ''} ${className}`}
      aria-pressed={on}
      aria-label={on ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`}
      onClick={(e) => {
        e.stopPropagation();
        toggleWish(id);
      }}
    >
      <Heart filled={on} />
    </button>
  );
}
