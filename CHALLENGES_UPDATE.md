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

Compiled `docs/app.js` SHA-256: `ac084d0cf49a748e95c33f9ea515f9495d37f823dd0ad171d9a96429d926ae85`
