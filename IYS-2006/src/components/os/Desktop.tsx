import { useState, type CSSProperties } from 'react';
import { curation, WALLPAPERS } from '../../data/assets';
import { concept } from '../../data/copy';
import { collectionCount } from '../../lib/catalogue/hydrate';
import { formatCount } from '../../lib/catalogue/format';
import { useCatalogue } from '../../lib/catalogue/load';
import { play } from '../../lib/sound';
import { productPath, useBrowse } from '../../lib/useBrowse';
import { useCart, itemCount } from '../../state/cart';
import { useFavorites } from '../../state/favorites';
import { useOS, type AppId } from '../../state/os';
import { usePreferences } from '../../state/preferences';
import { Icon, type IconName } from './Icon';

export function Wallpaper() {
  const wp = usePreferences((s) => s.wallpaper);
  const mode = usePreferences((s) => s.wallpaperMode);
  let src: string | null = null;
  let cls = `wallpaper wallpaper--${mode}`;
  if (wp.kind === 'preset') {
    const preset = WALLPAPERS.find((w) => w.id === wp.id) ?? WALLPAPERS[0]!;
    src = preset.src;
    cls = `wallpaper wallpaper--${preset.mode}`;
    if (preset.id === 'fw27') cls += ' wallpaper--preset-fw27';
  } else src = wp.src;
  const style: CSSProperties = src ? ({ backgroundImage: cls.includes('preset-fw27') ? undefined : `url("${src}")`, ['--wp-photo' as string]: `url("${src}")` } as CSSProperties) : {};
  return (
    <div className={cls} style={style} aria-hidden="true">
      <div className="wallpaper__grain" />
    </div>
  );
}

interface DIcon {
  id: string;
  label: string;
  icon: IconName;
  aria: string;
  tip?: string;
  badge?: number;
  act: () => void;
}

export function DesktopIcons() {
  const cat = useCatalogue();
  const browse = useBrowse();
  const bag = useCart((s) => itemCount(s.items));
  const favs = useFavorites((s) => s.handles.length);
  const [selected, setSelected] = useState<string | null>(null);
  const open = (id: AppId) => useOS.getState().open(id);
  const total = cat?.products.length;
  const pjoys = collectionCount(cat, 'pjoys');
  const touchGrass = cat?.byHandle.get(curation.jokes.touchGrass);
  const gameNight = cat?.byHandle.get(curation.jokes.gameNight);

  const left: DIcon[] = [
    { id: 'internet', label: 'IYS INTERNET', icon: 'internet', aria: 'Open IYS Internet', act: () => browse('/') },
    { id: 'shop', label: 'SHOP ALL', icon: 'hanger', aria: `Shop all ${total ? formatCount(total) : ''} products`, tip: total ? `${formatCount(total)} items` : undefined, act: () => browse('/shop') },
    { id: 'pjoys', label: 'PJOYS', icon: 'pjoys', aria: `Open Pjoys collection${pjoys ? `, ${pjoys} items` : ''}`, tip: pjoys ? `${pjoys} items` : undefined, act: () => browse('/collections/pjoys') },
    { id: 'wardrobe', label: 'MY WARDROBE', icon: 'wardrobe', aria: 'Open My Wardrobe, browse by folder', act: () => open('wardrobe') },
    { id: 'messenger', label: 'IYS MESSENGER', icon: 'messenger', aria: 'Open IYS Messenger', act: () => open('messenger') },
    { id: 'camera', label: 'IYS CAMERA', icon: 'camera', aria: 'Open IYS Camera photos', act: () => open('camera') },
    { id: 'favorites', label: 'FAVORITES', icon: 'favorites', aria: `Open Favorites, ${favs} saved`, badge: favs || undefined, act: () => browse('/favorites') },
    { id: 'stores', label: 'STORES', icon: 'stores', aria: 'Find IYS stores', act: () => browse('/stores') },
    { id: 'bag', label: 'MY BAG', icon: 'bag', aria: `Open My Bag, ${bag} items`, badge: bag || undefined, act: () => open('bag') },
    { id: 'control', label: 'CONTROL PANEL', icon: 'control', aria: 'Open Control Panel', act: () => open('control') },
  ];
  const right: DIcon[] = [
    { id: 'readme', label: 'README.TXT', icon: 'txt', aria: 'Open README.TXT', act: () => open('readme') },
    { id: 'mail', label: 'IYS MAIL', icon: 'mail', aria: 'Open IYS Mail', act: () => open('mail') },
    { id: 'recycle', label: 'RECYCLE BIN', icon: 'recycle', aria: 'Open Recycle Bin', act: () => open('recycle') },
  ];
  if (touchGrass)
    right.push({
      id: 'touch-grass',
      label: 'TOUCH_GRASS.EXE',
      icon: 'exe',
      aria: `Run TOUCH_GRASS.EXE (opens ${touchGrass.title})`,
      act: () => useOS.getState().showDialog({ kind: 'error', title: concept.touchGrass.title, message: concept.touchGrass.message, action: { label: `Open ${touchGrass.title}`, handle: touchGrass.handle } }),
    });
  if (gameNight) right.push({ id: 'game-night', label: concept.gameNight, icon: 'exe', aria: `Run GAME_NIGHT.EXE (opens ${gameNight.title})`, act: () => browse(productPath(gameNight.handle)) });

  const render = (list: DIcon[]) =>
    list.map((d) => (
      <li key={d.id}>
        <button
          type="button"
          className="dicon"
          aria-label={d.aria}
          title={d.tip ? `Open — ${d.tip}` : 'Open'}
          aria-current={selected === d.id ? 'true' : undefined}
          onClick={() => {
            setSelected(d.id);
            play('click');
            d.act();
          }}
          onFocus={() => setSelected(d.id)}
        >
          <span className="dicon__img">
            <Icon name={d.icon} size={40} />
          </span>
          {d.badge ? <span className="dicon__badge" aria-hidden="true">{d.badge}</span> : null}
          <span className="dicon__label">{d.label.split(/(?<=[_.])/).map((part, i) => (i ? [<wbr key={i} />, part] : part))}</span>
        </button>
      </li>
    ));

  return (
    <>
      <ul className="desktop__icons" aria-label="Desktop">
        {render(left)}
      </ul>
      <ul className="desktop__icons desktop__icons--right" aria-label="Desktop files">
        {render(right)}
      </ul>
    </>
  );
}
