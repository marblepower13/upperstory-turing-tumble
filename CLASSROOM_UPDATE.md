# Upper Story simulator: classroom controls update

This package updates the existing marblepower13/upperstory-turing-tumble repository.
It is an update package, not a complete standalone checkout.

## Approved lever and wording revision

- The bottom release mechanisms now use two mirrored, slender black lever arms,
  with blue/red caps and an outer pivot. Each tips down through a limited angle
  and returns to rest; it does not spin through a quarter-turn.
- The actual collision geometry is a single blade rather than the old rotor.
  Both full-length arms remain active in the physics engine, including off-center
  contacts. Each marble can trigger a given lever only once.
- Physical mode releases on blade contact or crossing its receiving end;
  schematic mode uses a single tipping animation and release event.
- Returning marbles cancels lever movement without releasing another marble.
- The Interceptor tooltip no longer suggests flipping it.
- Add marbles no longer includes generic peg placement or flip instructions.
- Help ends with: Contact hello@upperstory.com with any questions.
- The Advanced release-lever tool uses a matching simple-lever icon.

## What changed

- Labeled building and playback controls, with hover/focus explanations.
- Select / Flip explains clicking to flip and dragging to move.
- Remove part uses an eraser icon and preserves pegs, blank locations, and fixed board pieces.
- Add marbles sits below Gear; click either supply to add one matching-color marble.
  The placement preview changes to match the supply, and the tool cannot add marbles
  elsewhere on the board or accidentally remove existing marbles.
- Reset defaults remain eight blue and eight red marbles, matching many book setups.
  Additional marbles can be added for larger machines.
- Rabbit for Faster, snail for Slower, and blue/red marbles without arrows for Return marbles.
- Fit board to screen centers and zooms the view; it does not change peg counts.
- Reset all asks for confirmation, then clears placed parts, restores the original standard
  board and marble supplies, selects the hand, and returns to physical view at normal speed.
- Advanced contains schematic view, optional board-edge resizing, extra building tools,
  and board-file save/open. Board-edge resizing is off by default.
- Help explains the controls; original developer credit is retained.
- Scroll-wheel zoom only applies over the board, leaving the side panels scrollable.
- On narrow screens the controls use icons; their labels remain available to assistive
  technology and through Help and hover/focus descriptions.

## Upload without installing developer tools

1. Extract this ZIP on your computer.
2. Open your repository on GitHub and select its Code tab (repository root).
3. Select Add file > Upload files.
4. Drag the contents of this update folder into the upload area: docs, src, makefile,
   package-lock.json, and CLASSROOM_UPDATE.md. Do not drag the enclosing update folder
   or the ZIP itself. Preserve the folder names so docs/index.html replaces docs/index.html.
5. Review the file paths. Enter a commit message such as "Add classroom simulator controls"
   and commit directly to master.
6. GitHub Pages should publish the changes using your existing master /docs settings.
   After deployment completes, open the simulator and hard-refresh if it still shows
   the previous controls (Ctrl+Shift+R on Windows).

No hosting settings need to change. Nothing has been pushed or published by this package.
GitHub commit history can restore the previous version if needed.

## Verification and limits

- TypeScript 2.7.2 compilation completed successfully.
- JavaScript syntax checks passed.
- Automated checks exercised the compiled eraser logic for placed parts, both peg types,
  fixed board pieces, blank cells, and out-of-board clicks.
- Compiled-code checks verified supply-only marble placement, repeated additions,
  preview colors, placed colors, and correct supply associations.
- DOM-level checks exercised control startup, part-tool mappings, selection state,
  speed changes, return marbles, fit, Advanced, schematic mode, reset confirmation,
  reset state, icon mappings, and hover descriptions.
- The compiled simulator was exercised using its actual Matter.js engine with
  rendering stubbed: left/right lever passes, eight-marble sequences on both sides,
  schematic passes, and return-without-release behavior passed. This verifies
  simulation behavior, but is not a visual browser test.
- Full visual and live canvas interaction tests could not run in the development
  environment because an installed browser was unavailable. After publishing, check
  the desktop layout, placing/flipping/removing parts, marble and gear operation,
  hover text, resetting, and any tablet/touch devices you intend to support.
- No loadable puzzles, shared rooms, or new simulation engine are included.
- Return marbles preserves current part states; it does not rewind bits or gear bits.
- The change retains the original simulator's mechanics and associated limitations.

## Future development

Changes to TypeScript source were compiled into docs/app.js. New interface assets live
in src/classroom-ui.js and src/classroom-ui.css and are copied into docs for hosting.
The source and published assets are both included in this update.
Use npm ci, then make app to compile/copy interface assets. Do not run make clean unless
prepared to regenerate all original artwork. The lockfile records the dependencies
used to compile this update; existing browser runtime libraries were retained.

Original simulator and artwork: Jesse Crossen, https://github.com/jessecrossen/ttsim
Retain the repository's LICENSE and third-party license notices.
