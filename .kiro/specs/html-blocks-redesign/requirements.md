# Requirements Document

## Introduction

This feature redesigns the existing single-file HTML authoring tool at `/home/nicolas/repos/html-bricks/index.html` into a three-pane, kid-friendly block editor branded "HTML Blocks". The three panes are a Blocks palette, an HTML text editor, and a live Result preview. The HTML text is the single source of truth: dragging blocks and editing text both mutate the same HTML, the Result preview re-renders from that HTML, and a warning appears when a round-trip parse is lossy. The redesign mirrors conventions from the sibling tools at `/home/nicolas/repos/pyblocks/` and `/home/nicolas/repos/pywatch/` (banner, footer, Examples dropdown, Share button).

This plan covers Phase 1 only: TODO sections 1-4 plus the palette block hierarchy for groups a (Page), b (Structure), c (Text), e (Media), f (Forms), g (Tables), h (Lists), and i (Script). Phase 2 (TODO 5.d CSS Style blocks hierarchy) is explicitly out of scope and deferred as a follow-up.

The tool must continue to run with no build chain as a static file served over HTTP, and must not lose a child's work.

## Out of Scope (Deferred to Phase 2)

- TODO 5.d: the CSS Style blocks hierarchy (`style`, `selector`, and the TEXT / DISPLAY / SPACING / BACKGROUND / BORDER CSS property sub-groups). These blocks are not added to the palette in Phase 1 and are a deferred follow-up.

## Glossary

- **HTML_Blocks**: The redesigned single-file tool, formerly branded "HTML Bricks", displayed to the user under the name "HTML Blocks". The project folder remains `html-bricks`.
- **Blocks_Palette**: The left pane that presents draggable HTML blocks organised into collapsible colour-coded groups.
- **HTML_Editor**: The centre pane, a CodeMirror 5 text editor holding the HTML source text.
- **Result_Preview**: The right pane that renders the current HTML source as live output.
- **HTML_Source**: The HTML text held by the HTML_Editor; the single source of truth for the Blocks_Palette output and the Result_Preview.
- **Block**: A single draggable palette element representing one HTML construct (for example `div`, `h1`, `img`, `script`).
- **Group**: A labelled, colour-coded collection of related Blocks in the Blocks_Palette (for example Page, Structure, Text).
- **Banner**: The top menubar banner bearing the `lucide:code-xml` icon, matching pyblocks and pywatch.
- **Footer**: The bottom footer region, matching pyblocks and pywatch.
- **Examples_Menu**: The hierarchical Examples dropdown whose entries are defined in a separate `examples.js` file.
- **Share_Hash**: A compressed representation of the current HTML_Source encoded into the URL hash fragment.
- **Auto_Save_Store**: The IndexedDB-backed persistent store that holds the current HTML_Source.
- **Lossy_Parse_Warning**: The warning shown when parsing and re-serialising the HTML_Source does not round-trip faithfully.

## Requirements

### Requirement 1: Static single-file tool with no build chain

**User Story:** As a maintainer, I want the tool to remain a buildless static file, so that it can be served and deployed without tooling.

#### Acceptance Criteria

1. THE HTML_Blocks SHALL operate as a static file served over HTTP without a build step.
2. THE HTML_Blocks SHALL load all third-party dependencies, including the HTML_Editor library and icon libraries, from a CDN.
3. THE HTML_Blocks SHALL render all icons using Lucide and Iconify icon sources.
4. WHERE the `index.html` file becomes difficult to maintain in a single file, THE HTML_Blocks SHALL permit block definitions to be moved into a separate `blocks.js` file loaded by `index.html`.

### Requirement 2: Branding, banner, and footer

**User Story:** As a user, I want consistent branding and chrome, so that the tool matches its sibling tools and is recognisable.

#### Acceptance Criteria

1. THE HTML_Blocks SHALL display the product name "HTML Blocks" in the user interface.
2. THE HTML_Blocks SHALL retain the project folder name `html-bricks`.
3. THE HTML_Blocks SHALL display a Banner containing the `lucide:code-xml` icon, consistent with the pyblocks and pywatch tools.
4. THE HTML_Blocks SHALL display a Footer consistent with the pyblocks and pywatch tools.

### Requirement 3: Examples menu

**User Story:** As a learner, I want ready-made examples, so that I can start from a working page.

#### Acceptance Criteria

1. THE HTML_Blocks SHALL display an Examples_Menu as a dropdown control.
2. THE HTML_Blocks SHALL define the Examples_Menu entries in a separate `examples.js` file.
3. THE Examples_Menu SHALL present entries in a hierarchical structure, consistent with the pyblocks and pywatch tools.
4. WHEN a user selects an entry from the Examples_Menu, THE HTML_Blocks SHALL replace the HTML_Source with the selected example content.

### Requirement 4: Share via compressed URL hash

**User Story:** As a user, I want to share my work by link, so that others can open exactly what I made.

#### Acceptance Criteria

1. THE HTML_Blocks SHALL display a Share button.
2. WHEN a user activates the Share button, THE HTML_Blocks SHALL encode the current HTML_Source as a compressed Share_Hash in the URL.
3. WHEN the HTML_Blocks loads with a Share_Hash present in the URL, THE HTML_Blocks SHALL set the HTML_Source from the decoded Share_Hash.
4. WHEN the HTML_Blocks loads with a Share_Hash present in the URL, THE HTML_Blocks SHALL use the Share_Hash content in preference to any content held in the Auto_Save_Store.

### Requirement 5: Export to a self-contained HTML file

**User Story:** As a user, I want to download my page, so that I can keep or use the file elsewhere.

#### Acceptance Criteria

1. THE HTML_Blocks SHALL display an Export button.
2. WHEN a user activates the Export button, THE HTML_Blocks SHALL download the current HTML_Source as a single self-contained `.html` file.

### Requirement 6: Auto-save and restore

**User Story:** As a child using the tool, I want my work kept automatically, so that I do not lose it when I refresh or close the tab.

#### Acceptance Criteria

1. WHEN the HTML_Source changes through typing or block editing, THE HTML_Blocks SHALL persist the current HTML_Source to the Auto_Save_Store.
2. WHEN the HTML_Blocks loads without a Share_Hash present in the URL, THE HTML_Blocks SHALL restore the HTML_Source from the Auto_Save_Store.
3. IF the content read from the Auto_Save_Store is corrupt or cannot be parsed, THEN THE HTML_Blocks SHALL load default content and continue operating.
4. WHEN the HTML_Source changes after a restore, THE HTML_Blocks SHALL overwrite the restored content in the Auto_Save_Store with the current HTML_Source.

### Requirement 7: HTML source as single source of truth with two-way sync

**User Story:** As a user, I want blocks and text to stay in sync, so that there is one consistent document.

#### Acceptance Criteria

1. THE HTML_Blocks SHALL treat the HTML_Source as the single source of truth for the Result_Preview and for block operations.
2. WHEN a user drags a Block into the document, THE HTML_Blocks SHALL insert the corresponding HTML into the HTML_Source.
3. WHEN the HTML_Source changes, THE HTML_Blocks SHALL re-render the Result_Preview from the current HTML_Source.
4. IF parsing and re-serialising the HTML_Source does not reproduce equivalent HTML, THEN THE HTML_Blocks SHALL display the Lossy_Parse_Warning.

### Requirement 8: Blocks palette structure and interaction

**User Story:** As a learner, I want a compact, organised palette, so that I can find and use blocks without clutter.

#### Acceptance Criteria

1. THE Blocks_Palette SHALL display the header label "BLOCKS".
2. THE Blocks_Palette SHALL display a help control that, WHEN activated, shows a help popup describing the Blocks_Palette.
3. THE Blocks_Palette SHALL present Groups as a narrow hierarchy showing only a group icon per Group in the collapsed state.
4. THE Blocks_Palette SHALL assign each Group a distinct colour and apply that colour to the Group and all of the Group's member Blocks.
5. WHEN a user clicks a Group icon, THE Blocks_Palette SHALL expand the Group to show the Group's member Blocks.
6. WHEN a user hovers over a Group icon, THE Blocks_Palette SHALL display a tooltip showing the Group name.
7. WHEN a user hovers over a member Block, THE Blocks_Palette SHALL display a tooltip showing a brief description of that Block.
8. THE Blocks_Palette SHALL omit non-HTML descriptive labels such as "Page", "Heading", and "Paragraph" from the palette display.

### Requirement 9: Block appearance and dragging

**User Story:** As a learner, I want every block to look like real HTML and be draggable, so that I can build any page.

#### Acceptance Criteria

1. THE HTML_Blocks SHALL make every Block draggable, including `doctype`, `html`, `head`, and `body`.
2. THE HTML_Blocks SHALL omit non-HTML descriptive labels such as "Page", "Heading", and "Paragraph" from each Block's rendered content.
3. WHERE a Block carries an attribute, THE HTML_Blocks SHALL display that attribute inside the start tag of the Block.
4. THE HTML_Blocks SHALL omit `style` attributes from the HTML produced by Blocks.
5. THE HTML_Blocks SHALL omit a per-Block close button from each Block.
6. THE HTML_Blocks SHALL display a six-dot drag handle on text Blocks in place of the pencil icon.

### Requirement 10: Click a block to select its code

**User Story:** As a user, I want clicking a placed block to highlight its code, so that I can locate it in the editor.

#### Acceptance Criteria

1. WHEN a user clicks a placed Block, THE HTML_Blocks SHALL re-serialise the clicked Block and search the HTML_Source for the first matching text.
2. WHEN a match is found during a Block click, THE HTML_Blocks SHALL select the matching text in the HTML_Editor.
3. IF no matching text is found during a Block click, THEN THE HTML_Blocks SHALL leave the HTML_Editor selection unchanged.

### Requirement 11: Undo and redo

**User Story:** As a user, I want to undo and redo changes, so that I can recover from mistakes.

#### Acceptance Criteria

1. THE HTML_Blocks SHALL maintain a single unified history of HTML_Source snapshots covering both text edits and block operations.
2. THE Blocks_Palette SHALL display an undo control and a redo control in the pane header.
3. WHEN a user activates undo through the undo control or the Ctrl-Z keystroke, THE HTML_Blocks SHALL restore the previous HTML_Source snapshot.
4. WHEN a user activates redo through the redo control or the Ctrl-Y keystroke, THE HTML_Blocks SHALL restore the next HTML_Source snapshot.

### Requirement 12: HTML editor pane

**User Story:** As a user, I want a capable code editor, so that I can read and edit HTML comfortably.

#### Acceptance Criteria

1. THE HTML_Editor SHALL display the header label "HTML".
2. THE HTML_Editor SHALL display a help control that, WHEN activated, shows a help popup describing the HTML_Editor.
3. THE HTML_Editor SHALL use CodeMirror 5 loaded via CDN as the editing component.
4. THE HTML_Editor SHALL apply HTML syntax highlighting using the CodeMirror 5 `htmlmixed` and `xml` modes.
5. WHEN a user presses Ctrl-/, THE HTML_Editor SHALL toggle comment markers on the current selection or line.
6. WHEN a user presses Tab, THE HTML_Editor SHALL indent the current selection or line.
7. WHEN a user presses Shift-Tab, THE HTML_Editor SHALL dedent the current selection or line.

### Requirement 13: Result preview pane

**User Story:** As a user, I want a live preview with context, so that I can see my page and open it full-size.

#### Acceptance Criteria

1. THE Result_Preview SHALL display the header label "RESULT".
2. THE Result_Preview SHALL display a help control that, WHEN activated, shows a help popup describing the Result_Preview.
3. THE Result_Preview SHALL display a Popout control that, WHEN activated, opens the current HTML_Source as a rendered page in a new browser tab.
4. THE Result_Preview SHALL display the rendered page's favicon and title in the pane header.
5. THE HTML_Blocks SHALL omit the former "Open page in new tab" button from the tool.

### Requirement 14: Palette block hierarchy (Phase 1 groups)

**User Story:** As a learner, I want blocks organised into familiar groups, so that I can find the right HTML element.

#### Acceptance Criteria

1. THE Blocks_Palette SHALL provide a Page Group containing the Blocks `doctype`, `html`, `head`, `title`, `meta`, and `body`.
2. THE Blocks_Palette SHALL provide a Structure Group containing the Blocks `div`, `header`, `footer`, `section`, `article`, `br`, and `hr`.
3. THE Blocks_Palette SHALL provide a Text Group containing the Blocks `h1`, `h2`, `h3`, `h4`, `h5`, `h6`, `p`, `span`, `a`, `strong`, and `em`.
4. THE Blocks_Palette SHALL provide a Media Group containing the Blocks `video`, `audio`, and `img`.
5. THE Blocks_Palette SHALL provide a Forms Group containing the Blocks `form`, `input`, `button`, `label`, `select`, and `option`.
6. THE Blocks_Palette SHALL provide a Tables Group containing the Blocks `table`, `tr`, `th`, and `td`.
7. THE Blocks_Palette SHALL provide a Lists Group containing the Blocks `ul`, `ol`, and `li`.
8. THE Blocks_Palette SHALL provide a Script Group containing a `script` Block with a `src` attribute and an inline `script` Block.
9. THE Blocks_Palette SHALL apply a single shared colour to each Group and all of that Group's member Blocks.

### Requirement 15: Kid-friendly and non-functional constraints

**User Story:** As an educator, I want the tool to be approachable and safe for children's work, so that young learners can use it confidently.

#### Acceptance Criteria

1. THE HTML_Blocks SHALL present a kid-friendly interface consistent with the pyblocks and pywatch tools.
2. THE HTML_Blocks SHALL preserve the existing two-way synchronisation behaviour between the Blocks_Palette, HTML_Editor, and Result_Preview.
3. THE HTML_Blocks SHALL preserve the existing Lossy_Parse_Warning behaviour.
