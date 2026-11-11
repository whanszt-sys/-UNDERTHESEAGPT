/* Locally synthesized, light water ambience. Sound starts only after a user gesture. */
class CalmOceanAudio {
 constructor(){this.context=null;this.master=null;this.enabled=false;this.ducked=false;this.volume=.20;this.sources=[]}
 async initialize(){
  if(this.context)return;
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)throw new Error('Web Audio unavailable');
  const ctx=new AC();this.context=ctx;this.master=ctx.createGain();this.master.gain.value=0;
  const compressor=ctx.createDynamicsCompressor();compressor.threshold.value=-22;compressor.knee.value=28;compressor.ratio.value=2;compressor.attack.value=.3;compressor.release.value=1.5;this.master.connect(compressor);compressor.connect(ctx.destination);
  // A seamless, quiet water texture with no sustained notes or bass drones.
  const seconds=24,n=Math.floor(ctx.sampleRate*seconds),overlap=Math.floor(ctx.sampleRate*2),buffer=ctx.createBuffer(2,n,ctx.sampleRate);
  for(let channel=0;channel<2;channel++){
   const raw=new Float32Array(n+overlap);let b0=0,b1=0,b2=0;
   for(let i=0;i<raw.length;i++){const white=Math.random()*2-1;b0=.99765*b0+white*.099046;b1=.963*b1+white*.2965164;b2=.57*b2+white*1.0526913;raw[i]=(b0+b1+b2+white*.1848)*.055}
   const out=buffer.getChannelData(channel);
   for(let i=0;i<n;i++){let sample=raw[i+overlap];if(i>=n-overlap){const j=i-(n-overlap),t=j/(overlap-1);sample=sample*Math.cos(t*Math.PI/2)+raw[j]*Math.sin(t*Math.PI/2)}const expression=.93+.04*Math.sin(i/n*Math.PI*2+channel*.8);out[i]=sample*expression}
  }
  const sea=ctx.createBufferSource();sea.buffer=buffer;sea.loop=true;
  const low=ctx.createBiquadFilter();low.type='lowpass';low.frequency.value=1800;low.Q.value=.45;
  const high=ctx.createBiquadFilter();high.type='highpass';high.frequency.value=220;high.Q.value=.45;
  const texture=ctx.createGain();texture.gain.value=.55;sea.connect(high);high.connect(low);low.connect(texture);texture.connect(this.master);sea.start();this.sources.push(sea);
 }
 apply(fade=1.2){if(!this.master)return;const now=this.context.currentTime;const level=this.enabled?this.volume*.6*(this.ducked?.12:1):0;this.master.gain.cancelScheduledValues(now);this.master.gain.setTargetAtTime(level,now,fade)}
 async setEnabled(enabled){if(enabled){await this.initialize();await this.context.resume()}this.enabled=enabled;this.apply(enabled?1.8:.8)}
 setVolume(volume){this.volume=Math.max(0,Math.min(1,volume));this.apply(.4)}
 duck(ducked){this.ducked=ducked;this.apply(.5)}
 suspend(){return this.context?.suspend()}
 resume(){if(this.enabled)return this.context?.resume()}
}
/* Slow, independent swimming paths; pausing preserves the exact animation position. */
class SlowAnimalSwim {
 constructor(elements){this.paused=false;this.dialogOpen=false;this.items=elements.map((element,index)=>{const item={element,index,hover:false,focus:false,touch:false,animation:null};element.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch'){item.hover=true;this.sync(item)}});element.addEventListener('pointerleave',()=>{item.hover=false;this.sync(item)});element.addEventListener('focusin',()=>{item.focus=true;this.sync(item)});element.addEventListener('focusout',()=>{item.focus=false;this.sync(item)});element.addEventListener('pointerdown',()=>{item.touch=true;this.sync(item)},{passive:true});const release=()=>{item.touch=false;this.sync(item)};element.addEventListener('pointerup',release,{passive:true});element.addEventListener('pointercancel',release,{passive:true});return item});this.rebuild();let timer;addEventListener('resize',()=>{clearTimeout(timer);timer=setTimeout(()=>this.rebuild(),180)},{passive:true})}
 rebuild(){const small=innerWidth<=700;for(const item of this.items){const progress=item.animation?.currentTime||0;item.animation?.cancel();const phase=item.index*2.39996,ax=small?10:20+(item.index%3)*3,ay=small?12:20+(item.index%4)*2;const keys=Array.from({length:49},(_,j)=>{const t=j/48*Math.PI*2;const x=ax*(Math.sin(t+phase)*.72+Math.sin(2*t-phase)*.28),y=ay*(Math.cos(t-phase)*.7+Math.sin(3*t+phase)*.3),r=Math.sin(t+phase)*1.25;return {transform:`translate3d(${x.toFixed(3)}px,${y.toFixed(3)}px,0) rotate(${r.toFixed(3)}deg)`}});if(item.element.animate){item.animation=item.element.animate(keys,{duration:70000+(item.index%7)*7000,iterations:Infinity,easing:'linear'});item.animation.currentTime=progress}else item.element.classList.add('swim-css-fallback');this.sync(item)}}
 sync(item){const paused=this.paused||this.dialogOpen||document.hidden||item.hover||item.focus||item.touch;item.element.classList.toggle('is-swim-paused',paused);if(item.animation){if(paused)item.animation.pause();else item.animation.play()}}
 setPaused(value){this.paused=value;this.refresh()}
 setDialogOpen(value){this.dialogOpen=value;this.refresh()}
 refresh(){this.items.forEach(item=>this.sync(item))}
}
