# Upper Story simulator: rigid-lever and reset verification

Tested November 5, 2026.

## Current behavior

The rigid lower lever rotates DOWN about its fixed white hinge; it is not a
stationary artwork swap or a deformed shape. The same rotation transforms its
shaft, heel, nose and counterweight. A physical marble collision with detected
lever movement starts one complete down/return stroke. One passing marble can
initiate only one linked release. The mirrored top releaser follows that stroke,
then reloads after returning. A held or busy mechanism cannot repeatedly release.

The final lower board slopes are continuous visible rails ending at the wide
lever heels. Their fixed geometry is shared with the new collision surfaces;
there are no visible overlay boxes. The center block is fixed and tapers below
the receiving pocket. Invisible outer guards retain stray marbles. Free-flight,
interception and collection do not trigger release.

Reset all reconnects new supply instances rather than relying only on their
coordinates. This prevents old holding cups and misplaced supply marbles after
same-size resets. Upper and lower visible start controls have a delayed
'Press to Start' popup. The Upper Story logo is 33% smaller; the Turing Tumble
logo is 1.5x larger than the previous update.

## Verification method

Checks load the compiled app and its hosted Matter.js 0.14.2 bundle with PIXI
rendering stubbed. DOM-emulation checks exercise the hosted classroom interface.
Actual vector drawing commands were rendered separately for resting and pressed
poses, and the rigid sprite transforms were checked numerically across the
full sweep. These checks do not constitute a live WebGL/browser layout session.
The preview browser could not be launched in the available environment earlier;
live appearance and pointer behavior still need review on the intended devices.

## Results

| Check | Coverage | Result |
| --- | --- | --- |
| Rigid geometry | 606 poses: 101 progress values per side on three standard sizes | Hinge-to-nose/counterweight distances constant; sprite transforms match actual rotation; receiving tip moves downward more than 30 model units |
| Counterweight clearance | Every sampled pose in the same sweep | Entire visible counterweight cap remains below white slope; minimum margin 6.06 model units |
| Rail/heel join | Both sides on three sizes | Visible rail ends within 2.5 model units of the top of the widened receiving heel; no added visible boxes |
| Repeated Reset all | 24 resets across three standard sizes, including mid-cycle resets | Current supplies recognized, all stock on new rails, old cups/slopes hidden, one collider per fixed part and next manual release works |
| Start targets | Upper disks and lower cap/hinge/nose | Correct hit testing on the complete visible control; start hover event reaches UI |
| Start popup | Delayed show, hide on empty board, cancellation on board exit | Exact text 'Press to Start'; passed DOM checks |
| Linked supplies | 8 cases across both colors, 8/20 capacities and physical/schematic modes | Correct seating, mirrored rotation, one accepted press, busy interlock, reload, pause and return |
| Full machine | 18 combinations: 8/20 per color, blue/red/both starts, speeds 0.25/1/8 | Supply totals, real actuation, collection, settled output and exact order passed |
| Empty board | 22 runs: both starts at all eleven speeds | All released marbles retained, actuated and collected |
| Center approaches | 306 physical and 68 schematic cases | One actuation, divider passage and settled collection passed |
| Blade impacts | 102 position/velocity cases | No missed actuation or stranded marble |
| Outer-end impacts | 60 outward position/velocity cases | No escape, missed actuation or stranded marble |
| Output patterns | 88 forty-marble patterns across both modes and eleven speeds | Exact identities/order, spacing, idle stability and silent return |
| Release isolation | Interceptor, in-flight marble, below-arm marble, absent lower levers, return/reset | No automatic continuation without lower-lever actuation |
| Other components | Ramp directions, crossover routes, bit, gear-bit train, interceptor | Passed |
| Register controls | Forty marbles on three sizes, zoom, pause, return and reset | Passed |
| Interface/build | Instructions/Support, shortcut exclusions, Play/Pause speed restore, logos/link, TypeScript 2.7.2 and JS syntax | Passed; source and hosted assets match |

At full depression, the minimum divider/lever clearance is about 22.15 model
units for a 20-unit marble. The nearest visible lower collector-funnel surface
is about 68.98 units from the tip. The full approach/impact matrices verify
passage beyond these isolated geometric measurements.

## Ramp preservation

src/parts/ramp.ts, src/parts/partvertices.ts and src/board/constants.ts were
compared byte-for-byte with the preceding linked-releaser release and are
unchanged. Edits to shared PartBody remain within Turnstile construction and
rotation/pulse handling. Playable ramp density, friction, counterweight constants,
contact assistance and traversal rules were not tuned. Upper/lower staging
changes can affect arrival timing, independent of playable ramp speed.

Compiled docs/app.js SHA-256:
66a0eeb36579ae1ece21d15e5a2bafb863e3f91ebdc68ffc20250cc00f1aede6

## Live review after uploading

1. Reset all several times, including while a marble is moving: retain long
   supply rails without the original holding cups appearing.
2. Inspect the uninterrupted lower slopes and their joins to the widened heels.
3. Release a marble and watch the corresponding lower lever pivot DOWN rigidly;
   verify its counterweight cap stays below the slope and the marble clears.
4. Hover over top releasers and lower levers: confirm 'Press to Start'. Try
   clicking the lower counterweight end as well as the receiving end.
5. Pause during a stroke and resume; verify the two linked ends freeze together.
6. Check both logo sizes, the lower-left centered product link, tool access and
   full-board fitting on the classroom display. Verify intended touch devices.
7. Run a forty-marble sequence and check its final order.

The forty-marble output guarantee covers standard board configurations. Advanced
custom mechanisms, live resizing mid-stroke and larger capacities are outside
that guarantee. The existing serializer format, README, license and third-party
notices are preserved. No remote code changes or publishing were performed.
