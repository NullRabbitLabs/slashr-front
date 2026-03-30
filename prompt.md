# Task: Mobile polish pass

The site looks good on desktop but needs work on mobile (< 768px). This is a styling-only pass — no layout restructuring, no new components. Just making what exists work properly on small screens.

## Fix 1: Tab navigation wrapping

The tab bar (LIVE FEED, VALIDATORS, LEADERBOARD, REPORTS) wraps on mobile because "LIVE FEED" is two words. Fix:

- Reduce tab font-size to `11px` on mobile (from whatever it is now)
- Reduce gap/spacing between tabs so all four fit on one line
- If it still wraps, use `white-space: nowrap` on each tab label and `overflow-x: auto` on the tab container with `-webkit-overflow-scrolling: touch` — let it scroll horizontally rather than wrap. Hide the scrollbar with `scrollbar-width: none` / `::-webkit-scrollbar { display: none }`.
- The active tab underline must still work correctly

## Fix 2: Collapse the top section on mobile

The network summary cards (ATOM/ETH/SOL/SUI 2×2 grid) + the "new to this?" intro + subtitle take up too much vertical space before content. On mobile:

- Make the network summary cards a single horizontal scrolling row instead of a 2×2 grid. Each card should be compact: just the network name + count on one line, not stacked. Something like a horizontal pill strip: `● ATOM 2 · ● ETH 3 · ● SOL 11 · ● SUI 0` — or keep them as small cards in a horizontal scroll with `overflow-x: auto` and `flex-shrink: 0` on each card.
- Reduce the "new to this?" heading to `font-size: 16px` (from ~20px)
- Reduce the subtitle ("Your staking rewards...") to `font-size: 13px`
- Reduce vertical margin/padding between these elements — tighten the whole header area so content is visible without scrolling

## Fix 3: Feed item layout on mobile

The feed items are too wide for mobile. Fix:

- The metadata line (stake, commission, IP, website) should wrap naturally — add `flex-wrap: wrap` if it's a flex row, or just let it be a normal block that wraps
- The validator name + event title line: if the name is long (e.g. "Hedgehog Spiky Validator") and the title is long ("Went dark. Missed votes."), they wrap mid-phrase. Put the event title on its own line below the validator name on mobile. The name stays bold/prominent, the title sits below it in the dimmer colour. Use a media query to switch from inline to stacked layout.
- The timestamp row (date + network badge + status + relative time): make sure "relative time" (e.g. "18m ago") doesn't get pushed off screen. Use `flex-shrink: 0` on the relative time span and let the middle content compress.

## Fix 4: Chain filter pills

The network filter pills (SOL, ETH, ATOM, SUI, DOT) are tight on mobile. Fix:

- Reduce pill font-size to `11px` on mobile
- Reduce horizontal padding inside pills
- If they still overflow, wrap to a second line — `flex-wrap: wrap` with a small `gap`
- Do NOT horizontally scroll the pills — they're filter controls and hiding some behind a scroll is bad UX

## Fix 5: Leaderboard table on mobile

The leaderboard is mostly fine but:

- Hide the `#` rank column on mobile — the position is already implied by ordering
- Make sure validator names truncate with ellipsis rather than wrapping to two lines (e.g. "Hedgehog Spiky Validator" wrapping). Use `overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 140px` on the validator name cell on mobile.

## Fix 6: Search input width

The "address or name..." search input should be `width: 100%` on mobile. It looks like it might already be, but verify it's not overflowing or getting horizontal margin that makes it too narrow.

## General mobile rules

All changes should be inside a `@media (max-width: 768px)` media query (or whatever breakpoint the codebase already uses — check first and use the existing one).

Don't change any desktop styles. Everything should look identical on desktop after this pass.

## Constraints

- Styling only — no new components, no layout restructuring
- Use the existing breakpoint if one exists in the codebase
- Don't change colours, fonts, or the dark theme
- Don't change any functionality or data display
- Test on both feed and leaderboard tabs at minimum
- Run `npm run build` after
