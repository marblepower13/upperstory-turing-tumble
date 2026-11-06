# Upper Story simulator: feed alignment and matched rail pace

Tested November 6, 2026.

## Current change

The upper feed's drawn line and guided marble-center path derive from the same
rail endpoints. The center path is offset upward by the marble radius, half the
visible stroke width and a small rendering margin. This prevents the below-line
travel shown in the reported screenshot. A short roll-off segment carries the
marble past the rail tip, and its outgoing velocity transfers to free physics.

A shared RAIL_ROLL_SPEED of three model units per physical simulation step
controls both upper feeds and lower inlet slopes. Lower speed is applied only
on real contact with the upper face of a lower rail, with handoff before the
receiving heel. It does not pull free-falling marbles toward the rail or move
marbles on the underside. Existing Faster/Slower settings scale both equally.
Schematic routing uses the same pace and fixed lower-rail geometry.

The physics engine integrates gravity between contact corrections. Measured
lower travel is 3.027–3.055 units per step across the three standard sizes,
versus upper guided travel of 3.000: under two percent difference. Both paths
use the same nominal pace, replacing the visibly slower gravity-only roll.

## Verification method

Checks load the compiled application and hosted Matter.js 0.14.2 with stubbed
PIXI rendering. DOM checks use the hosted classroom controls. Actual drawing
commands were rendered for visual inspection, including a moving marble above
the upper feed rail. The tests include rounded drawing coordinates at three
supported zoom sizes. A live WebGL/browser session was not completed; review
appearance and interaction on the intended classroom screen after uploading.

| Check | Coverage | Result |
| --- | --- | --- |
| Upper feed clearance and pace | 18 feeds: both colors, three standard boards, zoom sizes 24/40/64; 1,902 straight-path samples | Marble center remains above the actual feed line; path advances exactly 3.000 units per step; rounded render coordinates checked |
| Outlet handoff | Each of the 18 feed cases | Physical body inherits outgoing motion; Return marbles clears pending handoff state |
| Lower rolling pace | 36 cases: both colors, both marble states, three boards, speeds 0.25/1/8; 2,760 samples | Contact target is 3.000; measured physical travel 3.027–3.055 per step; all marbles collect |
| Schematic pace | 18 cases across colors, board sizes and speeds; 5,637 samples | Same three-unit pace after iteration scaling; all marbles collect |
| Solid slope landings | 144 cases across sides, marble states, landing points, entry velocities and playback speeds | Slope contact precedes actuation; marbles stay supported, roll inward, actuate once and collect |
| Full machine | 18 combinations of 8/20 marbles per color, blue/red/both starts and 0.25/1/8 speed | Supply totals, actual actuation, collection, stable output and order passed |
| Empty board | Both starts at eleven speeds (22 runs) | No lost or unactuated output marbles |
| Center approaches | 306 physical and 68 schematic cases | Single actuation, divider passage and settled collection |
| Blade and outer-end impacts | 102 blade cases and 60 outward-velocity cases | No missed actuation, stranded marbles or escapes |
| Release isolation | In flight, intercepted, below arms, missing levers, return/reset | No continuation without lower-lever actuation |
| Rigid motion/reset | 606 poses and 24 same-size resets on three boards | Downward rigid travel, counterweight clearance, no old supply overlays and working next release |
| Supply/controls | Both modes and colors, 8/20 counts, busy protection, pause/return/reset, start hover | Passed |
| Output register | 88 forty-marble pattern cases across both modes and eleven speeds | Exact identities/order, spacing, idle stability and silent return |
| Other components and build | Ramps, crossover, bits/gear-bit trains, interceptor, eraser/add marbles, TypeScript 2.7.2 and JS syntax | Passed |

## Preserved behavior

src/parts/ramp.ts, src/parts/partvertices.ts, src/board/constants.ts,
src/parts/partbody.ts, src/parts/turnstile.ts and src/board/centerblock.ts match
the preceding solid-slope release byte-for-byte. No playable ramp/counterweight,
lever shape, center-block clearance or collision-category setting was tuned.
The wider center block still has approximately 1.23 units of resting gap at each
tip and 23.21 units of exit clearance for a 20-unit marble when depressed.

New shared helper: src/board/rail.ts. Source, compiled hosting bundle and current
release notes are included in the update.

Compiled docs/app.js SHA-256:
b63789a4388a10e6ecae5be1fcec2d800897ebe752f497865ce16601ff9a0ac4

## Live checks after upload

1. Release blue and red marbles: each should stay above the upper feed line,
   roll to its end and continue into the board smoothly.
2. Watch a marble reach each lower white slope: it should land and roll inward
   at approximately the same visible pace as the upper feed.
3. Try slow/normal/fast, pause on each rail, then resume and Return marbles.
4. Reset several times, then run a forty-marble sequence and verify its order.
5. Check the classroom display and any intended touch devices.

The verified output capacity remains forty total marbles on standard layouts.
Advanced custom mechanisms, live resizing during travel and larger capacities
are outside this guarantee. README, license and dependency notices are preserved.
No code has been pushed or published on your behalf.


Challenge update validation: the physics and geometry source files are unchanged. The linked release, matched rail pace, and 88 forty-marble pattern cases were rerun against the newly compiled bundle and passed. Solved Gravity and Tetrad setups also passed at 0.25x, 1x, and 8x in both physical and schematic modes. See CHALLENGES_UPDATE.md for the complete challenge test scope and browser-validation limitation.


Bottom-center clearance refinement: the center block now ends below the component envelope of the lowest center peg. Artwork and collider outlines match. Passed 306 physical and 68 schematic center approaches, 144 solid-inlet cases, 3,610 component-body poses, a controlled forty-marble full-supply run, center-path feedback/retention, and the complete challenge test suite. Ramp and inlet rolling-speed settings are unchanged. Details and scope are in CHALLENGES_UPDATE.md.
