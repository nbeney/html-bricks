# Implementation Plan: HTML Blocks (Phase 1)

## Overview

This plan redesigns the existing buildless single-file tool `/home/nicolas/repos/html-bricks/index.html` into the three-pane "HTML Blocks" editor. All work modifies that existing static file (plus a new `examples.js`, and optionally `blocks.js` only if the file grows unwieldy). The implementation is JavaScript/HTML/CSS with CDN-only dependencies (CodeMirror 5, Sortable.js, Iconify/Lucide) and no build chain.

The existing `parse()` / `ser()` / `fromText()` / `edit()` two-way-sync pipeline and the lossy-parse warning behaviour are **preserved** and extended, never replaced. Tasks are ordered by dependency: the CodeMirror bridge and chrome come first, then the palette redesign, then interactions and persistence, finishing with wiring and lightweight tests.

**Out of scope (Phase 2):** TODO 5.d — the CSS Style blocks hierarchy (group `d`: `style`, `selector`, and the TEXT / DISPLAY / SPACING / BACKGROUND / BORDER sub-groups). No task below implements it.

## Tasks

- [x] 1. Editor bridge: replace the textarea with CodeMirror 5
  - [x] 1.1 Load CodeMirror 5 from CDN and mount the editor
    - Add `codemirror.min.css` + `codemirror.min.js`, `mode/xml`, `mode/htmlmixed`, and `addon/comment/comment` CDN tags to `<head>` / end of body
    - Replace `<textarea id="text">` markup with a CodeMirror mount point (`#ed`); add CSS to size the CodeMirror instance to fill the HTML pane
    - Construct the `cm` instance with `mode:'htmlmixed'`, `lineNumbers:true`, `indentUnit:2`, `tabSize:2` and `extraKeys` for `Tab`→`indentMore`, `Shift-Tab`→`indentLess`, `Ctrl-/` / `Cmd-/`→`toggleComment`
    - _Requirements: 1.1, 1.2, 12.3, 12.4, 12.5, 12.6, 12.7_

  - [x] 1.2 Add the `getSource()` / `setSource()` bridge and re-wire the sync core
    - Implement `getSource()` = `cm.getValue()` and `setSource(t)` that no-ops when unchanged and preserves cursor/scroll, writing via `cm.operation(() => cm.setValue(t))`
    - Change `fromText()` to read `getSource()` instead of `$('text').value`; change `edit()` to write via `setSource(ser(model))` instead of assigning `.value`
    - Wire `cm.on('change', ...)` to call `fromText()` while ignoring `setValue`-origin changes to avoid loops; keep the 120 ms preview debounce
    - _Requirements: 7.1, 7.2, 7.3, 12.3, 15.2_

  - [ ]* 1.3 Manual smoke check: editor behaviour
    - Serve over `python -m http.server`; confirm HTML highlighting, `Ctrl-/`, `Tab`, `Shift-Tab`, and that typing updates the preview with no console errors
    - _Requirements: 12.4, 12.5, 12.6, 12.7_

- [x] 2. Chrome: branding, banner, footer, icons, header controls, pane headers
  - [x] 2.1 Inline the Lucide icon collection and load Iconify
    - Add `iconify-icon@2.1.0` CDN tag and an inlined `addCollection` for the Lucide icons used: `code-xml`, `share-2`, `download`, `rotate-ccw`, `rotate-cw`, `external-link`, `chevron-right`, `help-circle`, `copy`, plus the group icons (`file-code`, `layout-template`, `type`, `image`, `square-mouse-pointer`, `table`, `list`, `braces`)
    - _Requirements: 1.2, 1.3_

  - [x] 2.2 Add the `#menubar` banner and footer
    - Add the dark `#menubar` banner showing "HTML BLOCKS", the `lucide:code-xml` icon, and the tagline, matching pyblocks/pywatch
    - Add the `footer` with the © Nicolas Beney / CC BY-NC-SA 4.0 text and link, matching pyblocks/pywatch
    - Add the CSS for the pane grid, `#menubar`, and `footer`
    - _Requirements: 2.1, 2.3, 2.4, 15.1_

  - [x] 2.3 Add the header row with status pill and control placeholders
    - Add the `header` containing Examples / Share / Export controls (wired in later tasks) and the lossy-status pill; keep `updateBanner()` driving the pill
    - _Requirements: 2.1, 7.4, 15.3_

  - [x] 2.4 Rename pane headers and add help tooltips
    - Set pane header labels to "BLOCKS", "HTML", and "RESULT"; add a shared `#tip` element and a `help-circle` help control per pane that shows a popup describing that pane
    - _Requirements: 8.1, 8.2, 12.1, 12.2, 13.1, 13.2_

  - [ ]* 2.5 Manual smoke check: chrome
    - Confirm banner icon, footer text/link, all icons render, pane labels and help popups work, no console errors
    - _Requirements: 1.3, 2.3, 2.4, 8.1, 8.2_

- [x] 3. Palette redesign: GROUPS data model and derived lookups
  - [x] 3.1 Replace the flat `PALETTE` with the ordered `GROUPS` table
    - Define `GROUPS` for Phase-1 groups a (Page), b (Structure), c (Text), e (Media), f (Forms), g (Tables), h (Lists), i (Script) with `{key, name, hue, icon, members}`; Script provides a `src`-bearing and an inline `script` member; do NOT add group `d`
    - Derive `HUE[tag]`, `NAME[tag]`, `TAG2GROUP[tag]`, and `DESC[tag]` once at load
    - _Requirements: 8.4, 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8, 14.9_

  - [ ]* 3.2 Write property test for group colour sharing
    - **Property 10: Group colour is shared across a group and its members** (`HUE[member.tag] === group.hue` for every member)
    - Tag: "Feature: html-blocks-redesign, Property 10: Group colour is shared across a group and its members"
    - **Validates: Requirements 8.4, 14.9**

  - [ ]* 3.3 Write assertion test for palette membership
    - **Property 11: Palette group membership matches the Phase-1 specification** — exactly Page/Structure/Text/Media/Forms/Tables/Lists/Script with the Req 14 member tags, no `style`/`selector` block (plain `console.assert` over the `GROUPS` table)
    - Tag: "Feature: html-blocks-redesign, Property 11: Palette group membership matches the Phase-1 specification"
    - **Validates: Requirements 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8**

- [x] 4. Palette redesign: collapsible colour-coded groups and block appearance
  - [x] 4.1 Build the collapsible group strip
    - Implement `buildPalette()` to render a narrow strip of group icons (collapsed); clicking a group icon expands it in place to list members and collapses on re-click
    - Drive colour from a single `--h: <group.hue>` CSS variable on each group element and member block; add group-name tooltips and per-member description tooltips
    - _Requirements: 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 14.9_

  - [x] 4.2 Update block rendering: tags only, attrs in start tag, no close button, six-dot handle
    - Update `renderBrick()` / `renderBlocks()` to render the tag as HTML (e.g. `<h1>`) with no friendly labels; render editable attributes inside the opening start-tag row; remove the per-block `✕` close button; replace the `✎` pencil with a `⠿` six-dot drag handle on text blocks
    - _Requirements: 8.8, 9.2, 9.3, 9.5, 9.6_

  - [x] 4.3 Remove the `style` field from the parser/serializer tables
    - Remove the `S = [['style', …]]` entry and all `...S` spreads from `FIELDS` so `ser()` never emits a `style` attribute; keep the rest of `parse()`/`ser()` intact
    - _Requirements: 9.4_

  - [ ]* 4.4 Write property test for no-style and attrs-in-start-tag
    - **Property 6: No style attribute is ever emitted by blocks** (`ser(model)` contains no `style=`)
    - **Property 7: A block's attributes appear inside its start tag** (rendered start-tag text contains each displayed attribute; serialisation emits exactly the non-empty attributes)
    - Tags: "Feature: html-blocks-redesign, Property 6: No style attribute is ever emitted by blocks" and "Feature: html-blocks-redesign, Property 7: A block's attributes appear inside its start tag"
    - **Validates: Requirements 9.3, 9.4**

  - [x] 4.5 Make locked blocks draggable and widen `canPut()`
    - Include `doctype`, `html`, `head`, `body` in Sortable's `draggable:'.brick'` and apply the drag handle to their head; keep the `.locked` visual style optional
    - Update `canPut(zoneEl, el)` to the containment rules: `doctype`/`html` at `root` only; `head`/`body` only inside `html`; `title`/`meta` only in `head`; trash always allowed; otherwise normal flow content
    - _Requirements: 9.1, 7.2, 15.2_

  - [ ]* 4.6 Manual smoke check: palette and blocks
    - Confirm collapsed shows icons only, click expands, tooltips show, no friendly labels, attributes inside start tags, no `style` output, no close button, six-dot handle on text, and dragging `html`/`head`/`body`/`doctype` keeps containment valid
    - _Requirements: 8.3, 8.5, 9.1, 9.3, 9.4, 9.5, 9.6_

- [x] 5. Checkpoint — editor, chrome, and palette
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Interactions: click-to-select
  - [x] 6.1 Implement `selectInEditor(node)` and attach to block clicks
    - Serialise just the clicked node via `ser([node]).trim()`, find its first occurrence in `getSource()`, and set the CodeMirror selection to that range (scroll into view); leave the selection unchanged when there is no match
    - Attach on block click, kept distinct from Sortable drags (which use the handle)
    - _Requirements: 10.1, 10.2, 10.3_

  - [ ]* 6.2 Write property test for click-to-select
    - **Property 8: Click-to-select finds the first match or changes nothing**
    - Tag: "Feature: html-blocks-redesign, Property 8: Click-to-select finds the first match or changes nothing"
    - **Validates: Requirements 10.1, 10.2, 10.3**

- [x] 7. Interactions: app-level undo/redo snapshot stack
  - [x] 7.1 Implement the history stack and wire it to commit points
    - Implement `hist`, `pushHistory(S)` (drop redo tail, dedupe no-ops, cap at 200), `restore(S)` (guarded by `hist.lock`), `undo()`, `redo()`, and `refreshUndoButtons()`
    - Disable CodeMirror's own history (`undoDepth:0` or overridden `Ctrl-Z`/`Ctrl-Y`); call `pushHistory` at the end of `fromText()` (debounced) and `edit()` (immediate)
    - Wire the `rotate-ccw` / `rotate-cw` header buttons and `Ctrl-Z` / `Ctrl-Y` to `undo()` / `redo()`
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [ ]* 7.2 Write property test for the undo/redo stack
    - **Property 9: Undo/redo snapshot stack** (undo restores the previous snapshot; undo-then-redo restores current; a new commit discards the redo tail)
    - Tag: "Feature: html-blocks-redesign, Property 9: Undo/redo snapshot stack"
    - **Validates: Requirements 11.1, 11.3, 11.4**

- [x] 8. Interactions: Examples menu from `examples.js`
  - [x] 8.1 Create `examples.js` with hierarchical entries
    - Create `examples.js` exposing `window.HTMLB_EXAMPLES` as a hierarchical structure (starter pages), mirroring pyblocks/pywatch; load it before the main script in `index.html`
    - _Requirements: 3.2, 3.3_

  - [x] 8.2 Build the Examples dropdown and selection handler
    - Render the Examples dropdown from `window.HTMLB_EXAMPLES`; on selection, replace the source via `setSource(...)` + `fromText()` and push a history snapshot
    - _Requirements: 3.1, 3.3, 3.4_

- [x] 9. Share, Export, and Popout
  - [x] 9.1 Implement the Share codec and dialog
    - Implement `pipe`, `b64url`/`unb64url`, `encodeShare(S)` (`deflate-raw` → base64url) and `decodeShare(hash)`; guard against missing `CompressionStream` with a newer-browser alert
    - Wire the Share button to build `location.href.split('#')[0] + '#' + await encodeShare(getSource())` and open a Copy/Close dialog
    - _Requirements: 4.1, 4.2_

  - [ ]* 9.2 Write property test for the share codec
    - **Property 3: Share link round-trips** (`decodeShare(encodeShare(S)) === S`)
    - Tag: "Feature: html-blocks-redesign, Property 3: Share link round-trips"
    - **Validates: Requirements 4.2, 4.3**

  - [x] 9.3 Implement Export
    - Implement `exportFile()` that downloads `getSource()` verbatim as a single `.html` blob; wire the Export button
    - _Requirements: 5.1, 5.2_

  - [x] 9.4 Implement Popout and the Result header favicon/title; remove the old open button
    - Add the `external-link` Popout control in the RESULT header that opens a new tab and keeps it live on each `updatePreview()` (reusing the existing `popup` variable)
    - Implement `previewMeta(S)` (read-only `DOMParser`) and render the parsed `<title>` and favicon href in the RESULT header, with a graceful empty/placeholder state
    - Remove the former "Open page in new tab" (`#open`) button
    - _Requirements: 13.3, 13.4, 13.5_

  - [ ]* 9.5 Write assertion test for the Result header meta
    - **Property 12: Result header reflects the page's favicon and title** (plain `console.assert` over a few `S` samples including the absent case)
    - Tag: "Feature: html-blocks-redesign, Property 12: Result header reflects the page's favicon and title"
    - **Validates: Requirements 13.4**

- [x] 10. Persistence and boot wiring
  - [x] 10.1 Implement IndexedDB auto-save
    - Implement `openDB()`, `tx()`, `saveSource(S)`, and `loadSaved()` against database `htmlblocks` / store `Auto_Save_Store` / key `current`; call a debounced `saveSource(getSource())` on every source change, overwriting the single key (best-effort, swallow errors)
    - _Requirements: 6.1, 6.4_

  - [x] 10.2 Implement the load-precedence resolver with corrupt guard and boot
    - On load: decode `location.hash` and use it when decodable; otherwise use the saved value only when it is a string that `parse()` handles without throwing; otherwise use `DEFAULT_HTML` (the current starter page). Finish boot with `setSource(S); fromText(); pushHistory(S)`
    - Ensure corrupt/garbage hash or store values never throw and the tool stays usable
    - _Requirements: 4.3, 4.4, 6.2, 6.3_

  - [ ]* 10.3 Write property/assertion tests for load precedence and corrupt persistence
    - **Property 4: Load precedence** (decodable hash wins; else usable stored string; else default; stored never chosen while a decodable hash is present)
    - **Property 5: Corrupt persistence never breaks startup** (any stored bytes with no hash → usable document, no throw)
    - Tags: "Feature: html-blocks-redesign, Property 4: Load precedence" and "Feature: html-blocks-redesign, Property 5: Corrupt persistence never breaks startup"
    - **Validates: Requirements 4.4, 6.2, 6.3**

- [x] 11. Final wiring and round-trip / lossy validation
  - [x] 11.1 Confirm the end-to-end sync pipeline is wired
    - Verify both commit points flow through `parse()`/`ser()`: `fromText()` → `parse` → `renderBlocks` + `updateBanner` + `updatePreview` + `pushHistory` + debounced save; `edit()` → `ser` → `setSource` → `fromText`. Keep the lossy-parse `Lossy_Parse_Warning` and confirm-before-overwrite behaviour intact
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 15.2, 15.3_

  - [ ]* 11.2 Write property tests for round-trip and lossy warning
    - **Property 1: Parse/serialise round-trip is stable** (`parse(ser(parse(S).model)).model` equals `parse(S).model`; `ser` idempotent on its own output)
    - **Property 2: Lossy warning shown iff round-trip is unfaithful** (warning displayed iff `parse(S).issues` non-empty)
    - Generators: random well-formed models composed from `GROUPS` tags, plus random HTML-ish strings with comments/unknown tags/stray close tags; fast-check via CDN in a throwaway `test.html`, min. 100 iterations each
    - Tags: "Feature: html-blocks-redesign, Property 1: Parse/serialise round-trip is stable" and "Feature: html-blocks-redesign, Property 2: Lossy warning is shown exactly when the round-trip is unfaithful"
    - **Validates: Requirements 7.2, 7.4, 15.2, 15.3**

  - [ ]* 11.3 Manual smoke check: full flows
    - Drag/type sync + lossy warning (Req 7, 15); Examples replace source (Req 3); Share link reopens identical page and beats a saved doc (Req 4); Export opens standalone (Req 5); reload restores and corrupt store falls back to default (Req 6); click-select highlights code (Req 10); interleaved undo/redo steps through unified history (Req 11); Popout stays live with favicon+title and no old open button (Req 13)
    - _Requirements: 3.4, 4.3, 5.2, 6.2, 6.3, 7.4, 10.2, 11.3, 13.3, 13.4_

- [x] 12. Final checkpoint — ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional (tests and manual smoke checks) and can be skipped for a faster MVP.
- Each task references specific requirements for traceability; property tests reference Properties 1–12 from the design document.
- All code changes target the existing `/home/nicolas/repos/html-bricks/index.html` (plus new `examples.js`, and `blocks.js` only if needed per Req 1.4 / TODO 2.13). The buildless, CDN-only, static-file nature is preserved.
- The existing `parse()`/`ser()`/`fromText()`/`edit()` two-way-sync and the lossy-parse warning are preserved and extended, never rewritten.
- Property-based tests use fast-check via CDN in a throwaway `test.html` (≥100 iterations); example/invariant checks use plain `console.assert`. Every property test is tagged "Feature: html-blocks-redesign, Property N: <text>".
- **TODO 5.d (CSS Style blocks, group `d`) is out of scope** and has no tasks or tests in this plan.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "3.1", "8.1"] },
    { "id": 1, "tasks": ["1.2", "2.2", "2.4", "3.2", "3.3", "4.3"] },
    { "id": 2, "tasks": ["1.3", "2.3", "2.5", "4.1", "4.2"] },
    { "id": 3, "tasks": ["4.4", "4.5", "6.1", "7.1", "8.2", "9.1", "9.3", "10.1"] },
    { "id": 4, "tasks": ["4.6", "6.2", "7.2", "9.2", "9.4", "10.2"] },
    { "id": 5, "tasks": ["9.5", "10.3", "11.1"] },
    { "id": 6, "tasks": ["11.2", "11.3"] }
  ]
}
```
