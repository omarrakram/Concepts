import { logo } from '../data/assets';

/**
 * Current official IN YOUR SHOE logo (downloaded from the storefront header).
 * If the file is unavailable the brand name is set as text — never a redrawn mark.
 */
export function Logo({ className = '', invert = false }: { className?: string; invert?: boolean }) {
  if (logo)
    return (
      <img
        className={`logo ${invert ? 'logo--invert' : ''} ${className}`}
        src={logo.src}
        alt="IN YOUR SHOE"
        width={logo.width}
        height={logo.height}
        draggable={false}
      />
    );
  return (
    <span className={`logo logo--text ${className}`} aria-label="IN YOUR SHOE">
      IN YOUR SHOE
    </span>
  );
}
