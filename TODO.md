# 1. General
1.1) Use Lucide & Iconify for all the icons
1.2) No build chain tools
1.3) Add banner, like pyblocks & pywatch, lucide:code-xml
1.4) Remove "Open page in new tab" button
1.5) Add footer, like pyblocks & pywatch
1.6) Add Examples dropdown list, examples in separate examples.js file, hierarchical, see pyblocks & pywatch
1.7) Rename HTML Bricks --> HTML Blocks
1.8) Add Share button, like pyblocks & pywatch
1.9) Add Export button
1.10) Auto-save & restore, use IndexDB to automatically persist current HTML code (to prevent kids from losing work when refreshing or closing tab)

# 2. Blocks pane
2.1) Replace BRICKS --> BLOCKS
2.2) Add (?) icon, popup on click, basic help
2.3) Make the palette narrower and hierarchical, show only group icons, each group has a different colour (same colour for all its members), clicking an icon shows the members, see #5 for hierarchy details
2.4) Make all the blocks draggable (currently blocks like doctype, html, head, body, etc are not)
2.5) In each block, stop displaying non HTML text like "Page", "Heading", "Paragraph", etc
2.6) In each block, display the attribute inside the start tag
2.7) Remove the style attributes (we want to promote best practice like CSS)
2.8) Remove close button from each block (to reduce visual clutter)
2.9) Ideally, clicking a block should select the corresponding code in the HTML pane
2.10) When hovering over a group icon, popup the group name
2.11) When hovering over an item (like h1, p, img, etc), popup a brief description 
2.12) In the palette, stop displaying non HTML text like "Page", "Heading", "Paragraph", etc
2.13) Use separate blocks.js file to define the blocks,etc if index.html is growing too large
2.14) For the text blocks, replace the pencil icon by the same 6-dit icon as the other blocks
2.15) Ideally, support Undo and Redo, with 2 icons in pane header, with Ctrl-Z and Ctrl-Y if possible

# 3. HTML pane
3.1) Replace TEXT (HTML) --> HTML
3.2) Add (?) icon, popup on click, basic help
3.3) Use CodeMirror6 with Emmett plugin
3.4) Support Ctrl-/ to comment or uncomment
3.5) Support Ctrl-Tab & Shift-Ctrl-Tab to indent or dedent
3.6) Use syntax highlighting

# 4. Result pane
4.1) Replace RESULT (LIVE) --> RESULT
4.2) Add (?) icon, popup on click, basic help
4.3) Add "Popout" button to header,behavse like old "Open page in new tab" button
4.4) Display favicon & title in header

# 5. Blocks hierarchy, each group, its sub-groups, and its blocks have the same colour
5.a) Page
- doctype
- html
- head
- title
- meta
- body
5.b) Structure
- div
- header
- footer
- section
- article
- br
- hr
5.c) Text
- h1-h6
- p
- span
- a
- strong
- em
5.d) Style
- style
- selector
- TEXT:
* text-color
* font-family
* font-size
* text-align
* text-transform
* text-decoration
-DISPLAY:
* display
* float
* overflow-*
* height
* width
- SPACING:
* margin-*
* margin
* padding-*
* padding
- BACKGROUND:
* background-color
* background-image
* background-repeat
* background-position
* background-size
* background-clip
- BORDER:
* border
* border-*
* border-radius
5.e) Media
- video
- audio
- img
5.f) Forms
- form
- input
- button
- label
- select
- option
5.g) Tables
- table
- tr
- th
- td
5.h) Lists
- ul
- ol
- li
5.i) Script
- script (src)
- script (inline)
