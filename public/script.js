  const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;

  // scroll lock while the device session is running — the real Calculator
  // (src/calculator.tsx) dispatches 'astra:session-done' once it finishes.
  function lockScroll(){
    document.documentElement.classList.add('lock-scroll');
    document.body.classList.add('lock-scroll');
  }
  function unlockScroll(){
    document.documentElement.classList.remove('lock-scroll');
    document.body.classList.remove('lock-scroll');
  }
  lockScroll();
  addEventListener('astra:session-done',unlockScroll,{once:true});

  // reveal
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{threshold:.15});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

  // live dashboard demo — plays once the dashboard scrolls into view. In this
  // reduced page that only happens after the real session has finished (the
  // device auto-scrolls down to it), so it always runs to reveal the results.
  (function(){
    const root=document.getElementById('liveDash');
    if(!root)return;
    const CIRC=264;
    const nums=[...root.querySelectorAll('.num')];
    const statusEl=root.querySelector('#dStatus');
    const ring=root.querySelector('#readyRing');
    const readyPct=root.querySelector('#readyPct');
    const alertsEl=root.querySelector('#dAlerts');
    const aiEl=root.querySelector('#dAI');
    const AI_PLACEHOLDER='AI analysis will appear here after session completes…';
    const AI_TEXT='Cognitive readiness is optimal for complex tasks. Focus and performance are strong, with manageable stress levels.';
    const ALERTS=[
      ['14:08:18','Connected to session ABC123. Waiting for astronaut…'],
      ['14:08:20','Biometrics stream initialized.'],
      ['14:09:12','Mental math protocol started (Easy tier).'],
      ['14:11:47','Session complete. Compiling analysis…']
    ];

    function sleep(ms){return new Promise(r=>setTimeout(r,ms));}

    function animateNum(el,to,decimals,dur){
      if(reduce){el.textContent=decimals?to.toFixed(decimals):Math.round(to);return;}
      let s=null;
      function step(t){
        if(!s)s=t;
        const p=Math.min((t-s)/(dur||900),1);
        const v=to*(1-Math.pow(1-p,3));
        el.textContent=decimals?v.toFixed(decimals):Math.round(v);
        if(p<1)requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    function animateRingPct(to,dur){
      if(reduce){readyPct.textContent=to+'%';return;}
      let s=null;
      function step(t){
        if(!s)s=t;
        const p=Math.min((t-s)/(dur||1200),1);
        readyPct.textContent=Math.round(to*(1-Math.pow(1-p,3)))+'%';
        if(p<1)requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    function addAlert(ts,msg){
      const d=document.createElement('div');
      d.className='dalert';
      d.innerHTML='<span class="ts">['+ts+']</span>'+msg;
      alertsEl.appendChild(d);
    }
    function resetDash(){
      nums.forEach(n=>{const dec=n.dataset.decimals?+n.dataset.decimals:0;n.textContent=dec?(0).toFixed(dec):'0';});
      root.querySelectorAll('.dready-bars .fill,.dbio .fill').forEach(f=>f.style.width='0%');
      ring.style.strokeDashoffset=CIRC;
      readyPct.textContent='0%';
      statusEl.classList.remove('active');statusEl.classList.add('waiting');
      statusEl.innerHTML='<span class="sdot"></span>Waiting';
      alertsEl.innerHTML='';
      aiEl.textContent=AI_PLACEHOLDER;
      aiEl.classList.remove('ready');
    }

    let running=false, playedOnce=false;
    async function sequence(){
      if(running||playedOnce)return;
      running=true;
      resetDash();
      await sleep(900);

      statusEl.classList.remove('waiting');statusEl.classList.add('active');
      statusEl.innerHTML='<span class="sdot"></span>Active';
      root.querySelectorAll('.dbio .num').forEach(n=>{
        const dec=n.dataset.decimals?+n.dataset.decimals:0;
        animateNum(n,+n.dataset.target,dec);
      });
      addAlert(...ALERTS[0]);
      await sleep(650);

      addAlert(...ALERTS[1]);
      await sleep(900);

      ring.style.strokeDashoffset=CIRC*(1-.72);
      animateRingPct(72,1200);
      root.querySelectorAll('.dready-bars .fill').forEach(f=>f.style.width=f.dataset.target+'%');
      root.querySelectorAll('.dready-bars .num').forEach(n=>animateNum(n,+n.dataset.target,0,1100));
      await sleep(650);

      addAlert(...ALERTS[2]);
      await sleep(900);

      // Performance bars are driven by the live session — skip fake demo scores.
      addAlert(...ALERTS[3]);
      await sleep(900);

      aiEl.classList.add('ready');
      aiEl.textContent=AI_TEXT;
      playedOnce=true;
      running=false;
    }

    if(reduce){
      nums.forEach(n=>{const dec=n.dataset.decimals?+n.dataset.decimals:0;n.textContent=dec?(+n.dataset.target).toFixed(dec):n.dataset.target;});
      root.querySelectorAll('.dready-bars .fill').forEach(f=>f.style.width=f.dataset.target+'%');
      ring.style.strokeDashoffset=CIRC*(1-.72);
      readyPct.textContent='72%';
      statusEl.classList.remove('waiting');statusEl.classList.add('active');
      statusEl.innerHTML='<span class="sdot"></span>Active';
      ALERTS.forEach(([ts,msg])=>addAlert(ts,msg));
      aiEl.textContent=AI_TEXT;
      aiEl.classList.add('ready');
      playedOnce=true;
    }else{
      new IntersectionObserver(es=>es.forEach(e=>{
        if(e.isIntersecting)sequence();
      }),{threshold:.25}).observe(root);
    }
  })();
