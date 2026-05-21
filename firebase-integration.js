// ============================================
// FIREBASE INTEGRATION - EXEMPLO
// ============================================
// Este arquivo mostra como integrar o Firebase ao projeto
// Copie e cole os trechos necessários em app.js e admin.js

// ============================================
// 1. ADICIONAR NO HTML (antes do </body>)
// ============================================
/*
<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"></script>

<script>
  // Configuração do Firebase (obtenha em console.firebase.google.com)
  const firebaseConfig = {
    apiKey: "SUA_API_KEY_AQUI",
    authDomain: "seu-projeto.firebaseapp.com",
    databaseURL: "https://seu-projeto-default-rtdb.firebaseio.com",
    projectId: "seu-projeto",
    storageBucket: "seu-projeto.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc123def456"
  };
  
  // Inicializar Firebase
  firebase.initializeApp(firebaseConfig);
</script>
*/

// ============================================
// 2. MODIFICAR app.js (Landing Page)
// ============================================

// Substituir a função loadRaffleData() por:
function loadRaffleData() {
    // Escutar mudanças em tempo real
    firebase.database().ref('raffle').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            raffleData = data;
            updateUI();
        }
    }, (error) => {
        console.error('Erro ao carregar dados:', error);
        // Fallback para dados padrão se houver erro
        updateUI();
    });
}

// ============================================
// 3. MODIFICAR admin.js (Painel Admin)
// ============================================

// A) Adicionar autenticação Firebase (opcional mas recomendado)
function loginWithFirebase(email, password) {
    return firebase.auth().signInWithEmailAndPassword(email, password);
}

// B) Modificar o evento de login
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Opção 1: Login simples (atual)
    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
        sessionStorage.setItem('adminLoggedIn', 'true');
        showAdmin();
    } else {
        loginError.textContent = '❌ E-mail ou senha incorretos';
    }
    
    // Opção 2: Login com Firebase Authentication (recomendado)
    /*
    loginWithFirebase(email, password)
        .then((userCredential) => {
            sessionStorage.setItem('adminLoggedIn', 'true');
            showAdmin();
        })
        .catch((error) => {
            loginError.textContent = '❌ ' + error.message;
        });
    */
});

// C) Modificar a função loadAdminData()
function loadAdminData() {
    firebase.database().ref('raffle').once('value')
        .then((snapshot) => {
            const data = snapshot.val();
            if (data) {
                document.getElementById('adminTitle').value = data.title || '';
                document.getElementById('adminSubtitle').value = data.subtitle || '';
                document.getElementById('adminPrice').value = data.price || 7.00;
                document.getElementById('adminImage').value = data.image || '';
                document.getElementById('adminVideo').value = data.video || '';
                document.getElementById('adminDescription').value = data.description || '';
                document.getElementById('adminWinners').value = data.winners ? data.winners.join('\n') : '';
                document.getElementById('adminCheckout').value = data.checkoutUrl || '';
            } else {
                // Carregar dados padrão se não houver nada no Firebase
                loadDefaultData();
            }
        })
        .catch((error) => {
            console.error('Erro ao carregar dados:', error);
            alert('Erro ao carregar configurações: ' + error.message);
        });
}

// D) Modificar o botão de salvar
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
        checkoutUrl,
        updatedAt: new Date().toISOString() // Timestamp da última atualização
    };
    
    // Salvar no Firebase
    firebase.database().ref('raffle').set(raffleConfig)
        .then(() => {
            // Mostrar mensagem de sucesso
            successMessage.classList.remove('hidden');
            setTimeout(() => {
                successMessage.classList.add('hidden');
            }, 3000);
            
            // Scroll para o topo
            window.scrollTo({ top: 0, behavior: 'smooth' });
        })
        .catch((error) => {
            console.error('Erro ao salvar:', error);
            alert('Erro ao salvar configurações: ' + error.message);
        });
});

// ============================================
// 4. REGRAS DE SEGURANÇA DO FIREBASE
// ============================================
/*
Cole isso em: Firebase Console > Realtime Database > Regras

{
  "rules": {
    "raffle": {
      ".read": true,
      ".write": "auth != null"
    }
  }
}

Explicação:
- ".read": true = Qualquer pessoa pode ler (ver a rifa)
- ".write": "auth != null" = Só usuários autenticados podem escrever

Para mais segurança, você pode fazer:
{
  "rules": {
    "raffle": {
      ".read": true,
      ".write": "auth.uid === 'SEU_UID_AQUI'"
    }
  }
}

Isso permite que apenas UM usuário específico possa editar.
*/

// ============================================
// 5. CRIAR USUÁRIO ADMIN NO FIREBASE
// ============================================
/*
No Firebase Console:
1. Vá em Authentication
2. Clique em "Começar"
3. Ative "E-mail/senha"
4. Clique em "Adicionar usuário"
5. Digite: admin@rifa321.com / senha123 (ou o que preferir)
6. Copie o UID do usuário criado
7. Use esse UID nas regras de segurança acima
*/

// ============================================
// 6. FUNCIONALIDADES EXTRAS COM FIREBASE
// ============================================

// A) Contador de visualizações
function trackPageView() {
    const viewsRef = firebase.database().ref('stats/views');
    viewsRef.transaction((currentViews) => {
        return (currentViews || 0) + 1;
    });
}

// B) Registrar compras (para estatísticas)
function trackPurchase(quantity, total) {
    const purchaseRef = firebase.database().ref('stats/purchases').push();
    purchaseRef.set({
        quantity: quantity,
        total: total,
        timestamp: new Date().toISOString()
    });
}

// C) Sistema de ranking (top compradores)
function updateRanking(userName, quantity) {
    const rankingRef = firebase.database().ref('ranking/' + userName);
    rankingRef.transaction((currentQty) => {
        return (currentQty || 0) + quantity;
    });
}

// D) Marcar números como vendidos
function markNumberAsSold(number) {
    firebase.database().ref('soldNumbers/' + number).set({
        soldAt: new Date().toISOString(),
        status: 'sold'
    });
}

// E) Verificar se número está disponível
function checkNumberAvailability(number) {
    return firebase.database().ref('soldNumbers/' + number).once('value')
        .then((snapshot) => {
            return !snapshot.exists(); // true = disponível, false = vendido
        });
}

// ============================================
// 7. ESTRUTURA DO BANCO DE DADOS
// ============================================
/*
Estrutura recomendada no Firebase Realtime Database:

{
  "raffle": {
    "title": "MOTO YAMAHA...",
    "subtitle": "Extração: Loteria Federal",
    "price": 7.00,
    "image": "https://...",
    "video": "https://...",
    "description": "...",
    "winners": ["0000", "1968", "1973", "1999"],
    "checkoutUrl": "https://...",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "soldNumbers": {
    "0001": {
      "soldAt": "2024-01-15T10:30:00Z",
      "status": "sold",
      "buyer": "João Silva"
    }
  },
  "stats": {
    "views": 1523,
    "purchases": {
      "-NxYz123": {
        "quantity": 5,
        "total": 35.00,
        "timestamp": "2024-01-15T10:30:00Z"
      }
    }
  },
  "ranking": {
    "João Silva": 50,
    "Maria Santos": 30,
    "Pedro Costa": 20
  }
}
*/

// ============================================
// 8. BACKUP AUTOMÁTICO
// ============================================

// Fazer backup dos dados a cada salvamento
function backupData(data) {
    const backupRef = firebase.database().ref('backups/' + Date.now());
    backupRef.set(data);
}

// Restaurar backup
function restoreBackup(backupId) {
    firebase.database().ref('backups/' + backupId).once('value')
        .then((snapshot) => {
            const data = snapshot.val();
            if (data) {
                firebase.database().ref('raffle').set(data);
                alert('Backup restaurado com sucesso!');
            }
        });
}

// ============================================
// FIM DO ARQUIVO DE EXEMPLO
// ============================================
