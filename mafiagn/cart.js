// cart.js — client-side cart with localStorage
(function () {
  const STORAGE_KEY = 'gn_cart_v1';

  function $(sel, root = document) { return root.querySelector(sel); }
  function $all(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

  function formatBRL(v) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  }

  function loadCart() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { items: [] }; }
    catch (e) { return { items: [] }; }
  }

  function saveCart(cart) { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); }

  function cartTotals(cart) {
    const count = cart.items.reduce((s,i) => s + (i.qty||1), 0);
    const total = cart.items.reduce((s,i) => s + (i.qty||1) * Number(i.price), 0);
    return { count, total };
  }

  function updateHeader(cart) {
    const { count, total } = cartTotals(cart);
    const cnt = document.getElementById('cartCount');
    const tot = document.getElementById('cartTotal');
    if (cnt) cnt.textContent = String(count);
    if (tot) tot.textContent = formatBRL(total);
  }

  const STORE_PHONE = '5511942977855'; // substitua pelo número real do WhatsApp da loja (com DDI)

  function addToCart(product) {
    const cart = loadCart();
    const idx = cart.items.findIndex(i => i.id === product.id);
    if (idx >= 0) {
      cart.items[idx].qty += 1;
    } else {
      cart.items.push(Object.assign({ qty: 1 }, product));
    }
    saveCart(cart);
    updateHeader(cart);
    showMiniToast(`${product.name} adicionado ao carrinho`);
  }

  function showMiniToast(text) {
    const t = document.createElement('div');
    t.textContent = text;
    t.style.position = 'fixed';
    t.style.right = '18px';
    t.style.bottom = '18px';
    t.style.background = 'rgba(0,0,0,0.7)';
    t.style.color = '#fff';
    t.style.padding = '10px 14px';
    t.style.borderRadius = '10px';
    t.style.zIndex = 1600;
    document.body.appendChild(t);
    setTimeout(() => { t.style.transition = 'opacity 300ms'; t.style.opacity = '0'; }, 1200);
    setTimeout(() => t.remove(), 1600);
  }

  function formatPhoneBR(value) {
    const digits = sanitizePhone(value);
    if (digits.length === 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    if (digits.length === 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return value;
  }

  function buildWhatsAppMessage(cart, customerName, customerPhone, addressData) {
    const items = cart.items.map(item => `- ${item.name} x${item.qty}`).join('\n');
    const phoneLabel = formatPhoneBR(customerPhone);
    const addressLine = `Rua ${addressData.street}, nº ${addressData.number}`;
    const complemento = addressData.complement ? `Complemento: ${addressData.complement}\n` : '';

    return `Novo Pedido - GN Máfia\n\nCliente: ${customerName}\nWhatsApp: ${phoneLabel}\n\nEndereço: ${addressLine}\n${complemento}Bairro: ${addressData.neighborhood}\nCidade/UF: ${addressData.city} - ${addressData.state}\nCEP: ${addressData.cep}\n\nPedido:\n${items}`;
  }

  function sanitizePhone(value) {
    return value.replace(/\D/g, '');
  }

  function sanitizeCep(value) {
    return value.replace(/\D/g, '');
  }

  async function fetchAddressByCep(cep, onSuccess) {
    const cepValue = sanitizeCep(cep);
    if (cepValue.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepValue}/json/`);
      const data = await res.json();
      if (data.erro) { showMiniToast('CEP não encontrado.'); return; }
      onSuccess(data);
    } catch { showMiniToast('Não foi possível buscar o CEP.'); }
  }

  function validateCheckoutForm(values) {
    if (!values.customerName.trim()) return 'Por favor, informe seu nome completo.';
    const cepDigits = sanitizeCep(values.customerCep);
    if (!/^[0-9]{8}$/.test(cepDigits)) return 'Por favor, informe um CEP válido com 8 dígitos.';
    if (!values.customerStreet.trim()) return 'Por favor, informe a rua.';
    if (!values.customerNumber.trim()) return 'Por favor, informe o número.';
    if (!values.customerNeighborhood.trim()) return 'Por favor, informe o bairro.';
    if (!values.customerPayment) return 'Por favor, selecione a forma de pagamento.';
    return null;
  }

  function updateCartItem(id, newQty) {
    const cart = loadCart();
    const idx = cart.items.findIndex(i => i.id === id);
    if (idx < 0) return cart;
    if (newQty <= 0) {
      cart.items.splice(idx, 1);
    } else {
      cart.items[idx].qty = newQty;
    }
    saveCart(cart);
    updateHeader(cart);
    return cart;
  }

  function removeCartItem(id) {
    return updateCartItem(id, 0);
  }

  function closeCartModal() {
    const overlay = document.getElementById('checkoutOverlay');
    if (overlay) overlay.style.display = 'none';
  }

  function buildCheckoutShell(activeStep) {
    let overlay = document.getElementById('checkoutOverlay');
    let container;
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'checkoutOverlay';
      overlay.className = 'checkout-overlay';
      container = document.createElement('div');
      container.id = 'checkoutContainer';
      container.className = 'checkout-container';
      overlay.appendChild(container);
      document.body.appendChild(overlay);
      overlay.addEventListener('click', (e) => { if (e.target === overlay) closeCartModal(); });
    } else {
      container = document.getElementById('checkoutContainer');
    }
    container.innerHTML = '';

    // Header
    const header = document.createElement('div');
    header.className = 'checkout-header';
    header.innerHTML = `<img src="logo.jpeg" alt="GN Máfia" class="checkout-logo" /><button class="cart-modal-close" id="closeCartBtn">✕</button>`;
    container.appendChild(header);
    header.querySelector('#closeCartBtn').addEventListener('click', closeCartModal);

    // Steps
    const steps = document.createElement('div');
    steps.className = 'checkout-steps';
    steps.innerHTML = [
      { n: 1, label: 'Carrinho' },
      { n: 2, label: 'Identificação' }
    ].map(s => `<div class="step${s.n === activeStep ? ' step-active' : s.n < activeStep ? ' step-done' : ''}"><span>${s.n}</span>${s.label}</div>`).join('');
    container.appendChild(steps);

    return { overlay, container };
  }

  function renderSummary(total) {
    const right = document.createElement('aside');
    right.className = 'checkout-right';
    right.innerHTML = `
      <div class="checkout-summary">
        <h4>Resumo</h4>
        <div class="summary-row"><span>Valor dos produtos</span><strong>${formatBRL(total)}</strong></div>
        <div class="summary-row"><span>Frete</span><span>A calcular</span></div>
        <div class="summary-total"><span>Total da compra</span><strong>${formatBRL(total)}</strong></div>
      </div>`;
    return right;
  }

  function renderCartPanel() {
    const { overlay, container } = buildCheckoutShell(1);
    const cart = loadCart();
    const { total } = cartTotals(cart);

    const content = document.createElement('div');
    content.className = 'checkout-content';

    // Coluna esquerda — produtos
    const left = document.createElement('div');
    left.className = 'checkout-left';
    const title = document.createElement('h2');
    title.textContent = 'Produtos';
    left.appendChild(title);

    if (!cart.items.length) {
      const empty = document.createElement('div');
      empty.className = 'cart-empty';
      empty.textContent = 'Seu carrinho está vazio.';
      left.appendChild(empty);
    } else {
      const itemList = document.createElement('div');
      itemList.className = 'cart-item-list';
      cart.items.forEach(it => {
        const row = document.createElement('div');
        row.className = 'cart-item';

        // Imagem do produto
        const img = document.createElement('img');
        img.className = 'cart-item-img';
        img.src = it.image || '';
        img.alt = it.name;

        const details = document.createElement('div');
        details.className = 'cart-item-details';
        const name = document.createElement('strong');
        name.textContent = it.name;
        const price = document.createElement('span');
        price.textContent = formatBRL(it.price * it.qty);
        details.appendChild(name);
        details.appendChild(price);

        const controls = document.createElement('div');
        controls.className = 'cart-item-controls';
        const minus = document.createElement('button');
        minus.type = 'button'; minus.className = 'qty-control'; minus.textContent = '−';
        const qty = document.createElement('input');
        qty.type = 'number'; qty.className = 'qty-input'; qty.value = it.qty; qty.min = '1';
        const plus = document.createElement('button');
        plus.type = 'button'; plus.className = 'qty-control'; plus.textContent = '+';
        const remove = document.createElement('button');
        remove.type = 'button'; remove.className = 'remove-item'; remove.textContent = 'Remover';

        minus.addEventListener('click', () => { updateCartItem(it.id, it.qty - 1); renderCartPanel(); });
        plus.addEventListener('click', () => { updateCartItem(it.id, it.qty + 1); renderCartPanel(); });
        qty.addEventListener('change', () => { updateCartItem(it.id, Number(qty.value) || 1); renderCartPanel(); });
        remove.addEventListener('click', () => { removeCartItem(it.id); renderCartPanel(); });

        controls.append(minus, qty, plus, remove);

        const itemBody = document.createElement('div');
        itemBody.className = 'cart-item-body';
        itemBody.append(details, controls);

        row.append(img, itemBody);
        itemList.appendChild(row);
      });
      left.appendChild(itemList);
    }

    // Coluna direita — resumo + continuar
    const right = renderSummary(total);
    const continueBtn = document.createElement('button');
    continueBtn.className = 'checkout-continue';
    continueBtn.textContent = 'Continuar';
    continueBtn.addEventListener('click', () => {
      if (!cart.items.length) { showMiniToast('Adicione produtos ao carrinho.'); return; }
      renderIdentificationPanel();
    });
    right.querySelector('.checkout-summary').appendChild(continueBtn);

    content.append(left, right);
    container.appendChild(content);
    overlay.style.display = 'block';
  }

  function renderIdentificationPanel() {
    const { overlay, container } = buildCheckoutShell(2);
    const cart = loadCart();
    const { total } = cartTotals(cart);

    const content = document.createElement('div');
    content.className = 'checkout-content';

    // Coluna esquerda — formulário
    const left = document.createElement('div');
    left.className = 'checkout-left';

    const title = document.createElement('h2');
    title.textContent = 'Identificação';
    left.appendChild(title);

    const form = document.createElement('form');
    form.className = 'identification-form';

    const fields = [
      { label: 'Nome completo', name: 'customerName', type: 'text', placeholder: 'Seu nome completo' },
      { label: 'CEP', name: 'customerCep', type: 'text', placeholder: '00000-000' },
      { label: 'Rua / Logradouro', name: 'customerStreet', type: 'text', placeholder: 'Preenchido automaticamente pelo CEP', readonly: true },
      { label: 'Número', name: 'customerNumber', type: 'text', placeholder: 'Ex: 42 ou Apto 12' },
      { label: 'Bairro', name: 'customerNeighborhood', type: 'text', placeholder: 'Preenchido automaticamente pelo CEP', readonly: true },
    ];

    const inputs = {};
    fields.forEach(f => {
      const label = document.createElement('label');
      label.className = 'form-field';
      label.innerHTML = `<span>${f.label}</span>`;
      const input = document.createElement('input');
      input.type = f.type;
      input.name = f.name;
      input.placeholder = f.placeholder;
      if (f.readonly) input.readOnly = true;
      label.appendChild(input);
      form.appendChild(label);
      inputs[f.name] = input;
    });

    // Campo forma de pagamento (entre Número e Bairro)
    const payLabel = document.createElement('label');
    payLabel.className = 'form-field';
    payLabel.innerHTML = '<span>💳 Forma de Pagamento *</span>';
    const paySelect = document.createElement('select');
    paySelect.name = 'customerPayment';
    paySelect.className = 'form-select';
    paySelect.innerHTML = `
      <option value="">Selecione uma opção</option>
      <option value="PIX">PIX</option>
      <option value="Cartão de Débito">Cartão de Débito</option>
      <option value="Cartão de Crédito">Cartão de Crédito</option>
    `;
    const payNote = document.createElement('div');
    payNote.className = 'payment-note';
    payNote.style.display = 'none';
    payNote.textContent = '⚠️ O pagamento será realizado somente no momento da entrega do pedido.';
    paySelect.addEventListener('change', () => {
      payNote.style.display = paySelect.value ? 'block' : 'none';
    });
    payLabel.appendChild(paySelect);
    payLabel.appendChild(payNote);

    // Inserir após o campo Número (antes do Bairro)
    const neighborhoodField = form.querySelector('[name="customerNeighborhood"]')?.closest('label');
    form.insertBefore(payLabel, neighborhoodField || null);
    inputs.customerPayment = paySelect;

    inputs.customerCep.addEventListener('blur', () => {
      fetchAddressByCep(inputs.customerCep.value, (data) => {
        const cepNum = parseInt(sanitizeCep(inputs.customerCep.value));
        const atibaia = cepNum >= 12940001 && cepNum <= 12954999;
        const braganca = cepNum >= 12900000 && cepNum <= 12929999;
        if (!atibaia && !braganca) {
          showMiniToast('Desculpe, entregamos apenas em Atibaia e Bragança Paulista.');
          inputs.customerCep.value = '';
          inputs.customerStreet.value = '';
          inputs.customerNeighborhood.value = '';
          return;
        }
        inputs.customerStreet.value = data.logradouro || '';
        inputs.customerNeighborhood.value = data.bairro || '';
      });
    });

    const actions = document.createElement('div');
    actions.className = 'form-actions';

    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.className = 'btn-back';
    backBtn.textContent = '← Voltar';
    backBtn.addEventListener('click', renderCartPanel);

    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'checkout-continue';
    submitBtn.textContent = '🟢 Finalizar via WhatsApp';

    actions.append(backBtn, submitBtn);
    form.appendChild(actions);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const values = {
        customerName: inputs.customerName.value,
        customerCep: inputs.customerCep.value,
        customerStreet: inputs.customerStreet.value,
        customerNumber: inputs.customerNumber.value,
        customerNeighborhood: inputs.customerNeighborhood.value,
        customerPayment: inputs.customerPayment.value,
      };
      const error = validateCheckoutForm(values);
      if (error) { showMiniToast(error); return; }
      const items = cart.items.map(item => `- ${item.name} x${item.qty}`).join('\n');
      const message = `Novo Pedido - GN Mafia\n\nCliente: ${values.customerName}\n\nEndereco: Rua ${values.customerStreet}, n ${values.customerNumber}\nBairro: ${values.customerNeighborhood}\nCEP: ${sanitizeCep(values.customerCep)}\n\nForma de Pagamento: ${values.customerPayment}\nPagamento na entrega.\n\nPedido:\n${items}`;
      window.open(`https://wa.me/${STORE_PHONE}?text=${encodeURIComponent(message)}`, '_blank');
      closeCartModal();
      setTimeout(() => showRegisterPopup(values.customerName, values.customerCep), 800);
    });

    left.appendChild(form);

    // Coluna direita — resumo
    const right = renderSummary(total);

    content.append(left, right);
    container.appendChild(content);
    overlay.style.display = 'block';
  }

  const CUSTOMERS_KEY = 'gn_customers_v1';

  function loadCustomers() {
    try { return JSON.parse(localStorage.getItem(CUSTOMERS_KEY)) || []; }
    catch { return []; }
  }

  function saveCustomer(data) {
    const customers = loadCustomers();
    const exists = customers.find(c => c.email === data.email);
    if (exists) { showMiniToast('E-mail já cadastrado!'); return false; }
    const coupon = 'GN' + Math.random().toString(36).substring(2,7).toUpperCase();
    customers.push({ ...data, coupon, createdAt: new Date().toISOString() });
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
    return coupon;
  }

  function showRegisterPopup(prefillName, prefillCep) {
    if (localStorage.getItem('gn_register_done')) return;

    const overlay = document.createElement('div');
    overlay.className = 'register-overlay';

    overlay.innerHTML = `
      <div class="register-modal">
        <button class="register-close" id="regClose">✕</button>
        <div class="register-top">
          <img src="logo.jpeg" alt="GN Máfia" class="register-logo" />
          <h2>Pedido enviado!</h2>
          <p class="register-sub">Quer receber <strong>cupons exclusivos</strong> e ficar por dentro das promoções da GN Máfia?</p>
          <div class="register-benefits">
            <span>10% OFF na próxima compra</span>
            <span>Promoções antecipadas</span>
            <span>Novidades em primeira mão</span>
          </div>
        </div>
        <form class="register-form" id="registerForm">
          <label class="form-field"><span>Nome completo</span><input type="text" name="regName" placeholder="Seu nome" value="${prefillName || ''}" required /></label>
          <label class="form-field"><span>E-mail</span><input type="email" name="regEmail" placeholder="seu@email.com" required /></label>
          <label class="form-field"><span>WhatsApp (com DDD)</span><input type="tel" name="regPhone" placeholder="11999999999" required /></label>
          <button type="submit" class="checkout-continue">Criar cadastro e receber cupom</button>
        </form>
        <button class="register-skip" id="regSkip">Agora não</button>
      </div>
    `;

    document.body.appendChild(overlay);
    overlay.style.display = 'flex';

    const close = () => { overlay.remove(); };
    overlay.querySelector('#regClose').addEventListener('click', close);
    overlay.querySelector('#regSkip').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    overlay.querySelector('#registerForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const data = {
        name: fd.get('regName'),
        email: fd.get('regEmail'),
        phone: fd.get('regPhone'),
        cep: prefillCep || ''
      };
      const coupon = saveCustomer(data);
      if (!coupon) return;
      localStorage.setItem('gn_register_done', '1');
      overlay.querySelector('.register-modal').innerHTML = `
        <div class="register-success">
          <img src="logo.jpeg" alt="GN Máfia" class="register-logo" />
          <h2>Cadastro criado!</h2>
          <p>Seu cupom exclusivo:</p>
          <div class="register-coupon">${coupon}</div>
          <p class="register-coupon-note">Use na sua próxima compra e ganhe 10% OFF.</p>
          <button class="checkout-continue" onclick="this.closest('.register-overlay').remove()">Fechar</button>
        </div>
      `;
    });
  }

  function toggleCartPanel() {
    let overlay = document.getElementById('checkoutOverlay');
    if (!overlay) {
      renderCartPanel();
      overlay = document.getElementById('checkoutOverlay');
    }
    if (overlay.style.display === 'block') {
      overlay.style.display = 'none';
    } else {
      overlay.style.display = 'block';
      renderCartPanel();
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    updateHeader(loadCart());
    $all('.add-to-cart').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const card = e.target.closest('.product-card');
        const imgEl = card.querySelector('.main-img, img');
        const rawSrc = card.getAttribute('data-image') || (imgEl ? imgEl.getAttribute('src') : '');
        const base = window.location.href.replace(/\/[^\/]*$/, '/');
        const absoluteImage = rawSrc ? (rawSrc.startsWith('http') ? rawSrc : base + rawSrc) : '';
        const product = {
          id: card.getAttribute('data-name'),
          name: card.getAttribute('data-name'),
          price: Number(card.getAttribute('data-price')),
          image: absoluteImage
        };
        addToCart(product);
      });
    });

    const cartBtn = document.getElementById('cartBtn');
    cartBtn && cartBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleCartPanel();
    });
  });

})();
