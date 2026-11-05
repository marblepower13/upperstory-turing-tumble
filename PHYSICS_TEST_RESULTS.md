# Upper Story simulator: solid slopes and center-block verification

Tested November 5, 2026.

## Current correction

The continuous lower white inlet rails now collide with both marble states.
Previously their filter accepted only the released category, while a marble's
release flag resets after it leaves the upper supply area. That excluded normal
board marbles from the lower rails. The corrected filter accepts both categories.

A marble landing on the white slope is supported on its upper face and rolls
inward to the exposed black receiving heel. Only a real lower-lever impact can
advance the machine. The lever pivots rigidly downward, holds the exit open while
the passing marble clears, and then returns with its linked upper releaser.
The minimum open dwell and occupancy hold prevent closing onto a passing marble.
Pause freezes the complete mechanism.

The fixed center block is wider at the resting tips and tapers to its lower stem.
Resting clearance is about 1.23 model units on each side; full-depression clearance
is about 23.21 units for a 20-unit marble. Its concave outer outline is represented
by two convex rigid-body pieces, so collision testing matches the drawn profile.
Schematic deflection matches the new outline and keeps a consistent approach side.

## Method and results

Checks use the compiled app with its actual hosted Matter.js 0.14.2 bundle and
stubbed PIXI rendering. DOM checks exercise hosted classroom controls in DOM
emulation. Actual vector artwork was inspected at rest and full depression.
A live WebGL/browser layout session was not completed in this environment;
final visual and pointer review on the intended devices remains necessary.

| Check | Coverage | Result |
| --- | --- | --- |
| Direct slope landings | 144 cases: both sides, both marble states, four landing positions, entry speeds 0/4/12 and playback 0.25/1/8 | Every marble contacts the rail first, stays above it, rolls inward at least ten model units before actuation, releases once and collects |
| Tight center pocket | Actual convex collision pieces | Rest gaps 1.23 units; depressed gap 23.21; no fixed-block movement |
| Center approaches | 306 physical and 68 schematic cases | One actuation, no sticking and collection; penetration measured against the actual convex pieces |
| Full machine | 18 combinations of 8/20 per color, blue/red/both starts and 0.25/1/8 speed | All supply totals, actuation, settled collection and exact output order passed; final compiled bundle also reran the simultaneous forty-marble case |
| Empty board | Both starts at eleven speeds (22 runs) | Released marbles retained, actuated and collected |
| Blade impacts | 102 position/velocity cases | No missed actuation or stranded marbles |
| Outer ends | 60 position/outward-speed cases | Invisible guards retain stray marbles and the held-open lever lets them clear |
| Rigid motion | 606 sampled poses across both sides and three standard sizes | Constant hinge distances, real downward tip travel, counterweight stays below the slope with minimum margin 6.06 units |
| Same-size resets | 24 resets across three standard sizes, including mid-stroke | Correct supplies, no old cups or duplicate slopes, no extra colliders and next release works |
| Supply linkage | 8 cases covering both colors, 8/20 counts and both modes | Seating, mirrored rotation, one-press/busy protection, reload, pause and return |
| Output register | 88 forty-marble pattern cases across both modes and eleven speeds | Exact identities/order, spacing, idle stability and silent return |
| Controls | Three sizes, zoom, pause, return and reset; delayed Press to Start hover | Passed |
| Other components | Ramps, crossover, bit, gear-bit trains, interceptor and eraser/add-marble controls | Passed |
| Release isolation | In flight, intercepted, below the levers, absent levers and return/reset | No automatic continuation without lever actuation |
| Build/assets | TypeScript 2.7.2, hosted JS syntax and matching source/hosted assets | Passed |

## Playable ramps preserved

src/parts/ramp.ts, src/parts/partvertices.ts and src/board/constants.ts match the
preceding rigid-lever release byte-for-byte. Shared PartBody code was also not
changed by this correction. Playable ramp collision shapes, counterweights,
friction, density, contact assistance and traversal speed remain unchanged.
Changes are limited to the lower inlet collision filtering, fixed block profile,
lower lever clearance/return timing, related drawing and schematic handling.

Compiled docs/app.js SHA-256:
b62cbb5da2d89ee678ef01f352f386e5d9447cc3133b4b5eca48b672735c53eb

## Live checks after upload

1. Guide a marble toward several points on each lower white slope. It should
   land on the slope and roll inward to the exposed black receiving area.
2. Check that both resting lever tips nearly touch the wider white center block.
3. Watch a complete stroke: rigid downward movement, one linked top release,
   clear passage to the output ramps, then return and reload.
4. Pause while the lever is down, then resume. Reset all several times and check
   that only the preferred supply rails appear.
5. Run a forty-marble output and verify its final order. Review classroom screen
   fitting, hover controls and any intended touch devices.

The verified output capacity is forty total marbles on standard board layouts.
Advanced custom mechanisms, live resizing mid-stroke and larger capacities remain
outside this guarantee. The serializer format, README, license and third-party
notices are preserved. No code has been pushed or published.
