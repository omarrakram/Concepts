# Sources: what is archived and what is reconstructed

The 2007 screens are drawn in code. This file records what each one is based
on, so no detail is passed off as historical when it is not. Two labels:

- **Documented**: seen in an archived page or a period screenshot listed below.
- **Reconstruction**: a plausible period design, built by analogy with the
  documented pages or from memory of the period. It was not seen in any
  archive and must not be read as fact.

## How the research was done (October 2026)

- Pages of 2007 were found with the Wayback Machine's CDX index and fetched as
  raw snapshots (`id_`) with curl, with TLS verification on.
- They were looked at by rendering the saved files locally in headless
  Chromium (`file://`, every network request blocked). Chromium in the build
  container did not trust the network proxy's certificate authority, so it was
  never pointed at live pages. TLS verification was never turned off.
- Nothing was logged into, posted or scraped from an account. No Tumblr or
  Microsoft image is used in the videos: the archived images were only looked at.

## Sources retrieved

| # | Source | Snapshot | Used for |
| - | --- | --- | --- |
| 1 | Tumblr home page | [web.archive.org/web/20070804210551/http://www.tumblr.com/](https://web.archive.org/web/20070804210551/http://www.tumblr.com/) (4 Aug 2007) | the look of 2007 Tumblr: light page, Georgia headings |
| 2 | Tumblr FAQs | [web.archive.org/web/20070702062101/http://www.tumblr.com/faqs](https://web.archive.org/web/20070702062101/http://www.tumblr.com/faqs) (2 Jul 2007) | the words of the time (“tumblelog”) |
| 3 | Tumblr sign-up | [web.archive.org/web/20070713083232/http://www.tumblr.com/register](https://web.archive.org/web/20070713083232/http://www.tumblr.com/register) (13 Jul 2007) | a blog's address is *name*`.tumblr.com` |
| 4 | Tumblr API | [web.archive.org/web/20070811045305/http://www.tumblr.com/api](https://web.archive.org/web/20070811045305/http://www.tumblr.com/api) (11 Aug 2007) | the post types; a text post (“regular”) “Requires at least one: title, body” |
| 5 | Tumblr's blog control (iframe) | [web.archive.org/web/20070811044905/…/publisher/iframe](https://web.archive.org/web/20070811044905/http://www.tumblr.com/publisher/iframe?src=http%3A%2F%2Fwww.tumblr.com%2F) (11 Aug 2007) | the control at a blog's top right (empty for a signed-out visitor, as archived) |
| 6 | Tumblr's demo blog, default theme | [web.archive.org/web/20070820090651/http://demo.tumblr.com/](https://web.archive.org/web/20070820090651/http://demo.tumblr.com/) (20 Aug 2007) | her blog: the theme's CSS, its colour settings, the day block, “Powered by Tumblr” |
| 7 | Davidville's blog (Tumblr's makers) | [web.archive.org/web/20070613134440/http://blog.davidville.com/](https://web.archive.org/web/20070613134440/http://blog.davidville.com/) (13 Jun 2007) | screenshots of the April 2007 dashboard, the March 2007 “Add a Link” form, the bookmarklet, the ReBlog / Dashboard control |
| 8 | Microsoft, “Simplicity in Design – Windows Media Player 11” | [web.archive.org/web/20070102121416/…/player/11/design.aspx](https://web.archive.org/web/20070102121416/http://www.microsoft.com/windows/windowsmedia/player/11/design.aspx) (2 Jan 2007) | the WMP11 transport and status area, back / forward, the tabs |
| 9 | Microsoft, Windows Media Player 11 home | [web.archive.org/web/20070713041336/…/player/11/default.aspx](https://web.archive.org/web/20070713041336/http://www.microsoft.com/windows/windowsmedia/player/11/default.aspx?wt_svl=10074XPHa1&mg_id=10074XPHb1) (13 Jul 2007) | the player in Microsoft's own screenshots |
| 10 | PageRewind, tumblr.com history | [pagerewind.com/tumblr](https://www.pagerewind.com/tumblr) | a cross-check of the 2007 home page |
| 11 | Website History Viewer | [websitehistoryviewer.com/timeline/tumblr.com](https://www.websitehistoryviewer.com/timeline/tumblr.com) | a cross-check of the timeline (no detail taken from it) |

Not available:

- **Wikimedia Commons** answered every request with HTTP 429 (“too many
  requests”), so nothing from it was seen or used.
- **The logged-in Tumblr text-post form of 2007** was never archived: the
  Wayback Machine only holds redirects for `tumblr.com/new/text` (a page that
  needed a login). Everything on it below is therefore a reconstruction.
- **The XP start-up screens** (loading bar, “welcome”) were not looked up in
  an archive. A web search did not establish the typeface of the “welcome”.

## Slide 2: Tumblr, item by item

| What is on screen | Status | Basis |
| --- | --- | --- |
| Dashboard frame: dark navy page, white panel, tabs `Dashboard` (active) `Feeds` `Settings` `Goodies` | Documented | the April 2007 dashboard (7); colours taken from the screenshot |
| Top right: her blog address, `Log out`, `Help`, each followed by `«` | Documented | (7): the blog address, Log out and Help, with `«` |
| `tumblr.` wordmark | Documented (the word) | set in a plain bold face: **not** the logo, no flower mark |
| `Add a new...` and the six buttons `Text` `Photo` `Quote` `Link` `Chat` `Video` | Documented | (7); the button pictures are original drawings, not Tumblr's |
| Side column: her picture, her name, `Change my photo` | Documented (the pattern) | (7) shows picture, name and “Change my photo”; its “Invite your friends” and Followers boxes are left out |
| Her dashboard has no posts | Reconstruction | nobody else appears in the carousel, so nobody's posts are shown |
| The text-post form: `Add a Text Post`, `Title (optional)`, `Post`, `Bold` `Italic` `Link`, `Create post`, `Cancel` | **Reconstruction** | by analogy with the archived “Add a Link” form (heading “Add a Link”, “Name (optional)”, “Create post”, “Cancel”) and the bookmarklet (Bold / Italic / Link buttons, “Create Photo”, “Cancel”), both in (7) |
| A post with a title and no body | Documented as valid | the API (4) |
| After `Create post`, her blog | Reconstruction | where the 2007 form went after posting is not archived |
| Her blog: the layout, the title in Arial Black, the rule, the RSS badge's place and size, the day block `THU` + `AUG` / `23RD`, the post title (18 px bold), `Powered by Tumblr` | Documented | the default theme (6): its CSS and markup (`date_brick`, upper-cased) |
| Her blog's pink | Documented mechanism | the theme lets the owner choose its Title, Post Title, Date, Date Block and Date Block Text colours (6); the pink is hers, as on her Messenger |
| The RSS badge | Documented place and size | drawn in code; Tumblr's image is not used |
| The `Dashboard` control at the blog's top right | Documented control, reconstructed content | (5), (7) show the dark ReBlog / Dashboard control; that its owner sees just `Dashboard` is a reconstruction |
| Fonts | Stand-ins | Arial Black → Archivo Black; the pages ask for Lucida Grande / Helvetica, which her XP PC did not have, so Arial (Arimo); Georgia → Gelasio |
| Page widths | Fitted | the archived pages are about 800 px wide; the browser window here is 452 px, so columns are narrower; type sizes are kept |

## Slide 1: the opening

| What is on screen | Status | Basis |
| --- | --- | --- |
| Today's lock screen: the clock `11:47`, `Wednesday, October 28`, wi-fi and battery | Reconstruction, generic | no product, logo or wallpaper of any vendor: an abstract gradient |
| The glitch, then the picture collapsing to a line and a dot | Stylised | how a CRT monitor looked when it switched off |
| Old Windows starting: the loading bar on black (three blue blocks in a rounded track) | Reconstruction from memory | Microsoft's logo and wordmark, which sat above it, are left out |
| The “welcome” screen: blue field, dark-blue bands with a pale and an orange rule, `welcome` in white italic | Reconstruction from memory | typeface unknown here, so Fira Sans bold italic stands in; no logo, no start-up sound |
| Sounds (screen on, glitch, crash, degauss) | Original | synthesised in `scripts/make-sfx.mjs` |

## Slide 3: Windows Media Player 11

| What is on screen | Status | Basis |
| --- | --- | --- |
| The transport: plain shuffle, repeat and stop, then previous and next in one capsule around the big round Play, then the volume | Documented | Microsoft's design page (8), corrected in this version |
| The status area: a thumbnail, the title and the time on one line | Documented | (8) |
| Tabs `Now Playing` `Library` `Rip` `Burn` `Sync` with their arrows | Documented | (8), (9); the online-store tab of the time (URGE) is left out |
| Library ▸ Songs, the Now Playing bars and list pane, the black glass frame | Reconstruction | in WMP11's look, not traced from a screenshot |
| The Start menu, Internet Explorer 6, Windows XP Luna | Reconstruction | as in the film (see the README) |
