$file = 'c:\Users\enric\OneDrive\Desktop\rifa-site\mafiagn\index.html'
$lines = Get-Content $file -Encoding UTF8

# Lines are 0-indexed here; line 679 (1-indexed) = index 678
# Line 892 (1-indexed) = index 891
# We keep lines 0..677 (before boneco) and 892.. (from "Monte seu Kit")
$startIdx = 678   # index of "  <script>" line after cart.js
$endIdx   = 892   # index of "    // Monte seu Kit"

$newCode = '  <script>
  (function () {
    var canvas = document.getElementById(''kitCanvas'');
    var ctx    = canvas.getContext(''2d'');
    var W = 320, H = 500;
    canvas.width = W; canvas.height = H;
    canvas.style.width = W+''px''; canvas.style.height = H+''px'';
    var SKIN=''#c8845a'', HAIR=''#1a0800'', SHOE=''#1a1a1a'', SOLE=''#333'';
    var SHIRT_CLR=''#1c1c2e'', SHORT_CLR=''#0d0d0d'';
    var shirtImg=null, shortImg=null;
    var shirtColor=SHIRT_CLR, shortColor=SHORT_CLR;
    var cx=W/2;
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
      c.lineTo(cx+10,348); c.lineTo(cx,334); c.lineTo(cx-10,348);
      c.lineTo(cx-32,348); c.closePath();
    }
    function rr(x,y,w,h,r,color){
      ctx.beginPath();
      ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
      ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
      ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
      ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y);
      ctx.closePath(); ctx.fillStyle=color; ctx.fill();
    }
    function el(x,y,rx,ry,color){
      ctx.beginPath(); ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);
      ctx.fillStyle=color; ctx.fill();
    }
    function draw(){
      ctx.clearRect(0,0,W,H);
      var bg=ctx.createRadialGradient(cx,H*.5,10,cx,H*.5,W*.7);
      bg.addColorStop(0,''rgba(28,18,8,.8)''); bg.addColorStop(1,''rgba(0,0,0,0)'');
      ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
      ctx.save(); ctx.translate(cx,458); ctx.scale(1,.22);
      var pg=ctx.createRadialGradient(0,0,4,0,0,68);
      pg.addColorStop(0,''#d5a651''); pg.addColorStop(1,''#6b3f08'');
      ctx.beginPath(); ctx.arc(0,0,68,0,Math.PI*2); ctx.fillStyle=pg; ctx.fill();
      ctx.restore();
      [cx-22,cx+22].forEach(function(tx){ el(tx,432,19,8,SHOE); el(tx,435,19,5,SOLE); });
      rr(cx-30,346,18,86,8,SKIN); rr(cx+12,346,18,86,8,SKIN);
      ctx.save(); pathShort(ctx);
      if(shortImg){
        ctx.clip();
        ctx.drawImage(shortImg, shortImg.width*.08, shortImg.height*.04, shortImg.width*.84, shortImg.height*.52, cx-36,270,72,80);
      } else { ctx.fillStyle=shortColor; ctx.fill(); }
      ctx.restore();
      ctx.fillStyle=''rgba(0,0,0,.45)''; ctx.fillRect(cx-36,269,72,10);
      ctx.strokeStyle=''rgba(255,255,255,.5)''; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(cx-8,274); ctx.lineTo(cx-3,281); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx+8,274); ctx.lineTo(cx+3,281); ctx.stroke();
      ctx.save(); pathShirt(ctx);
      if(shirtImg){
        ctx.clip();
        ctx.drawImage(shirtImg, shirtImg.width*.02, shirtImg.height*.02, shirtImg.width*.96, shirtImg.height*.96, cx-52,136,104,140);
      } else { ctx.fillStyle=shirtColor; ctx.fill(); }
      ctx.restore();
      ctx.save(); ctx.globalAlpha=.15; ctx.fillStyle=''#000'';
      ctx.beginPath(); ctx.moveTo(cx-38,162); ctx.lineTo(cx-36,272); ctx.lineTo(cx-26,272); ctx.lineTo(cx-28,162); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx+38,162); ctx.lineTo(cx+36,272); ctx.lineTo(cx+26,272); ctx.lineTo(cx+28,162); ctx.closePath(); ctx.fill();
      ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.moveTo(cx-14,142); ctx.quadraticCurveTo(cx,154,cx+14,142);
      ctx.strokeStyle=''rgba(255,255,255,.2)''; ctx.lineWidth=2; ctx.stroke(); ctx.restore();
      rr(cx-54,200,14,52,7,SKIN); rr(cx+40,200,14,52,7,SKIN);
      el(cx-47,258,9,11,SKIN); el(cx+47,258,9,11,SKIN);
      rr(cx-7,125,14,18,5,SKIN);
      ctx.save(); ctx.beginPath(); ctx.ellipse(cx,96,28,32,0,0,Math.PI*2); ctx.fillStyle=HAIR; ctx.fill(); ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.ellipse(cx,100,23,27,0,0,Math.PI*2); ctx.fillStyle=SKIN; ctx.fill(); ctx.restore();
      el(cx-8,96,3.5,3.5,''#fff''); el(cx+8,96,3.5,3.5,''#fff'');
      el(cx-8,97,2,2,''#222''); el(cx+8,97,2,2,''#222'');
      ctx.save(); ctx.strokeStyle=HAIR; ctx.lineWidth=1.8;
      ctx.beginPath(); ctx.moveTo(cx-12,91); ctx.lineTo(cx-4,90); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx+4,90); ctx.lineTo(cx+12,91); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.arc(cx,110,5,.1,Math.PI-.1);
      ctx.strokeStyle=''rgba(0,0,0,.25)''; ctx.lineWidth=1.5; ctx.stroke(); ctx.restore();
    }
    function loadImg(src){
      return new Promise(function(res){
        var img=new Image(); img.onload=function(){ res(img); }; img.onerror=function(){ res(null); }; img.src=src;
      });
    }
    draw();
    window.kitUpdate3D=async function(type,imgSrc,color){
      if(type===''camisa''){ shirtColor=color||SHIRT_CLR; shirtImg=imgSrc?await loadImg(imgSrc):null; }
      else { shortColor=color||SHORT_CLR; shortImg=imgSrc?await loadImg(imgSrc):null; }
      draw();
    };
  })();'

$before  = $lines[0..($startIdx - 1)]
$after   = $lines[$endIdx..($lines.Length - 1)]
$result  = $before + $newCode.Split("`n") + $after
Set-Content $file $result -Encoding UTF8
Write-Host "Done. Total lines: $($result.Length)"
