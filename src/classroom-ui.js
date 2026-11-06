/* Upper Story classroom controls. Original simulation and part artwork: Jesse Crossen.
   This adapter uses the existing toolbar controllers so simulation behavior is retained. */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const paths = {
    challenges: '<path d="M6 4h20v24H6zM11 10h10M11 16h10M11 22h6"/>',
    instructions: '<path d="M3 5h10l3 3 3-3h10v22H19l-3 3-3-3H3zM16 8v22M6 10h6M6 15h6M20 10h6M20 15h6"/>',
    play: '<path fill="currentColor" d="M9 5l19 11L9 27z"/>',
    pause: '<path fill="currentColor" d="M8 5h5v22H8zM20 5h5v22h-5z"/>',
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
    const img = document.createElement('img'); img.src = name === 'release-lever' ? 'images/release-lever.svg' : 'images/usage/' + name + '.png'; img.alt = ''; img.draggable = false; return img;
  }
  const ui = document.createElement('div'); ui.id = 'classroom-ui';
  ui.innerHTML = '<h1 id="simulator-title"><img src="images/turing-tumble-logo.png" alt="Turing Tumble"></h1><aside class="sidebar left" aria-label="Building tools"><div id="instructions-slot"></div><div id="challenge-slot"></div><p id="current-challenge" class="current-challenge" hidden></p><section class="panel" id="tools"><h2>TOOLS</h2></section><section class="panel" id="parts"><h2>PARTS</h2></section></aside><div class="brand"><img src="images/upper-story-logo.png" alt="Upper Story"><a href="https://www.upperstory.com/en/turingtumble/" target="_blank" rel="noopener noreferrer">Learn More About Turing Tumble</a></div><aside class="sidebar right" aria-label="Simulation controls"><div id="reset-slot"></div><section class="panel" id="actions"></section><div class="bottom" id="more"></div></aside><div id="transport" aria-label="Playback controls"></div><div id="tooltip" role="tooltip" hidden></div><div id="status" role="status" aria-live="polite"></div>';
  document.body.appendChild(ui);
  const tooltip = ui.querySelector('#tooltip');
  let tipOwner = null, tipTimer = 0, statusTimer = 0, boardTipActive = false;
  function hideTip() { boardTipActive = false; clearTimeout(tipTimer); tooltip.hidden = true; if (tipOwner) tipOwner.removeAttribute('aria-describedby'); tipOwner = null; }
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
    const sim = event.detail.sim, Builder = event.detail.BoardBuilder, Challenges = event.detail.Challenges, board = sim.board, bar = sim.actionbar;
    let boardTipX=0,boardTipY=0;
    function positionBoardTip(){
      const t=tooltip.getBoundingClientRect();
      tooltip.style.left=Math.max(8,Math.min(boardTipX+14,innerWidth-t.width-8))+'px';
      tooltip.style.top=Math.max(8,Math.min(boardTipY+16,innerHeight-t.height-8))+'px';
    }
    board.onStartControlHover=(active,x,y)=>{
      if(!active){if(boardTipActive)hideTip();return;}
      boardTipX=x;boardTipY=y;
      if(boardTipActive){if(!tooltip.hidden)positionBoardTip();return;}
      hideTip();boardTipActive=true;
      tipTimer=setTimeout(()=>{if(!boardTipActive)return;tooltip.textContent='Press to Start';tooltip.hidden=false;positionBoardTip();},350);
    };
    const boardSurface=document.querySelector('#container');
    boardSurface.addEventListener('pointerleave',()=>{if(boardTipActive)hideTip();});
    boardSurface.addEventListener('pointerdown',hideTip);
    window.addEventListener('blur',hideTip);
    sim.classroomControls = true; sim.refreshLayout();
    const toolButtons = [];
    let lastPlayingSpeed = board.speed || 1;
    function sync() {
      if(board.speed>0)lastPlayingSpeed=board.speed;
      playButton.disabled=board.speed>0;pauseButton.disabled=board.speed===0;
      toolButtons.forEach(pair => pair[0].setAttribute('aria-pressed', pair[1].isToggled ? 'true' : 'false'));
      zin.disabled = !bar.canZoomIn; zout.disabled = !bar.canZoomOut; faster.disabled = !bar.canGoFaster; slower.disabled = !bar.canGoSlower;
      speed.textContent = board.speed === 0 ? 'Paused — click Faster to resume' : 'Speed: ' + board.speed + '×';
      schematic.setAttribute('aria-pressed', board.schematic ? 'true' : 'false');
      syncChallenges();
    }
    const playButton=button(ui.querySelector('#transport'),'play','Play','play','Resume at the previously selected speed.',()=>{board.speed=lastPlayingSpeed;sync();});
    const pauseButton=button(ui.querySelector('#transport'),'pause','Pause','pause','Pause marble motion. Keep the board and current sequence.',()=>{if(board.speed>0)lastPlayingSpeed=board.speed;board.speed=0;sync();});
    function choose(index) { if(board.challengeId && index >= 8) return; sim.toolbar.onButtonClick(sim.toolbar._buttons[index]); sync(); }
    function tool(parent,id,label,image,tip,index) { const b=button(parent,id,label,image,tip,()=>choose(index));toolButtons.push([b,sim.toolbar._buttons[index]]);return b; }
    tool(ui.querySelector('#tools'),'select-flip','Select / Flip','hand','Click a component to flip it. Drag a component to move it. Click a black circular releaser at the top to release one marble. Let it return before clicking again.',0);
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
    partSpecs.forEach(s=>{
      let tip = s[3];
      if (s[0] === 'add-marbles') tip = 'Click the blue or red holding area to add one matching marble.';
      else {
        tip += ' Select, then click a peg to place.';
        if (s[0] !== 'interceptor' && s[0] !== 'gear' && s[0] !== 'crossover') tip += ' Press F or click the selected tool again to flip the placement preview.';
      }
      tool(ui.querySelector('#parts'),s[0],s[1],s[2],tip,s[4]);
    });
    const hint=document.createElement('p');hint.className='hint';hint.textContent='Press F to flip the selected placement preview. Select / Flip: click to flip a part; drag to move it.';ui.querySelector('#parts').appendChild(hint);
    const actions=ui.querySelector('#actions');
    const zin=button(actions,'zoom-in','Zoom in','zoomin','Enlarge the view without changing the board.',()=>{bar.zoomIn();sync();});
    const zout=button(actions,'zoom-out','Zoom out','zoomout','Show more of the board without changing its size.',()=>{bar.zoomOut();sync();});
    button(actions,'fit-board','Fit board to screen','fit','Adjust zoom and center the view so the entire board fits on screen. Peg count stays the same.',()=>{bar.zoomToFit();sync();});
    actions.appendChild(document.createElement('hr'));
    const faster=button(actions,'faster','Faster','faster','Increase marble speed. At the slowest setting, this resumes the machine.',()=>{bar.goFaster();sync();});
    const slower=button(actions,'slower','Slower','slower','Decrease marble speed. The lowest setting pauses the machine.',()=>{bar.goSlower();sync();});
    button(actions,'return-marbles','Return marbles','marbles','Return marbles to their supplies. Keep placed parts and their current orientations.',()=>{board.returnBalls();announce('Marbles returned. Component states kept.');});
    const restartButton=button(actions,'restart-challenge','Restart challenge','reset','Restore this challenge’s starting layout, part allowance, and marble supplies. Your solution will be cleared.',()=>restartChallenge());
    restartButton.hidden=true;
    const speed=document.createElement('p');speed.className='speed';speed.setAttribute('aria-live','polite');actions.appendChild(speed);
    const reset=dialog('Reset all?');
    const explanation=document.createElement('p');explanation.textContent='Remove all placed components and restore the standard board, marble supplies, physical view, and normal speed. This cannot be undone.';reset.appendChild(explanation);
    const rr=document.createElement('div');rr.className='dialog-actions';const cancel=document.createElement('button');cancel.textContent='Cancel';cancel.autofocus=true;cancel.addEventListener('click',()=>reset.close());rr.appendChild(cancel);
    const confirm=document.createElement('button');confirm.textContent='Reset all';confirm.className='primary';confirm.id='confirm-reset';confirm.addEventListener('click',()=>{board.schematic=false;board.allowBoardResize=false;resizeCheck.checked=false;board.speed=1;Builder.initStandardBoard(board);choose(0);bar.zoomToFit();sync();reset.close();announce('Standard board restored.');});rr.appendChild(confirm);reset.appendChild(rr);
    const resetButton=button(ui.querySelector('#reset-slot'),'reset-all','Reset all','reset','Clear all placed parts and restore the standard board and marble supplies. You will be asked to confirm.',()=>reset.showModal());resetButton.classList.add('reset');
    const advanced=dialog('Advanced controls');
    let h=document.createElement('h3');h.textContent='Display';advanced.appendChild(h);
    const schematic=button(advanced,'schematic','Schematic view','schematic','Switch between physical animation and a simplified schematic. Switching returns marbles to the top.',()=>{board.schematic=!board.schematic;sim.toolbar.updateToggled();sync();});
    const resizeLabel=document.createElement('label');resizeLabel.className='check';const resizeCheck=document.createElement('input');resizeCheck.type='checkbox';resizeCheck.addEventListener('change',()=>{board.allowBoardResize=resizeCheck.checked && !board.challengeId;});resizeLabel.appendChild(resizeCheck);resizeLabel.appendChild(document.createTextNode('Allow resizing by dragging board edges'));advanced.appendChild(resizeLabel);
    h=document.createElement('h3');h.textContent='Extra building tools';advanced.appendChild(h);const extra=document.createElement('div');extra.className='dialog-grid';advanced.appendChild(extra);
    [['supply','Marble supply','Drop-t',9],['release-lever','Release lever','release-lever',10],['wall','Wall','Side-t',11],['slope','Slope','Slope-t',12]].forEach(s=>{const b=tool(extra,s[0],s[1],s[2],'Select this extra part, then click the board to place it. Press F to flip its placement preview.',s[3]); b.addEventListener('click',()=>advanced.close());});
    h=document.createElement('h3');h.textContent='Save and reopen';advanced.appendChild(h);
    button(advanced,'save-board','Save board file','download','Download a board configuration file. It is a PNG data file, not a screenshot.',()=>board.serializer.download());
    button(advanced,'open-board','Open board file','upload','Replace this board with a previously saved simulator PNG file.',()=>{if(window.confirm('Opening a board file will replace your current board. Continue?')){advanced.close();board.serializer.upload(restored=>{if(restored){bar.zoomToFit();sim.toolbar.updateToggled();sync();announce('Board file opened.');}});}});
    closeButton(advanced);
    button(ui.querySelector('#more'),'advanced','Advanced','advanced','Extra tools, schematic view, optional resizing, and save/open controls.',()=>advanced.showModal());
    const instructions=dialog('Using the simulator');
    instructions.insertAdjacentHTML('beforeend','<ul><li><strong>Challenges:</strong> choose a book challenge to load its starting layout, limited parts, and objective. Use Restart challenge to restore the puzzle, or choose Free build in Challenges for unrestricted building.</li><li><strong>Build:</strong> select a part, then click a valid peg. Press F or click its toolbar button again to change the placement orientation (where applicable).</li><li><strong>Select / Flip:</strong> click a placed component to flip it; drag it to move it. Click a black circular releaser at the top to release one marble. Let it return before clicking again.</li><li><strong>Add marbles:</strong> select the marbles button below Gear, then click either top holding area to add one marble. The preview and added marble match that supply’s color. Clicking an existing marble adds another; it does not delete it. Reset all starts with eight blue and eight red marbles.</li><li><strong>Remove part:</strong> click or drag over placed components. Pegs and fixed board pieces are protected.</li><li><strong>Fit board to screen:</strong> reset the view to show the entire board. It does not add or remove pegs.</li><li><strong>Faster / Slower:</strong> change animation speed. The slowest setting pauses; Faster resumes.</li><li><strong>Play / Pause:</strong> use the buttons below the board to pause and resume at your selected speed.</li><li><strong>Return marbles:</strong> put marbles back at the top, keeping the current component states.</li><li><strong>Output register:</strong> collected marbles stay in a single file, with room for 40. Read the sequence from the first marble at the right-hand stop toward the left.</li><li><strong>Reset all:</strong> clear the machine and restore the standard starting board after confirmation.</li><li><strong>Move the view:</strong> drag empty board space. Use Advanced to enable board-edge resizing.</li></ul><p>Hover over a button or focus it with Tab for an explanation. On narrow screens, Instructions explains the compact icon controls.</p><p>Simulation and component artwork adapted from <a href="https://github.com/jessecrossen/ttsim" target="_blank" rel="noopener noreferrer">Jesse Crossen’s Turing Tumble Simulator</a>.</p>');closeButton(instructions);
    button(ui.querySelector('#instructions-slot'),'instructions','Instructions','instructions','Read instructions for building and using the simulator.',()=>{if(board.challengeId)showChallengeInstructions();else instructions.showModal();});
    const help=dialog('Support');
    help.insertAdjacentHTML('beforeend','<p>For support, contact <a href="mailto:hello@upperstory.com">hello@upperstory.com</a>.</p>');closeButton(help);
    button(ui.querySelector('#more'),'help','Help','help','Contact Upper Story for simulator support.',()=>help.showModal());

    window.addEventListener('keydown',event=>{
      const target=event.target;
      if(event.key.toLowerCase()!=='f'||event.repeat||event.ctrlKey||event.metaKey||event.altKey||
          (target&&target.closest&&target.closest('input,textarea,select,[contenteditable="true"]'))||document.querySelector('dialog[open]'))return;
      const current=toolButtons.find(pair=>pair[1].isToggled);
      if(!current||['interceptor','gear','add-marbles','select-flip','remove-part'].includes(current[0].id))return;
      event.preventDefault();sim.toolbar.onButtonClick(current[1]);sync();
    });

    const challengesDialog=dialog('Choose a challenge');challengesDialog.id='challenge-picker';
    const intro=document.createElement('p');intro.textContent='The first 30 challenges from the Turing Tumble puzzle book. Select a challenge to load its starting setup and allowed parts.';challengesDialog.appendChild(intro);
    const variableForm=document.createElement('div');variableForm.className='challenge-variable';variableForm.hidden=true;
    const variableLabel=document.createElement('label');variableLabel.textContent='Blue marbles for this test: ';variableLabel.htmlFor='challenge-blue-count';
    const variableInput=document.createElement('input');variableInput.id='challenge-blue-count';variableInput.type='number';variableInput.min='0';variableInput.step='1';variableInput.value='8';variableLabel.appendChild(variableInput);variableForm.appendChild(variableLabel);
    const applyCount=document.createElement('button');applyCount.type='button';applyCount.textContent='Apply and return marbles';
    applyCount.addEventListener('click',()=>{
      const def=Challenges.find(board.challengeId),count=Number(variableInput.value);
      if(!def||!def.variableMax||variableInput.value.trim()===''||!Number.isInteger(count)||count<0||count>def.variableMax){variableInput.setCustomValidity('Enter a whole number from 0 to '+(def?def.variableMax:0)+'.');variableInput.reportValidity();return;}
      variableInput.setCustomValidity('');board.returnBalls();for(const drop of board.drops)board.setDropBallCount(drop,drop.isFlipped?0:count);sync();announce('Marbles returned. Testing with '+count+' blue marbles.');
    });variableForm.appendChild(applyCount);challengesDialog.appendChild(variableForm);
    const list=document.createElement('div');list.className='challenge-list';challengesDialog.appendChild(list);
    Challenges.definitions.forEach(def=>{
      const b=document.createElement('button');b.type='button';b.className='challenge-choice';b.dataset.challenge=String(def.id);
      const title=document.createElement('strong');title.textContent=def.id+'. '+def.name;b.appendChild(title);
      const detail=document.createElement('span');detail.textContent='Book page '+def.page;b.appendChild(detail);
      b.addEventListener('click',()=>{
        if(hasWork()&&!window.confirm('Loading this challenge will replace your current board and output. Continue?'))return;
        Challenges.load(board,def.id);prepareChallenge();challengesDialog.close();showChallengeInstructions();
      });list.appendChild(b);
    });
    const pickerActions=document.createElement('div');pickerActions.className='dialog-actions';
    const freeBuild=document.createElement('button');freeBuild.id='free-build';freeBuild.textContent='Free build';
    freeBuild.addEventListener('click',()=>{
      if(hasWork()&&!window.confirm('Return to a clear free-build board? Your current challenge and solution will be cleared.'))return;
      Builder.initStandardBoard(board);prepareChallenge();challengesDialog.close();announce('Free build: all parts are available.');
    });pickerActions.appendChild(freeBuild);challengesDialog.appendChild(pickerActions);closeButton(challengesDialog);
    button(ui.querySelector('#challenge-slot'),'challenges','Challenges','challenges','Choose one of the first 30 book challenges, restart, or return to free build.',()=>{sync();challengesDialog.showModal();});

    const challengeInstructions=dialog('Challenge instructions');challengeInstructions.id='challenge-instructions';
    const challengeContent=document.createElement('div');challengeInstructions.appendChild(challengeContent);closeButton(challengeInstructions);
    function hasWork(){
      if(board.outputRegister.sequence.length||[...board.balls].some(ball=>ball.released))return true;
      for(let r=0;r<board.rowCount;r++)for(let c=0;c<board.columnCount;c++){
        const part=board.getPart(c,r);if(part&&!part.isLocked&&!board.isBackgroundPart(c,r))return true;
      }return false;
    }
    function blueCount(){for(const drop of board.drops)if(!drop.isFlipped)return drop.balls.size;return 0;}
    function prepareChallenge(){
      board.allowBoardResize=false;resizeCheck.checked=false;choose(0);bar.zoomToFit();sync();
    }
    function restartChallenge(){
      if(!board.challengeId)return;
      if(!window.confirm('Restart this challenge? This clears your added parts and output and restores the starting component states.'))return;
      Challenges.load(board,board.challengeId,blueCount());prepareChallenge();showChallengeInstructions();
    }
    function syncChallenges(){
      const def=Challenges.find(board.challengeId),active=!!def;
      restartButton.hidden=!active;resizeCheck.disabled=active;if(active)resizeCheck.checked=false;
      const current=ui.querySelector('#current-challenge');current.hidden=!active;current.textContent=active?'Challenge '+def.id+': '+def.name:'';
      ui.querySelector('#instructions').dataset.tip=active?'Review the objective, required output, and instructions for this challenge.':'Read instructions for building and using the simulator.';
      toolButtons.forEach(pair=>{
        const b=pair[0],spec=partSpecs.find(item=>item[0]===b.id);
        if(spec&&spec[0]!=='add-marbles'){
          const type=spec[4]+1,remaining=board.remainingParts(type);let badge=b.querySelector('.part-count');
          if(!badge){badge=document.createElement('span');badge.className='part-count';b.appendChild(badge);}
          badge.hidden=!active;badge.textContent=remaining===Infinity?'∞':String(remaining);
          b.disabled=active&&remaining===0;b.setAttribute('aria-label',spec[1]+(active?' — '+(remaining===Infinity?'unlimited':remaining+' remaining'):''));
        }else if(b.id==='add-marbles'||['supply','release-lever','wall','slope'].includes(b.id))b.disabled=active;
      });
      variableForm.hidden=!(active&&def.variableMax);if(active&&def.variableMax){variableInput.max=String(def.variableMax);if(document.activeElement!==variableInput)variableInput.value=String(blueCount());}
      list.querySelectorAll('button').forEach(b=>{if(active&&Number(b.dataset.challenge)===def.id)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current');});
    }
    function showChallengeInstructions(){
      const def=Challenges.find(board.challengeId);if(!def)return;
      challengeInstructions.querySelector('h2').textContent='Challenge '+def.id+': '+def.name;
      challengeContent.textContent='';
      const objectiveTitle=document.createElement('h3');objectiveTitle.textContent='Objective';challengeContent.appendChild(objectiveTitle);
      const objective=document.createElement('p');objective.textContent=def.objective;challengeContent.appendChild(objective);
      const page=document.createElement('p');page.className='challenge-book-page';page.textContent='Turing Tumble puzzle book · page '+def.page;challengeContent.appendChild(page);
      if(def.output){
        const heading=document.createElement('h3');heading.textContent='Required output';challengeContent.appendChild(heading);
        const row=document.createElement('div');row.className='required-output';row.setAttribute('role','img');row.setAttribute('aria-label','First to last: '+[...def.output].map(c=>c==='b'?'blue':'red').join(', '));
        [...def.output].forEach(color=>{const marble=document.createElement('span');marble.className='output-marble '+(color==='b'?'blue':'red');row.appendChild(marble);});challengeContent.appendChild(row);
        const direction=document.createElement('p');direction.className='challenge-book-page';direction.textContent='Read from right to left. The first marble stops at the right-hand end.';challengeContent.appendChild(direction);
      }
      const supplies=document.createElement('p');supplies.textContent='Starting supplies: '+blueCount()+' blue and '+[...board.drops].filter(d=>d.isFlipped).reduce((n,d)=>n+d.balls.size,0)+' red marbles.';challengeContent.appendChild(supplies);
      const heading=document.createElement('h3');heading.textContent='Using this challenge';challengeContent.appendChild(heading);
      const rules=document.createElement('ul');
      [
        'Use only the available parts. The number beside each part shows how many remain. Removing one of your parts returns it to the available supply.',
        'Faded starting parts are fixed in position and cannot be removed. Starting Bits and Gear Bits can still be flipped with Select / Flip, and continue to operate when marbles reach them.',
        'Select a part and click a valid peg to place it. Press F to flip the placement preview for a Ramp, Bit, or Gear Bit.',
        def.start==='either'?'Choose either the blue or red releaser to start.':('Press the '+(def.start==='left'?'blue (left)':'red (right)')+' releaser or bottom lever to start. The other manual start control is disabled for this challenge. Bottom levers still release the appropriate next marble during a run.'),
        'Return marbles keeps your construction and current Bit states. Restart challenge restores the starting layout and removes your added parts.',
        'Reopen these instructions with Instructions. Open Challenges to choose another puzzle or return to Free build.'
      ].forEach(text=>{const li=document.createElement('li');li.textContent=text;rules.appendChild(li);});challengeContent.appendChild(rules);
      if(def.variableMax){const note=document.createElement('p');note.textContent='This challenge must work with different numbers of blue marbles. Open Challenges to choose a test supply from 0 to '+def.variableMax+'.';challengeContent.appendChild(note);}
      challengeInstructions.showModal();
    }
    ui.classList.add('ready');bar.zoomToFit();sync();
    if(board.challengeId)showChallengeInstructions();

    // Keep button states in sync after canvas interactions and imported boards.
    document.addEventListener('pointerup',()=>setTimeout(sync,0));
    window.addEventListener('resize',()=>{sim.refreshLayout();bar.zoomToFit();sync();});
  }, {once:true});
})();
