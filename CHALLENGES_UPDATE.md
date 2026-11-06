# First 30 book challenges - simulator update

This update adds the first 30 Turing Tumble book challenges to the supplied matched-slopes simulator. The board artwork, marble routing, ramp physics, levers, supply rails, and output-register mechanics are retained.

## Install on your existing GitHub repository

1. Extract this ZIP.
2. Open the folder named `upperstory-turing-tumble-update`.
3. Upload its CONTENTS to the root of your existing repository. Keep the `src`, `docs`, and `tests` folder structures. Do not upload the ZIP itself or create an extra enclosing folder in the repository.
4. Commit the files. Keep GitHub Pages publishing from the existing `master` / `docs` setting.
5. Wait for the Pages deployment to finish, then open the simulator and hard-refresh with Ctrl+Shift+R.

The compiled website is included in `docs/app.js`; no build tools are needed to install this update. Your existing README is not replaced. This ZIP updates an existing installation, rather than supplying a standalone copy of every unchanged asset.

## What students will see

- A Challenges button above the tools, with all 30 numbered book challenges.
- Selecting a challenge loads its starting components and marble supplies and opens its objective and instructions. Required-output marbles are shown where the book specifies a sequence. Read from the first marble on the right toward the left.
- Remaining part quantities appear beside the part buttons. Zero disables that part. Infinity means the book allows an unlimited number. Placing a part uses one; removing or replacing a student part returns it to the available stock. Moving a part does not consume an extra one.
- Faded starting components cannot be moved, replaced, or erased. Starting Bits and Gear Bits can still be flipped with Select / Flip and operate normally when hit by a marble.
- Only the book's prescribed manual start side works. Challenge 27 permits either side. Automatic releases through the bottom levers continue normally.
- Instructions reopens the current puzzle's objective. Return marbles preserves construction and Bit states. Restart challenge restores the starting machine and clears added parts. Reset all returns to a standard free-build board after confirmation.
- Challenges also contains a Free build button. In free build the existing unrestricted tools are restored.
- Challenges 21, 22, and 30 allow the blue supply to be changed under Challenges. They start with eight blue and no red marbles; 21/22 permit 0-15 and 30 permits 0-20. Applying a quantity returns marbles and preserves the construction and Bit states. Restart preserves the chosen test quantity but restores the puzzle's starting parts and states.
- Board PNG saves and URL state retain the challenge identity, restrictions, quantities, and current component states. Weighted register and A/B/T/F labels are included where needed.

## Puzzle-book checks

Definitions were converted to this simulator's native grid and checked against Upper Story's supplied English standard-edition V6 book, pages 15-54. Only book content and puzzle facts are carried over; the new controls and restriction logic are implemented in the existing simulator.

The book is authoritative over errors in the old web version: Challenge 1 has eight red marbles available as shown in the book; Challenge 13 has eight red marbles and twelve available ramps; Double Bond's displayed output contains sixteen marbles; Depletion allows five ramps; Overflow allows unlimited ramps. Challenge names and objectives follow the supplied edition.

## Validation and limits

Passed:

- TypeScript 2.7.2 build and JavaScript syntax checks.
- All 30 challenge loads: native coordinates, starting component types, locks, state-change exceptions, supplies, per-type quantities, and no release on load.
- Inventory exhaustion, refusal of extra parts and marble additions, moving/refunding parts, restart, and standard free-build reset.
- All 30 challenge menu/instructions/restarter flows using the real board and toolbar controllers with a test DOM. Includes confirmation cancellation, quantities, disabled tools, variable-supply validation, and support text.
- All 30 PNG pixel/metadata round trips: challenge identity, orientations, fixed parts, quantities, and remaining inventory.
- Sixty top-releaser manual-start hit tests, plus challenge-label creation.
- Twelve completed runs: solved Gravity and Tetrad setups at 0.25x, 1x, and 8x in both physical and schematic modes. Expected output and release counts match; each output settles.
- Existing linked-releaser regressions, 18 upper-feed cases, 36 physical lower-slope cases, 18 schematic lower-slope cases, and 88 forty-marble output-pattern cases.

Physics checks use the shipped Matter.js engine. Rendering is stubbed in the repeatable engine tests. These checks are not a claim that every possible solution to all 30 puzzles has been played through.

A full browser visual pass could not be completed in this environment: its test browser could not launch and the separate preview browser could not reach the local server. Check desktop and narrow-screen layout after uploading. Challenge mode displays the objective; it does not automatically award a pass/fail result.

## First live check

1. Open Challenges and select 1. Gravity. Confirm the popup and the Ramp count of 4.
2. Close the popup. Add four ramps to finish the alternating blue path. Confirm the count decreases to zero and another ramp cannot be added.
3. Remove one of your ramps. Its count should return to 1. Replace it, then start with the blue releaser. Only the eight blue marbles should reach the output.
4. Confirm starting ramps cannot be erased. Try Restart challenge and then Free build. Check that the current supply rails and lever design remain in place.
5. Open 11. Selectivity and check the starting Bits can flip but cannot move. Open 21. Quantum Number to check the blue test quantity control.

## Repeatable engine test

After compiling (`node_modules/typescript/bin/tsc`), run:

```
node tests/challenges/verify.cjs
```

This uses the hosted `docs/matter.min.js` and Node's standard library, with test-only graphics stubs; no added runtime dependency is required.

Compiled `docs/app.js` SHA-256: `d4f4699ef03915c4ae0c4b1b5d95eab9ddcfe6597a12b61f5ed7dd7b10c6ee42`


## Bottom-center peg clearance and lever exits

The center divider has a pointed, steeper roof that stays below the complete moving-component area of the lowest center peg. The widened section beside the resting lever noses remains in place. Drawing, physical collision geometry, and schematic guidance use the same revised outline; no invisible high cap is left behind. Saved boards acquire the refinement automatically after the updated bundle loads.

Validation for this refinement:

- Actual atlas artwork was checked at 181 positions per orientation for all six standard component types, including physical and schematic layers. No occupied artwork overlaps the divider; the smallest vertical artwork gap is about 5 canonical model units before the divider's outline stroke.
- 3,610 physical component-body poses clear the divider. Plain gears have no asymmetric collision body and are covered by the artwork check.
- 306 physical and 68 schematic center-approach cases pass: one lever actuation, no sticking, and collection-tray settling. Fully pressed tip-to-block clearance is 23.21 model units, greater than the 20-unit marble diameter.
- 144 inlet cases pass: incoming marbles contact the white slopes, roll to a lever, actuate once, and collect.
- All 30 challenge setup/inventory/metadata checks, all 30 PNG pixel/metadata round trips, and twelve solved Gravity/Tetrad runs at slow/normal/fast speeds in both routing modes pass.
- A controlled full-supply run retains and settles all forty marbles. A simultaneous center-path run also retains every released marble and actuates once per marble. Center-peg ricochets may send a marble to either lever; if that supply is empty, the chain correctly stops with the other supply's remaining marbles still held at the top.
- Challenge control/menu/instructions DOM integration checks still pass. A native-artwork rendering of the ramp at rest, halfway through motion, and fully rotated was visually inspected.

The repeatable physical-envelope check is:

```
node tests/challenges/verify-center-peg.cjs
```

After uploading, hard-refresh the simulator and check a Ramp on the bottom-center peg in both orientations while stationary and running. It should remain fully visible above the pointed block.


## Gravity marble crossing correction

The preceding flat-cap version allowed a marble that had already pressed one lever to climb across the divider and visit the other side before falling through. A regression test reproduced this for four of eight Gravity marbles at each of three playback speeds.

The cap is now pointed and steeper, with its wide shoulders retained beside the resting lever noses. Physical collision handling remembers the lever actually actuated by each marble. If that marble then contacts the divider roof, its motion is resolved along the downward slope on that lever's side. This applies only at real divider contact: there is no hidden wall above the block, no position jump, no color-based routing, and no release triggered by the block. Schematic routing follows the same actuated side. Ramp and inlet rolling-speed settings are unchanged.

Passed against the corrected bundle:

- 96 Gravity and mirrored red-side marbles, at 0.25x, 1x, and 8x in physical and schematic modes. No marble crosses the center after actuation; all eight per run settle in the register. Maximum lever-clearance delay: 87 physical-step equivalents, compared with 245 in the flat-cap reproduction.
- 306 physical plus 68 schematic center approaches, 144 solid-inlet cases, and the controlled forty-marble full-supply run.
- Linked top/bottom release and single-actuation regression tests.
- All 30 challenge setup/inventory/metadata checks, all 30 PNG pixel/metadata round trips, the twelve solved Gravity/Tetrad runs, and the challenge DOM/control checks.
- The 3,610 moving-body clearance cases still pass. Rechecking all six standard components' atlas-artwork envelopes leaves about five canonical units of clearance at the most conservative top-edge comparison. Native ramp artwork was also visually reviewed at rest, halfway, and fully rotated.

Run the new repeatable regression with:

```
node tests/challenges/verify-lever-exit.cjs
```

For the first live test, load Gravity, complete the same ramp path, and watch each marble after it presses the blue lever. It should drop through on that side without visiting the red lever. Marble color does not determine routing: the side is the lever the marble actually actuated.
