# 🎰 Sistema de Rifa Online - Rifa 321

Sistema completo de rifa online com Landing Page mobile-first e Painel Administrativo.

## 📁 Estrutura do Projeto

```
rifa-site/
├── index.html      # Landing Page (usuário)
├── admin.html      # Painel Administrativo
├── style.css       # Estilos (dark mode)
├── app.js          # JavaScript da Landing Page
├── admin.js        # JavaScript do Painel Admin
└── README.md       # Este arquivo
```

## 🚀 Como Usar

### 1. Acessar o Painel Admin

Abra `admin.html` no navegador e faça login com:

**Credenciais padrão:**
- **E-mail:** admin@rifa321.com
- **Senha:** admin123

> ⚠️ **IMPORTANTE:** Altere essas credenciais no arquivo `admin.js` antes de publicar!

### 2. Configurar a Rifa

No painel admin, você pode editar:

- **Título e Subtítulo** da rifa
- **Preço da Cota** (ex: R$ 7,00)
- **URL da Imagem** (cole o link direto da imagem hospedada)
- **URL do Vídeo** (YouTube/Vimeo - opcional)
- **Descrição dos Prêmios** (aceita HTML)
- **Números da Sorte** (um por linha)
- **URL de Checkout** (Kiwify/Kirvano/Cakto)

### 3. Salvar e Visualizar

- Clique em **"💾 Salvar Alterações"** para guardar as configurações
- Clique em **"👁️ Visualizar Site"** para ver a landing page

### 4. Publicar

Abra `index.html` - esta é a página que seus clientes verão!

## 🎨 Características

### Landing Page (index.html)
- ✅ Design dark mode moderno
- ✅ Mobile-first responsivo
- ✅ Seletor de cotas rápido (+1, +5, +10, +20, +100, +250)
- ✅ Controle manual de quantidade
- ✅ Cálculo automático do valor total
- ✅ Botão de participação com redirecionamento para checkout
- ✅ Tabs: Títulos Premiados, Ranking, Prêmios
- ✅ Lista de números da sorte
- ✅ Descrição completa dos prêmios

### Painel Admin (admin.html)
- ✅ Tela de login protegida
- ✅ Interface limpa e intuitiva
- ✅ Campos para todas as configurações
- ✅ Responsivo (edite pelo celular!)
- ✅ Persistência no localStorage
- ✅ Mensagem de confirmação ao salvar

## 💾 Persistência de Dados

### Atualmente: localStorage

Os dados são salvos no **localStorage** do navegador. Isso significa:

✅ **Vantagens:**
- Funciona offline
- Não precisa de servidor
- Grátis

⚠️ **Limitações:**
- Se limpar o cache do navegador, os dados somem
- Não sincroniza entre dispositivos
- Não é seguro para produção

### Recomendado: Firebase Realtime Database

Para um site real, use o Firebase (gratuito para esse volume):

## 🔥 Como Integrar com Firebase

### Passo 1: Criar Projeto no Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Adicionar projeto"
3. Dê um nome (ex: "rifa-321")
4. Desabilite o Google Analytics (opcional)
5. Clique em "Criar projeto"

### Passo 2: Configurar Realtime Database

1. No menu lateral, clique em "Realtime Database"
2. Clique em "Criar banco de dados"
3. Escolha a localização (ex: us-central1)
4. Inicie em **modo de teste** (depois configure as regras)
5. Clique em "Ativar"

### Passo 3: Obter Configuração

1. Clique no ícone de engrenagem ⚙️ > "Configurações do projeto"
2. Role até "Seus aplicativos"
3. Clique no ícone `</>`  (Web)
4. Registre o app (ex: "Rifa 321 Web")
5. Copie o código de configuração

### Passo 4: Adicionar Firebase ao Projeto

Adicione antes do `</body>` em `index.html` e `admin.html`:

```html
<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js"></script>

<script>
  // Cole aqui a configuração do Firebase
  const firebaseConfig = {
    apiKey: "SUA_API_KEY",
    authDomain: "seu-projeto.firebaseapp.com",
    databaseURL: "https://seu-projeto.firebaseio.com",
    projectId: "seu-projeto",
    storageBucket: "seu-projeto.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc123"
  };
  
  firebase.initializeApp(firebaseConfig);
</script>
```

### Passo 5: Modificar admin.js

Substitua a função de salvar por:

```javascript
// Salvar no Firebase
saveBtn.addEventListener('click', () => {
    const raffleConfig = {
        title: document.getElementById('adminTitle').value,
        subtitle: document.getElementById('adminSubtitle').value,
        price: parseFloat(document.getElementById('adminPrice').value) || 7.00,
        image: document.getElementById('adminImage').value,
        video: document.getElementById('adminVideo').value,
        description: document.getElementById('adminDescription').value,
        winners: document.getElementById('adminWinners').value.split('\n').filter(l => l.trim()),
        checkoutUrl: document.getElementById('adminCheckout').value
    };
    
    // Salvar no Firebase
    firebase.database().ref('raffle').set(raffleConfig)
        .then(() => {
            successMessage.classList.remove('hidden');
            setTimeout(() => successMessage.classList.add('hidden'), 3000);
        })
        .catch(error => {
            alert('Erro ao salvar: ' + error.message);
        });
});

// Carregar do Firebase
function loadAdminData() {
    firebase.database().ref('raffle').once('value')
        .then(snapshot => {
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
            }
        });
}
```

### Passo 6: Modificar app.js

Substitua a função de carregar por:

```javascript
// Carregar do Firebase
function loadRaffleData() {
    firebase.database().ref('raffle').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            raffleData = data;
            updateUI();
        }
    });
}
```

### Passo 7: Configurar Regras de Segurança

No Firebase Console > Realtime Database > Regras:

```json
{
  "rules": {
    "raffle": {
      ".read": true,
      ".write": "auth != null"
    }
  }
}
```

Isso permite que qualquer um leia (veja a rifa), mas só usuários autenticados podem escrever (editar).

## 🖼️ Hospedagem de Imagens

Não precisa de servidor! Use:

1. **ImgBB** (https://imgbb.com/) - Gratuito, sem cadastro
2. **Imgur** (https://imgur.com/) - Popular e confiável
3. **Cloudinary** (https://cloudinary.com/) - Plano gratuito generoso
4. **Firebase Storage** - Se já usa Firebase

**Como usar:**
1. Faça upload da imagem
2. Copie o link direto (URL que termina em .jpg, .png, etc)
3. Cole no campo "URL da Imagem" no painel admin

## 🎥 Vídeos

Para vídeos do YouTube:
1. Abra o vídeo no YouTube
2. Clique em "Compartilhar"
3. Copie o link
4. Cole no campo "URL do Vídeo"

## 💳 Integração com Checkout

### Kiwify
1. Crie seu produto na Kiwify
2. Copie o link de checkout
3. Cole no campo "URL de Checkout"

### Kirvano / Cakto
Mesmo processo - cole o link de pagamento.

O botão "Participar" redirecionará automaticamente para esse link, passando a quantidade selecionada como parâmetro `?qty=X`.

## 🔒 Segurança

### Para Produção:

1. **Altere as credenciais** em `admin.js`
2. **Use Firebase** em vez de localStorage
3. **Configure Firebase Authentication** para login seguro
4. **Use HTTPS** ao publicar (Netlify, Vercel, GitHub Pages)
5. **Configure regras do Firebase** para proteger dados

## 🌐 Como Publicar

### Opção 1: Netlify (Recomendado)
1. Crie conta em [netlify.com](https://netlify.com)
2. Arraste a pasta do projeto
3. Pronto! Seu site está no ar

### Opção 2: Vercel
1. Crie conta em [vercel.com](https://vercel.com)
2. Importe o projeto
3. Deploy automático

### Opção 3: GitHub Pages
1. Crie repositório no GitHub
2. Faça upload dos arquivos
3. Ative GitHub Pages nas configurações

## 📱 Responsividade

O sistema é **mobile-first** e funciona perfeitamente em:
- 📱 Celulares (320px+)
- 📱 Tablets (768px+)
- 💻 Desktops (1024px+)

## 🎨 Personalização

### Cores (em style.css)

```css
:root {
    --bg-dark: #0f1419;      /* Fundo escuro */
    --bg-card: #1a1f29;      /* Cards */
    --blue: #2563eb;         /* Azul vibrante */
    --green: #10b981;        /* Verde neon */
}
```

### Logo

Edite o texto em `index.html` e `admin.html`:
```html
<div class="logo">RIFA <span>321</span></div>
```

## 📞 Suporte

Para dúvidas sobre:
- **Kiwify:** suporte@kiwify.com.br
- **Firebase:** Documentação oficial
- **Código:** Revise os comentários nos arquivos

## ⚠️ Avisos Legais

- Verifique a legislação local sobre rifas
- Use sempre a Loteria Federal para transparência
- Mantenha regulamento claro e acessível
- Cumpra todas as obrigações fiscais

---

**Desenvolvido com 🧡 para empreendedores digitais**

Sistema inspirado no Rifa 321 - Adaptado para suas necessidades!
