/**
 * COPY REGISTRY
 *
 * OFFICIAL — existing In Your Shoe language, re-verified on the public
 *            Egyptian storefront on 2026-09-29, with where it appears.
 *            Promotions are volatile: re-verify before each publish.
 * CONCEPT  — lines written for this unofficial concept (Omar Akram, 2026).
 *            Never present these as IYS copy.
 */

export const OFFICIAL_VERIFIED_ON = '2026-09-29';

export const official = {
  /** Scrolling marquee + footer, https://inyourshoe.com/ */
  coolDecision: 'You’re about to make a Cool Decision!',
  /** <title> of https://inyourshoe.com/ */
  coolestApparel: 'The Coolest Apparel In Town!',
  /** meta description of https://inyourshoe.com/ */
  standOut: 'Stand out, Express yourself! We put ourselves in your shoe, in style! :)',
  /** Footer newsletter block, https://inyourshoe.com/ */
  coolList: 'Join our cool list and receive a 10% OFF code for your 1st purchase!',
  /** Announcement bar, https://inyourshoe.com/ */
  sameDay: 'Same-day delivery available ⚡',
  /** Announcement bar, https://inyourshoe.com/ */
  freeShipping: 'Free Shipping +2,499',
  /** Pjoys product descriptions, e.g. https://inyourshoe.com/products/cereal-killer-pjoys */
  pjoys: 'Pjoys are our terminology for pyjama pants that are super joyful, just like you reading this.',
  brand: 'IN YOUR SHOE',
} as const;

export const officialSources = {
  home: 'https://inyourshoe.com/',
  stores: 'https://inyourshoe.com/pages/store-locations',
  collections: 'https://inyourshoe.com/collections/all-products',
} as const;

/** ── CONCEPT COPY — NOT OFFICIAL BRAND LANGUAGE ─────────────────────── */
export const concept = {
  name: 'IYS INTERNET 2006',
  os: 'IYS OS',
  targetYear: '2006',
  thesis: 'What if today’s In Your Shoe travelled back to the internet of 2006?',
  boot: {
    machine: 'IYS PERSONAL COMPUTER',
    lines: [
      ['MEMORY', 'OK'],
      ['WARDROBE', 'DETECTED'],
      ['INTERNET', 'CONNECTED'],
      ['COOL DECISIONS', 'READY :)'],
    ] as [string, string][],
    target: 'TIME TARGET: 2006',
    connecting: 'CONNECTING 2 IYS INTERNET... brb :)',
    skip: 'SKIP',
  },
  dialog: { app: 'IYS.EXE', cancel: 'Cancel', ok: 'Obviously', postponed: 'cool decision postponed. it’ll wait 4 u xo' },
  notFound: { title: 'IYS.EXE', line: 'omg this page went offline :(' },
  imageOffline: 'IMAGE COULD NOT LOAD :(',
  copying: 'COPYING ITEM TO:',
  itemAdded: 'ADDED 2 BAG :)',
  wallpaperUpdated: 'WALLPAPER UPDATED xo',
  touchGrass: { title: 'TOUCH_GRASS.EXE', loaded: 'TOUCH_GRASS.EXE loaded :) go touch some grass lol' },
  gameNight: 'GAME_NIGHT.EXE',
  checkout: {
    title: 'CONCEPT CHECKOUT',
    lines: ['omg great taste xo - but this is an unofficial portfolio prototype.', 'No order will be placed.'],
    continue: 'keep shopping xo',
    visit: 'Visit In Your Shoe ↗',
  },
  /** IYS MAIL — real support mail to orders@inyourshoe.com. */
  mail: {
    title: 'IYS MAIL',
    send: 'SEND MAIL :)',
    sending: 'Sending mail...',
    retry: 'TRY AGAIN :(',
    done: 'MAIL SENT :) xo',
    doneSub: 'The IYS team got ur message at orders@inyourshoe.com and will reply to the email u gave. ttyl!',
    another: 'Write another',
    errorTitle: 'MAIL NOT SENT :(',
    failed: 'Could not reach the mail server. Ur message is still here - please try again.',
    placeholder: 'hi IYS! my message is...',
    note: 'Goes to orders@inyourshoe.com. We only use ur details to reply.',
  },
  /** IYS NEWSLETTER — the cool list. The code is revealed only after a real, confirmed signup. */
  newsletter: {
    title: 'IYS NEWSLETTER',
    headline: 'JOIN THE COOL LIST :)',
    sub: 'GET 10% OFF UR FIRST ORDER',
    join: 'JOIN XO',
    joining: 'Joining...',
    invalid: 'hmm that email looks off :( check it?',
    error: 'Could not join right now :( ur email is still here - try again?',
    offlineTitle: 'COOL LIST: COMING ONLINE SOON :)',
    offlineSubmit: 'COOL LIST CONNECTION IS STILL COMING ONLINE :)',
    offlineSubmitSub: 'ur email wasn’t sent yet.',
    offline: 'The signup line isn’t connected yet, so nobody is added and no code is issued from here. Join the real list on inyourshoe.com meanwhile.',
    successTitle: 'UR ON THE COOL LIST :)',
    successCode: '10% OFF CODE:',
    copy: 'Copy code',
    copied: 'CODE COPIED xo',
  },
  /** Odoo-hosted forms (URLs configured in src/config/integrations.ts). */
  help: {
    title: 'IYS HELP & SUPPORT',
    heading: 'IYS HELP CENTER :)',
    pending: 'Support form connection: coming online soon',
    placeholder: 'ODOO FORM PLACEHOLDER',
    open: 'OPEN SUPPORT FORM ↗',
  },
  exchange: {
    icon: 'XCHANGE.EXE :) EXCHANGES/REFUNDS',
    title: 'XCHANGE.EXE :) - EXCHANGES / REFUNDS FORM',
    heading: 'EXCHANGES / REFUNDS FORM',
    pending: 'form connection coming online soon :)',
    placeholder: 'Odoo form will load here',
    open: 'OPEN FORM ↗',
  },
  /** Easter-egg graffiti signature. Concept copy — never inside official IYS lines. */
  catchy: {
    footer: 'Catchy was here XD',
    notFound: 'Catchy was here ;P',
    recycle: 'Catchy was here :)',
  },
  readme: [
    'you made a cool decision.',
    '',
    'IYS INTERNET 2006 is an unofficial concept:',
    'today’s In Your Shoe, running on a computer from 2006.',
    '',
    'Every product, price and photo inside is real and public,',
    'copied from inyourshoe.com at the snapshot time shown in',
    'Control Panel. Nothing here can place an order.',
    '',
    '- Omar Akram, 2026',
    '',
    '',
    '',
    '(Catchy was here <3)',
  ],
  recycle: { title: 'RECYCLE BIN', folder: 'BORING_OUTFITS', empty: 'this folder is empty. nobody here dresses boring xd' },
  snapshot: 'Prices & availability as of the catalogue snapshot',
  guestbook: 'no entries yet :( (no reviews shown - we don’t invent customers)',
  counterLabel: 'TIME TRAVELLERS:',
  counterNote: 'Fictional counter. Not analytics.',
  messenger: {
    pjoysOpener: 'u awake?',
    /** Egyptian Franco-Arabic ("are you awake?") — period-accurate chat script. */
    pjoysFranco: 'enta sa7y?',
    pjoysAfter: ['omg found these 4 the sleepover XD'],
    /** Early/mid-2000s IM voice (MSN/AIM era). Text only - the Messenger UI itself is unchanged. */
    pjoysSignIn: 'PJOYS has just signed in. its 2:13 AM somewhere... sleepover mode',
    pjoysWallpapers: 'also made u some wallpapers :P',
    pjoysOutro: (online: number) => `ok pick 1. obviously ;) ${online} pjoys online rn lol, ttyl xo`,
    buddyStatus: (name: string, status: string) => `${name} is ${status}.`,
    buddyOutro: (shown: number, total: number) => `thats ${shown} of ${total} btw. the rest r in the shop, brb :)`,
    autoReply: (name: string) => `${name} is afk rn. auto-reply: brb!! the whole collection is open in IYS INTERNET →`,
    myMood: '<makin cool decisions ;)>',
    howTo: { title: 'How 2 use IYS Messenger :)', lines: ['1. pick a buddy', '2. type ur msg', '3. hit send', 'ttyl :)'] },
    about: {
      title: 'About IYS Messenger',
      lines: ['IYS MESSENGER is part of IYS Retro V2, an unofficial concept by Omar Akram.', 'Buddies are real IYS collections. Chats are scripted concept copy: no real people, no bots.', 'Not affiliated with In Your Shoe.'],
    },
  },
  /**
   * Y2K voice (team feedback, 2026-09): 2000s-internet slang used on CTAs and
   * small UI moments. One slang beat per line, max — readable first.
   */
  y2k: {
    heroKicker: 'omg new drop just landed :)',
    primary: 'Shop the drop',
    secondary: 'Explore pjoys xo',
    shopAll: 'Shop all',
    enter: 'Enter IYS :)',
    quick: 'bff shortcuts',
    justDropped: 'just dropped ✧ fresh 4 u',
    seeAllNew: 'see all new stuff',
    newsletterTitle: 'subscribe 2 our newsletter xoxo',
    newsletterCta: 'Subscribe xo',
    newsletterNote: 'opens the real cool list on inyourshoe.com - this concept stores nothing.',
    ping: '1 new msg from PJOYS :)',
    wasHere: 'IYS was here XD',
    add: 'ADD 2 BAG',
    addLong: 'brb adding this 2 bag',
    pickSize: 'PICK SIZE',
    soldOut: 'SOLD OUT :(',
    fitNote: 'u + this fit = meant 2 b xx',
    tooCute: 'too cute 2 skip xo',
    seeOnIys: 'see it on IYS ↗',
    filter: 'Sort & filter',
    noResults: '0 results :( try fewer filters?',
    searchPlaceholder: 'wat r u looking 4?',
    favEmpty: 'no favs yet :( tap ☆ on sth u love',
    bagEmpty: 'ur bag is empty :( go get sth cute',
    bagCta: 'CHECKOUT xx',
    bagNote: 'snapshot prices in EGP · this concept can’t place real orders, lol',
    stores: 'come say hi IRL :)',
    notFoundSub: 'no worries, the fits r still here. ttyl 404',
    menuHint: 'everything else lives here xo',
    seeMoreTop8: (n: string) => `see more cool decisions :) shop all ${n} ›`,
    shopCairo: (n: string) => `Shop Cairo (${n}) ›`,
    openCollection: (n: string) => `Open collection (${n} items) ›`,
    added: 'ADDED 2 BAG :)',
    viewBag: 'VIEW BAG',
    keepShopping: 'KEEP SHOPPING XO',
    pickSizeFirst: 'Pick a size first :)',
    back2Shop: 'BACK 2 SHOP',
    shopNew: 'SHOP NEW STUFF',
  },
  disclaimer: [
    'UNOFFICIAL SPECULATIVE DIGITAL CONCEPT.',
    'NOT AFFILIATED WITH IN YOUR SHOE.',
    'DESIGN & DEVELOPMENT CONCEPT - OMAR AKRAM / 2026.',
    'Product names, logo and photography belong to their respective rights holders and are used here for a non-commercial concept.',
  ],
} as const;
