const ADMIN_SESSION_KEY = 'urban-tmt-admin-session';
const ADMIN_USER = 'urbanadmin';
const ADMIN_PASSWORD = 'urban123';

const loginPanel = document.getElementById('loginPanel');
const adminPanel = document.getElementById('adminPanel');
const loginStatus = document.getElementById('loginStatus');
const adminStatus = document.getElementById('adminStatus');
const adminPosterGrid = document.getElementById('adminPosterGrid');

function initAdmin() {
  document.getElementById('loginBtn').addEventListener('click', login);
  document.getElementById('logoutBtn').addEventListener('click', logout);
  document.getElementById('uploadPosterBtn').addEventListener('click', uploadPoster);
  setAdminVisible(localStorage.getItem(ADMIN_SESSION_KEY) === 'active');
}

function login() {
  const username = document.getElementById('adminUser').value.trim();
  const password = document.getElementById('adminPassword').value;
  if (username === ADMIN_USER && password === ADMIN_PASSWORD) {
    localStorage.setItem(ADMIN_SESSION_KEY, 'active');
    loginStatus.textContent = '';
    setAdminVisible(true);
    return;
  }
  loginStatus.textContent = 'Invalid admin login.';
}

function logout() {
  localStorage.removeItem(ADMIN_SESSION_KEY);
  setAdminVisible(false);
}

function setAdminVisible(isVisible) {
  loginPanel.classList.toggle('hidden', isVisible);
  adminPanel.classList.toggle('hidden', !isVisible);
  document.getElementById('logoutBtn').classList.toggle('hidden', !isVisible);
  if (isVisible) loadPosters();
}

async function loadPosters() {
  try {
    const response = await fetch('api/posters');
    const data = await response.json();
    renderAdminPosters(data.posters || []);
  } catch {
    adminPosterGrid.innerHTML = '<p class="status">Could not load uploaded posters.</p>';
  }
}

function renderAdminPosters(posters) {
  if (!posters.length) {
    adminPosterGrid.innerHTML = '<p class="status">No admin posters uploaded yet.</p>';
    return;
  }

  adminPosterGrid.innerHTML = posters
    .map(
      (poster) => `
        <article class="admin-poster-card">
          <img src="${poster.artwork}" alt="${poster.name}" />
          <div>
            <h3>${poster.name}</h3>
            <p>${poster.category}</p>
            <button class="button secondary" type="button" data-delete-id="${poster.id}">Delete</button>
          </div>
        </article>
      `,
    )
    .join('');

  adminPosterGrid.querySelectorAll('[data-delete-id]').forEach((button) => {
    button.addEventListener('click', () => deletePoster(button.dataset.deleteId));
  });
}

async function uploadPoster() {
  const fileInput = document.getElementById('adminPosterFile');
  const file = fileInput.files[0];
  if (!file) {
    adminStatus.textContent = 'Choose a PNG or JPG poster image.';
    return;
  }

  const title = document.getElementById('posterTitle').value.trim() || file.name.replace(/\.[^.]+$/, '');
  const category = document.getElementById('posterCategory').value;
  const accent = document.getElementById('posterAccent').value;
  adminStatus.textContent = 'Uploading poster...';

  try {
    const dataUrl = await readFileAsDataUrl(file);
    const response = await fetch('api/posters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: title,
        category,
        accent,
        mimeType: file.type,
        imageBase64: dataUrl.split(',')[1],
      }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || 'Upload failed');
    adminStatus.textContent = 'Poster uploaded to the member website.';
    document.getElementById('posterTitle').value = '';
    fileInput.value = '';
    renderAdminPosters(data.posters || []);
  } catch (error) {
    adminStatus.textContent = error.message || 'Could not upload poster.';
  }
}

async function deletePoster(id) {
  adminStatus.textContent = 'Deleting poster...';
  try {
    const response = await fetch(`api/posters/${encodeURIComponent(id)}`, { method: 'DELETE' });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || 'Delete failed');
    adminStatus.textContent = 'Poster deleted.';
    renderAdminPosters(data.posters || []);
  } catch (error) {
    adminStatus.textContent = error.message || 'Could not delete poster.';
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

initAdmin();
