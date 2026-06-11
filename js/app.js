/* ──────────────────────────────────────
   NAVIGATION
────────────────────────────────────── */
function goTab(t) {
  ['gen','scan'].forEach(x => {
    document.getElementById('pg-'+x).classList.toggle('on', x===t);
    document.getElementById('tb-'+x).classList.toggle('on', x===t);
  });
  if (t !== 'scan') stopCam();
}

/* ──────────────────────────────────────
   QR GENERATION
────────────────────────────────────── */
let qrInst = null;

function clearErr() {
  document.getElementById('gen-err').classList.remove('on');
}

function generate() {
  const text  = document.getElementById('qr-in').value.trim();
  const size  = parseInt(document.getElementById('sz').value);
  const color = document.getElementById('clr').value;
  const box   = document.getElementById('qr-box');
  const card  = document.getElementById('qr-card');
  const err   = document.getElementById('gen-err');

  if (!text) { err.classList.add('on'); card.classList.remove('on'); return; }

  err.classList.remove('on');
  box.innerHTML = '';
  if (qrInst) { try { qrInst.clear(); } catch(e){} }

  qrInst = new QRCode(box, {
    text, width: size, height: size,
    colorDark: color, colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H
  });

  document.getElementById('qr-lbl').textContent = text.length > 60 ? text.slice(0,57)+'…' : text;
  card.classList.add('on');
}

function dlQR() {
  const box = document.getElementById('qr-box');
  const el  = box.querySelector('canvas') || box.querySelector('img');
  if (!el) return;
  const a = document.createElement('a');
  a.download = 'qrcode.png';
  a.href = el.tagName === 'CANVAS' ? el.toDataURL('image/png') : el.src;
  a.click();
}

function copyText(id) {
  const v = document.getElementById(id).value.trim();
  if (!v) return;
  navigator.clipboard?.writeText(v).then(() => flash(event.target, 'Скопировано!'));
}

document.getElementById('qr-in').addEventListener('keydown', e => {
  if (e.key === 'Enter') generate();
});

/* ──────────────────────────────────────
   SCAN MODE
────────────────────────────────────── */
let scanMode = 'cam';

function setMode(m) {
  scanMode = m;
  document.getElementById('mb-cam').classList.toggle('on',   m==='cam');
  document.getElementById('mb-file').classList.toggle('on',  m==='file');
  document.getElementById('cam-wrap').classList.toggle('on', m==='cam');
  document.getElementById('file-wrap').classList.toggle('on',m==='file');
  if (m !== 'cam') stopCam();
}

/* ──────────────────────────────────────
   CAMERA SCANNING
────────────────────────────────────── */
let stream   = null;
let scanning = false;
let paused   = false;
let lastTs   = 0;

async function startCam() {
  const ph = document.getElementById('cam-ph');

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showCamFallback('Живой сканер недоступен в<br>этом браузере.');
    return;
  }

  document.getElementById('cam-start-btn').textContent = 'Подключение…';
  document.getElementById('cam-start-btn').disabled = true;

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
    });
    const vid = document.getElementById('vid');
    vid.srcObject = stream;
    await vid.play();
    ph.style.display = 'none';
    scanning = true;
    paused   = false;
    requestAnimationFrame(tick);
  } catch(e) {
    document.getElementById('cam-start-btn').textContent = 'Включить камеру';
    document.getElementById('cam-start-btn').disabled = false;

    if (e.name === 'NotAllowedError') {
      showCamFallback('Доступ к камере запрещён.<br>Разрешите в настройках браузера.');
    } else if (e.name === 'SecurityError' || location.protocol === 'file:') {
      showCamFallback('Живой сканер требует localhost<br>или https://');
    } else {
      showCamFallback('Камера недоступна.');
    }
  }
}

function showCamFallback(msg) {
  document.getElementById('cam-ph-txt').innerHTML = msg;
  document.getElementById('cam-capture-btn').style.display = 'block';
  document.getElementById('cam-hint-sub').style.display = 'block';
}

function scanCaptured(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (typeof jsQR === 'undefined') {
    alert('Библиотека сканирования не загружена. Проверьте интернет.');
    return;
  }
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    const cv  = document.createElement('canvas');
    cv.width  = img.naturalWidth; cv.height = img.naturalHeight;
    const ctx = cv.getContext('2d');
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
    const data = ctx.getImageData(0, 0, cv.width, cv.height);
    const code = jsQR(data.data, data.width, data.height);
    if (code) {
      if (navigator.vibrate) navigator.vibrate(55);
      showCamResult(code.data);
    } else {
      document.getElementById('cam-ph-txt').innerHTML +=
        '<br><span style="color:var(--red);font-size:11px">QR не найден на фото</span>';
    }
  };
  img.src = url;
  e.target.value = '';
}

function stopCam() {
  scanning = false;
  if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
  const vid = document.getElementById('vid');
  vid.srcObject = null;
  document.getElementById('cam-ph').style.display = 'flex';
}

function tick(ts) {
  if (!scanning) return;
  if (paused)    { requestAnimationFrame(tick); return; }
  if (ts - lastTs < 110) { requestAnimationFrame(tick); return; }
  lastTs = ts;

  const vid = document.getElementById('vid');
  if (vid.readyState < vid.HAVE_ENOUGH_DATA) { requestAnimationFrame(tick); return; }

  const cv  = document.getElementById('cv-hidden');
  const ctx = cv.getContext('2d');
  cv.width  = vid.videoWidth;
  cv.height = vid.videoHeight;
  ctx.drawImage(vid, 0, 0, cv.width, cv.height);

  const img  = ctx.getImageData(0, 0, cv.width, cv.height);
  const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });

  if (code) {
    paused = true;
    showCamResult(code.data);
    if (navigator.vibrate) navigator.vibrate(55);
    const f = document.getElementById('finder');
    f.classList.add('found');
    setTimeout(() => f.classList.remove('found'), 500);
  }
  requestAnimationFrame(tick);
}

function showCamResult(text) {
  document.getElementById('cam-res-txt').textContent = text;
  document.getElementById('cam-open-btn').style.display = isUrl(text) ? '' : 'none';
  document.getElementById('scan-hint').style.display = 'none';
  const panel = document.getElementById('cam-res');
  panel.style.display = 'flex';
  requestAnimationFrame(() => panel.classList.add('on'));
}

function dismissCam() {
  const panel = document.getElementById('cam-res');
  panel.classList.remove('on');
  setTimeout(() => { panel.style.display = 'none'; }, 300);
  document.getElementById('scan-hint').style.display = '';
  paused = false;
}

/* ──────────────────────────────────────
   FILE SCANNING
────────────────────────────────────── */
function scanFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  const errEl = document.getElementById('file-err');
  if (typeof jsQR === 'undefined') {
    errEl.textContent = 'Библиотека сканирования не загружена. Проверьте интернет.';
    errEl.classList.add('on'); return;
  }

  errEl.textContent = 'QR-код не найден на изображении';
  document.getElementById('file-err').classList.remove('on');
  document.getElementById('file-res').classList.remove('on');

  const img    = document.getElementById('prev-img');
  const reader = new FileReader();

  reader.onload = ev => {
    img.src = ev.target.result;
    img.classList.add('on');
    img.onload = () => {
      const cv  = document.createElement('canvas');
      cv.width  = img.naturalWidth;
      cv.height = img.naturalHeight;
      const ctx = cv.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, cv.width, cv.height);
      const code = jsQR(data.data, data.width, data.height);
      if (code) {
        document.getElementById('file-res-txt').textContent = code.data;
        document.getElementById('file-open-btn').style.display = isUrl(code.data) ? '' : 'none';
        document.getElementById('file-res').classList.add('on');
      } else {
        document.getElementById('file-err').classList.add('on');
      }
    };
  };
  reader.readAsDataURL(file);
  e.target.value = '';
}

/* ──────────────────────────────────────
   SHARED UTILS
────────────────────────────────────── */
function isUrl(t) { return /^https?:\/\//i.test(t); }

function copyRes(src) {
  const id   = src === 'cam' ? 'cam-res-txt' : 'file-res-txt';
  const text = document.getElementById(id).textContent;
  navigator.clipboard?.writeText(text).then(() => flash(event.target, 'Скопировано!'));
}

function openUrl(src) {
  const id  = src === 'cam' ? 'cam-res-txt' : 'file-res-txt';
  const url = document.getElementById(id).textContent;
  window.open(url, '_blank', 'noopener');
}

function flash(btn, msg) {
  const orig = btn.textContent;
  btn.textContent = msg;
  setTimeout(() => btn.textContent = orig, 1600);
}
