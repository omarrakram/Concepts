import { asset } from '../data/assets';

const LOGO = asset('logo'); // black wordmark — storefront header
const LOGO_WHITE = asset('logo-white'); // white wordmark — storefront footer
const MARK = asset('mark'); // IYS monogram — storefront social/og image

/**
 * The current official IN YOUR SHOE logo, as served by inyourshoe.com.
 * `invert` picks the official white wordmark; `mark` the IYS monogram.
 * Never redrawn — if a file is missing the brand name is set as plain text.
 */
export function Logo({ className = '', invert = false, mark = false }: { className?: string; invert?: boolean; mark?: boolean }) {
  const a = mark ? MARK : invert ? LOGO_WHITE : LOGO;
  if (a)
    return <img className={`logo ${mark ? 'logo--mark' : ''} ${className}`} src={a.src} alt={mark ? 'IYS' : 'IN YOUR SHOE'} width={a.width} height={a.height} draggable={false} />;
  return (
    <span className={`logo logo--text ${className}`} aria-label="IN YOUR SHOE">
      {mark ? 'IYS' : 'IN YOUR SHOE'}
    </span>
  );
}
