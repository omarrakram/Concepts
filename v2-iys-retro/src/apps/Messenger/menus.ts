import type { MenuDef } from '../../components/os/MenuBar';
import { concept } from '../../data/copy';
import { BUDDIES } from '../../data/taxonomy';
import { useCatalogue } from '../../lib/catalogue/load';
import type { Product } from '../../lib/catalogue/types';
import { collectionPath, productPath, useBrowse } from '../../lib/useBrowse';
import { useOS, type Win } from '../../state/os';
import { addToBag, quickRequest } from '../../state/status';

export function openChat(id: string, name: string) {
  useOS.getState().open('chat', { id: `chat-${id}`, title: `${name} - Conversation`, props: { buddy: id } });
}

/** Focus an element that may still be mounting (lazy window), for up to 3 s. */
function focusWhenReady(selector: string) {
  const until = performance.now() + 3000;
  const tick = () => {
    const el = document.querySelector<HTMLElement>(selector);
    if (el) el.focus();
    else if (performance.now() < until) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/**
 * Real menus for IYS MESSENGER (buddy list + conversations), rendered by the
 * same MenuBar as IYS INTERNET. `buddyId` = the conversation in context;
 * `shared` = the latest product actually sent in that conversation.
 */
export function useMessengerMenus(win: Win, buddyId: string | null, shared: Product | null = null): MenuDef[] {
  const cat = useCatalogue();
  const browse = useBrowse();
  const { open, close, minimize } = useOS.getState();
  const isChat = win.app === 'chat';
  const available = BUDDIES.filter((b) => !cat || (cat.collections.get(b.collection)?.count ?? 0) > 0);
  const buddy = buddyId ? available.find((b) => b.id === buddyId) ?? null : null;
  const startConversation = () => {
    open('messenger');
    focusWhenReady('[data-window="messenger"] .im__buddy');
  };
  const sendIM = (id: string, name: string) => {
    openChat(id, name);
    focusWhenReady(`#compose-chat-${id}`);
  };
  const req = shared ? quickRequest(shared) : null;

  return [
    {
      label: 'File',
      items: [
        { label: 'New Conversation...', run: startConversation },
        { label: isChat ? 'Minimize Conversation' : 'Minimize Messenger', run: () => minimize(win.id) },
        { label: isChat ? 'Close Conversation' : 'Close IYS Messenger', separator: true, run: () => close(win.id) },
      ],
    },
    {
      label: 'Contacts',
      items: [
        ...available.map((b) => ({ label: b.name, run: () => openChat(b.id, b.name) })),
        { label: 'Show Buddy List', separator: true, run: () => open('messenger') },
      ],
    },
    {
      label: 'Actions',
      items: buddy
        ? [
            { label: 'Send IM', run: () => sendIM(buddy.id, buddy.name) },
            { label: `Open ${buddy.name} Collection`, run: () => browse(collectionPath(buddy.collection)) },
            ...(shared ? [{ label: 'View Shared Product', run: () => browse(productPath(shared.handle)) }] : []),
            ...(shared && req ? [{ label: 'Add Shared Product to Bag', run: () => addToBag(req) }] : []),
            { label: 'Open My Bag', separator: true, run: () => open('bag') },
            { label: 'Open IYS Internet', run: () => open('internet') },
          ]
        : [
            { label: 'Start Conversation...', run: startConversation },
            { label: 'Open My Bag', run: () => open('bag') },
            { label: 'Open IYS Internet', run: () => open('internet') },
          ],
    },
    {
      label: 'Help',
      items: [
        { label: concept.messenger.howTo.title, run: () => useOS.getState().showDialog({ kind: 'info', title: concept.messenger.howTo.title, lines: [...concept.messenger.howTo.lines] }) },
        { label: concept.messenger.about.title, run: () => useOS.getState().showDialog({ kind: 'info', title: concept.messenger.about.title, lines: [...concept.messenger.about.lines] }) },
      ],
    },
  ];
}
