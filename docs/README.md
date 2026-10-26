# Sandeep ♥ Priyanka · Wedding site

Reception: Wed 27 Jan 2027, 6 PM · Wedding: Thu 28 Jan 2027, morning
Shelter Beach Resorts, East Coast Road, Mahabalipuram

A plain HTML/CSS/JS site. There's no build step and no outside libraries; only Google Fonts loads from the web.

## What's inside

| Feature | Where |
| --- | --- |
| Scratch-card invitation with loot tiers (common → legendary) | `#invite` |
| Live countdown, event cards, maps and calendar links, timeline | hero, `#events` |
| Daily Mystery Box with streaks and badges | `#box` |
| Love Stock Market: play-money prediction market with live prices | `#market` |
| He Said, She Said: guess the couple's secret answers | `#hss` |
| Voice blessings, time-capsule wishes, the couple's sealed letters | `#bless` |
| The Vault: sealed counter, pressure meter, weekly leak | `#vault` |
| Wrapped-style reveal show with a personal shareable card | `#reveal` |
| Couple portal: secret answers, letters, results desk | `#couple` (passcode in `config.js`) |
| XP levels, 13 badges, player bar, live ticker, synthesized sounds, haptics | throughout |

## Editing content

Everything lives in `assets/js/config.js`: names, dates, muhurtham time, questions, prediction markets, box rewards and scratch-card perks.

- When the muhurtham time is fixed, update `dates.wedding` and set `weddingTimeAnnounced: true`. The games lock at that moment.
- Change `couplePasscode` before sharing the site.

## Preview mode vs. live

`demoMode: true` fills the site with a **sample crowd**: simulated trades, guesses and ticker activity, all labelled "sample". It also enables the "Rehearse the reveal show" button.

At the moment, all data is saved **in each visitor's own browser**. Before going live with guests, connect a shared backend so that:

1. guesses, trades, wishes, voice notes and RSVPs from every guest are stored in one place,
2. results stay truly sealed. The database itself refuses to return answers before 29 Jan, so nobody can peek with browser tools,
3. the couple portal uses real logins instead of a passcode.

Firebase (Firestore + Storage) is the recommended option. Its security rules support time locks such as `request.time > timestamp.date(2027, 1, 29)`. Every read and write already goes through `W.store` in `assets/js/store.js`, so swapping the storage adapter only touches that file. When the backend is live, set `demoMode: false`.

## Running locally

Open `index.html` in a browser, or run `npx serve docs`.

## Hosting

GitHub Pages: Settings → Pages → Branch: `main`, folder `/docs`. A custom domain such as `sandeepwedspriyanka.com` can be added there too.
