# Upper Story simulator: register and physics verification

Tested November 3, 2026.

## Result and behavior

The approved single-file output register replaces the open collection area on
standard boards. Forty full-size marbles fit in one bottom row. The first marble
is at the right-hand stop; the output is read toward the left.

The simulation keeps free-body physics on the board and levers. After a marble
clears the mechanism and reaches the visible funnel, the output guide constrains
its movement along a fixed path. Entries cannot pass their predecessors. The
spacing constraint accounts for full circle clearance through the rounded turn,
not just distance along the path. Collected marbles no longer participate in
Matter.js collisions. This is deliberate guided routing, not an assertion that
the original open tray's physical collisions preserve order.

The sequence is the chronological order of entry into the register. Simultaneous
entries receive a stable tie order. Multiple manually started marbles can reach
the inlet in a different order from their earlier lever contacts; the guide
preserves inlet order. The standard one-marble-driven puzzle flow is retained.

## Method

Checks loaded compiled docs/app.js and the exact hosted Matter.js 0.14.2 bundle.
Rendering was stubbed for engine tests; controls used DOM emulation. A coordinate
render of the implemented guide and forty actual output positions was inspected.
No installed browser was available for a live WebGL session. TypeScript 2.7.2
compilation and JavaScript syntax checks passed.

Compiled docs/app.js SHA-256:
ff755aebf6f5275cdca998f3d7a2290be50f7368e814bde9a304c5456114277b

## Test results

| Check | Coverage | Result |
| --- | --- | --- |
| Exact output patterns | 88 cases: four 40-marble patterns × all 11 nonzero speeds × physical/schematic modes | Exact marble identities and colors retained; 40 in one row; full moving clearance around turn; idle positions unchanged |
| Patterns | Alternating BR; BBRR pairs; 20 blue then 20 red; mixed color groups | Preserved from first entry to last |
| End-to-end screenshot-layout runs | 18 combinations: 8/20 marbles per color, blue/red/both starts, speeds 0.25/1/8 | Supplies and marble counts conserved; all released marbles actuate; final positions match register entry order |
| Empty-board sequences | 22 cases: both starts at all 11 nonzero speeds | Every released marble retained, actuated, and settled in the register |
| Center approach physics | 306 cases: 17 entry positions, three initial horizontal velocities, six speeds | One automatic actuation, post clearance, passage, and collection |
| Schematic approaches | 68 position/speed cases | One actuation and collection |
| Outer-end containment | 60 positions/velocity cases on both ends | No outside escape; one actuation and collection |
| Blade-impact width | 102 cases across both blades | Previously reproduced brief-strike failures remain fixed |
| Release isolation | Intercepted, in-flight, below-lever marbles, missing levers, return/idle | No proximity- or collection-triggered release |
| Register controls | Three standard board sizes, 40 marbles, pause/resume, zoom, return/reset | Capacity, entry order and part states preserved appropriately; no idle release |
| Other parts | Ramp directions, both crossover paths, alternating bits, linked gear bits, interceptor | Passed |
| User interface | Heading text, removal of footer block, control mappings, tooltips, icons, reset, eraser and color-matched supply additions | Passed |

At full depression, blade/post clearance remains 22.52 simulation units versus
marble diameter 20. The raised outer rims and prior first-touch collision fix
remain in place. Forty-marble output checks require at least 20.49 units of
actual center-to-center clearance through the turn, with 20.5-unit pitch in the
straight register. Output positions remain fixed after the queue settles.

## Limits and live checks

These checks cover the specified engine, guided output, and DOM scenarios; they
do not prove every possible custom machine or browser/device combination.
Live checks should confirm title placement, fitting/zooming, visibility of the
full register, inlet animation, mouse/touch interaction, and sample output
patterns. Output capacity verified here is 40 marbles. Standard paired locked
levers are required for the derived register; custom advanced boards remain
outside this layout guarantee.

Save/open retains the existing configuration format, not a replay of completed
output. Return marbles resets the queue and retains component states; Reset all
clears the machine. The package includes matching source and hosting files and
preserves the separately edited README.md, LICENSE and third-party notices.
