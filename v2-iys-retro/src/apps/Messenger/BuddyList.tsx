import { useState } from 'react';
import { Icon } from '../../components/os/Icon';
import { Window } from '../../components/os/Window';
import { brand } from '../../data/assets';
import { BUDDIES } from '../../data/taxonomy';
import { formatCount } from '../../lib/catalogue/format';
import { useCatalogue } from '../../lib/catalogue/load';
import { useOS, type Win } from '../../state/os';

export function openChat(id: string, name: string) {
  useOS.getState().open('chat', { id: `chat-${id}`, title: `${name} - Conversation`, props: { buddy: id } });
}

export default function BuddyList({ win }: { win: Win }) {
  const cat = useCatalogue();
  const [me, setMe] = useState<'online' | 'away' | 'busy'>('online');
  const buddies = BUDDIES.filter((b) => !cat || (cat.collections.get(b.collection)?.count ?? 0) > 0);
  const online = buddies.filter((b) => b.status !== 'busy').length;
  return (
    <Window
      win={win}
      icon="messenger"
      menubar={['File', 'Contacts', 'Actions', 'Help']}
      statusbar={
        <div className="statusbar">
          <span className="grow">{buddies.length} contacts</span>
          <span>IYS MESSENGER</span>
        </div>
      }
    >
      <div className="win__scroll im">
        <div className="im__me">
          <span className="im__dp">
            <img src={brand.mark} alt="" />
          </span>
          <div>
            <label className="im__status">
              <span className="sr-only">Your status</span>
              <select className="select" value={me} onChange={(e) => setMe(e.target.value as typeof me)}>
                <option value="online">you (Online)</option>
                <option value="away">you (Away)</option>
                <option value="busy">you (Busy)</option>
              </select>
            </label>
            <p className="im__pm">&lt;making cool decisions&gt;</p>
          </div>
        </div>
        <p className="im__group">
          ▾ IYS ({online}/{buddies.length})
        </p>
        <ul className="im__list" aria-label="Contacts">
          {buddies.map((b) => {
            const n = cat?.collections.get(b.collection)?.count;
            return (
              <li key={b.id}>
                <button type="button" className="im__buddy" onClick={() => openChat(b.id, b.name)} aria-label={`Chat with ${b.name}, ${b.status}${n ? `, ${n} items` : ''}`}>
                  <span className={`orb orb--${b.status}`} aria-hidden="true" />
                  <span className="im__name">
                    <b>{b.name}</b> <small>({b.status})</small>
                    <span className="im__mood">
                      {b.id === 'pjoys' ? '2:13 AM · ' : ''}
                      {b.mood}
                      {n ? ` · ${formatCount(n)} items` : ''}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="im__foot">
          <Icon name="info" size={16} /> Contacts are IYS collections. Statuses are concept UI, not stock levels. No real people, no bots.
        </p>
      </div>
    </Window>
  );
}
