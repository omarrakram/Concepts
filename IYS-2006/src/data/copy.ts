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
      ['COOL DECISIONS', 'READY'],
    ] as [string, string][],
    target: 'TIME TARGET: 2006',
    connecting: 'CONNECTING TO IYS INTERNET...',
    skip: 'SKIP',
  },
  dialog: { app: 'IYS.EXE', cancel: 'Cancel', ok: 'Obviously', postponed: 'Cool decision postponed. It’ll wait.' },
  notFound: { title: 'IYS.EXE', line: 'THE PAGE YOU’RE LOOKING FOR WENT OFFLINE.' },
  imageOffline: 'IMAGE COULD NOT LOAD',
  copying: 'COPYING ITEM TO:',
  itemAdded: 'ITEM ADDED.',
  wallpaperUpdated: 'WALLPAPER UPDATED.',
  touchGrass: { title: 'TOUCH_GRASS.EXE', message: 'ERROR: TOUCH GRASS NOT FOUND.', sub: 'Opening the closest available alternative...' },
  gameNight: 'GAME_NIGHT.EXE',
  checkout: {
    title: 'CONCEPT CHECKOUT',
    lines: ['This is an unofficial portfolio prototype.', 'No order will be placed.'],
    continue: 'Continue shopping',
    visit: 'Visit In Your Shoe ↗',
  },
  mail: {
    title: 'IYS MAIL',
    subject: 'Welcome to the cool list',
    note: 'Portfolio demo — this form does not send or store your address. Join the real list on inyourshoe.com.',
    done: 'MESSAGE QUEUED. (Not really — this is a concept. Nothing was sent.)',
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
    '— Omar Akram, 2026',
  ],
  recycle: { title: 'RECYCLE BIN', folder: 'BORING_OUTFITS', empty: 'This folder is empty. Nobody here dresses boring.' },
  snapshot: 'Prices & availability as of the catalogue snapshot',
  guestbook: 'NO ENTRIES LOADED. (No reviews are shown — we don’t invent customers.)',
  counterLabel: 'TIME TRAVELLERS:',
  counterNote: 'Fictional counter. Not analytics.',
  messenger: {
    pjoysOpener: 'u awake?',
    /** Egyptian Franco-Arabic ("are you awake?") — period-accurate chat script. */
    pjoysFranco: 'enta sa7y?',
    pjoysAfter: ['found these for the sleepover', 'pick one. obviously.'],
  },
  disclaimer: [
    'UNOFFICIAL SPECULATIVE DIGITAL CONCEPT.',
    'NOT AFFILIATED WITH IN YOUR SHOE.',
    'DESIGN & DEVELOPMENT CONCEPT — OMAR AKRAM / 2026.',
    'Product names, logo and photography belong to their respective rights holders and are used here for a non-commercial concept.',
  ],
} as const;
