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
a4437616b9cbbe6b108845b1e3a45383238ebcb5b3010ca02e0cc9d9586333de

## Reproduced outer-end escape

The previous lever revision allowed outward-moving marbles to pass the outer
pivot and miss the collection ramps. Targeted tests reproduced this on both sides.
A raised rim now closes each outer end and moves with the lever. Its visible rim
and collision shape use shared dimensions. It catches the outward roll without
opening a new release path or changing the center post.

The prior empty-board check asserted lever actuation but could accept an already
actuated marble escaping the collector. The strengthened check requires every
released marble to leave its supply, actuate a lever, remain in the board's marble
set, and finish at rest within the collection area. This correction addresses
that test-coverage gap; it does not make the engine tests a browser test.

## Reproduced brief-contact failure

Before this fix, isolated drops at columns 4.1 and 7.9, from row 12.35 with
initial downward velocity 8, passed their respective blades without depression
or release. These are two reproducible instances of the reported failure type;
the exact sequence observed in the live browser was not reproduced.

The handler previously considered continuing collisions but omitted first-touch
collisions. Both kinds now count for lever handling; other components' handling
is unchanged. Release still requires actual blade contact and depression.
The previously failing cases are included in the impact-width regression below.

Longer regression runs also exposed inadequate space below a fully depressed
blade. Travel is now limited to 0.28 radians (about 16 degrees). The minimum
post/blade separation is 22.52 units; measured inner-tip-to-collection-ramp
clearances are 36.32 units on the left and 27.67 on the right (marble diameter 20).
A top-face incline assist, analogous to the simulator's ramp assist, prevents
solver friction stranding a marble near the pivot. It does not act from below.


## Results

| Check | Coverage | Result |
| --- | --- | --- |
| Outer-end retention | 60 cases: both ends, five positions, six outward speeds up to the engine speed limit | No outside escape; exactly one actuation and bottom-tray settling |
| Brief-impact width regression | 102 cases: 34 positions across both blades, 3 incoming downward speeds | One actuation and passage per marble, including both previously failing cases |
| Empty-board sequences | Blue/red starts at all 11 nonzero playback settings (22 cases) | All released marbles actuated a lever and settled within the collection area; counts conserved |
| Physical center/side approach matrix | 306 cases: 17 positions, 3 incoming horizontal velocities, 6 speeds (0.25–8) | Exactly one actuation; passage and tray settling; no lost marbles |
| Schematic approach matrix | 68 cases: 17 positions, 4 speeds | Exactly one actuation and collection |
| Full screenshot-layout runs | 18 combinations: 8 or 20 marbles per color; blue, red, or both started; speeds 0.25, 1, 8 | Expected supplies exhausted; total marble counts conserved; released marbles settled clear of post and levers |
| Pressed clearance | Left and right actual collision polygons | 22.52 units minimum separation on both sides; marble diameter 20; post stays fixed |
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
