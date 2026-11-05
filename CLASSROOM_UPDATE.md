# Upper Story simulator: classroom controls update

This package updates the existing marblepower13/upperstory-turing-tumble repository.
It is an update package, not a complete standalone checkout.

## Solid lower slopes and tighter center block - November 5, 2026

- Corrected the lower white slopes' collision filtering so they support marbles
  in both release states. A marble landing on either slope rolls inward toward
  the exposed receiving lever, then actuates the mechanism and exits below.
- Widened the fixed center block at the resting lever tips. Each resting gap is
  about 1.23 model units; the full-depression exit has about 23.21 units of
  clearance for a 20-unit marble. The wider cap tapers below the receiving area.
- The block uses two convex collision pieces matching its visible profile.
  The visible white slope and its collision surface remain aligned and fixed.
- After an actual lever impact, the rigid lever completes its downward stroke
  and stays open until the passing marble clears. It then returns and reloads
  its linked top releaser. Pause freezes this motion. One marble still triggers
  at most one linked release.
- Schematic routing follows the wider cap and retains its chosen approach side
  while clearing the shoulder, preventing a marble from oscillating there.
- Verified 144 direct slope landings, both marble collision states and colors,
  four landing locations, three entry velocities and slow/normal/fast speeds.
  Checks require slope contact before actuation, inward rolling and collection.
- Ramp components and their counterweight/speed parameters were not changed.
  README.md, LICENSE, branding and classroom controls are retained.

Extract and upload the contents of upperstory-turing-tumble-update to matching
folders in the existing repository. This ZIP is an update, not a full repository.
Keep master's /docs publishing source. No remote files were changed for you.

See PHYSICS_TEST_RESULTS.md for current checks and live-review steps.

## Prior release notes

## Rigid lever, continuous slope and reset corrections - November 5, 2026

- Reset all reconnects the NEW supply objects even when board coordinates and
  dimensions are unchanged. Repeated resets retain the long rails, seated
  marbles and circular releasers; the original holding cups remain hidden.
- A lower lever stays one rigid object. Its inner receiving end rotates downward
  about the white hinge; the counterweight rises slightly but remains below the
  white board slope throughout the full stroke. A detected marble impact starts
  one complete stroke/return. Pausing freezes the mechanism mid-stroke.
- The final runs of lower white slopes are drawn as uninterrupted slender rails
  ending at the widened black receiving heels. There are no overlay boxes or
  added visible wedges. The short black nose covers the remaining receiving
  area beside a tapered fixed center block; the opening admits a marble when
  the lever depresses. The fixed rail geometry does not move with the lever.
- Invisible outer guards remain in the collision model to retain stray marbles.
  The receiving end travels downward by more than one marble diameter. Sampled
  counterweight-to-visible-slope clearance stays at least 6.06 model units.
- Hovering over either circular upper releaser or anywhere on a visible lower
  lever displays 'Press to Start'. Clicking the visible lower lever, including
  its counterweight end, starts its actual rigid stroke. The popup disappears
  when leaving the control or pressing it. Add marbles retains priority when
  adding a marble to a supply cup.
- Upper Story remains at lower left with its product link centered below it;
  it is 33% smaller than the preceding release (201 px desktop instead of 300).
  The Turing Tumble logo is another 1.5x larger (228 px maximum height instead
  of 152). Responsive variants are included.
- Ramp traversal/counterweight rules are unchanged. Source and compiled hosting
  files are included. The update does not overwrite README.md or LICENSE.

### Uploading

Extract the ZIP and upload the CONTENTS of upperstory-turing-tumble-update into
matching folders in the existing repository. Do not add that enclosing folder as
another nested directory. Continue publishing master's /docs folder. The package
is an update, not a complete standalone repository. Nothing was pushed or
published on your behalf.

See PHYSICS_TEST_RESULTS.md for the current verification and live-review steps.

## Previous release history

## Linked cupped releasers and revised levers - November 5, 2026

- The blue and red circular releasers now have visible cupped cutouts, each
  initially holding one marble. The blue disk turns clockwise and the red disk
  counterclockwise as the corresponding lower lever tips, then returns with it.
  The next supply marble enters the cup only after the mechanism returns.
- A real lower lever contact and depression starts one release. Holding a lever
  down cannot repeatedly release marbles. A busy top releaser ignores additional
  clicks until its stroke and reload finish. Manual top clicks remain available
  for starting the machine and work without any lower levers.
- The linkage is virtual; no connecting rods are drawn. Its two ends update in
  the same simulation step. Manual cycles, schematic lever pulses and stock/feed
  travel use simulation steps, so Pause freezes the complete mechanism.
- Lower levers now hinge at the white peg in the central mounting hole, rather
  than near the counterweight cap. The blue/red counterweight ends move with the
  lever. Shaped receiving cups and wider heels meet short flush continuations of
  the white lower board ramps. The center divider stays fixed, with no feet
  extending into the exits. Full depression leaves about 32.83 units to the
  divider and 31.98 to the lower funnel for a 20-unit marble.
- White outer catch tabs are invisible; their collision guards remain active to
  retain stray marbles. The advanced release-lever tool icon matches the new
  hinge/profile. The guided forty-marble output register retains its entry order.
- The Turing Tumble logo is twice its previous size. Upper Story remains at the
  lower left, three times its previous size, with the product link centered below.
  Header, board, tools and branding have separate layout space. Responsive
  breakpoints retain the enlarged proportions where space permits.
- Crossover hover text no longer mentions F. Other previously approved tooltip
  exclusions remain. Instructions, support email and Play/Pause remain available.
- Add marbles still adds to either supply, including when clicking an existing
  marble in its cup; select another tool to operate that black releaser manually.
- Playable ramp traversal/counterweight behavior has not been tuned. Ramp source,
  shared component vertices and physics constants are unchanged. PartBody edits
  are confined to the lower release levers. The new top mechanism changes supply
  delivery timing, not the speed through a playable ramp.

### Uploading this update

Extract the ZIP and upload the CONTENTS of upperstory-turing-tumble-update into
existing repository folders, replacing files at matching paths. Do not upload
that enclosing folder as an additional nested directory. Publish from master's
/docs folder as before. This ZIP is an update, not a complete new repository.
README.md, LICENSE and existing dependency notices are not overwritten.

The included PHYSICS_TEST_RESULTS.md describes automated checks and the remaining
live-browser review. Source and compiled hosting files match; no publishing was
performed on your behalf.

## Earlier changes (historical)

## Single-file output register and page title

- Added the approved longer output track with a guided inlet and space for 40
  full-size marbles in one bottom row. Read the first marble at the right-hand
  stop, then toward the left. The existing board and marble size are retained.
- Marbles use the existing physics until clearing the levers and reaching the
  visible funnel. They then follow the track in immutable entry order, with
  full-diameter spacing on straight sections and through the rounded turn.
  Free-body collisions are disabled for collected marbles, preventing climbing,
  overtaking, bouncing, and rearrangement of a puzzle's completed output.
- Collection never triggers a release. Returning/resetting clears the output
  queue; Return marbles preserves placed components and their current states.
- The register is derived from the standard paired locked levers. Existing saved
  standard boards acquire it without a serializer change; legacy lower fences
  remain in board data but are superseded in rendering and physical routing.
- Added a centered top heading: Turing Tumble Simulator. The canvas starts below
  the title. Removed the bottom-right classroom-edition/developer-credit block.
  Existing attribution and contact information remain in Help.
- Verified alternating, paired, grouped and mixed 40-marble patterns in both
  physical and schematic modes at every nonzero playback speed. See the report.

## Outer-end containment fix

- Added a small raised black rim at each lever's outer end. The rim is part of
  the moving lever, with matching visible and rigid-body geometry on both sides.
- An outward-rolling marble is caught and guided back along the upper face rather
  than falling off beyond the collection ramps. The rim itself does not trigger
  another release; actual lever depression remains required.
- Retained the center post, inner exit clearance, limited travel, and contact-only
  release logic.
- Strengthened the empty-board regression: every released marble must finish in
  the collection area at rest, in addition to having actuated a lever. The earlier
  check could miss an escape occurring after successful actuation.

## Brief-impact lever collision fix

- Fixed a reproduced failure where a short strike near the outer section of
  either lever passed without depression or a subsequent release.
- Matter.js reports first-touch contacts in collisionStart separately from
  continuing contacts in collisionActive. The lever handler now processes both.
- Previously the return spring could reset a lever on that first contact because
  the handler had not counted it. It now retains and handles the actual strike.
- This does not add proximity-triggered releases. Depression and actual contact
  are still required, and each marble can automatically advance only once.
- Limited lever travel to keep the inner exit clear of the lower collection ramps.
  A small incline assist on the blade's upper face moves resting marbles toward
  the lowered tip, consistent with the existing ramp-assist approach. It does not
  act on underside contacts or release marbles by proximity.
- Other components retain their previous contact-processing behavior.

## Fixed center block and lever clearance

- A fixed white center post separates the bottom levers. Its peaked top directs
  center approaches toward a lever; no feet extend into the exit paths.
- Drawing, rigid-body collision, and schematic routing share the same post outline.
  Older standard-board saves acquire the post without a file-format change.
- The blade tips terminate beside the post. Each lever swings down through 0.28
  radians (about 16 degrees). At full depression, the closest blade/post separation
  is 22.52 simulation units, compared with a marble diameter of 20 units.
- Automatic advancement requires actual marble/blade contact and measurable
  depression. Divider contact, proximity, falling, interception, and collection
  cannot themselves release another marble.
- Each marble can automatically advance the machine only once, even if it touches
  both blades. Return marbles rebuilds the supplies and cancels lever motion silently.
- Slow playback now schedules the same fixed physics steps used at normal speed,
  avoiding changes to gravity/contact behavior that could leave a marble on a ramp.
- See PHYSICS_TEST_RESULTS.md for the tested cases, method, and remaining limits.

## Approved lever and wording revision

- The bottom release mechanisms now use two mirrored, slender black lever arms,
  with blue/red caps and an outer pivot. Each tips down through a limited angle
  and returns to rest; it does not spin through a quarter-turn.
- The actual collision geometry is a single blade rather than the old rotor.
  Both full-length arms remain active in the physics engine, including off-center
  contacts. Each marble can automatically trigger only one lever per run.
- Physical mode releases only on actual marble/blade contact with lever depression;
  schematic mode uses a blade intersection and a single tipping/release event.
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
   package-lock.json, CLASSROOM_UPDATE.md, and PHYSICS_TEST_RESULTS.md. Do not drag the enclosing update folder
   or the ZIP itself. Preserve the folder names so docs/index.html replaces docs/index.html.
5. Review the file paths. Enter a commit message such as "Update physical board design and controls"
   and commit directly to master.
6. GitHub Pages should publish the changes using your existing master /docs settings.
   After deployment completes, open the simulator and hard-refresh if it still shows
   the previous controls (Ctrl+Shift+R on Windows).

No hosting settings need to change. Nothing has been pushed or published by this package.
GitHub commit history can restore the previous version if needed.

## Earlier verification and limits (see current test report)

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
