// Credenciais de login (em produção, use autenticação real)
const ADMIN_CREDENTIALS = {
    email: 'admin@rifa321.com',
    password: 'admin123'
};

// Elementos
const loginContainer = document.getElementById('loginContainer');
const adminContainer = document.getElementById('adminContainer');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const saveBtn = document.getElementById('saveBtn');
const previewBtn = document.getElementById('previewBtn');
const successMessage = document.getElementById('successMessage');

// Verificar se já está logado
function checkAuth() {
    const isLoggedIn = sessionStorage.getItem('adminLoggedIn');
    if (isLoggedIn === 'true') {
        showAdmin();
    }
}

// Login
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
        sessionStorage.setItem('adminLoggedIn', 'true');
        showAdmin();
    } else {
        loginError.textContent = '❌ E-mail ou senha incorretos';
    }
});

// Logout
logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('adminLoggedIn');
    location.reload();
});

// Mostrar painel admin
function showAdmin() {
    loginContainer.classList.add('hidden');
    adminContainer.classList.remove('hidden');
    loadAdminData();
}

// Carregar dados no formulário
function loadAdminData() {
    const savedData = localStorage.getItem('raffleConfig');
    
    if (savedData) {
        const data = JSON.parse(savedData);
        document.getElementById('adminTitle').value = data.title || '';
        document.getElementById('adminSubtitle').value = data.subtitle || '';
        document.getElementById('adminPrice').value = data.price || 7.00;
        document.getElementById('adminImage').value = data.image || '';
        document.getElementById('adminVideo').value = data.video || '';
        document.getElementById('adminDescription').value = data.description || '';
        document.getElementById('adminWinners').value = data.winners ? data.winners.join('\n') : '';
        document.getElementById('adminCheckout').value = data.checkoutUrl || '';
    } else {
        // Dados padrão
        document.getElementById('adminTitle').value = 'MOTO YAMAHA/YZF R3 ABS DOS SONHOS 🤩🔧';
        document.getElementById('adminSubtitle').value = 'Extração: Loteria Federal';
        document.getElementById('adminPrice').value = 7.00;
        document.getElementById('adminImage').value = 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800';
        document.getElementById('adminDescription').value = `<h3>🚨 A RIFA MAIS INSANA DO ANO CHEGOU!! 🚨</h3>
<p>Já imaginou levar uma <strong>Yamaha R3</strong> pra casa ou até mesmo <strong>R$18.000,00 reais</strong> por só <strong>R$ 7,00</strong>?</p>

<h3>🏆 PRÊMIOS OFICIAIS:</h3>
<p><strong>🥇 1º Lugar:</strong><br>
💰 Yamaha R3 – Ano 2018/2020</p>

<p><strong>🥈 2º Lugar:</strong><br>
💵 R$ 2.000 em dinheiro</p>

<p><strong>🥉 3º Lugar:</strong><br>
💵 R$ 1.000 em dinheiro</p>`;
        document.getElementById('adminWinners').value = '0000\n1968\n1973\n1999';
        document.getElementById('adminCheckout').value = 'https://pay.kiwify.com.br/exemplo';
    }
}

// Salvar alterações
saveBtn.addEventListener('click', () => {
    const title = document.getElementById('adminTitle').value;
    const subtitle = document.getElementById('adminSubtitle').value;
    const price = parseFloat(document.getElementById('adminPrice').value) || 7.00;
    const image = document.getElementById('adminImage').value;
    const video = document.getElementById('adminVideo').value;
    const description = document.getElementById('adminDescription').value;
    const winnersText = document.getElementById('adminWinners').value;
    const checkoutUrl = document.getElementById('adminCheckout').value;
    
    // Processar números da sorte
    const winners = winnersText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    
    // Criar objeto de configuração
    const raffleConfig = {
        title,
        subtitle,
        price,
        image,
        video,
        description,
        winners,
        checkoutUrl
    };
    
    // Salvar no localStorage
    localStorage.setItem('raffleConfig', JSON.stringify(raffleConfig));
    
    // Mostrar mensagem de sucesso
    successMessage.classList.remove('hidden');
    setTimeout(() => {
        successMessage.classList.add('hidden');
    }, 3000);
    
    // Scroll para o topo
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Visualizar site
previewBtn.addEventListener('click', () => {
    window.open('index.html', '_blank');
});

// Inicializar
checkAuth();
