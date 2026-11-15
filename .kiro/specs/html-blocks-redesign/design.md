# Design Document

## Overview

HTML Blocks is a redesign of the existing single-file tool at `/home/nicolas/repos/html-bricks/index.html`. It stays a buildless static file served over HTTP, with all third-party libraries loaded from a CDN. The interface becomes a three-pane editor: a **Blocks palette** (left), an **HTML editor** (centre, CodeMirror 5), and a **Result preview** (right, iframe).

The central invariant from the current tool is preserved: **the HTML text is the single source of truth.** Dragging blocks and typing both mutate the same HTML string; the preview re-renders from that string; and a warning appears whenever a round-trip parse is lossy. The redesign adds CodeMirror editing, a grouped collapsible palette, click-to-select, app-level undo/redo, IndexedDB auto-save, a compressed share link, file export, and a popout window — all mirroring the chrome and conventions of the sibling tools `pyblocks` and `pywatch` (dark `#menubar` banner, footer, Examples dropdown from `examples.js`, Share dialog, Iconify/Lucide icons, CodeMirror 5).

This design covers **Phase 1 only**: TODO sections 1–4 plus palette groups a, b, c, e, f, g, h, i. **TODO 5.d — the CSS Style blocks hierarchy (`style`, `selector`, and the TEXT / DISPLAY / SPACING / BACKGROUND / BORDER property sub-groups) is explicitly out of scope** and deferred to Phase 2. No `style` block is added to the palette, and `style` attributes are deliberately dropped from block output (Req 9.4).

## Architecture

### High-level layout

```
+--------------------------------------------------------------+
| #menubar   HTML BLOCKS  <lucide:code-xml>   Code to the web  |
+--------------------------------------------------------------+
| header: [Examples v] [Share] [Export]        [status pill]   |
+------------------+----------------------+--------------------+
| BLOCKS  ? ↶ ↷    | HTML            ?     | RESULT  <favicon>  |
|                  |                      |   <title>   ? ⧉    |
| [group icons]    | [ CodeMirror 5 ]     | [ iframe srcdoc ]  |
| (expand on click)|                      |                    |
+------------------+----------------------+--------------------+
| footer: © Nicolas Beney, CC BY-NC-SA 4.0                      |
+--------------------------------------------------------------+
```

### Data-flow model

The HTML source string `S` flows through one pipeline. Everything is driven by two commit points that already exist in the tool — `fromText()` (text changed) and `edit()` (a block changed) — extended to also write CodeMirror, persistence, and the undo stack.

```
 user types ──► cm.on('change') ──► fromText(S) ─┐
 drag/attr  ──► edit(fn) ──► S = ser(model) ─────┤
                                                 ▼
                             parse(S) → {model, issues}
                                                 │
                    ┌────────────────────────────┼───────────────────────────┐
                    ▼                             ▼                            ▼
            renderBlocks(model)            updateBanner(issues)        updatePreview(S)
            (palette/canvas)               (lossy warning)             iframe.srcdoc = S
                                                 │                      popout.write(S)
                                                 ▼
                                   pushHistory(S)  +  debounced save(S) → IndexedDB
```

Key rule, unchanged from today: **the model is derived, the text is authoritative.** A block edit rewrites `S` from the model via `ser()`; a text edit re-derives the model via `parse()`. When they disagree (lossy parse), the text wins and the user is warned before any block edit overwrites it.

### Dependencies (all CDN, no build)

| Purpose | Library | Notes |
|---|---|---|
| Editor | CodeMirror 5.65.x (`codemirror.min.js` + `codemirror.min.css`) | replaces `<textarea>` |
| Editor modes | `mode/xml`, `mode/htmlmixed` | HTML highlighting (Req 12.4) |
| Editor addon | `addon/comment/comment` | `Ctrl-/` toggle (Req 12.5) |
| Drag/drop | Sortable.js 1.15.x | reused from current tool |
| Icons | `iconify-icon@2.1.0` + inlined Lucide collection | banner + controls (Req 1.3) |
| Examples | local `examples.js` → `window.HTMLB_EXAMPLES` | (Req 3.2) |

`CompressionStream` / `DecompressionStream` and `indexedDB` are browser built-ins (no CDN).

## Single-file section breakdown

`index.html` is organised into the following labelled sections (same philosophy as the current file). If the file grows unwieldy, block definitions (GROUPS, HUE/NAME/FIELDS and `make()`) may be moved to a sibling `blocks.js` loaded before the main script — this is **optional** (Req 1.4, TODO 2.13) and not required for Phase 1.

1. **`<head>` / CSS** — pane grid, `#menubar`, `footer`, palette-group styles, CodeMirror sizing, help `#tip`, Share `dialog`.
2. **Chrome markup** — `#menubar`, `header` (Examples / Share / Export + status pill), three `.pane`s, `footer`, Share `dialog`, shared `#tip` element.
3. **Icon collection** — inlined `addCollection` for the Lucide icons used (`code-xml`, `share-2`, `download`, `rotate-ccw`, `rotate-cw`, `external-link`, `chevron-right`, `help-circle`, `copy`).
4. **Data tables** — `VOID`, `GROUPS`, derived `HUE` / `NAME` / `FIELDS` / `TAG2GROUP` lookups.
5. **Parser / serializer** — `parse()` and `ser()` (preserved, with `style` removed from `FIELDS`).
6. **Sync core** — `fromText()`, `edit()`, `updatePreview()`, `updateBanner()`, plus the CodeMirror bridge `setSource()/getSource()`.
7. **Palette** — `buildPalette()` renders collapsible groups; `renderBrick()`/`renderBlocks()` for the canvas; `canPut()` containment rules.
8. **Interactions** — click-to-select, undo/redo stack, Examples menu, Share, Export, Popout, help tips.
9. **Persistence + boot** — IndexedDB `Auto_Save_Store`, load-precedence resolver, default template, startup.

## Components and Interfaces

### Editor bridge (CodeMirror 5)

The `<textarea id="text">` is replaced by a CodeMirror instance. HTML text remains the source of truth; CodeMirror is only a view over `S`.

```js
const cm = CodeMirror($('ed'), {
  value: '', mode: 'htmlmixed', lineNumbers: true, indentUnit: 2, tabSize: 2,
  extraKeys: { Tab:'indentMore', 'Shift-Tab':'indentLess',
               'Ctrl-/':'toggleComment', 'Cmd-/':'toggleComment' }
});
const getSource = () => cm.getValue();
function setSource(t){                 // programmatic writes must not loop
  if (cm.getValue() === t) return;
  const c = cm.getCursor(), s = cm.getScrollInfo();
  cm.operation(() => cm.setValue(t));
  cm.setCursor(c); cm.scrollTo(s.left, s.top);
}
cm.on('change', (_, ch) => { if (ch.origin === 'setValue') return; fromText(); });
```

`fromText()` reads `getSource()` instead of `$('text').value`; `edit()` writes via `setSource(ser(model))` instead of assigning `.value`. Preview is debounced (120 ms, unchanged).

### Palette: GROUPS data model

The flat `PALETTE` array is replaced by an ordered `GROUPS` table. Each group owns a colour (an HSL hue), a Lucide icon, a human name (tooltip only — never shown as a block label), and an ordered list of members. Each member names its tag and a short description (item tooltip).

```js
// Shape
// Group  = { key, name, hue, icon, members: Member[] }
// Member = { tag, desc, attr? }   // attr marks the script-with-src variant
const GROUPS = [
  { key:'a', name:'Page',      hue:215, icon:'lucide:file-code', members:[
      {tag:'doctype', desc:'Declares an HTML5 page'},
      {tag:'html',    desc:'The whole page'},
      {tag:'head',    desc:'Hidden page settings'},
      {tag:'title',   desc:'Name shown in the browser tab'},
      {tag:'meta',    desc:'Page setting (charset, viewport…)'},
      {tag:'body',    desc:'Everything you can see'} ]},
  { key:'b', name:'Structure', hue:195, icon:'lucide:layout-template', members:[
      {tag:'div'},{tag:'header'},{tag:'footer'},{tag:'section'},
      {tag:'article'},{tag:'br'},{tag:'hr'} ].map(withDesc)},
  { key:'c', name:'Text',      hue:210, icon:'lucide:type', members:[
      'h1','h2','h3','h4','h5','h6','p','span','a','strong','em' ].map(tag=>({tag}))},
  { key:'e', name:'Media',     hue:160, icon:'lucide:image', members:[
      {tag:'video'},{tag:'audio'},{tag:'img'} ]},
  { key:'f', name:'Forms',     hue:25,  icon:'lucide:square-mouse-pointer', members:[
      {tag:'form'},{tag:'input'},{tag:'button'},{tag:'label'},{tag:'select'},{tag:'option'} ]},
  { key:'g', name:'Tables',    hue:300, icon:'lucide:table', members:[
      {tag:'table'},{tag:'tr'},{tag:'th'},{tag:'td'} ]},
  { key:'h', name:'Lists',     hue:40,  icon:'lucide:list', members:[
      {tag:'ul'},{tag:'ol'},{tag:'li'} ]},
  { key:'i', name:'Script',    hue:275, icon:'lucide:braces', members:[
      {tag:'script', attr:'src', desc:'Load JavaScript from a file'},
      {tag:'script',             desc:'Inline JavaScript'} ]},
];
// Derived once at load:
//   HUE[tag]       = group.hue
//   NAME[tag]      = group.name         // used only for aria/debug, not display
//   TAG2GROUP[tag] = group.key
//   DESC[tag]      = member.desc || default
```

Note: group `d` is intentionally absent — it is reserved for the deferred Phase 2 CSS Style group (TODO 5.d).

**Collapsed vs expanded.** The palette shows only a vertical strip of group icons (Req 8.3). Clicking a group icon expands it in place to list its member blocks (Req 8.5); clicking again collapses it. Group hover shows the group name (Req 8.6); member hover shows the block description (Req 8.7). Colour comes entirely from the group: each group element and every member block set `--h: <group.hue>` so one CSS variable drives the shared colour (Req 8.4, 14.9).

### Block appearance

- **No descriptive labels.** Blocks render their tag as HTML (`<h1>`), never friendly words like "Heading" (Req 8.8, 9.2). The old `NAME` label is no longer rendered in palette or canvas.
- **Attributes shown inside the start tag.** A block carrying attributes renders them within its opening tag text, e.g. `<a href="…">`, rather than as separate labelled fields floating outside the tag (Req 9.3). Editable attribute inputs sit inside the rendered start-tag row.
- **No `style` field.** The `S = [['style', …]]` entry and all `...S` spreads are removed from `FIELDS`; `ser()` therefore never emits a `style` attribute (Req 9.4).
- **No close button.** The per-block `✕` button is removed; deletion is via the trash drop-zone / dragging out (Req 9.5).
- **Six-dot handle.** Text blocks use a `⠿` six-dot drag handle in place of the `✎` pencil (Req 9.6).
- **Locked blocks are draggable.** `doctype`, `html`, `head`, `body` are now draggable (Req 9.1). The `.locked` visual style may stay, but `draggable:'.brick'` includes them and `handle` is applied to their head.

### canPut containment rules (updated)

Making structural blocks draggable must not let the user build an invalid tree. `canPut(zoneEl, el)` is widened for the structural tags while keeping containment valid:

```js
function canPut(zoneEl, el){
  const z = zoneEl.dataset.z, t = el.dataset.tag;
  if (z === 'trash')  return true;
  if (t === 'doctype')return z === 'root';                 // top level only
  if (t === 'html')   return z === 'root';
  if (t === 'head' || t === 'body') return z === 'html';   // only inside <html>
  if (t === 'title' || t === 'meta') return z === 'head';  // head-only content
  if (z === 'head')   return t === 'title' || t === 'meta';
  return true;                                             // normal flow content
}
```

The ultimate guarantee that drag/drop never corrupts the document is the round-trip check in §Correctness (Property 1): after any committed drag, `S = ser(model)` is re-parsed and the preview reflects exactly what the text says; a lossy result raises the warning rather than silently losing content.

### Click-to-select

Clicking a placed block re-serialises **just that node** and locates its first occurrence in the source, then selects it in CodeMirror (Req 10.1–10.3). This is best-effort: identical sibling blocks are ambiguous and the first textual match is chosen.

```js
function selectInEditor(node){
  const needle = ser([node]).trim();         // serialise the single clicked node
  const src = getSource();
  const idx = src.indexOf(needle);
  if (idx < 0) return;                        // no match → leave selection unchanged
  cm.setSelection(cm.posFromIndex(idx), cm.posFromIndex(idx + needle.length));
  cm.scrollIntoView(cm.getCursor('from'));
}
```

Attach on block click (distinct from drag, which Sortable handles via the handle). Because serialised output is normalised (same indentation rules as the editor view), the needle matches the canonical text; hand-edited whitespace variations may miss, which is acceptable under the "best-effort / first match" contract.

### Undo / redo — app-level snapshot stack

Requirement 11 asks for a **single unified history of HTML source snapshots** spanning both text edits and block operations. CodeMirror has its own per-keystroke history, which would fight a unified model and would not capture block drags at all. The approach: an **app-level snapshot stack of full `S` strings**, driven by commit points, with CodeMirror's own history intercepted so `Ctrl-Z/Ctrl-Y` map to the app stack.

```js
const hist = { stack: [], i: -1, lock: false };
function pushHistory(S){
  if (hist.lock) return;
  if (hist.stack[hist.i] === S) return;        // no-op commits don't stack
  hist.stack.length = hist.i + 1;              // drop any redo tail
  hist.stack.push(S); hist.i++;
  if (hist.stack.length > 200) { hist.stack.shift(); hist.i--; }   // cap
  refreshUndoButtons();
}
function restore(S){                           // apply a snapshot without re-stacking
  hist.lock = true;
  setSource(S); fromText();                    // re-derives model, preview, banner
  hist.lock = false; refreshUndoButtons();
}
const undo = () => { if (hist.i > 0)                    restore(hist.stack[--hist.i]); };
const redo = () => { if (hist.i < hist.stack.length-1)  restore(hist.stack[++hist.i]); };
```

Wiring:
- `pushHistory(S)` is called at the end of `fromText()` (debounced so a burst of typing coalesces) and at the end of `edit()` (immediately, so each block operation is one undo step).
- CodeMirror is created with `undoDepth: 0` (or its `Ctrl-Z/Ctrl-Y` extraKeys are overridden) so the editor does not run its own undo; the app stack is the single history (Req 11.1).
- Header buttons `↶`/`↷` and the keystrokes `Ctrl-Z` / `Ctrl-Y` call `undo()` / `redo()` (Req 11.2–11.4). During `restore()`, `hist.lock` prevents the resulting `fromText()` from pushing the snapshot back onto the stack.

### Persistence — IndexedDB `Auto_Save_Store`

A single IndexedDB database with one object store holds the latest HTML under one fixed key.

```js
const DB='htmlblocks', STORE='Auto_Save_Store', KEY='current';
function openDB(){ return new Promise((res,rej)=>{
  const r = indexedDB.open(DB,1);
  r.onupgradeneeded = () => r.result.createObjectStore(STORE);
  r.onsuccess = () => res(r.result);
  r.onerror   = () => rej(r.error);
});}
async function saveSource(S){ try{ const db=await openDB();
  await tx(db,'readwrite',s=>s.put(S,KEY)); }catch(e){/* best-effort */} }
async function loadSaved(){ try{ const db=await openDB();
  return await tx(db,'readonly',s=>s.get(KEY)); }catch(e){ return null; } }
```

Saving is debounced on every source change (Req 6.1) and overwrites the single key so the store always holds the latest (Req 6.4). On startup, saved content is restored only when no share hash is present (Req 6.2), and corrupt/unusable content falls back to the default template while the tool keeps running (Req 6.3).

### Share — compressed URL hash

Mirrors pyblocks: compress the source with `deflate-raw` and put it in `location.hash`; decompress on load. The current tool uses hex; this design uses **base64url** for a shorter link, as specified in the technical context.

```js
const pipe = async (data, stream) =>
  new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(stream)).arrayBuffer());
const b64url   = u => btoa(String.fromCharCode(...u)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const unb64url = s => Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')), c=>c.charCodeAt(0));

async function encodeShare(S){
  const u = await pipe(new TextEncoder().encode(S), new CompressionStream('deflate-raw'));
  return b64url(u);
}
async function decodeShare(hash){
  const u = await pipe(unb64url(hash), new DecompressionStream('deflate-raw'));
  return new TextDecoder().decode(u);
}
```

The Share button builds `location.href.split('#')[0] + '#' + await encodeShare(getSource())` and opens the Copy/Close dialog (Req 4.1, 4.2). On load, a present hash is decoded and used as the source (Req 4.3) in preference to the IndexedDB store (Req 4.4).

### Export

```js
function exportFile(){
  const blob = new Blob([getSource()], {type:'text/html'});
  const a = h('a', {href:URL.createObjectURL(blob), download:'page.html'});
  document.body.append(a); a.click(); a.remove();
  URL.revokeObjectURL(a.href);
}
```

Downloads the current source verbatim as a single self-contained `.html` file (Req 5.1, 5.2).

### Popout + Result header

The old `#open` button is removed (Req 13.5). A Popout control (`lucide:external-link`) in the RESULT header opens a new tab and writes the current source into it, kept live on each `updatePreview()` exactly as the current `popup` variable already does (Req 13.3). The RESULT header also shows the page's favicon and `<title>`, parsed from the current source (Req 13.4):

```js
function previewMeta(S){
  const doc = new DOMParser().parseFromString(S, 'text/html');
  const title = (doc.querySelector('title')?.textContent || '').trim();
  const icon  = doc.querySelector('link[rel~="icon" i]')?.getAttribute('href') || '';
  return { title, icon };
}
```

Parsing with `DOMParser` here is read-only and used only for header chrome; it does not replace the authoritative `parse()`/`ser()` pipeline.

### Load precedence resolver (boot)

```
on load:
  hash = location.hash.slice(1)
  if hash non-empty and decodeShare(hash) succeeds:   S ← decoded        // Req 4.3/4.4
  else:
     saved = await loadSaved()
     if saved is a usable string:                     S ← saved          // Req 6.2
     else:                                            S ← DEFAULT_HTML   // Req 6.3
  setSource(S); fromText(); pushHistory(S)
```

"Usable" means a string that `parse()` handles without throwing; any exception or non-string falls back to the default (Req 6.3). The default template is the current tool's starter page.

## Data Models

**Source (`S`)** — the HTML string; single source of truth.

**Model node** (unchanged from current tool):
```
DoctypeNode = { type:'doctype' }
TextNode    = { type:'text', text:string }
ElementNode = { type:'el', tag:string, attrs:{n:string,v:string}[], children:Node[] }
```

**Issues** — `string[]` of human-readable reasons the text can't be shown as blocks; non-empty ⇒ lossy ⇒ warning.

**History** — `{ stack:S[], i:number }`, a linear snapshot stack with a redo tail.

**Persisted value** — a single HTML string at key `current` in `Auto_Save_Store`.

**Share hash** — base64url(`deflate-raw`(UTF-8(`S`))).

## Error Handling

| Situation | Handling |
|---|---|
| Lossy parse (issues non-empty) | Show `Lossy_Parse_Warning`; block edits confirm-then-rewrite, losing unrepresented text (Req 7.4, preserved) |
| Sortable.js fails to load | Fall back to click-to-add; show a hint (preserved behaviour) |
| `CompressionStream` unavailable | Share alerts "needs a newer browser"; tool still works |
| Corrupt/garbage share hash | `decodeShare` throws → ignored → fall through to IndexedDB/default |
| Corrupt IndexedDB value / DB error | `loadSaved` returns null or value fails `parse()` → load default, keep running (Req 6.3) |
| Popup blocked | Alert the user to allow pop-ups (preserved) |
| Click-select with no match | Leave editor selection unchanged (Req 10.3) |

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — a formal statement about what the system should do. Properties bridge human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Parse/serialise round-trip is stable

For any HTML source `S`, if `parse(S)` reports no issues, then serialising and re-parsing is stable: `parse(ser(parse(S).model)).model` is structurally equal to `parse(S).model`, and a second serialisation is textually identical to the first (`ser` is idempotent on its own output). This is the core two-way-sync guarantee behind block drags inserting correct HTML.

**Validates: Requirements 7.2, 15.2**

### Property 2: Lossy warning is shown exactly when the round-trip is unfaithful

For any HTML source `S`, the `Lossy_Parse_Warning` is displayed if and only if `parse(S)` returns a non-empty `issues` list (equivalently, re-serialising would not reproduce equivalent HTML).

**Validates: Requirements 7.4, 15.3**

### Property 3: Share link round-trips

For any HTML source `S`, `decodeShare(encodeShare(S))` equals `S`.

**Validates: Requirements 4.2, 4.3**

### Property 4: Load precedence

For any combination of (share hash present/absent, decodable/not) and (stored value present/absent, usable/not), the resolved startup source is: the decoded hash when a decodable hash is present; otherwise the stored value when it is a usable string; otherwise the default template. The stored value is never chosen while a decodable hash is present.

**Validates: Requirements 4.4, 6.2**

### Property 5: Corrupt persistence never breaks startup

For any byte sequence read from `Auto_Save_Store` (including non-strings, truncated, or un-parseable content) and with no share hash present, startup completes without throwing and yields a usable editable document (the stored value if it parses, otherwise the default template).

**Validates: Requirements 6.3**

### Property 6: No style attribute is ever emitted by blocks

For any model, the output of `ser(model)` contains no `style=` attribute.

**Validates: Requirements 9.4**

### Property 7: A block's attributes appear inside its start tag

For any element block with a non-empty set of displayed attributes, the rendered start-tag text of that block contains each attribute's name, and its serialisation emits exactly the non-empty attributes within the opening tag.

**Validates: Requirements 9.3**

### Property 8: Click-to-select finds the first match or changes nothing

For any placed node `n` and current source `S`: if `ser([n]).trim()` occurs in `S`, the editor selection is set to the range of its first occurrence; if it does not occur, the editor selection is unchanged.

**Validates: Requirements 10.1, 10.2, 10.3**

### Property 9: Undo/redo snapshot stack

For any sequence of committed source snapshots pushed to the history, performing one `undo` after a commit restores the immediately preceding snapshot, and an `undo` immediately followed by a `redo` (with no intervening commit) restores the current snapshot. A new commit after an `undo` discards the redo tail.

**Validates: Requirements 11.1, 11.3, 11.4**

### Property 10: Group colour is shared across a group and its members

For any group in `GROUPS` and any member of that group, the colour (hue) applied to the member block equals the colour applied to the group. Equivalently, `HUE[member.tag] === group.hue` for every member.

**Validates: Requirements 8.4, 14.9**

### Property 11: Palette group membership matches the Phase-1 specification

The `GROUPS` table contains exactly the Phase-1 groups Page, Structure, Text, Media, Forms, Tables, Lists, and Script, and each group's member tags are exactly those enumerated in Requirement 14 (with the Script group providing both a `src`-bearing and an inline `script` block). No `style`/`selector` CSS block appears.

**Validates: Requirements 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8**

### Property 12: Result header reflects the page's favicon and title

For any HTML source `S` containing a `<title>` and/or a favicon `<link rel="icon">`, the RESULT header displays that title text and that favicon href; when absent, the header shows the empty/placeholder state without error.

**Validates: Requirements 13.4**

## Testing Strategy

This is a buildless static tool with no existing test harness, so testing is pragmatic and layered. Logic that is pure and input-varying (parse/serialise, share codec, load-precedence, history stack, click-select, group-data invariants) is where automated checks pay off; the rest is verified by manual smoke checks.

### Automated / lightweight assertions

The pure functions are written so they can be exercised without the DOM. A small self-check can run either from a dev-only `?test` query flag or by pasting the functions into a scratch runner:

- **Property-based** (where a generator is cheap — fast-check via CDN in a throwaway `test.html`, min. 100 iterations each): Properties 1, 2, 3, 6, 7, 8, 9.
  - Generators: random well-formed models (compose from `GROUPS` tags) → serialise to get `S` for round-trip and lossy tests; random HTML-ish strings including comments, unknown tags, and stray close tags to exercise the lossy flag; random strings for the share codec.
  - Each test tagged **Feature: html-blocks-redesign, Property N: <text>**.
- **Example/invariant assertions** (plain `console.assert`): Properties 4, 5, 10, 11, 12 — small fixed input tables (presence matrix for load precedence; a corrupt-value list for startup; the `GROUPS` table itself for colour/membership; a few `S` samples for header meta).

### Manual smoke checks (per requirement area)

- **Chrome** (Req 1–2): serve over `python -m http.server`, confirm banner `lucide:code-xml`, footer text/link, icons render, no console errors.
- **Examples** (Req 3): dropdown is hierarchical from `examples.js`; selecting an entry replaces the source and preview updates.
- **Share** (Req 4): Share → copy link → open in a fresh tab → identical page; hash beats a different saved doc.
- **Export** (Req 5): downloaded `.html` opens standalone and matches the editor.
- **Auto-save** (Req 6): type, reload (no hash) → work restored; manually corrupt the store → default loads, tool usable.
- **Sync** (Req 7, 15): drag a block → text updates and preview re-renders; paste a comment/unknown tag → warning appears; editing a block then warns before overwriting.
- **Palette/blocks** (Req 8, 9, 14): collapsed shows icons only; click expands; group/member tooltips; no friendly labels; attributes inside start tags; no `style` output; no close button; six-dot handle on text; drag `html/head/body/doctype` and confirm containment stays valid.
- **Click-select** (Req 10): click a placed block → its code highlights; click a block whose text was hand-edited → selection unchanged.
- **Undo/redo** (Req 11): interleave typing and drags; `Ctrl-Z`/`Ctrl-Y` and header buttons step through the unified history.
- **Editor** (Req 12): highlighting present; `Ctrl-/`, `Tab`, `Shift-Tab` behave.
- **Result** (Req 13): live preview; Popout opens and stays live; favicon + title shown in header; old "open in new tab" button gone.

### Out of scope for testing

TODO 5.d CSS Style blocks (group `d`) are not implemented in Phase 1 and have no tests here.
