import { Link, useParams } from 'react-router';
import { Gallery } from '../../../components/product/Gallery';
import { VariantPicker } from '../../../components/product/VariantPicker';
import { FavoriteButton } from '../../../components/shop/FavoriteButton';
import { PageLoading } from '../../../components/shop/PageLoading';
import { Price, SaleBadge, StockNote } from '../../../components/shop/Price';
import { RemoteImage } from '../../../components/shop/RemoteImage';
import { concept } from '../../../data/copy';
import { usePage } from '../../../lib/usePage';
import { useProductState } from '../../../lib/useProductState';
import { collectionTitle } from '../../../lib/useShopQuery';
import NotFound from './NotFound';

export default function Product() {
  const { handle } = useParams();
  const s = useProductState(handle);
  const { cat, indexed, detail, p, variant } = s;
  const title = p?.title ?? indexed?.title ?? 'Loading...';
  usePage(title, detail.status === 'loading' ? 'Loading image...' : p ? 'Done.' : undefined);

  if (s.missing || detail.status === 'missing') return <NotFound />;
  if (detail.status === 'error')
    return (
      <div className="page">
        <p className="errline">This page could not be loaded ({detail.error}). Check the connection and press Refresh.</p>
      </div>
    );

  if (!p) {
    // Instant shell from the index while the detail shard downloads.
    return indexed ? (
      <div className="page product">
        <div className="product__layout">
          <div className="gallery">
            <div className="gallery__stage">
              <RemoteImage src={indexed.image} alt={indexed.title} title={indexed.title} width={indexed.imageWidth} height={indexed.imageHeight} base={800} eager />
            </div>
          </div>
          <div className="props">
            <h1 className="props__title">{indexed.title}</h1>
            <Price price={indexed.price} compareAt={indexed.compareAtPrice} large />
            <PageLoading label="Loading product properties..." />
          </div>
        </div>
      </div>
    ) : (
      <PageLoading label="Opening product..." />
    );
  }

  const price = variant?.price ?? p.price;
  const compare = variant ? variant.compareAtPrice : p.compareAtPrice;
  const available = variant ? variant.available : p.available;
  const collections = p.collections.filter((h) => cat?.collections.has(h) && !['all-products', 'best-sellers', 'unisex', 'men', 'outwear', 'the-vacation-edit', 'stripes', 'bundles'].includes(h));

  return (
    <div className="page product">
      <p className="crumbs">
        <Link to="/">Home</Link> › <Link to="/shop">Shop</Link>
        {p.productType && <> › {p.productType}</>} › {p.title}
      </p>
      <div className="product__layout">
        <Gallery images={p.images} title={p.title} handle={p.handle} sourceUrl={p.sourceUrl} />
        <section className="props" aria-labelledby="product-title">
          <div className="props__tab" aria-hidden="true">
            PRODUCT PROPERTIES
          </div>
          <h1 className="props__title" id="product-title" tabIndex={-1}>
            {p.title}
          </h1>
          <div className="props__price">
            <Price price={price} compareAt={compare} large />
            {compare !== null && price !== null && compare > price && <SaleBadge />}
          </div>
          <StockNote available={available} />
          <VariantPicker p={p} selected={s.selected} onSelect={s.select} />
          <div className="props__buy">
            <button type="button" className="btn btn--go props__add" disabled={!s.canAdd} onClick={s.add}>
              {s.needsChoice ? `Choose ${p.options.find((_, i) => !s.selected[i])?.name.toLowerCase() ?? 'an option'} :)` : available === false ? concept.y2k.soldOut : concept.y2k.add}
            </button>
            <FavoriteButton handle={p.handle} title={p.title} />
          </div>
          <p className="props__fit">{available === false ? concept.y2k.tooCute : concept.y2k.fitNote}</p>
          <a className="props__real" href={p.sourceUrl} target="_blank" rel="noopener noreferrer">
            VIEW CURRENT ITEM ON IYS ↗
          </a>
          <p className="props__snapshot">
            {concept.snapshot} ({p.retrievedAt?.slice(0, 10) ?? 'unknown'}). This concept cannot place orders.
          </p>
          {p.description && (
            <details className="props__desc" open>
              <summary>Description</summary>
              <p>{p.description}</p>
            </details>
          )}
          <table className="props__table">
            <caption className="sr-only">Product details</caption>
            <tbody>
              {p.productType && (
                <tr>
                  <th scope="row">Type</th>
                  <td>{p.productType}</td>
                </tr>
              )}
              {p.options.map((o) => (
                <tr key={o.name}>
                  <th scope="row">{o.name}</th>
                  <td>{o.values.join(', ')}</td>
                </tr>
              ))}
              {collections.length > 0 && (
                <tr>
                  <th scope="row">Found in</th>
                  <td>
                    {collections.map((h, i) => (
                      <span key={h}>
                        <Link to={`/collections/${h}`}>{collectionTitle(h, cat?.collections.get(h)?.title)}</Link>
                        {i < collections.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </td>
                </tr>
              )}
              <tr>
                <th scope="row">Photos</th>
                <td>{p.images.length}</td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
