const STORAGE_KEY = 'urban-tmt-uploaded-posters';
const DOWNLOAD_CACHE = 'urban-tmt-generated-posters-v1';
const CANVAS_WIDTH = 1080;
const DEFAULT_POSTER_AREA_HEIGHT = 1080;
const DEALER_BAND_HEIGHT = 190;

const samplePosters = [
  {
    id: 'sample-strength',
    name: 'Urban TMT Strength',
    category: 'Product Poster',
    description: 'Ready company poster for steel strength promotions.',
    accent: '#e53935',
    artwork: null,
    drawArtwork(ctx) {
      const gradient = ctx.createLinearGradient(0, 0, 1080, 1080);
      gradient.addColorStop(0, '#141820');
      gradient.addColorStop(1, '#6f7b89');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1080, 1080);
      beamPattern(ctx, '#303845', 0.75, 1080);
      brandLockup(ctx, '#e53935', '#ffffff', 'FE 550D STEEL BARS');
      blockText(ctx, 'BUILD WITH', 96, 296, 84, '#ffffff', '900');
      blockText(ctx, 'UNSHAKABLE', 96, 388, 94, '#e53935', '900');
      blockText(ctx, 'STRENGTH', 96, 482, 94, '#ffffff', '900');
      rodBundle(ctx, 720, 410, '#e53935');
      badge(ctx, 96, 768, 'Earthquake Resistant');
      badge(ctx, 402, 768, 'Superior Bendability');
    },
  },
  {
    id: 'sample-dealer',
    name: 'Authorized Dealer',
    category: 'Dealer Poster',
    description: 'Prepared company artwork for dealer announcements.',
    accent: '#16806a',
    artwork: null,
    drawArtwork(ctx) {
      ctx.fillStyle = '#f3f8f8';
      ctx.fillRect(0, 0, 1080, 1080);
      ctx.fillStyle = '#20313f';
      ctx.fillRect(0, 0, 1080, 230);
      brandLockup(ctx, '#16806a', '#ffffff', 'AUTHORIZED DEALER NETWORK');
      blockText(ctx, 'NOW AVAILABLE', 84, 370, 78, '#20313f', '900');
      roundedRect(ctx, 84, 468, 560, 92, 10, '#16806a');
      blockText(ctx, 'NEAR YOU', 124, 528, 46, '#ffffff', '900');
      storefront(ctx, 668, 348, '#16806a');
      badge(ctx, 88, 812, 'Genuine Urban TMT');
      badge(ctx, 430, 812, 'Fast Supply Support');
    },
  },
  {
    id: 'sample-festival',
    name: 'Festival Wishes',
    category: 'Festival Poster',
    description: 'Ready seasonal poster for WhatsApp and social media.',
    accent: '#b3252a',
    artwork: null,
    drawArtwork(ctx) {
      ctx.fillStyle = '#fff5df';
      ctx.fillRect(0, 0, 1080, 1080);
      ctx.fillStyle = '#b3252a';
      ctx.fillRect(0, 0, 1080, 210);
      brandLockup(ctx, '#f5b83b', '#ffffff', 'SEASON OF STRONG BEGINNINGS');
      burst(ctx, 844, 360, 176, '#f5b83b');
      burst(ctx, 184, 430, 96, '#e53935');
      blockText(ctx, 'FESTIVE', 92, 358, 90, '#263548', '900');
      blockText(ctx, 'WISHES', 92, 454, 104, '#b3252a', '900');
      roundedRect(ctx, 92, 610, 760, 100, 12, '#263548');
      blockText(ctx, 'Strong homes. Strong relations.', 128, 674, 34, '#ffffff', '800');
      rodBundle(ctx, 732, 674, '#b3252a');
    },
  },
  {
    id: 'sample-site',
    name: 'Construction Project',
    category: 'Customer Poster',
    description: 'Prepared customer-facing poster for builders.',
    accent: '#3f7dd6',
    artwork: null,
    drawArtwork(ctx) {
      ctx.fillStyle = '#eef3fb';
      ctx.fillRect(0, 0, 1080, 1080);
      skyline(ctx);
      brandLockup(ctx, '#3f7dd6', '#20313f', 'STEEL FOR EVERY DREAM PROJECT');
      blockText(ctx, 'YOUR PROJECT', 86, 342, 74, '#1c2a3a', '900');
      blockText(ctx, 'DESERVES', 86, 424, 82, '#3f7dd6', '900');
      blockText(ctx, 'CERTIFIED STEEL', 86, 512, 76, '#1c2a3a', '900');
      badge(ctx, 88, 682, 'Strong Grip');
      badge(ctx, 334, 682, 'High Ductility');
      badge(ctx, 596, 682, 'Long Life');
    },
  },
];

const state = {
  posterId: '',
  shopName: '',
  phone: '',
  city: '',
  address: '',
  dealerCode: '',
  accent: '#e53935',
  showDealerCode: true,
  dealerLogo: null,
};

let posters = [];
const posterCanvas = document.getElementById('posterCanvas');
posterCanvas.width = CANVAS_WIDTH;
posterCanvas.height = DEFAULT_POSTER_AREA_HEIGHT + DEALER_BAND_HEIGHT;
const ctx = posterCanvas.getContext('2d');
const heroCanvas = document.getElementById('heroCanvas');
const heroCtx = heroCanvas ? heroCanvas.getContext('2d') : null;
const templateSelect = document.getElementById('templateSelect');
const templateGrid = document.getElementById('templateGrid');
const shareStatus = document.getElementById('shareStatus');
const uploadStatus = document.getElementById('uploadStatus');
const downloadBtn = document.getElementById('downloadBtn');
const downloadLink = document.getElementById('downloadLink');
const downloadPreview = document.getElementById('downloadPreview');
const selectedPosterName = document.getElementById('selectedPosterName');
const dealerLogoInput = document.getElementById('dealerLogo');
const dealerLogoPreview = document.getElementById('dealerLogoPreview');
let currentDownloadHref = '';
let currentPreviewUrl = '';
let downloadWorkerReady = null;

function loadUploadedPosters() {
  try {
    return dedupePosters(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')).map((poster) => ({
      id: poster.id,
      name: poster.name,
      category: poster.category,
      description: poster.description,
      accent: poster.accent,
      uploaded: true,
      artwork: poster.artwork,
    }));
  } catch {
    return [];
  }
}

function saveUploadedPosters() {
  const uploaded = dedupePosters(posters.filter((poster) => poster.uploaded)).map((poster) => ({
    id: poster.id,
    name: poster.name,
    category: poster.category,
    description: poster.description,
    accent: poster.accent,
    uploaded: true,
    artwork: poster.artwork,
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(uploaded));
}

function dedupePosters(items) {
  const seen = new Set();
  return items.filter((poster) => {
    const key = poster.artwork || poster.name;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function init() {
  registerDownloadWorker();
  await loadServerPosters();
  renderPosterOptions();
  syncInputs();
  bindEvents();
  selectPoster(state.posterId);
}

async function loadServerPosters() {
  try {
    const response = await fetch('api/posters');
    if (!response.ok) return;
    const data = await response.json();
    const uploaded = (data.posters || []).map((poster) => ({
      ...poster,
      uploaded: true,
      artwork: poster.artwork,
    }));
    posters = dedupePosters(uploaded);
  } catch {
    posters = [];
  }
}

function registerDownloadWorker() {
  if (!('serviceWorker' in navigator) || !('caches' in window)) return;
  downloadWorkerReady = navigator.serviceWorker
    .register('poster-download-sw.js')
    .then(() => navigator.serviceWorker.ready)
    .catch(() => null);
}

function renderPosterOptions() {
  templateSelect.innerHTML = '';
  templateGrid.innerHTML = '';

  if (!posters.length) {
    templateSelect.innerHTML = '<option value="">No admin posters uploaded</option>';
    templateGrid.innerHTML = `
      <article class="template-card empty-card">
        <div class="poster-thumb empty-thumb">No posters uploaded</div>
        <div>
          <h3>Admin poster library is empty</h3>
          <p>Upload prepared Urban TMT posters from the admin panel to show them here.</p>
        </div>
      </article>
    `;
    return;
  }

  posters.forEach((poster) => {
    const option = document.createElement('option');
    option.value = poster.id;
    option.textContent = `${poster.name} - ${poster.category}`;
    templateSelect.appendChild(option);

    const card = document.createElement('article');
    card.className = 'template-card';
    card.dataset.template = poster.id;
    card.innerHTML = `${poster.artwork ? `<div class="poster-thumb"><img src="${poster.artwork}" alt="${poster.name}" /></div>` : '<div class="poster-thumb"><canvas width="360" height="360"></canvas></div>'}<div><h3>${poster.name}</h3><p>${poster.description}</p><button class="select-card" type="button" data-poster-id="${poster.id}" onclick="selectPosterFromButton(this)">Select this poster</button></div>`;
    templateGrid.appendChild(card);
    const thumbCanvas = card.querySelector('canvas');
    if (thumbCanvas) {
      renderPosterThumb(thumbCanvas, poster);
    }
  });
}

function selectPoster(id, moveToForm = false) {
  const poster = posters.find((item) => item.id === id) || posters[0];
  if (!poster) {
    state.posterId = '';
    selectedPosterName.textContent = 'No poster selected';
    renderPoster();
    return;
  }
  state.posterId = poster.id;
  state.accent = poster.accent || '#e53935';
  templateSelect.value = poster.id;
  document.getElementById('accentColor').value = state.accent;
  selectedPosterName.textContent = `Selected: ${poster.name}`;
  renderPoster();
  selectedPosterName.textContent = `Selected: ${poster.name}`;
  markActiveTemplate();
  if (moveToForm) {
    window.location.hash = 'studio';
    document.getElementById('studio').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function markActiveTemplate() {
  const selectedId = templateSelect.value || state.posterId;
  document.querySelectorAll('.template-card').forEach((card) => {
    const isActive = card.dataset.template === selectedId;
    card.classList.toggle('active', isActive);
    const button = card.querySelector('.select-card');
    if (button) {
      button.textContent = isActive ? 'Selected poster' : 'Select this poster';
    }
  });
}

function selectPosterFromButton(button) {
  selectPoster(button.dataset.posterId, true);
  document.querySelectorAll('.template-card').forEach((card) => {
    card.classList.remove('active');
    const cardButton = card.querySelector('.select-card');
    if (cardButton) cardButton.textContent = 'Select this poster';
  });
  const card = button.closest('.template-card');
  if (card) card.classList.add('active');
  button.textContent = 'Selected poster';
}

function syncInputs() {
  document.getElementById('shopName').value = state.shopName;
  document.getElementById('phone').value = state.phone;
  document.getElementById('city').value = state.city;
  document.getElementById('address').value = state.address;
  document.getElementById('dealerCode').value = state.dealerCode;
  document.getElementById('accentColor').value = state.accent;
  document.getElementById('showDealerCode').checked = state.showDealerCode;
}

function renderPoster() {
  const poster = posters.find((item) => item.id === state.posterId) || posters[0];
  if (!poster) {
    posterCanvas.width = CANVAS_WIDTH;
    posterCanvas.height = DEFAULT_POSTER_AREA_HEIGHT;
    ctx.clearRect(0, 0, posterCanvas.width, posterCanvas.height);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, posterCanvas.width, posterCanvas.height);
    ctx.fillStyle = '#303846';
    ctx.font = '900 42px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No uploaded posters available', CANVAS_WIDTH / 2, DEFAULT_POSTER_AREA_HEIGHT / 2 - 18);
    ctx.font = '700 26px Arial, sans-serif';
    ctx.fillStyle = '#5d6675';
    ctx.fillText('Open Admin Panel and upload Urban TMT poster artwork.', CANVAS_WIDTH / 2, DEFAULT_POSTER_AREA_HEIGHT / 2 + 30);
    ctx.textAlign = 'left';
    renderHero();
    shareStatus.textContent = '';
    return;
  }
  const posterAreaHeight = getPosterAreaHeight(poster);
  posterCanvas.width = CANVAS_WIDTH;
  posterCanvas.height = posterAreaHeight + DEALER_BAND_HEIGHT;
  selectedPosterName.textContent = `Selected: ${poster.name}`;
  ctx.clearRect(0, 0, posterCanvas.width, posterCanvas.height);
  drawPreparedArtwork(ctx, poster, 0, 0, CANVAS_WIDTH, posterAreaHeight);
  drawDealerDetails(ctx, state, posterAreaHeight);
  renderHero();
  updateDownloadTargets();
  markActiveTemplate();
  shareStatus.textContent = '';
}

function renderHero() {
  if (!heroCanvas || !heroCtx) return;
  heroCanvas.width = 720;
  heroCanvas.height = 980;
  heroCtx.clearRect(0, 0, heroCanvas.width, heroCanvas.height);
  const heroPoster = posters[0] || null;
  heroCtx.save();
  heroCtx.scale(720 / CANVAS_WIDTH, 720 / DEFAULT_POSTER_AREA_HEIGHT);
  if (heroPoster) {
    drawPreparedArtwork(heroCtx, heroPoster, 0, 0, CANVAS_WIDTH, DEFAULT_POSTER_AREA_HEIGHT);
  } else {
    heroCtx.fillStyle = '#f8fafc';
    heroCtx.fillRect(0, 0, CANVAS_WIDTH, DEFAULT_POSTER_AREA_HEIGHT);
    brandLockup(heroCtx, '#e53935', '#151a22', 'ADMIN UPLOADED POSTERS');
    blockText(heroCtx, 'UPLOAD', 96, 390, 92, '#151a22', '900');
    blockText(heroCtx, 'POSTERS', 96, 490, 92, '#e53935', '900');
    blockText(heroCtx, 'FROM ADMIN', 96, 590, 64, '#151a22', '900');
  }
  heroCtx.restore();
  heroCtx.save();
  heroCtx.scale(720 / CANVAS_WIDTH, 180 / DEALER_BAND_HEIGHT);
  drawDealerDetails(heroCtx, { ...state, shopName: 'Urban Steel Distributors', city: 'Dealer Network' }, 0);
  heroCtx.restore();
}

function renderPosterThumb(canvas, poster) {
  const thumbCtx = canvas.getContext('2d');
  thumbCtx.clearRect(0, 0, canvas.width, canvas.height);
  thumbCtx.save();
  thumbCtx.scale(canvas.width / CANVAS_WIDTH, canvas.height / DEFAULT_POSTER_AREA_HEIGHT);
  drawPreparedArtwork(thumbCtx, poster, 0, 0, CANVAS_WIDTH, DEFAULT_POSTER_AREA_HEIGHT);
  thumbCtx.restore();
}

function drawPreparedArtwork(ctx, poster, x, y, width, height) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.rect(0, 0, width, height);
  ctx.clip();

  if (isDrawableImage(poster.image)) {
    const img = poster.image;
    drawImageContain(ctx, img, 0, 0, width, height);
  } else if (poster.artwork) {
    if (!poster.loadingImage) {
      poster.loadingImage = true;
      loadImage(
        poster.artwork,
        (img) => {
          poster.image = img;
          poster.loadingImage = false;
          renderPoster();
        },
        () => {
          poster.loadingImage = false;
        },
      );
    }
    placeholderArtwork(ctx, poster);
  } else {
    poster.drawArtwork(ctx);
  }
  ctx.restore();
}

function isDrawableImage(img) {
  return img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0 && img.naturalHeight > 0;
}

function drawDealerDetails(ctx, data, y) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, y, CANVAS_WIDTH, DEALER_BAND_HEIGHT);
  ctx.fillStyle = data.accent;
  ctx.fillRect(0, y, CANVAS_WIDTH, 14);
  ctx.fillStyle = '#151a22';
  ctx.fillRect(0, y + 14, CANVAS_WIDTH, DEALER_BAND_HEIGHT - 14);
  ctx.fillStyle = data.accent;
  ctx.globalAlpha = 0.18;
  ctx.fillRect(0, y + 14, CANVAS_WIDTH, DEALER_BAND_HEIGHT - 14);
  ctx.globalAlpha = 1;

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  const brandCenterX = drawDealerBrandLine(ctx, data, y + 72);
  ctx.font = '800 28px Arial, sans-serif';
  ctx.fillText([data.city, data.phone].filter(Boolean).join('  |  '), brandCenterX, y + 115);
  ctx.font = '700 22px Arial, sans-serif';
  fitText(ctx, data.address || 'Store address', brandCenterX, y + 152, 22, 720, '700');
  if (data.showDealerCode && data.dealerCode) {
    roundedRect(ctx, brandCenterX - 150, y + 160, 300, 26, 5, '#ffffff');
    ctx.fillStyle = '#151a22';
    ctx.font = '800 17px Arial, sans-serif';
    ctx.fillText(`Dealer Code: ${data.dealerCode}`, brandCenterX, y + 180);
  }
  ctx.textAlign = 'left';
}

function drawDealerBrandLine(ctx, data, baselineY) {
  const name = data.shopName || 'Your Store Name';
  let fontSize = 48;
  const hasLogo = Boolean(data.dealerLogo);
  const logoWidth = hasLogo ? 330 : 0;
  const logoHeight = hasLogo ? 128 : 0;
  const logoCenterX = 270;
  const logoCenterY = baselineY + 30;
  const textCenterX = hasLogo ? 690 : CANVAS_WIDTH / 2;
  const maxTextWidth = hasLogo ? 620 : 900;

  ctx.font = `900 ${fontSize}px Arial, sans-serif`;
  while (ctx.measureText(name).width > maxTextWidth && fontSize > 28) {
    fontSize -= 2;
    ctx.font = `900 ${fontSize}px Arial, sans-serif`;
  }

  const textWidth = ctx.measureText(name).width;
  let x = textCenterX - textWidth / 2;

  if (hasLogo) {
    drawLogoContain(ctx, data.dealerLogo, logoCenterX - logoWidth / 2, logoCenterY - logoHeight / 2, logoWidth, logoHeight);
  }

  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(name, x, baselineY);
  ctx.textAlign = 'center';
  return textCenterX;
}

function bindEvents() {
  templateSelect.addEventListener('change', (event) => selectPoster(event.target.value));
  templateGrid.addEventListener('click', (event) => {
    const button = event.target.closest('[data-poster-id]');
    if (!button) return;
    event.preventDefault();
    selectPosterFromButton(button);
  });

  [
    ['shopName', 'shopName'],
    ['phone', 'phone'],
    ['city', 'city'],
    ['address', 'address'],
    ['dealerCode', 'dealerCode'],
    ['accentColor', 'accent'],
  ].forEach(([id, key]) => {
    document.getElementById(id).addEventListener('input', (event) => {
      state[key] = event.target.value;
      renderPoster();
    });
  });

  document.getElementById('showDealerCode').addEventListener('change', (event) => {
    state.showDealerCode = event.target.checked;
    renderPoster();
  });
  dealerLogoInput?.addEventListener('change', uploadDealerLogo);
  dealerLogoPreview?.addEventListener('click', (event) => {
    const removeButton = event.target.closest('[data-remove-logo]');
    if (!removeButton) return;
    removeDealerLogo();
  });
  downloadBtn.addEventListener('click', downloadPoster);
  document.getElementById('shareBtn').addEventListener('click', () => {
    sharePoster().catch(() => {
      shareStatus.textContent = 'Sharing was cancelled or unavailable.';
    });
  });
  document.getElementById('posterUpload')?.addEventListener('change', uploadPreparedPosters);
  document.getElementById('clearUploads')?.addEventListener('click', clearUploads);
}

function uploadDealerLogo(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.addEventListener('load', () => {
    loadImage(
      reader.result,
      (img) => {
        const trimmedLogo = trimLogoImage(img);
        state.dealerLogo = trimmedLogo;
        if (dealerLogoPreview) {
          dealerLogoPreview.innerHTML = `<img src="${trimmedLogo.src}" alt="Uploaded store logo" /><span>${file.name}</span><button class="remove-logo-button" type="button" data-remove-logo aria-label="Remove uploaded logo">X</button>`;
          dealerLogoPreview.classList.add('has-logo');
        }
        renderPoster();
      },
      () => {
        if (dealerLogoPreview) dealerLogoPreview.textContent = 'Could not load logo. Try PNG or JPG.';
      },
    );
  });
  reader.readAsDataURL(file);
}

function removeDealerLogo() {
  state.dealerLogo = null;
  if (dealerLogoInput) dealerLogoInput.value = '';
  if (dealerLogoPreview) {
    dealerLogoPreview.textContent = 'No logo selected';
    dealerLogoPreview.classList.remove('has-logo');
  }
  renderPoster();
}

function uploadPreparedPosters(event) {
  const files = Array.from(event.target.files || []).filter((file) => file.type.startsWith('image/'));
  if (!files.length) return;
  let loaded = 0;

  files.forEach((file) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      const poster = {
        id: `upload-${Date.now()}-${loaded}`,
        name: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
        category: 'Uploaded Poster',
        description: 'Uploaded Urban TMT prepared artwork.',
        accent: state.accent,
        uploaded: true,
        artwork: reader.result,
      };
      posters.push(poster);
      loaded += 1;
      if (loaded === files.length) {
        posters = dedupePosters(posters);
        saveUploadedPosters();
        renderPosterOptions();
        selectPoster(poster.id);
        uploadStatus.textContent = `${files.length} poster${files.length > 1 ? 's' : ''} uploaded for this browser.`;
        event.target.value = '';
      }
    });
    reader.readAsDataURL(file);
  });
}

function clearUploads() {
  posters = posters.filter((poster) => !poster.uploaded);
  localStorage.removeItem(STORAGE_KEY);
  renderPosterOptions();
  selectPoster(posters[0].id);
  uploadStatus.textContent = 'Uploaded posters cleared.';
}

async function downloadPoster(event) {
  if (event) event.preventDefault();

  const safeName = (state.shopName || 'urban-tmt-poster').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const fileName = `${safeName || 'urban-tmt-poster'}.png`;

  try {
    const exportCanvas = await buildExportCanvas();
    const blob = await canvasToPngBlob(exportCanvas);
    await setDownloadFile(blob, fileName);

    const savedPoster = await savePosterOnServer(blob, fileName);
    if (savedPoster) {
      shareStatus.textContent = `Preparing download: ${savedPoster.fileName}`;
    }

    const link = document.createElement('a');
    link.href = currentDownloadHref;
    link.download = fileName;
    link.rel = 'noopener';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
    shareStatus.textContent = `Download started: ${fileName}.`;
  } catch (error) {
    shareStatus.textContent = 'Could not prepare the PNG. Please select the poster again and try download.';
  }
}

async function savePosterOnServer(blob, fileName) {
  try {
    const dataUrl = await blobToDataUrl(blob);
    const response = await fetch('save-poster', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName,
        imageBase64: dataUrl.split(',')[1],
      }),
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

function updateDownloadTargets() {
  const safeName = (state.shopName || 'urban-tmt-poster').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const fileName = `${safeName || 'urban-tmt-poster'}.png`;
  buildExportCanvas()
    .then((exportCanvas) => canvasToPngBlob(exportCanvas))
    .then((blob) => {
      setDownloadFile(blob, fileName);
    })
    .catch(() => {
      setDownloadDataUrl(posterCanvas.toDataURL('image/png'), fileName);
    });
}

async function buildExportCanvas() {
  const poster = posters.find((item) => item.id === state.posterId) || posters[0];
  await ensurePosterImageReady(poster);
  const posterAreaHeight = getPosterAreaHeight(poster);

  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = CANVAS_WIDTH;
  exportCanvas.height = posterAreaHeight + DEALER_BAND_HEIGHT;
  const exportCtx = exportCanvas.getContext('2d');

  exportCtx.fillStyle = '#ffffff';
  exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
  drawPreparedArtworkForExport(exportCtx, poster, 0, 0, CANVAS_WIDTH, posterAreaHeight);
  drawDealerDetails(exportCtx, state, posterAreaHeight);

  return exportCanvas;
}

function getPosterAreaHeight(poster) {
  if (poster.artwork && isDrawableImage(poster.image)) {
    const ratioHeight = Math.round((CANVAS_WIDTH * poster.image.naturalHeight) / poster.image.naturalWidth);
    return Math.max(720, Math.min(1800, ratioHeight));
  }
  return DEFAULT_POSTER_AREA_HEIGHT;
}

function ensurePosterImageReady(poster) {
  if (!poster.artwork || isDrawableImage(poster.image)) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    loadImage(
      poster.artwork,
      (img) => {
        poster.image = img;
        poster.loadingImage = false;
        resolve();
      },
      reject,
    );
  });
}

function drawPreparedArtworkForExport(ctx, poster, x, y, width, height) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.rect(0, 0, width, height);
  ctx.clip();

  if (poster.artwork && isDrawableImage(poster.image)) {
    drawImageContain(ctx, poster.image, 0, 0, width, height);
  } else if (poster.drawArtwork) {
    poster.drawArtwork(ctx);
  } else {
    placeholderArtwork(ctx, poster);
  }

  ctx.restore();
}

function canvasToPngBlob(canvas = posterCanvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Could not create PNG image.'));
      }
    }, 'image/png');
  });
}

async function setDownloadFile(blob, fileName) {
  const dataUrl = await blobToDataUrl(blob);
  setDownloadDataUrl(dataUrl, fileName);

  if (downloadWorkerReady) {
    const worker = await downloadWorkerReady;
    if (worker && 'caches' in window) {
      const url = new URL(`generated-posters/${encodeURIComponent(fileName)}`, window.location.href);
      url.searchParams.set('v', Date.now().toString());
      const cache = await caches.open(DOWNLOAD_CACHE);
      await cache.put(
        url.href,
        new Response(blob, {
          headers: {
            'Content-Type': 'image/png',
            'Content-Disposition': `attachment; filename="${fileName.replace(/"/g, '')}"`,
            'Cache-Control': 'no-store',
          },
        }),
      );
      currentDownloadHref = url.href;
      downloadLink.href = currentDownloadHref;
    }
  }
}

function setDownloadDataUrl(dataUrl, fileName) {
  currentDownloadHref = dataUrl;
  downloadLink.href = currentDownloadHref;
  downloadLink.download = fileName;
  downloadLink.classList.add('ready');
  if (currentPreviewUrl) {
    URL.revokeObjectURL(currentPreviewUrl);
  }
  currentPreviewUrl = dataUrl.startsWith('data:') ? '' : URL.createObjectURL(dataUrl);
  downloadPreview.src = currentDownloadHref;
  downloadPreview.classList.add('ready');
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function sharePoster() {
  const exportCanvas = await buildExportCanvas();
  const blob = await canvasToPngBlob(exportCanvas);
  const file = new File([blob], 'urban-tmt-dealer-poster.png', { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: 'Urban TMT Dealer Poster',
      text: 'Urban TMT prepared poster with dealer details.',
    });
    shareStatus.textContent = 'Poster shared successfully.';
  } else {
    await navigator.clipboard.writeText('Poster is ready. Use Download PNG and share it on WhatsApp or social media.');
    shareStatus.textContent = 'Sharing is unavailable here, so a sharing note was copied.';
  }
}

function loadImage(src, callback, onError) {
  const img = new Image();
  img.onload = () => callback(img);
  img.onerror = () => {
    if (onError) onError();
  };
  img.src = src;
}

function trimLogoImage(img) {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const trimCtx = canvas.getContext('2d');
  trimCtx.drawImage(img, 0, 0);
  const { width, height } = canvas;
  const pixels = trimCtx.getImageData(0, 0, width, height).data;
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const red = pixels[index];
      const green = pixels[index + 1];
      const blue = pixels[index + 2];
      const alpha = pixels[index + 3];
      const isWhite = red > 245 && green > 245 && blue > 245;
      if (alpha > 10 && !isWhite) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (minX > maxX || minY > maxY) return img;

  const padding = 8;
  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(width - 1, maxX + padding);
  maxY = Math.min(height - 1, maxY + padding);

  const trimWidth = maxX - minX + 1;
  const trimHeight = maxY - minY + 1;
  const output = document.createElement('canvas');
  output.width = trimWidth;
  output.height = trimHeight;
  output.getContext('2d').drawImage(canvas, minX, minY, trimWidth, trimHeight, 0, 0, trimWidth, trimHeight);

  const trimmed = new Image();
  trimmed.src = output.toDataURL('image/png');
  return trimmed;
}

function drawImageCover(ctx, img, x, y, width, height) {
  const scale = Math.max(width / img.width, height / img.height);
  const drawWidth = img.width * scale;
  const drawHeight = img.height * scale;
  ctx.drawImage(img, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
}

function drawImageContain(ctx, img, x, y, width, height) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, width, height);
  const scale = Math.min(width / img.width, height / img.height);
  const drawWidth = img.width * scale;
  const drawHeight = img.height * scale;
  ctx.drawImage(img, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
}

function drawLogoContain(ctx, img, x, y, width, height) {
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.32)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;
  const scale = Math.min(width / img.width, height / img.height);
  const drawWidth = img.width * scale;
  const drawHeight = img.height * scale;
  ctx.drawImage(img, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
  ctx.restore();
}

function placeholderArtwork(ctx, poster) {
  ctx.fillStyle = '#e7ebf0';
  ctx.fillRect(0, 0, CANVAS_WIDTH, DEFAULT_POSTER_AREA_HEIGHT);
  ctx.fillStyle = '#5d6675';
  ctx.font = '800 34px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Loading ${poster.name}`, CANVAS_WIDTH / 2, DEFAULT_POSTER_AREA_HEIGHT / 2);
  ctx.textAlign = 'left';
}

function brandLockup(ctx, accent, textColor, subtitle) {
  roundedRect(ctx, 78, 70, 104, 104, 14, accent);
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 64px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('U', 130, 144);
  ctx.textAlign = 'left';
  ctx.fillStyle = textColor;
  ctx.font = '900 55px Arial, sans-serif';
  ctx.fillText('URBAN TMT', 206, 120);
  ctx.font = '800 24px Arial, sans-serif';
  ctx.fillText(subtitle, 210, 158);
}

function blockText(ctx, text, x, y, size, color, weight) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px Arial, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText(text, x, y);
}

function fitText(ctx, text, x, y, startSize, maxWidth, weight) {
  let size = startSize;
  do {
    ctx.font = `${weight} ${size}px Arial, sans-serif`;
    size -= 2;
  } while (ctx.measureText(text).width > maxWidth && size > 24);
  ctx.fillText(text, x, y);
}

function roundedRect(ctx, x, y, width, height, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.fill();
}

function beamPattern(ctx, color, alpha, height) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 26;
  for (let i = -160; i < 1250; i += 130) {
    ctx.beginPath();
    ctx.moveTo(i, height);
    ctx.lineTo(i + 420, 0);
    ctx.stroke();
  }
  ctx.restore();
}

function rodBundle(ctx, x, y, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.18);
  for (let i = 0; i < 8; i += 1) {
    roundedRect(ctx, -110 + i * 24, 0, 26, 430, 12, i % 2 ? '#5c6674' : '#8792a0');
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 8;
  ctx.strokeRect(-128, 28, 238, 60);
  ctx.restore();
}

function badge(ctx, x, y, text) {
  roundedRect(ctx, x, y, 260, 54, 27, '#ffffff');
  ctx.fillStyle = '#1d2735';
  ctx.font = '800 21px Arial, sans-serif';
  ctx.fillText(text, x + 24, y + 35);
}

function burst(ctx, x, y, radius, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  for (let i = 0; i < 18; i += 1) {
    ctx.rotate(Math.PI / 9);
    ctx.fillRect(-10, -radius, 20, radius * 0.55);
  }
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.52, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function storefront(ctx, x, y, accent) {
  ctx.fillStyle = '#dfe6ee';
  ctx.fillRect(x, y + 210, 320, 270);
  ctx.fillStyle = '#20313f';
  ctx.fillRect(x + 40, y + 300, 96, 180);
  ctx.fillStyle = '#9eb2c7';
  ctx.fillRect(x + 168, y + 300, 104, 84);
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.moveTo(x - 20, y + 210);
  ctx.lineTo(x + 160, y + 70);
  ctx.lineTo(x + 340, y + 210);
  ctx.closePath();
  ctx.fill();
  blockText(ctx, 'TMT', x + 106, y + 186, 38, '#ffffff', '900');
}

function skyline(ctx) {
  ctx.fillStyle = '#cfdbe8';
  ctx.fillRect(0, 780, 1080, 300);
  const buildings = [
    [42, 648, 120, 432],
    [202, 720, 160, 360],
    [410, 590, 128, 490],
    [600, 670, 180, 410],
    [830, 560, 142, 520],
  ];
  buildings.forEach(([x, y, w, h]) => {
    ctx.fillStyle = '#263548';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#e7edf4';
    for (let row = y + 30; row < y + h - 30; row += 54) {
      for (let col = x + 22; col < x + w - 20; col += 38) {
        ctx.fillRect(col, row, 18, 22);
      }
    }
  });
}

init();
