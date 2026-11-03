/* Upper Story classroom controls. Original simulation and part artwork: Jesse Crossen.
   This adapter uses the existing toolbar controllers so simulation behavior is retained. */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const paths = {
    hand: '<path d="M8 14V5a2 2 0 014 0v6-1a2 2 0 014 0v1a2 2 0 014 0v2a2 2 0 014 0v6c0 4-3 7-7 7h-3c-2 0-3-1-5-3l-5-6a2 2 0 013-3l4 3"/>',
    eraser: '<path d="M4 19L18 5a2 2 0 013 0l7 7a2 2 0 010 3L16 27H10l-6-5a2 2 0 010-3zM12 11l12 12M16 27h12"/>',
    reset: '<path d="M7 9a11 11 0 111 16M7 3v7h7"/>',
    fit: '<path d="M3 3l8 8M5 11h6V5M29 3l-8 8M21 5v6h6M3 29l8-8M5 21h6v6M29 29l-8-8M21 27v-6h6"/>',
    advanced: '<circle cx="16" cy="16" r="4"/><path d="M13 3h6l1 4 3 2 4-1 3 5-3 3v3l3 3-3 5-4-1-3 2-1 3h-6l-1-3-3-2-4 1-3-5 3-3v-3l-3-3 3-5 4 1 3-2z" transform="translate(1 0) scale(.94)"/>',
    help: '<circle cx="16" cy="16" r="13"/><path d="M12 11a4 4 0 018 0c0 3-4 3-4 6M16 23h.01"/>',
    marbles: '<defs><radialGradient id="blue"><stop stop-color="#91c9ff"/><stop offset="1" stop-color="#1155cc"/></radialGradient><radialGradient id="red"><stop stop-color="#ffb4aa"/><stop offset="1" stop-color="#cf2029"/></radialGradient></defs><circle cx="8" cy="16" r="7" fill="url(#blue)" stroke="#164ba0"/><circle cx="24" cy="16" r="7" fill="url(#red)" stroke="#a91925"/>'
  };
  function icon(name) {
    if (paths[name]) {
      const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '0 0 32 32'); svg.setAttribute('aria-hidden', 'true'); svg.innerHTML = paths[name]; return svg;
    }
    const img = document.createElement('img'); img.src = 'images/usage/' + name + '.png'; img.alt = ''; img.draggable = false; return img;
  }
  const ui = document.createElement('div'); ui.id = 'classroom-ui';
  ui.innerHTML = '<aside class="sidebar left" aria-label="Building tools"><section class="panel" id="tools"><h2>TOOLS</h2></section><section class="panel" id="parts"><h2>PARTS</h2></section></aside><aside class="sidebar right" aria-label="Simulation controls"><div id="reset-slot"></div><section class="panel" id="actions"></section><div class="bottom" id="more"></div></aside><div id="tooltip" role="tooltip" hidden></div><div id="status" role="status" aria-live="polite"></div>';
  document.body.appendChild(ui);
  const tooltip = ui.querySelector('#tooltip');
  let tipOwner = null, tipTimer = 0, statusTimer = 0;
  function hideTip() { clearTimeout(tipTimer); tooltip.hidden = true; if (tipOwner) tipOwner.removeAttribute('aria-describedby'); tipOwner = null; }
  function showTip(el) {
    hideTip(); tipOwner = el;
    tipTimer = setTimeout(() => {
      if (!document.contains(el)) return;
      tooltip.textContent = el.dataset.tip; tooltip.hidden = false; el.setAttribute('aria-describedby', 'tooltip');
      const r = el.getBoundingClientRect(), t = tooltip.getBoundingClientRect();
      let x = r.right + 10; if (x + t.width > innerWidth - 8) x = r.left - t.width - 10;
      tooltip.style.left = Math.max(8, Math.min(x, innerWidth - t.width - 8)) + 'px';
      tooltip.style.top = Math.max(8, Math.min(r.top, innerHeight - t.height - 8)) + 'px';
    }, 350);
  }
  function announce(text) { clearTimeout(statusTimer); ui.querySelector('#status').textContent = text; statusTimer = setTimeout(() => {ui.querySelector('#status').textContent = '';}, 3500); }
  function button(parent, id, label, image, tip, action) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'control'; b.id = id; b.setAttribute('aria-label', label); b.dataset.tip = tip;
    b.appendChild(icon(image)); const text = document.createElement('span'); text.textContent = label; b.appendChild(text);
    b.addEventListener('pointerenter', () => showTip(b)); b.addEventListener('pointerleave', hideTip); b.addEventListener('focus', () => showTip(b)); b.addEventListener('blur', hideTip);
    b.addEventListener('click', () => {hideTip(); action();}); parent.appendChild(b); return b;
  }
  function dialog(title) {
    const d = document.createElement('dialog'); const h = document.createElement('h2'); h.textContent = title; h.id = 'heading-' + document.querySelectorAll('dialog').length; d.setAttribute('aria-labelledby', h.id); d.appendChild(h); document.body.appendChild(d); return d;
  }
  function closeButton(d) { const row=document.createElement('div');row.className='dialog-actions'; const b=document.createElement('button'); b.textContent='Close'; b.addEventListener('click',()=>d.close());row.appendChild(b);d.appendChild(row); }
  window.addEventListener('resize', hideTip);
  window.addEventListener('simulator-ready', function (event) {
    const sim = event.detail.sim, Builder = event.detail.BoardBuilder, board = sim.board, bar = sim.actionbar;
    sim.classroomControls = true; sim.refreshLayout();
    const toolButtons = [];
    function sync() {
      toolButtons.forEach(pair => pair[0].setAttribute('aria-pressed', pair[1].isToggled ? 'true' : 'false'));
      zin.disabled = !bar.canZoomIn; zout.disabled = !bar.canZoomOut; faster.disabled = !bar.canGoFaster; slower.disabled = !bar.canGoSlower;
      speed.textContent = board.speed === 0 ? 'Paused — click Faster to resume' : 'Speed: ' + board.speed + '×';
      schematic.setAttribute('aria-pressed', board.schematic ? 'true' : 'false');
    }
    function choose(index) { sim.toolbar.onButtonClick(sim.toolbar._buttons[index]); sync(); }
    function tool(parent,id,label,image,tip,index) { const b=button(parent,id,label,image,tip,()=>choose(index));toolButtons.push([b,sim.toolbar._buttons[index]]);return b; }
    tool(ui.querySelector('#tools'),'select-flip','Select / Flip','hand','Click a component to flip it. Drag a component to move it. Click a marble release to start.',0);
    tool(ui.querySelector('#tools'),'remove-part','Remove part','eraser','Remove a component. Board pegs and fixed board pieces stay in place.',1);
    const partSpecs = [
      ['ramp','Ramp','Ramp-t','Direct marbles left or right.',2],
      ['crossover','Crossover','Crossover-t','Let two marble paths cross.',3],
      ['interceptor','Interceptor','Interceptor-t','Catch a marble to stop the machine.',4],
      ['bit','Bit','Bit-t','Route a marble, then flip direction for the next marble.',5],
      ['gear-bit','Gear bit','Gearbit-t','A bit whose state is linked to other gear bits through gears.',6],
      ['gear','Gear','Gear-t','Connect gear bits. Marbles do not operate plain gears.',7],
      ['add-marbles','Add marbles','marbles','Click the blue or red holding area to add one matching marble. The preview changes color to match the supply.',8]
    ];
    partSpecs.forEach(s=>tool(ui.querySelector('#parts'),s[0],s[1],s[2],s[3]+' Select, then click a peg to place. Click the selected tool again to flip its orientation.',s[4]));
    const hint=document.createElement('p');hint.className='hint';hint.textContent='Select / Flip: click to flip a part; drag to move it.';ui.querySelector('#parts').appendChild(hint);
    const actions=ui.querySelector('#actions');
    const zin=button(actions,'zoom-in','Zoom in','zoomin','Enlarge the view without changing the board.',()=>{bar.zoomIn();sync();});
    const zout=button(actions,'zoom-out','Zoom out','zoomout','Show more of the board without changing its size.',()=>{bar.zoomOut();sync();});
    button(actions,'fit-board','Fit board to screen','fit','Adjust zoom and center the view so the entire board fits on screen. Peg count stays the same.',()=>{bar.zoomToFit();sync();});
    actions.appendChild(document.createElement('hr'));
    const faster=button(actions,'faster','Faster','faster','Increase marble speed. At the slowest setting, this resumes the machine.',()=>{bar.goFaster();sync();});
    const slower=button(actions,'slower','Slower','slower','Decrease marble speed. The lowest setting pauses the machine.',()=>{bar.goSlower();sync();});
    button(actions,'return-marbles','Return marbles','marbles','Return marbles to their supplies. Keep placed parts and their current orientations.',()=>{board.returnBalls();announce('Marbles returned. Component states kept.');});
    const speed=document.createElement('p');speed.className='speed';speed.setAttribute('aria-live','polite');actions.appendChild(speed);
    const reset=dialog('Reset all?');
    const explanation=document.createElement('p');explanation.textContent='Remove all placed components and restore the standard board, marble supplies, physical view, and normal speed. This cannot be undone.';reset.appendChild(explanation);
    const rr=document.createElement('div');rr.className='dialog-actions';const cancel=document.createElement('button');cancel.textContent='Cancel';cancel.autofocus=true;cancel.addEventListener('click',()=>reset.close());rr.appendChild(cancel);
    const confirm=document.createElement('button');confirm.textContent='Reset all';confirm.className='primary';confirm.id='confirm-reset';confirm.addEventListener('click',()=>{board.schematic=false;board.allowBoardResize=false;resizeCheck.checked=false;board.speed=1;Builder.initStandardBoard(board);choose(0);bar.zoomToFit();sync();reset.close();announce('Standard board restored.');});rr.appendChild(confirm);reset.appendChild(rr);
    const resetButton=button(ui.querySelector('#reset-slot'),'reset-all','Reset all','reset','Clear all placed parts and restore the standard board and marble supplies. You will be asked to confirm.',()=>reset.showModal());resetButton.classList.add('reset');
    const advanced=dialog('Advanced controls');
    let h=document.createElement('h3');h.textContent='Display';advanced.appendChild(h);
    const schematic=button(advanced,'schematic','Schematic view','schematic','Switch between physical animation and a simplified schematic. Switching returns marbles to the top.',()=>{board.schematic=!board.schematic;sim.toolbar.updateToggled();sync();});
    const resizeLabel=document.createElement('label');resizeLabel.className='check';const resizeCheck=document.createElement('input');resizeCheck.type='checkbox';resizeCheck.addEventListener('change',()=>{board.allowBoardResize=resizeCheck.checked;});resizeLabel.appendChild(resizeCheck);resizeLabel.appendChild(document.createTextNode('Allow resizing by dragging board edges'));advanced.appendChild(resizeLabel);
    h=document.createElement('h3');h.textContent='Extra building tools';advanced.appendChild(h);const extra=document.createElement('div');extra.className='dialog-grid';advanced.appendChild(extra);
    [['supply','Marble supply','Drop-t',9],['release-lever','Release lever','Turnstile-t',10],['wall','Wall','Side-t',11],['slope','Slope','Slope-t',12]].forEach(s=>{const b=tool(extra,s[0],s[1],s[2],'Select this extra part, then click the board to place it.',s[3]); b.addEventListener('click',()=>advanced.close());});
    h=document.createElement('h3');h.textContent='Save and reopen';advanced.appendChild(h);
    button(advanced,'save-board','Save board file','download','Download a board configuration file. It is a PNG data file, not a screenshot.',()=>board.serializer.download());
    button(advanced,'open-board','Open board file','upload','Replace this board with a previously saved simulator PNG file.',()=>{if(window.confirm('Opening a board file will replace your current board. Continue?')){advanced.close();board.serializer.upload(restored=>{if(restored){bar.zoomToFit();sim.toolbar.updateToggled();sync();announce('Board file opened.');}});}});
    closeButton(advanced);
    button(ui.querySelector('#more'),'advanced','Advanced','advanced','Extra tools, schematic view, optional resizing, and save/open controls.',()=>advanced.showModal());
    const help=dialog('Using the simulator');
    help.insertAdjacentHTML('beforeend','<ul><li><strong>Build:</strong> select a part, then click a valid peg. Click its toolbar button again to change the placement orientation.</li><li><strong>Select / Flip:</strong> click a placed component to flip it; drag it to move it. Click a marble release to start.</li><li><strong>Add marbles:</strong> select the marbles button below Gear, then click either top holding area to add one marble. The preview and added marble match that supply’s color. Clicking an existing marble adds another; it does not delete it. Reset all starts with eight blue and eight red marbles.</li><li><strong>Remove part:</strong> click or drag over placed components. Pegs and fixed board pieces are protected.</li><li><strong>Fit board to screen:</strong> reset the view to show the entire board. It does not add or remove pegs.</li><li><strong>Faster / Slower:</strong> change animation speed. The slowest setting pauses; Faster resumes.</li><li><strong>Return marbles:</strong> put marbles back at the top, keeping the current component states.</li><li><strong>Reset all:</strong> clear the machine and restore the standard starting board after confirmation.</li><li><strong>Move the view:</strong> drag empty board space. Use Advanced to enable board-edge resizing.</li></ul><p>Hover over a button or focus it with Tab for an explanation. On narrow screens, Help explains the compact icon controls.</p><p>Simulation and component artwork adapted from <a href="https://github.com/jessecrossen/ttsim" target="_blank" rel="noopener noreferrer">Jesse Crossen’s Turing Tumble Simulator</a>.</p>');closeButton(help);
    button(ui.querySelector('#more'),'help','Help','help','Read instructions for building, flipping, running, and resetting machines.',()=>help.showModal());
    const credit=document.createElement('p');credit.className='credit';credit.innerHTML='Upper Story classroom edition<br>Based on <a href="https://github.com/jessecrossen/ttsim" target="_blank" rel="noopener noreferrer">Jesse Crossen’s simulator</a>';ui.querySelector('#more').appendChild(credit);
    ui.classList.add('ready');bar.zoomToFit();sync();
    // Keep button states in sync after canvas interactions and imported boards.
    document.addEventListener('pointerup',()=>setTimeout(sync,0));
    window.addEventListener('resize',()=>{sim.refreshLayout();bar.zoomToFit();sync();});
  }, {once:true});
})();
