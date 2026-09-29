import { useState, type ImgHTMLAttributes } from 'react';
import { concept } from '../../data/copy';
import { sized, srcSet } from '../../lib/catalogue/images';

/**
 * Official CDN product photo: lazy, async-decoded, responsive. If the remote
 * image ever disappears we show an honest period error box with the real
 * product title — never a substitute photo.
 */
export function RemoteImage({
  src,
  alt,
  width,
  height,
  sizes = '(max-width: 700px) 50vw, 240px',
  max = 1000,
  base = 480,
  title,
  sourceUrl,
  className,
  eager,
  actions = false,
  ...rest
}: {
  src: string | null;
  alt: string;
  width?: number | null;
  height?: number | null;
  sizes?: string;
  max?: number;
  base?: number;
  title?: string;
  sourceUrl?: string;
  className?: string;
  eager?: boolean;
  /** Show Retry / View original buttons (only where the image is NOT inside a link or button). */
  actions?: boolean;
} & Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'width' | 'height'>) {
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  if (!src || state === 'error') {
    return (
      <div className={`img-offline ${className ?? ''}`} role={actions ? 'group' : 'img'} aria-label={`${concept.imageOffline}: ${title ?? alt}`} style={{ aspectRatio: width && height ? `${width} / ${height}` : '4 / 5' }}>
        <b>{concept.imageOffline}</b>
        <span>{title ?? alt}</span>
        {actions && (
        <span className="img-offline__actions">
          {src && (
            <button
              type="button"
              className="btn btn--small"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setState('loading');
                setAttempt((a) => a + 1);
              }}
            >
              Retry
            </button>
          )}
          {sourceUrl && (
            <a className="btn btn--small" href={sourceUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
              View original ↗
            </a>
          )}
        </span>
        )}
      </div>
    );
  }
  const isLocal = src.startsWith('/');
  return (
    <img
      key={attempt}
      className={`${className ?? ''}${state === 'loading' ? ' is-loading' : ''}`}
      src={isLocal ? src : sized(src, base)}
      srcSet={isLocal ? undefined : srcSet(src, max)}
      sizes={isLocal ? undefined : sizes}
      alt={alt}
      width={width ?? undefined}
      height={height ?? undefined}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onLoad={() => setState('ok')}
      onError={() => setState('error')}
      {...rest}
    />
  );
}
