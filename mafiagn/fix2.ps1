$file = 'c:\Users\enric\OneDrive\Desktop\rifa-site\mafiagn\index.html'
$lines = Get-Content $file -Encoding UTF8

# Encontra as linhas exatas
$startLine = ($lines | Select-String -Pattern 'BONECO 2D KIT' -SimpleMatch).LineNumber - 1  # 0-based: script src line before
# Recua ate a linha do script src
for ($i = $startLine; $i -ge 0; $i--) {
    if ($lines[$i] -match 'cart\.js') { $startLine = $i; break }
}

$endLine = ($lines | Select-String -Pattern 'Monte seu Kit' -SimpleMatch)[0].LineNumber - 1  # 0-based, primeira ocorrencia no script

Write-Host "Start: $startLine  End: $endLine"

$newCode = @'
  <script src="cart.js"></script>
  <script>
  (function () {
    const canvas = document.getElementById('kitCanvas');
    const ctx    = canvas.getContext('2d');
    const W = 320, H = 500;
    canvas.width = W; canvas.height = H;
    canvas.style.width = W+'px'; canvas.style.height = H+'px';

    const SKIN='#c8845a', HAIR='#1a0800', SHOE='#1a1a1a', SOLE='#333';
    const SHIRT_CLR='#1c1c2e', SHORT_CLR='#0d0d0d';
    let shirtImg=null, shortImg=null;
    let shirtColor=SHIRT_CLR, shortColor=SHORT_CLR;
    const cx=W/2;

    function pathShirt(c){
      c.beginPath();
      c.moveTo(cx-18,140); c.lineTo(cx-46,150); c.lineTo(cx-52,200);
      c.lineTo(cx-42,202); c.lineTo(cx-38,162); c.lineTo(cx-36,272);
      c.lineTo(cx+36,272); c.lineTo(cx+38,162); c.lineTo(cx+42,202);
      c.lineTo(cx+52,200); c.lineTo(cx+46,150); c.lineTo(cx+18,140);
      c.quadraticCurveTo(cx,152,cx-18,140); c.closePath();
    }

    function pathShort(c){
      c.beginPath();
      c.moveTo(cx-36,270); c.lineTo(cx+36,270); c.lineTo(cx+32,348);
      c.lineTo(cx+10,348); c.lineTo(cx,334);
      c.lineTo(cx-10,348); c.lineTo(cx-32,348); c.closePath();
    }

    function rr(x,y,w,h,r,color){
      ctx.beginPath();
      ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y);
      ctx.quadraticCurveTo(x+w,y,x+w,y+r); ctx.lineTo(x+w,y+h-r);
      ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h); ctx.lineTo(x+r,y+h);
      ctx.quadraticCurveTo(x,y+h,x,y+h-r); ctx.lineTo(x,y+r);
      ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
      ctx.fillStyle=color; ctx.fill();
    }

    function el(x,y,rx,ry,color){
      ctx.beginPath(); ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);
      ctx.fillStyle=color; ctx.fill();
    }

    function draw(){
      ctx.clearRect(0,0,W,H);
      const bg=ctx.createRadialGradient(cx,H*.5,10,cx,H*.5,W*.7);
      bg.addColorStop(0,'rgba(28,18,8,.8)'); bg.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);

      // plataforma
      ctx.save(); ctx.translate(cx,458); ctx.scale(1,.22);
      const pg=ctx.createRadialGradient(0,0,4,0,0,68);
      pg.addColorStop(0,'#d5a651'); pg.addColorStop(1,'#6b3f08');
      ctx.beginPath(); ctx.arc(0,0,68,0,Math.PI*2); ctx.fillStyle=pg; ctx.fill();
      ctx.restore();

      // tenis
      [cx-22,cx+22].forEach(tx=>{ el(tx,432,19,8,SHOE); el(tx,435,19,5,SOLE); });

      // canelas
      rr(cx-30,346,18,86,8,SKIN); rr(cx+12,346,18,86,8,SKIN);

      // SHORTS
      ctx.save();
      pathShort(ctx);
      if(shortImg){
        ctx.clip();
        const iw=shortImg.width, ih=shortImg.height;
        ctx.drawImage(shortImg, iw*.08, ih*.04, iw*.84, ih*.52, cx-36,270,72,80);
      } else { ctx.fillStyle=shortColor; ctx.fill(); }
      ctx.restore();

      // cinto
      ctx.fillStyle='rgba(0,0,0,.45)'; ctx.fillRect(cx-36,269,72,10);
      ctx.strokeStyle='rgba(255,255,255,.5)'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(cx-8,274); ctx.lineTo(cx-3,281); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx+8,274); ctx.lineTo(cx+3,281); ctx.stroke();

      // CAMISA
      ctx.save();
      pathShirt(ctx);
      if(shirtImg){
        ctx.clip();
        const iw=shirtImg.width, ih=shirtImg.height;
        ctx.drawImage(shirtImg, iw*.02, ih*.02, iw*.96, ih*.96, cx-52,136,104,140);
      } else { ctx.fillStyle=shirtColor; ctx.fill(); }
      ctx.restore();

      // sombra torso
      ctx.save(); ctx.globalAlpha=.15; ctx.fillStyle='#000';
      ctx.beginPath(); ctx.moveTo(cx-38,162); ctx.lineTo(cx-36,272); ctx.lineTo(cx-26,272); ctx.lineTo(cx-28,162); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx+38,162); ctx.lineTo(cx+36,272); ctx.lineTo(cx+26,272); ctx.lineTo(cx+28,162); ctx.closePath(); ctx.fill();
      ctx.restore();

      // gola
      ctx.save(); ctx.beginPath();
      ctx.moveTo(cx-14,142); ctx.quadraticCurveTo(cx,154,cx+14,142);
      ctx.strokeStyle='rgba(255,255,255,.2)'; ctx.lineWidth=2; ctx.stroke(); ctx.restore();

      // antebracos + maos
      rr(cx-54,200,14,52,7,SKIN); rr(cx+40,200,14,52,7,SKIN);
      el(cx-47,258,9,11,SKIN);    el(cx+47,258,9,11,SKIN);

      // pescoco
      rr(cx-7,125,14,18,5,SKIN);

      // cabelo
      ctx.save(); ctx.beginPath(); ctx.ellipse(cx,96,28,32,0,0,Math.PI*2);
      ctx.fillStyle=HAIR; ctx.fill(); ctx.restore();

      // rosto
      ctx.save(); ctx.beginPath(); ctx.ellipse(cx,100,23,27,0,0,Math.PI*2);
      ctx.fillStyle=SKIN; ctx.fill(); ctx.restore();

      // olhos
      el(cx-8,96,3.5,3.5,'#fff'); el(cx+8,96,3.5,3.5,'#fff');
      el(cx-8,97,2,2,'#222');     el(cx+8,97,2,2,'#222');

      // sobrancelhas
      ctx.save(); ctx.strokeStyle=HAIR; ctx.lineWidth=1.8;
      ctx.beginPath(); ctx.moveTo(cx-12,91); ctx.lineTo(cx-4,90); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx+4,90);  ctx.lineTo(cx+12,91); ctx.stroke();
      ctx.restore();

      // boca
      ctx.save(); ctx.beginPath(); ctx.arc(cx,110,5,.1,Math.PI-.1);
      ctx.strokeStyle='rgba(0,0,0,.25)'; ctx.lineWidth=1.5; ctx.stroke(); ctx.restore();
    }

    function loadImg(src){
      return new Promise(res=>{
        const img=new Image();
        img.onload=()=>res(img); img.onerror=()=>res(null); img.src=src;
      });
    }

    draw();

    window.kitUpdate3D=async function(type,imgSrc,color){
      if(type==='camisa'){ shirtColor=color||SHIRT_CLR; shirtImg=imgSrc?await loadImg(imgSrc):null; }
      else               { shortColor=color||SHORT_CLR; shortImg=imgSrc?await loadImg(imgSrc):null; }
      draw();
    };
  })();

    // Monte seu Kit
'@

$before = $lines[0..($startLine-1)]
$after  = $lines[$endLine..($lines.Length-1)]

$newLines = $before + $newCode.Split("`n") + $after
Set-Content $file $newLines -Encoding UTF8
Write-Host "Done. Lines replaced: $startLine to $endLine"
