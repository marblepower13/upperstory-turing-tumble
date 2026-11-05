# Upper Story simulator: physical board and controls verification

Tested November 5, 2026.

## Current implementation

The standard supplies use long sloped rows, outer circular black releasers and
inward feed channels to the original first pegs. Supply and feed travel is guided;
marbles are handed to the existing physics on the board. Bottom lever artwork
was restyled while retaining the previously tested collision bodies, travel and
outer-end protection. The two output inlet joins are now flush. The guided
40-marble register retains entry order and spacing.

The Turing Tumble logo replaces the text heading. Upper Story branding and the
product link are at lower left. Instructions is above Tools and contains the
usage text. Help contains only the support email. F changes the selected placement
preview where orientation applies; the Crossover's symmetry is explained in its
tooltip. Play/Pause sits below the board and resumes at the previous speed.

## Ramp behavior preserved

The full src/parts/ramp.ts, src/parts/partbody.ts, src/parts/partvertices.ts and
src/board/constants.ts files were compared byte-for-byte with the prior review
snapshot and are unchanged. Counterweight parameters, ramp contacts, incline
assistance, collision geometry and traversal helpers have not been tuned. The
frame-based playback scheduling remains unchanged. The redesigned feeder can
change the timing of arrival at the first ramp; this is not a change to the ramp
model itself.

## Verification

Tests load the compiled app and its actual hosted Matter.js 0.14.2 bundle with
rendering stubbed. Interface tests use DOM emulation. Source compiles with
TypeScript 2.7.2 and the hosted JavaScript passes syntax checks.

| Check | Coverage | Result |
| --- | --- | --- |
| New supply behavior | Both colors, 8/20 capacities, physical/schematic modes (8 cases) | Correct parking and colors; three rapid manual releases; pause freezes rail/feed coordinates; all released marbles collect; silent return |
| Releaser hit testing | Hand, placement and erase modes | Exactly one marble per black-disk click |
| Full machine runs | 18 combinations: 8/20 per color, blue/red/both starts, speeds 0.25/1/8 | Supply totals conserved; released marbles actuate and collect in entry order |
| Empty-board runs | Both starts at all 11 nonzero speeds (22 cases) | All released marbles retained, actuated and settled |
| Output patterns | Four 40-marble patterns at 11 speeds in both modes (88 cases) | Exact identities/colors preserved; full-diameter clearance through turn; stable finished row |
| Center approaches | 306 physical and 68 schematic cases | Divider passage, one actuation and collection |
| Outer-end and blade impacts | 60 outer-end and 102 blade-width cases | No escape or missed actuation |
| Release isolation | Interceptor, in flight, below levers, missing levers, return | No collection/proximity-triggered continuation; top supplies remain functional even without bottom levers |
| Other components | Ramp directions, crossover paths, bits, linked gear bits, interceptor | Passed |
| Reset, size and register controls | Three standard sizes, 40 marbles, pause/resume, zoom, return/reset | Queue and component-state behavior preserved |
| UI and shortcut | Logos/link, Instructions/Help content, tooltip exclusions, F dispatch, speed preservation, Play/Pause enabled states | Passed |
| Assets and build | Original logos compared with source and hosted copies | Matching bytes; no logo alterations |

Compiled docs/app.js SHA-256:
294d352f35ce882da669ecc9a9921abfac1b91b377c8d74890eb2b6a39f92f30

## Live verification still needed

A live WebGL/browser layout session could not be completed reliably in the
available preview environment. The tests above are engine and DOM checks, not
an assertion that every device or browser has been visually verified. After
uploading, check the physical rail and lever appearance, black-disk clicks,
adding marbles to either rail, F preview behavior, Instructions/Help, logo sizing,
Play/Pause placement and full-board fitting. Test any intended touch devices.

Normal standard boards and forty total marbles are the supported output capacity
verified here. Advanced custom layouts, live resizing during feed travel and
larger supplies are outside this layout guarantee. The original configuration
file format remains in use. README.md, LICENSE and existing third-party notices
are preserved by the update package. No code has been pushed or published.
