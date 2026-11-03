# Upper Story simulator: physics verification

Tested: November 3, 2026.

## Implementation verified

Fixed white center post with no lateral feet; mirrored single-blade levers;
marble clearance beside the post during depression; actual-contact-only automatic
release; one automatic release per passing marble; silent return/reset; fixed-step
slow playback. The post's shared polygon drives its drawing and collision body.

## Method

Automated Node checks loaded the compiled docs/app.js and the exact hosted
Matter.js 0.14.2 bundle from docs/matter.min.js. Board construction, part bodies,
collision detection, lever motion, routing, release callbacks and collection used
the simulator's actual code. Rendering was stubbed. Interface checks separately
used a DOM emulation. TypeScript compilation and JavaScript syntax checks passed.

Compiled docs/app.js SHA-256:
1239b529687b74ec70ab13718834dc28e9960bae1c510cb2fafe8638db02c3a6

## Results

| Check | Coverage | Result |
| --- | --- | --- |
| Physical center/side approach matrix | 306 cases: 17 positions, 3 incoming horizontal velocities, 6 speeds (0.25–8) | Exactly one actuation; passage and tray settling; no lost marbles |
| Schematic approach matrix | 68 cases: 17 positions, 4 speeds | Exactly one actuation and collection |
| Full screenshot-layout runs | 18 combinations: 8 or 20 marbles per color; blue, red, or both started; speeds 0.25, 1, 8 | Expected supplies exhausted; total marble counts conserved; released marbles settled clear of post and levers |
| Pressed clearance | Left and right actual collision polygons | 49.44 units minimum separation on both sides; marble diameter 20; post stays fixed |
| Release isolation | In-flight, intercepted, below-lever marbles; levers removed; return and idle | No unrequested automatic continuation |
| Both lever directions | Individual physical and schematic passes; sequential supplies | Tip, release once, pass, return |
| Other components | Both ramp directions, both crossover entries, alternating bit state, linked gear bits, interceptor | Passed |
| Reset, sizing, playback | Three standard board sizes, repeated reset, pause/resume, speed changes during a pass | One post, no duplicate colliders or idle release; passage continues |
| Controls | Eraser protection, supply-only marble adding, matching colors, tool mappings, help, reset, speed/return controls | Passed |

Full-run settling required sustained low velocity, retention of all marbles, prior
lever actuation, and no remaining post/lever contact. With 40 marbles released,
the existing collection area packs back onto its lower inlet ramp. All 40 clear
the mechanism and settle; they do not all fit in one straight row at the bottom.
The collection-ramp dimensions were retained.

## Scope and remaining checks

These are engine and DOM tests, not visual browser tests. No installed browser
was available for a live WebGL/canvas session. After uploading, check the drawing,
mouse placement and flipping, tooltip positioning, and any intended touch devices.
The tests cover the listed cases; they do not establish correctness for every
possible user-built machine, custom board, or deliberately overlapping placement.
The underlying simulator's existing physics limitations remain.

## Package

This is an update for the existing repository, not a standalone application ZIP.
It includes compiled hosting files and matching source. README.md is excluded so
it will preserve your separately edited customer-facing README. Existing LICENSE
and third-party notices must remain in the repository.
