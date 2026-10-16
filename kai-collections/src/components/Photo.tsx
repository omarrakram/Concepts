import { useState, type CSSProperties, type ReactNode } from 'react';
import { imgUrl, srcSet } from '../data/media';

/**
 * A photograph served by KAI's CDN: responsive srcset (Shopify resizes and converts on request),
 * intrinsic size to avoid layout shift, lazy by default, and a graceful fallback if it fails.
 */
export function Photo({
  src,
  w,
  h,
  alt,
  sizes = '(max-width: 760px) 50vw, 25vw',
  priority = false,
  className,
  style,
  max = 1800,
  fallback = null,
  decorative = false,
  onLoad,
}: {
  src: string;
  w?: number | null;
  h?: number | null;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  style?: CSSProperties;
  max?: number;
  fallback?: ReactNode;
  decorative?: boolean;
  onLoad?: () => void;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return <>{fallback}</>;
  return (
    <img
      className={className}
      style={style}
      src={imgUrl(src, Math.min(720, max, w ?? 720))}
      srcSet={srcSet(src, max, w)}
      sizes={sizes}
      width={w ?? undefined}
      height={h ?? undefined}
      alt={decorative ? '' : alt}
      aria-hidden={decorative || undefined}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
      draggable={false}
      onLoad={onLoad}
      onError={() => setFailed(true)}
      data-kai-photo=""
    />
  );
}
