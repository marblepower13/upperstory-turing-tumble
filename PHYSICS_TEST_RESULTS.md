# Upper Story simulator: linked releasers verification

Tested November 5, 2026.

## Current mechanism

Each standard supply has a long sloped rail and a circular black releaser with
one marble seated in its cup. The two mirrored releasers rotate downward with
their corresponding lower levers (clockwise blue, counterclockwise red). The
marble follows the cup before passing into the guided upper feed. The next stock
marble seats only after the releaser returns. Repeated clicks during a busy
stroke/reload are ignored; a held bottom lever cannot release extra marbles.
Manual top clicks initiate a complete single-marble cycle.

The lower hinges are at the central mounting holes shown in the supplied lever
reference. Outer colored counterweights move with the lever. Receiving heels
are wider, tips are cupped, and short fixed white inlet ramps meet the heels at
rest. Invisible outer guards retain stray marbles. The center divider is fixed,
and the guided forty-marble output retains exact arrival order.

## Method and limits

Engine checks load the compiled application and its actual hosted Matter.js
0.14.2 bundle; PIXI rendering is stubbed. DOM checks exercise the hosted classroom
interface through DOM emulation. New geometry was also inspected through raster
renders of the actual vector drawing commands at rest and with a lever pressed.
This is not a successful live WebGL/browser layout test: the available headless
browser could not launch in this environment. Browser appearance, pointer use,
responsive layout and intended touch devices still require live review.

## Results

| Check | Coverage | Result |
| --- | --- | --- |
| Cupped supplies | 8 cases: both colors, 8/20 capacities, both routing modes | Initial seating, spacing, rotation direction, one accepted press, reload and return passed |
| Linked release | Both sides, real contact in physical/schematic modes | Top angle matches lower lever stroke in the same simulation step; no drawn linkage |
| Held-lever protection | Both sides, 100 attempted repeats during each held stroke | One release until return; next press works after reload |
| Pause | Manual supply and linked strokes in both modes | Cup, stock, feed and lower lever remain fixed; resume continues |
| Manual controls | Black-disk hit testing across hand/part/erase; no bottom levers | One cycle per accepted click; busy clicks ignored |
| Full machine | 18 combinations of 8/20 per color, blue/red/both starts, speeds 0.25/1/8 | Totals conserved, lever actuation, collection and order passed; final compiled bundle also reran the 40-marble simultaneous case |
| Empty board | Both starts at eleven speeds (22 cases) | No lost or unactuated output marbles; all collected and settled |
| Center approaches | 306 physical and 68 schematic cases | One actuation, passage and collection passed |
| Fast blade impacts | 102 position/velocity cases | No misses after strengthening the flush inlet joins |
| Outer ends | 60 position/outward-velocity cases | Invisible guards retain all marbles and route them to collection |
| Pressed clearance | Both sides | Divider: 32.83 units; actual lower funnel: 31.98 units; marble diameter: 20 units |
| Output patterns | 88 forty-marble cases across both modes and eleven speeds | Exact identities/order, clearance, idle stability and silent return passed |
| Release isolation | Interceptor, free flight, below levers, removed levers, return | No automatic continuation without lower-lever actuation |
| Other components | Both ramp directions, crossover routes, bits, gear-bit trains, interceptor | Passed |
| Reset and register controls | Three standard sizes, forty marbles, zoom, pause, return/reset | Passed |
| Interface | Logos/link, Instructions/Support, crossover F exclusion, other F tooltips, Play/Pause speed restore | Passed DOM checks |
| Build and assets | TypeScript 2.7.2; hosted JS syntax; matching src/docs assets | Passed; uploaded logos unaltered |

## Ramp behavior

src/parts/ramp.ts, src/parts/partvertices.ts and src/board/constants.ts match the
previous physical-board release byte-for-byte. The PartBody diff is confined to
Turnstile collision geometry, return motion and manual pulse handling. No ramp
counterweight constants, contact assistance, density, friction, vertices or
traversal rules were changed. Existing physical playback scheduling is unchanged.
New supply loading and release timing can alter arrival time at the first part.

Compiled docs/app.js SHA-256:
09fb9b71e1f2da83f7835ae4073f88fe7596e60b29b4b49fa0fd56fe75a6020a

## Live review after upload

Check both enlarged logos and the centered lower-left product link; tool access
on your classroom screen; the absence of the crossover F description; cupped
marble seating; click/release/return/reload on each side; synchronized lower lever
and top disk movement; the new hinge positions and inlet joins; pause mid-stroke;
return/reset; and a forty-marble sequence. Guards at the outer lever ends should
be invisible while still retaining a stray marble.

The output guarantee covers forty total marbles and standard board layouts.
Advanced custom mechanisms, live resizing mid-stroke and greater capacities
remain outside that guarantee. The update preserves the existing serializer
format, README, license and dependency notices. No code was pushed or published.
