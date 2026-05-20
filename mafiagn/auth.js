// auth.js — exemplo de integração com Firebase Auth (compat)
// Substitua `firebaseConfig` com as credenciais do seu projeto Firebase.

const firebaseConfig = {
  apiKey: "REPLACE_WITH_YOUR_API_KEY",
  authDomain: "REPLACE_WITH_YOUR_PROJECT.firebaseapp.com",
  projectId: "REPLACE_WITH_YOUR_PROJECT_ID",
  appId: "REPLACE_WITH_YOUR_APP_ID",
};

if (typeof firebase === 'undefined') {
  console.warn('Firebase SDK não encontrado. Verifique se os scripts CDN estão incluídos.');
} else {
  firebase.initializeApp(firebaseConfig);
}

const loginBtn = document.getElementById('loginBtn');
const loginModal = document.getElementById('loginModal');
const modalClose = document.getElementById('modalClose');
const modalBackdrop = document.getElementById('modalBackdrop');
const authStatus = document.getElementById('authStatus');

function openModal() {
  loginModal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  loginModal.setAttribute('aria-hidden', 'true');
  authStatus.hidden = true;
}

loginBtn && loginBtn.addEventListener('click', openModal);
modalClose && modalClose.addEventListener('click', closeModal);
modalBackdrop && modalBackdrop.addEventListener('click', closeModal);

function showStatus(text) {
  if (!authStatus) return;
  authStatus.hidden = false;
  authStatus.textContent = text;
}

async function signInWithProvider(provider) {
  showStatus('Abrindo provedor...');
  try {
    const result = await firebase.auth().signInWithPopup(provider);
    const user = result.user;
    showStatus(`Bem-vindo, ${user.displayName || user.email}`);
    // exemplo: salvar no localStorage e fechar modal
    localStorage.setItem('gn_user', JSON.stringify({ uid: user.uid, name: user.displayName, email: user.email }));
    setTimeout(closeModal, 900);
  } catch (err) {
    console.error(err);
    showStatus('Erro durante autenticação: ' + (err.message || err.code));
  }
}

// Botões
document.getElementById('btnGoogle')?.addEventListener('click', () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  signInWithProvider(provider);
});

document.getElementById('btnFacebook')?.addEventListener('click', () => {
  const provider = new firebase.auth.FacebookAuthProvider();
  signInWithProvider(provider);
});

document.getElementById('btnApple')?.addEventListener('click', () => {
  // Apple Sign-In via Firebase requires configuração no Apple Developer e no console do Firebase
  const provider = new firebase.auth.OAuthProvider('apple.com');
  signInWithProvider(provider);
});

// Autologin check (exemplo)
document.addEventListener('DOMContentLoaded', () => {
  const stored = localStorage.getItem('gn_user');
  if (stored) {
    const u = JSON.parse(stored);
    console.log('Usuário logado (local):', u);
  }
});
