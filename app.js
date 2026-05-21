// Configuração padrão (será substituída pelos dados do localStorage)
let raffleData = {
    title: 'MOTO YAMAHA/YZF R3 ABS DOS SONHOS 🤩🔧',
    subtitle: 'Extração: Loteria Federal',
    price: 7.00,
    image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800',
    video: '',
    description: `
        <h3>🚨 A RIFA MAIS INSANA DO ANO CHEGOU!! 🚨</h3>
        <p>Já imaginou levar uma <strong>Yamaha R3</strong> pra casa ou até mesmo <strong>R$18.000,00 reais</strong> por só <strong>R$ 7,00</strong>?</p>
        <p>E ainda ter chance de ganhar <strong>até R$ 2.000</strong> mesmo sem levar o 1º prêmio?!</p>
        
        <h3>🏆 PRÊMIOS OFICIAIS:</h3>
        <p><strong>🥇 1º Lugar:</strong><br>
        💰 Yamaha R3 – Ano 2018/2020<br>
        Carregada 2022 (azul com detalhes circa)<br>
        • 90 mil km rodados<br>
        • Pneus novos Michelin Pilot<br>
        • Vela Iridium + Filtro de Ar K&N<br>
        • Moto impecável toda original e muito bem cuidada</p>
        
        <p><strong>OU</strong></p>
        <p><strong>R$18.000,00 Reais</strong> 💰💰</p>
        
        <p>O ganhador poderá escolher entre essas duas opções 🎯🤩</p>
        
        <p><strong>🥈 2º Lugar:</strong><br>
        💵 R$ 2.000 em dinheiro</p>
        
        <p><strong>🥉 3º Lugar:</strong><br>
        💵 R$ 1.000 em dinheiro</p>
        
        <p><strong>🎁 Valor da cota: apenas R$ 7,00</strong></p>
        
        <hr>
        
        <p>⭐ Sorteio pela <strong>Loteria Federal</strong> – total transparência<br>
        📅 <strong>Sem data marcada!</strong><br>
        O sorteio será realizado assim que <strong>todos os bilhetes forem vendidos</strong></p>
        
        <hr>
        
        <p>❗ Não perca! Quanto mais números você comprar, maiores as chances de levar ou essa nave ou com grana na bolsa!</p>
        
        <p>🔥 Corra antes que acabe! Chance real de sair da moto ou com dinheiro no bolsa!</p>
    `,
    winners: ['0000', '1968', '1973', '1999'],
    checkoutUrl: 'https://pay.kiwify.com.br/exemplo'
};

// Carregar dados do localStorage
function loadRaffleData() {
    const savedData = localStorage.getItem('raffleConfig');
    if (savedData) {
        raffleData = JSON.parse(savedData);
    }
    updateUI();
}

// Atualizar interface
function updateUI() {
    document.getElementById('prizeTitle').textContent = raffleData.title;
    document.getElementById('prizeSubtitle').textContent = raffleData.subtitle;
    document.getElementById('ticketPrice').textContent = `R$ ${raffleData.price.toFixed(2)}`;
    document.getElementById('prizeImage').src = raffleData.image;
    document.getElementById('prizeDescription').innerHTML = raffleData.description;
    
    // Atualizar lista de ganhadores
    const winnersList = document.getElementById('winnersList');
    const winnersCount = document.getElementById('winnersCount');
    winnersCount.textContent = raffleData.winners.length;
    
    winnersList.innerHTML = '';
    raffleData.winners.forEach(number => {
        const item = document.createElement('div');
        item.className = 'winner-item';
        item.innerHTML = `
            <span class="winner-number">🎫 ${number}</span>
            <span class="winner-status">✅ Disponível</span>
        `;
        winnersList.appendChild(item);
    });
    
    updateTotal();
}

// Quantidade selecionada
let quantity = 1;

// Botões de quantidade rápida
document.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const qty = parseInt(btn.dataset.qty);
        quantity += qty;
        document.getElementById('manualQty').value = quantity;
        updateTotal();
    });
});

// Controles manuais
document.querySelector('.decrease').addEventListener('click', () => {
    if (quantity > 1) {
        quantity--;
        document.getElementById('manualQty').value = quantity;
        updateTotal();
    }
});

document.querySelector('.increase').addEventListener('click', () => {
    quantity++;
    document.getElementById('manualQty').value = quantity;
    updateTotal();
});

document.getElementById('manualQty').addEventListener('input', (e) => {
    quantity = parseInt(e.target.value) || 1;
    if (quantity < 1) quantity = 1;
    updateTotal();
});

// Atualizar total
function updateTotal() {
    const total = quantity * raffleData.price;
    document.getElementById('totalPrice').textContent = total.toFixed(2);
}

// Botão participar
document.getElementById('participateBtn').addEventListener('click', () => {
    if (raffleData.checkoutUrl) {
        // Adicionar quantidade como parâmetro na URL se possível
        let url = raffleData.checkoutUrl;
        if (url.includes('?')) {
            url += `&qty=${quantity}`;
        } else {
            url += `?qty=${quantity}`;
        }
        window.open(url, '_blank');
    } else {
        alert('URL de checkout não configurada. Configure no painel admin.');
    }
});

// Sistema de Tabs
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        // Remove active de todas
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
        
        // Ativa a selecionada
        tab.classList.add('active');
        const tabName = tab.dataset.tab;
        document.getElementById(`${tabName}Tab`).classList.remove('hidden');
    });
});

// Inicializar
loadRaffleData();
