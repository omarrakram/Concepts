import { Icon } from '../../components/os/Icon';
import { Window } from '../../components/os/Window';
import { formatEGP } from '../../lib/catalogue/format';
import { productPath, useBrowse } from '../../lib/useBrowse';
import { itemCount, subtotal, useCart } from '../../state/cart';
import { BagList } from '../../components/shop/BagList';
import { useOS, type Win } from '../../state/os';

export default function Bag({ win }: { win: Win }) {
  const items = useCart((s) => s.items);
  const browse = useBrowse();
  const total = subtotal(items);
  const count = itemCount(items);
  return (
    <Window
      win={win}
      icon="bag"
      menubar={['File', 'Edit', 'View', 'Help']}
      statusbar={
        <div className="statusbar">
          <span className="grow">
            {count} item(s) · {formatEGP(total)}
          </span>
          <span>Saved on this computer</span>
        </div>
      }
    >
      <div className="win__scroll bag">
        <p className="bag__path">
          <Icon name="folder-open" size={16} /> C:\MY BAG\
        </p>
        <BagList onOpenProduct={(h) => browse(productPath(h))} />
      </div>
      {items.length > 0 && (
        <div className="bag__foot">
          <div className="bag__total">
            <span>Subtotal ({count} items)</span>
            <b>{formatEGP(total)}</b>
          </div>
          <p className="bag__note">Snapshot prices in EGP. Delivery and offers are calculated on the real site.</p>
          <button type="button" className="btn btn--primary bag__checkout" onClick={() => useOS.getState().showDialog({ kind: 'checkout' })}>
            CHECKOUT
          </button>
        </div>
      )}
    </Window>
  );
}
