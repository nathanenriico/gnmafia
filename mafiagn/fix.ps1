$file = 'c:\Users\enric\OneDrive\Desktop\rifa-site\mafiagn\index.html'
$content = Get-Content $file -Raw -Encoding UTF8

$newBoneco = @'
  <script src="cart.js"></script>
  <script>
  // BONECO CANVAS KIT
  (function () {
    const canvas = document.getElementById('kitCanvas');
    const ctx    = canvas.getContext('2d');
    const W = 320, H = 500;
    canvas.width  = W;
    canvas.height = H;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';

    const SKIN      = '#c8845a';
    const HAIR      = '#1a0800';
    const SHOE      = '#1a1a1a';
    const SOLE      = '#333';
    const SHIRT_CLR = '#1c1c2e';
    const SHORT_CLR = '#0d0d0d';

    let shirtImg = null, shortImg = null;
    let shirtColor = SHIRT_CLR, shortColor = SHORT_CLR;
    const cx = W / 2;

    function pathShirt(c) {
      c.beginPath();
      c.moveTo(cx - 18, 140);
      c.lineTo(cx - 46, 150);
      c.lineTo(cx - 52, 200);
      c.lineTo(cx - 42, 202);
      c.lineTo(cx - 38, 162);
      c.lineTo(cx - 36, 272);
      c.lineTo(cx + 36, 272);
      c.lineTo(cx + 38, 162);
      c.lineTo(cx + 42, 202);
      c.lineTo(cx + 52, 200);
      c.lineTo(cx + 46, 150);
      c.lineTo(cx + 18, 140);
      c.quadraticCurveTo(cx, 152, cx - 18, 140);
      c.closePath();
    }

    function pathShort(c) {
      c.beginPath();
      c.moveTo(cx - 36, 270);
      c.lineTo(cx + 36, 270);
      c.lineTo(cx + 32, 348);
      c.lineTo(cx + 10, 348);
      c.lineTo(cx,      334);
      c.lineTo(cx - 10, 348);
      c.lineTo(cx - 32, 348);
      c.closePath();
    }

    function roundRect(c, x, y, w, h, r, color) {
      c.beginPath();
      c.moveTo(x+r,y); c.lineTo(x+w-r,y);
      c.quadraticCurveTo(x+w,y,x+w,y+r);
      c.lineTo(x+w,y+h-r);
      c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
      c.lineTo(x+r,y+h);
      c.quadraticCurveTo(x,y+h,x,y+h-r);
      c.lineTo(x,y+r);
      c.quadraticCurveTo(x,y,x+r,y);
      c.closePath();
      c.fillStyle = color; c.fill();
    }

    function ell(c, x, y, rx, ry, color) {
      c.beginPath();
      c.ellipse(x, y, rx, ry, 0, 0, Math.PI*2);
      c.fillStyle = color; c.fill();
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // fundo
      const bg = ctx.createRadialGradient(cx,H*0.5,10,cx,H*0.5,W*0.7);
      bg.addColorStop(0,'rgba(28,18,8,0.8)');
      bg.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);

      // plataforma
      ctx.save();
      ctx.translate(cx, 458); ctx.scale(1, 0.22);
      const pg = ctx.createRadialGradient(0,0,4,0,0,68);
      pg.addColorStop(0,'#d5a651'); pg.addColorStop(1,'#6b3f08');
      ctx.beginPath(); ctx.arc(0,0,68,0,Math.PI*2);
      ctx.fillStyle = pg; ctx.fill();
      ctx.restore();

      // tenis
      [cx-22, cx+22].forEach(tx => {
        ell(ctx, tx, 432, 19, 8, SHOE);
        ell(ctx, tx, 435, 19, 5, SOLE);
      });

      // canelas (skin)
      roundRect(ctx, cx-30, 346, 18, 86, 8, SKIN);
      roundRect(ctx, cx+12, 346, 18, 86, 8, SKIN);

      // SHORTS com imagem recortada
      ctx.save();
      pathShort(ctx);
      if (shortImg) {
        ctx.clip();
        // crop: pega a parte central superior da foto do shorts
        const iw = shortImg.width, ih = shortImg.height;
        const cropX = iw * 0.1, cropY = ih * 0.05;
        const cropW = iw * 0.8, cropH = ih * 0.55;
        ctx.drawImage(shortImg, cropX, cropY, cropW, cropH, cx-36, 270, 72, 80);
      } else {
        ctx.fillStyle = shortColor; ctx.fill();
      }
      ctx.restore();

      // cinto
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(cx-36, 269, 72, 10);
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(cx-8,274); ctx.lineTo(cx-3,281); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx+8,274); ctx.lineTo(cx+3,281); ctx.stroke();

      // CAMISA (torso + mangas) com imagem recortada
      ctx.save();
      pathShirt(ctx);
      if (shirtImg) {
        ctx.clip();
        // enquadra a camisa para cobrir exatamente o torso+mangas
        const iw = shirtImg.width, ih = shirtImg.height;
        // crop zona central da camisa (remove fundo acima/abaixo)
        const cropX = iw * 0.02, cropY = ih * 0.02;
        const cropW = iw * 0.96, cropH = ih * 0.96;
        ctx.drawImage(shirtImg, cropX, cropY, cropW, cropH, cx-52, 136, 104, 140);
      } else {
        ctx.fillStyle = shirtColor; ctx.fill();
      }
      ctx.restore();

      // sombra lateral torso (volume)
      ctx.save(); ctx.globalAlpha = 0.15; ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.moveTo(cx-38,162); ctx.lineTo(cx-36,272); ctx.lineTo(cx-26,272); ctx.lineTo(cx-28,162); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx+38,162); ctx.lineTo(cx+36,272); ctx.lineTo(cx+26,272); ctx.lineTo(cx+28,162); ctx.closePath(); ctx.fill();
      ctx.restore();

      // gola
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx-14,142); ctx.quadraticCurveTo(cx,154,cx+14,142);
      ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=2; ctx.stroke();
      ctx.restore();

      // antebracos skin
      roundRect(ctx, cx-54, 200, 14, 52, 7, SKIN);
      roundRect(ctx, cx+40, 200, 14, 52, 7, SKIN);

      // maos
      ell(ctx, cx-47, 258, 9, 11, SKIN);
      ell(ctx, cx+47, 258, 9, 11, SKIN);

      // pescoco
      roundRect(ctx, cx-7, 125, 14, 18, 5, SKIN);

      // cabelo
      ctx.save();
      ctx.beginPath(); ctx.ellipse(cx,96,28,32,0,0,Math.PI*2);
      ctx.fillStyle = HAIR; ctx.fill(); ctx.restore();

      // rosto
      ctx.save();
      ctx.beginPath(); ctx.ellipse(cx,100,23,27,0,0,Math.PI*2);
      ctx.fillStyle = SKIN; ctx.fill(); ctx.restore();

      // olhos
      ell(ctx,cx-8,96,3.5,3.5,'#fff');
      ell(ctx,cx+8,96,3.5,3.5,'#fff');
      ell(ctx,cx-8,97,2,2,'#222');
      ell(ctx,cx+8,97,2,2,'#222');

      // sobrancelhas
      ctx.save(); ctx.strokeStyle=HAIR; ctx.lineWidth=1.8;
      ctx.beginPath(); ctx.moveTo(cx-12,91); ctx.lineTo(cx-4,90); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx+4,90);  ctx.lineTo(cx+12,91); ctx.stroke();
      ctx.restore();

      // boca
      ctx.save();
      ctx.beginPath(); ctx.arc(cx,110,5,0.1,Math.PI-0.1);
      ctx.strokeStyle='rgba(0,0,0,0.25)'; ctx.lineWidth=1.5; ctx.stroke();
      ctx.restore();
    }

    function loadImg(src) {
      return new Promise(res => {
        const img = new Image();
        img.onload  = () => res(img);
        img.onerror = () => res(null);
        img.src = src;
      });
    }

    draw();

    window.kitUpdate3D = async function(type, imgSrc, color) {
      if (type === 'camisa') {
        shirtColor = color || SHIRT_CLR;
        shirtImg   = imgSrc ? await loadImg(imgSrc) : null;
      } else {
        shortColor = color || SHORT_CLR;
        shortImg   = imgSrc ? await loadImg(imgSrc) : null;
      }
      draw();
    };
  })();

    // Monte seu Kit
'@

# Encontra o bloco antigo e substitui
$pattern = '(?s)  <script src="cart\.js"></script>\r?\n  <script>\r?\n    // .* BONECO 2D KIT .*?    // Monte seu Kit'
$content = $content -replace $pattern, $newBoneco

Set-Content $file $content -Encoding UTF8
Write-Host "Done"
