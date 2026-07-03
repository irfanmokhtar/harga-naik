# Mobile-friendly layout — design

Date: 2026-07-04

## Goal

Make Harga Naik comfortable on phones (~390px) with targeted responsive fixes. No layout rework; terminal aesthetic and desktop appearance unchanged.

## Audit findings (390px)

1. Inputs use 13–14px font → iOS auto-zooms on focus (<16px threshold).
2. Home search `autoFocus` pops the keyboard on every mobile visit.
3. Item price table and basket ranking hide the district/state column on mobile (`hidden sm:inline`) — location info lost where it matters most.
4. Touch targets ~30px tall (header buttons, share buttons); 44px recommended.
5. Header cramped: four elements in one row at 390px.
6. Item table date column takes fixed width on narrow screens.

## Changes

### Inputs (iOS zoom)
- Home search: `text-[16px] sm:text-[14px]`.
- Basket search and both `<select>`s: `text-[16px] sm:text-[13px]`.

### Home search focus
- Remove `autoFocus` attribute. Add mount effect that focuses the input only when `matchMedia("(pointer: fine)")` matches — desktop keeps type-to-search, phones don't get a surprise keyboard.

### Two-line table rows (mobile only)
- Item price table (`ItemClient.tsx`): below `sm`, each row shows premise name on line 1 and `district, state · date` as small dim second line. The standalone location (`hidden sm:inline`) and date columns hide below `sm`; desktop layout unchanged.
- Basket ranking (`BasketClient.tsx`): same treatment — location moves to second line below `sm` (ranking rows have no date column).

### Touch targets
- Header lang + theme buttons: `py-1.5 sm:py-0.5`.
- Share buttons and add-to-basket button: `py-2.5 sm:py-1.5`.
- Table row links (home boards, search results): `py-2.5 sm:py-2`.

### Header spacing
- Row gap `gap-2 sm:gap-4`; nav gap `gap-3 sm:gap-4`.
- "Bakul Saya" nav label: use short i18n label variant below `sm` (`hidden sm:inline` for the "Saya"/full part).

## Out of scope

- Bottom navigation, sticky filters, any structural rework.
- Share card canvas.

## Testing

- Build, run production server, drive at ~390px viewport: home (search focus behavior, board rows), item page (two-line rows, selects, share buttons), basket (ranking rows).
- Both themes spot-checked.
- Desktop viewport regression check: columns/one-line rows unchanged.
