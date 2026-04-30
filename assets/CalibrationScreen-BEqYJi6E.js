import{a as e}from"./rolldown-runtime-COnpUsM8.js";import{f as t,i as n,m as r,t as i}from"./gameStore-BwE8T6Ks.js";import{t as a}from"./BlinkDetector-_ILtGrkb.js";import{_ as o,a as s,c,d as l,f as u,g as d,h as f,i as p,l as m,m as h,n as g,o as _,p as ee,r as v,s as te,t as y,u as ne}from"./postprocessing-2Cdj7RSs.js";var b=e(r(),1),x=t(),re=()=>{let e=document.createElement(`canvas`);e.width=64,e.height=64;let t=e.getContext(`2d`);if(!t)throw Error(`2D context not available`);t.fillStyle=`black`,t.fillRect(0,0,e.width,e.height);let n=new f(e);n.minFilter=m,n.magFilter=m,n.generateMipmaps=!1;let r=[],i=null,a=.1*64,o=()=>{t.fillStyle=`black`,t.fillRect(0,0,e.width,e.height)},s=e=>{let n={x:e.x*64,y:(1-e.y)*64},r=1;r=e.age<64*.3?(e=>Math.sin(e*Math.PI/2))(e.age/(64*.3)):(e=>-e*(e-2))(1-(e.age-64*.3)/(64*.7))||0,r*=e.force;let i=`${(e.vx+1)/2*255}, ${(e.vy+1)/2*255}, ${r*255}`;t.shadowOffsetX=320,t.shadowOffsetY=320,t.shadowBlur=a,t.shadowColor=`rgba(${i},${.22*r})`,t.beginPath(),t.fillStyle=`rgba(255,0,0,1)`,t.arc(n.x-320,n.y-320,a,0,Math.PI*2),t.fill()};return{canvas:e,texture:n,addTouch:e=>{let t=0,n=0,a=0;if(i){let r=e.x-i.x,o=e.y-i.y;if(r===0&&o===0)return;let s=r*r+o*o,c=Math.sqrt(s);n=r/(c||1),a=o/(c||1),t=Math.min(s*1e4,1)}i={x:e.x,y:e.y},r.push({x:e.x,y:e.y,age:0,force:t,vx:n,vy:a})},update:()=>{o();for(let e=r.length-1;e>=0;e--){let t=r[e],n=t.force*.015625*(1-t.age/64);t.x+=t.vx*n,t.y+=t.vy*n,t.age++,t.age>64&&r.splice(e,1)}for(let e=0;e<r.length;e++)s(r[e]);n.needsUpdate=!0},set radiusScale(e){a=.1*64*e},get radiusScale(){return a/(.1*64)},size:64}},ie=(e,t)=>new y(`LiquidEffect`,`
    uniform sampler2D uTexture;
    uniform float uStrength;
    uniform float uTime;
    uniform float uFreq;

    void mainUv(inout vec2 uv) {
      vec4 tex = texture2D(uTexture, uv);
      float vx = tex.r * 2.0 - 1.0;
      float vy = tex.g * 2.0 - 1.0;
      float intensity = tex.b;

      float wave = 0.5 + 0.5 * sin(uTime * uFreq + intensity * 6.2831853);

      float amt = uStrength * intensity * wave;

      uv += vec2(vx, vy) * amt;
    }
    `,{uniforms:new Map([[`uTexture`,new d(e)],[`uStrength`,new d(t?.strength??.025)],[`uTime`,new d(0)],[`uFreq`,new d(t?.freq??4.5)]])}),S={square:0,circle:1,triangle:2,diamond:3},C=`
void main() {
  gl_Position = vec4(position, 1.0);
}
`,w=`
precision highp float;

uniform vec3  uColor;
uniform vec2  uResolution;
uniform float uTime;
uniform float uPixelSize;
uniform float uScale;
uniform float uDensity;
uniform float uPixelJitter;
uniform int   uEnableRipples;
uniform float uRippleSpeed;
uniform float uRippleThickness;
uniform float uRippleIntensity;
uniform float uEdgeFade;

uniform int   uShapeType;
const int SHAPE_SQUARE   = 0;
const int SHAPE_CIRCLE   = 1;
const int SHAPE_TRIANGLE = 2;
const int SHAPE_DIAMOND  = 3;

const int   MAX_CLICKS = 10;

uniform vec2  uClickPos  [MAX_CLICKS];
uniform float uClickTimes[MAX_CLICKS];

out vec4 fragColor;

float Bayer2(vec2 a) {
  a = floor(a);
  return fract(a.x / 2. + a.y * a.y * .75);
}
#define Bayer4(a) (Bayer2(.5*(a))*0.25 + Bayer2(a))
#define Bayer8(a) (Bayer4(.5*(a))*0.25 + Bayer2(a))

#define FBM_OCTAVES     5
#define FBM_LACUNARITY  1.25
#define FBM_GAIN        1.0

float hash11(float n){ return fract(sin(n)*43758.5453); }

float vnoise(vec3 p){
  vec3 ip = floor(p);
  vec3 fp = fract(p);
  float n000 = hash11(dot(ip + vec3(0.0,0.0,0.0), vec3(1.0,57.0,113.0)));
  float n100 = hash11(dot(ip + vec3(1.0,0.0,0.0), vec3(1.0,57.0,113.0)));
  float n010 = hash11(dot(ip + vec3(0.0,1.0,0.0), vec3(1.0,57.0,113.0)));
  float n110 = hash11(dot(ip + vec3(1.0,1.0,0.0), vec3(1.0,57.0,113.0)));
  float n001 = hash11(dot(ip + vec3(0.0,0.0,1.0), vec3(1.0,57.0,113.0)));
  float n101 = hash11(dot(ip + vec3(1.0,0.0,1.0), vec3(1.0,57.0,113.0)));
  float n011 = hash11(dot(ip + vec3(0.0,1.0,1.0), vec3(1.0,57.0,113.0)));
  float n111 = hash11(dot(ip + vec3(1.0,1.0,1.0), vec3(1.0,57.0,113.0)));
  vec3 w = fp*fp*fp*(fp*(fp*6.0-15.0)+10.0);
  float x00 = mix(n000, n100, w.x);
  float x10 = mix(n010, n110, w.x);
  float x01 = mix(n001, n101, w.x);
  float x11 = mix(n011, n111, w.x);
  float y0  = mix(x00, x10, w.y);
  float y1  = mix(x01, x11, w.y);
  return mix(y0, y1, w.z) * 2.0 - 1.0;
}

float fbm2(vec2 uv, float t){
  vec3 p = vec3(uv * uScale, t);
  float amp = 1.0;
  float freq = 1.0;
  float sum = 1.0;
  for (int i = 0; i < FBM_OCTAVES; ++i){
    sum  += amp * vnoise(p * freq);
    freq *= FBM_LACUNARITY;
    amp  *= FBM_GAIN;
  }
  return sum * 0.5 + 0.5;
}

float maskCircle(vec2 p, float cov){
  float r = sqrt(cov) * .25;
  float d = length(p - 0.5) - r;
  float aa = 0.5 * fwidth(d);
  return cov * (1.0 - smoothstep(-aa, aa, d * 2.0));
}

float maskTriangle(vec2 p, vec2 id, float cov){
  bool flip = mod(id.x + id.y, 2.0) > 0.5;
  if (flip) p.x = 1.0 - p.x;
  float r = sqrt(cov);
  float d  = p.y - r*(1.0 - p.x);
  float aa = fwidth(d);
  return cov * clamp(0.5 - d/aa, 0.0, 1.0);
}

float maskDiamond(vec2 p, float cov){
  float r = sqrt(cov) * 0.564;
  return step(abs(p.x - 0.49) + abs(p.y - 0.49), r);
}

void main(){
  float pixelSize = uPixelSize;
  vec2 fragCoord = gl_FragCoord.xy - uResolution * .5;
  float aspectRatio = uResolution.x / uResolution.y;

  vec2 pixelId = floor(fragCoord / pixelSize);
  vec2 pixelUV = fract(fragCoord / pixelSize);

  float cellPixelSize = 8.0 * pixelSize;
  vec2 cellId = floor(fragCoord / cellPixelSize);
  vec2 cellCoord = cellId * cellPixelSize;
  vec2 uv = cellCoord / uResolution * vec2(aspectRatio, 1.0);

  float base = fbm2(uv, uTime * 0.05);
  base = base * 0.5 - 0.65;

  float feed = base + (uDensity - 0.5) * 0.3;

  float speed     = uRippleSpeed;
  float thickness = uRippleThickness;
  const float dampT     = 1.0;
  const float dampR     = 10.0;

  if (uEnableRipples == 1) {
    for (int i = 0; i < MAX_CLICKS; ++i){
      vec2 pos = uClickPos[i];
      if (pos.x < 0.0) continue;
      float cellPixelSize = 8.0 * pixelSize;
      vec2 cuv = (((pos - uResolution * .5 - cellPixelSize * .5) / (uResolution))) * vec2(aspectRatio, 1.0);
      float t = max(uTime - uClickTimes[i], 0.0);
      float r = distance(uv, cuv);
      float waveR = speed * t;
      float ring  = exp(-pow((r - waveR) / thickness, 2.0));
      float atten = exp(-dampT * t) * exp(-dampR * r);
      feed = max(feed, ring * atten * uRippleIntensity);
    }
  }

  float bayer = Bayer8(fragCoord / uPixelSize) - 0.5;
  float bw = step(0.5, feed + bayer);

  float h = fract(sin(dot(floor(fragCoord / uPixelSize), vec2(127.1, 311.7))) * 43758.5453);
  float jitterScale = 1.0 + (h - 0.5) * uPixelJitter;
  float coverage = bw * jitterScale;
  float M;
  if      (uShapeType == SHAPE_CIRCLE)   M = maskCircle (pixelUV, coverage);
  else if (uShapeType == SHAPE_TRIANGLE) M = maskTriangle(pixelUV, pixelId, coverage);
  else if (uShapeType == SHAPE_DIAMOND)  M = maskDiamond(pixelUV, coverage);
  else                                   M = coverage;

  if (uEdgeFade > 0.0) {
    vec2 norm = gl_FragCoord.xy / uResolution;
    float edge = min(min(norm.x, norm.y), min(1.0 - norm.x, 1.0 - norm.y));
    float fade = smoothstep(0.0, uEdgeFade, edge);
    M *= fade;
  }

  vec3 color = uColor;

  // sRGB gamma correction - convert linear to sRGB for accurate color output
  vec3 srgbColor = mix(
    color * 12.92,
    1.055 * pow(color, vec3(1.0 / 2.4)) - 0.055,
    step(0.0031308, color)
  );

  fragColor = vec4(srgbColor, M);
}
`,T=10,E=({variant:e=`square`,pixelSize:t=3,color:n=`#B497CF`,className:r,style:i,antialias:a=!0,patternScale:f=2,patternDensity:m=1,liquid:E=!1,liquidStrength:D=.1,liquidRadius:O=1,pixelSizeJitter:k=0,enableRipples:A=!0,rippleIntensityScale:j=1,rippleThickness:M=.1,rippleSpeed:N=.3,liquidWobbleSpeed:P=4.5,autoPauseOffscreen:F=!0,speed:I=.5,transparent:L=!0,edgeFade:R=.5,noiseAmount:z=0,burstCount:B=0,burstCenterTargetRef:V})=>{let H=(0,b.useRef)(null),ae=(0,b.useRef)({visible:!0}),U=(0,b.useRef)(I),W=(0,b.useRef)(null),G=(0,b.useRef)(null);return(0,b.useEffect)(()=>{let r=H.current;if(!r)return;U.current=I;let i=[`antialias`,`liquid`,`noiseAmount`],b={antialias:a,liquid:E,noiseAmount:z},x=!1;if(!W.current)x=!0;else if(G.current){for(let e of i)if(G.current[e]!==b[e]){x=!0;break}}if(x){if(W.current){let e=W.current;e.resizeObserver?.disconnect(),cancelAnimationFrame(e.raf),e.quad?.geometry.dispose(),e.material.dispose(),e.composer?.dispose(),e.renderer.dispose(),e.renderer.forceContextLoss(),e.renderer.domElement.parentElement===r&&r.removeChild(e.renderer.domElement),W.current=null}let i=new s({canvas:document.createElement(`canvas`),antialias:a,alpha:!0,powerPreference:`high-performance`});i.domElement.style.width=`100%`,i.domElement.style.height=`100%`,i.setPixelRatio(Math.min(window.devicePixelRatio||1,2)),r.appendChild(i.domElement),L?i.setClearAlpha(0):i.setClearColor(0,1);let b={uResolution:{value:new o(0,0)},uTime:{value:0},uColor:{value:new te(n)},uClickPos:{value:Array.from({length:T},()=>new o(-1,-1))},uClickTimes:{value:new Float32Array(T)},uShapeType:{value:S[e]??0},uPixelSize:{value:t*i.getPixelRatio()},uScale:{value:f},uDensity:{value:m},uPixelJitter:{value:k},uEnableRipples:{value:+!!A},uRippleSpeed:{value:N},uRippleThickness:{value:M},uRippleIntensity:{value:j},uEdgeFade:{value:R}},x=new ee,I=new l(-1,1,1,-1,0,1),B=new h({vertexShader:C,fragmentShader:w,uniforms:b,transparent:!0,depthTest:!1,depthWrite:!1,glslVersion:c}),V=new ne(new u(2,2),B);x.add(V);let H=new _,G=()=>{let e=r.clientWidth||1,n=r.clientHeight||1;i.setSize(e,n,!1),b.uResolution.value.set(i.domElement.width,i.domElement.height),W.current?.composer&&W.current.composer.setSize(i.domElement.width,i.domElement.height),b.uPixelSize.value=t*i.getPixelRatio()};G();let K=new ResizeObserver(G);K.observe(r);let q=(()=>{if(typeof window<`u`&&window.crypto?.getRandomValues){let e=new Uint32Array(1);return window.crypto.getRandomValues(e),e[0]/4294967295}return Math.random()})()*1e3,J,Y,X;if(E){Y=re(),Y.radiusScale=O,J=new g(i);let e=new p(x,I);X=ie(Y.texture,{strength:D,freq:P});let t=new v(I,X);t.renderToScreen=!0,J.addPass(e),J.addPass(t)}if(z>0){J||(J=new g(i),J.addPass(new p(x,I)));let e=new v(I,new y(`NoiseEffect`,`uniform float uTime; uniform float uAmount; float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453);} void mainUv(inout vec2 uv){} void mainImage(const in vec4 inputColor,const in vec2 uv,out vec4 outputColor){ float n=hash(floor(uv*vec2(1920.0,1080.0))+floor(uTime*60.0)); float g=(n-0.5)*uAmount; outputColor=inputColor+vec4(vec3(g),0.0);} `,{uniforms:new Map([[`uTime`,new d(0)],[`uAmount`,new d(z)]])}));e.renderToScreen=!0,J&&J.passes.length>0&&J.passes.forEach(e=>{let t=e;t.renderToScreen=!1}),J.addPass(e)}J&&J.setSize(i.domElement.width,i.domElement.height);let Z=e=>{let t=i.domElement.getBoundingClientRect(),n=i.domElement.width/t.width,r=i.domElement.height/t.height;return{fx:(e.clientX-t.left)*n,fy:(t.height-(e.clientY-t.top))*r,w:i.domElement.width,h:i.domElement.height}};i.domElement.addEventListener(`pointerdown`,e=>{let{fx:t,fy:n}=Z(e),r=W.current?.clickIx??0;b.uClickPos.value[r].set(t,n),b.uClickTimes.value[r]=b.uTime.value,W.current&&(W.current.clickIx=(r+1)%T)},{passive:!0}),i.domElement.addEventListener(`pointermove`,e=>{if(!Y)return;let{fx:t,fy:n,w:r,h:i}=Z(e);Y.addTouch({x:t/r,y:n/i})},{passive:!0});let Q=0,$=()=>{if(F&&!ae.current.visible){Q=requestAnimationFrame($);return}if(b.uTime.value=q+H.getElapsedTime()*U.current,X){let e=X.uniforms.get(`uTime`);e&&(e.value=b.uTime.value)}J?(Y&&Y.update(),J.passes.forEach(e=>{let t=e;t.effects&&t.effects.forEach(e=>{let t=e.uniforms?.get(`uTime`);t&&(t.value=b.uTime.value)})}),J.render()):i.render(x,I),Q=requestAnimationFrame($)};Q=requestAnimationFrame($),W.current={renderer:i,scene:x,camera:I,material:B,clock:H,clickIx:0,uniforms:b,resizeObserver:K,raf:Q,quad:V,timeOffset:q,composer:J,touch:Y,liquidEffect:X}}else{let r=W.current;if(r.uniforms.uShapeType.value=S[e]??0,r.uniforms.uPixelSize.value=t*r.renderer.getPixelRatio(),r.uniforms.uColor.value.set(n),r.uniforms.uScale.value=f,r.uniforms.uDensity.value=m,r.uniforms.uPixelJitter.value=k,r.uniforms.uEnableRipples.value=+!!A,r.uniforms.uRippleIntensity.value=j,r.uniforms.uRippleThickness.value=M,r.uniforms.uRippleSpeed.value=N,r.uniforms.uEdgeFade.value=R,L?r.renderer.setClearAlpha(0):r.renderer.setClearColor(0,1),r.liquidEffect){let e=r.liquidEffect,t=e.uniforms.get(`uStrength`);t&&(t.value=D);let n=e.uniforms.get(`uFreq`);n&&(n.value=P)}r.touch&&(r.touch.radiusScale=O)}return G.current=b,()=>{if(W.current&&x||!W.current)return;let e=W.current;e.resizeObserver?.disconnect(),cancelAnimationFrame(e.raf),e.quad?.geometry.dispose(),e.material.dispose(),e.composer?.dispose(),e.renderer.dispose(),e.renderer.forceContextLoss(),e.renderer.domElement.parentElement===r&&r.removeChild(e.renderer.domElement),W.current=null}},[a,E,z,t,f,m,A,j,M,N,k,R,L,D,O,P,F,e,n,I]),(0,b.useEffect)(()=>{if(!B)return;let e=!1,t=0,n=()=>{if(e)return;let r=W.current;if(!r){t++<120&&requestAnimationFrame(n);return}let i=r.renderer.domElement,a=i.width,o=i.height;if(a<2||o<2){t++<120&&requestAnimationFrame(n);return}r.uniforms.uResolution.value.set(a,o);let s=i.getBoundingClientRect(),c=V?.current,l,u;if(c&&s.width>=1&&s.height>=1&&Number.isFinite(s.width)&&Number.isFinite(s.height)){let e=a/s.width,t=o/s.height,n=c.getBoundingClientRect(),r=n.left+n.width/2,i=n.top+n.height/2;l=(r-s.left)*e,u=(s.height-(i-s.top))*t}else l=a*.5,u=o*.5;let d=r.clickIx;r.uniforms.uClickPos.value[d].set(l,u),r.uniforms.uClickTimes.value[d]=r.uniforms.uTime.value,r.clickIx=(d+1)%T};return n(),()=>{e=!0}},[B,V]),(0,x.jsx)(`div`,{ref:H,className:r,style:{position:`relative`,overflow:`hidden`,width:`100%`,height:`100%`,...i},"aria-label":`PixelBlast interactive background`})};function D(){let{backFromCalibration:e,completeCalibration:t}=i(),[r,o]=(0,b.useState)(`single`),[s,c]=(0,b.useState)(0),l=(0,b.useRef)(null),u=(0,b.useRef)(null),d=(0,b.useCallback)(()=>{c(e=>e+1)},[]),f=(0,b.useCallback)(()=>{r===`single`&&(d(),o(`double`))},[r,d]),p=(0,b.useCallback)(()=>{r===`double`&&(d(),o(`done`))},[r,d]);(0,b.useEffect)(()=>{if(r===`done`)return l.current=setTimeout(()=>{t()},2e3),()=>{l.current&&clearTimeout(l.current)}},[r,t]);let m=r===`double`?`double`:`single`,h=r===`single`||r===`double`;return(0,x.jsxs)(`div`,{className:`calibration-screen`,ref:u,children:[(0,x.jsx)(`div`,{className:`calibration-screen__pixel-wrap`,"aria-hidden":!0,children:(0,x.jsx)(E,{variant:`square`,pixelSize:6,color:`#FFD200`,patternScale:3,patternDensity:0,pixelSizeJitter:1.2,enableRipples:!0,rippleSpeed:.4,rippleThickness:.12,rippleIntensityScale:1.5,liquid:!0,liquidStrength:.12,liquidRadius:1.2,liquidWobbleSpeed:5,speed:2.5,edgeFade:0,transparent:!0,burstCount:s,burstCenterTargetRef:u})}),(0,x.jsxs)(`header`,{className:`calibration-screen__header`,children:[(0,x.jsx)(`button`,{type:`button`,className:`calibration-screen__back`,onClick:e,children:`← 返回`}),(0,x.jsxs)(`div`,{className:`calibration-screen__title-block`,children:[(0,x.jsx)(`h1`,{className:`calibration-screen__title`,children:`眨眼校准`}),(0,x.jsx)(`span`,{className:`calibration-screen__title-en`,children:`Blink Calibration`})]}),(0,x.jsx)(`span`,{className:`calibration-screen__header-spacer`})]}),(0,x.jsxs)(`div`,{className:`calibration-screen__body`,children:[(0,x.jsx)(n.div,{className:`calibration-screen__camera-card`,initial:{opacity:0,y:16},animate:{opacity:1,y:0},transition:{duration:.45},children:(0,x.jsx)(a,{blinkMode:m,enabled:h,showPreview:!0,previewWidth:480,previewHeight:360,onBlink:f,onDoubleBlink:p,pipPreview:{className:`calibration-screen__pip`,width:220,height:165,showLandmarks:!1}})}),(0,x.jsxs)(n.div,{className:`calibration-screen__task`,initial:{opacity:0,x:12},animate:{opacity:1,x:0},transition:{duration:.35},children:[r===`single`&&(0,x.jsxs)(x.Fragment,{children:[(0,x.jsx)(`span`,{className:`calibration-screen__task-step`,children:`步骤 1 / 2`}),(0,x.jsx)(`h2`,{className:`calibration-screen__task-title`,children:`请单眨眼一次`}),(0,x.jsx)(`p`,{className:`calibration-screen__task-desc`,children:`自然眨一下眼睛，确认系统能识别单次眨眼。`})]}),r===`double`&&(0,x.jsxs)(x.Fragment,{children:[(0,x.jsx)(`span`,{className:`calibration-screen__task-step`,children:`步骤 2 / 2`}),(0,x.jsx)(`h2`,{className:`calibration-screen__task-title`,children:`请双眨眼一次`}),(0,x.jsx)(`p`,{className:`calibration-screen__task-desc`,children:`在约 0.7 秒内连续眨眼两次，完成双眨眼校准。`})]}),r===`done`&&(0,x.jsxs)(x.Fragment,{children:[(0,x.jsx)(`span`,{className:`calibration-screen__task-step`,children:`完成`}),(0,x.jsx)(`h2`,{className:`calibration-screen__task-title`,children:`校准成功`}),(0,x.jsx)(`p`,{className:`calibration-screen__task-desc`,children:`即将返回开始界面…`})]})]},r)]})]})}export{D as CalibrationScreen};