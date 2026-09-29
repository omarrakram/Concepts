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
  touchGrass: { title: 'TOUCH_GRASS.EXE', message: 'ERROR: TOUCH GRASS NOT FOUND.', sub: 'Opening the closest available alternative...' },
  gameNight: 'GAME_NIGHT.EXE',
  checkout: {
    title: 'CONCEPT CHECKOUT',
    lines: ['omg great taste xo — but this is an unofficial portfolio prototype.', 'No order will be placed.'],
    continue: 'keep shopping xo',
    visit: 'Visit In Your Shoe ↗',
  },
  mail: {
    title: 'IYS MAIL',
    subject: 'subscribe 2 our newsletter xoxo',
    note: 'Portfolio demo — this form does not send or store your address. Join the real list on inyourshoe.com.',
    done: 'omg ur on the list xo (jk — this is a concept, nothing was sent lol)',
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
  recycle: { title: 'RECYCLE BIN', folder: 'BORING_OUTFITS', empty: 'this folder is empty. nobody here dresses boring xd' },
  snapshot: 'Prices & availability as of the catalogue snapshot',
  guestbook: 'no entries yet :( (no reviews shown — we don’t invent customers)',
  counterLabel: 'TIME TRAVELLERS:',
  counterNote: 'Fictional counter. Not analytics.',
  messenger: {
    pjoysOpener: 'u awake?',
    /** Egyptian Franco-Arabic ("are you awake?") — period-accurate chat script. */
    pjoysFranco: 'enta sa7y?',
    pjoysAfter: ['omg found these 4 the sleepover xd', 'pick one. obviously :)'],
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
    newsletterNote: 'opens the real cool list on inyourshoe.com — this concept stores nothing.',
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
  },
  disclaimer: [
    'UNOFFICIAL SPECULATIVE DIGITAL CONCEPT.',
    'NOT AFFILIATED WITH IN YOUR SHOE.',
    'DESIGN & DEVELOPMENT CONCEPT — OMAR AKRAM / 2026.',
    'Product names, logo and photography belong to their respective rights holders and are used here for a non-commercial concept.',
  ],
} as const;
