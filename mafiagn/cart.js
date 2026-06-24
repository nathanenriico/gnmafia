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

  const STORE_PHONE = '5511947036093'; // substitua pelo número real do WhatsApp da loja (com DDI)

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

  window.gnAddToCart = addToCart;

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

  const SUPABASE_URL = 'https://yhggzhyabuqjuxtetjpj.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloZ2d6aHlhYnVxanV4dGV0anBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NTc4MzIsImV4cCI6MjA5NjMzMzgzMn0.jvF7q0tkjFOzYp1JOBG_2e2RbpZZ2euSKc1r4VHUnJs';

  // Interpreta o campo desconto de cupons_conquistados e retorna { rate, fixed }
  // rate = fração (ex: 0.1 para 10%), fixed = valor fixo em R$
  function parseCouponDiscount(desconto, total) {
    // Valor fixo: "Cupom R$ 20", "Cupom R$ 50"
    const fixedMatch = desconto.match(/R\$\s*([\d,.]+)/);
    if (fixedMatch) return { rate: 0, fixed: parseFloat(fixedMatch[1].replace(',', '.')) };
    // Percentual: "5% OFF", "10% OFF", "Frete + 15% OFF"
    const pctMatch = desconto.match(/(\d+)%/);
    if (pctMatch) return { rate: parseInt(pctMatch[1]) / 100, fixed: 0 };
    return { rate: 0, fixed: 0 };
  }

  async function renderIdentificationPanel() {
    const { overlay, container } = buildCheckoutShell(2);
    const cart = loadCart();
    const { total } = cartTotals(cart);
    let appliedDiscount = 0;
    let appliedFixedDiscount = 0;
    let appliedCoupon = '';
    let appliedCouponType = '';
    let appliedCouponId = null;

    // Busca dados do cliente logado
    let clienteLogado = null;
    const savedEmail = localStorage.getItem('gn_profile_email');
    console.log('[ID] email salvo:', savedEmail);
    if (savedEmail) {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/dados_clientes?email=eq.${encodeURIComponent(savedEmail)}&select=nome,email,whatsapp,cep,rua,numero,bairro`, {
        cache: 'no-store',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
      });
      const data = await res.json();
      console.log('[ID] dados do cliente:', res.status, data);
      if (data && data.length) clienteLogado = data[0];
    }
    console.log('[ID] clienteLogado:', clienteLogado);

    const content = document.createElement('div');
    content.className = 'checkout-content';

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

    // Preenche automaticamente se cliente logado
    if (clienteLogado) {
      if (clienteLogado.nome) inputs.customerName.value = clienteLogado.nome;
      if (clienteLogado.cep) {
        inputs.customerCep.value = clienteLogado.cep;
        fetchAddressByCep(clienteLogado.cep, (viaCep) => {
          inputs.customerStreet.value = clienteLogado.rua || viaCep.logradouro || '';
          inputs.customerNeighborhood.value = clienteLogado.bairro || viaCep.bairro || '';
        });
      }
      if (clienteLogado.numero) inputs.customerNumber.value = clienteLogado.numero;
    }

    // Campo forma de pagamento
    const payLabel = document.createElement('label');
    payLabel.className = 'form-field';
    payLabel.innerHTML = '<span>Forma de Pagamento *</span>';
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
    payNote.textContent = 'O pagamento será realizado somente no momento da entrega do pedido.';
    paySelect.addEventListener('change', () => {
      payNote.style.display = paySelect.value ? 'block' : 'none';
    });
    payLabel.appendChild(paySelect);
    payLabel.appendChild(payNote);
    const neighborhoodField = form.querySelector('[name="customerNeighborhood"]')?.closest('label');
    form.insertBefore(payLabel, neighborhoodField || null);
    inputs.customerPayment = paySelect;

    // Campo cupom
    const couponWrap = document.createElement('div');
    couponWrap.className = 'coupon-field-wrap';
    couponWrap.innerHTML = `
      <span class="form-field-label">Cupom de desconto</span>
      <div class="coupon-input-row">
        <input type="text" id="couponInput" placeholder="Ex: GN4K2XM" autocomplete="off" />
        <button type="button" id="couponApplyBtn">Aplicar</button>
      </div>
      <div id="couponMsg"></div>
    `;
    form.appendChild(couponWrap);

    // Resumo lateral atualizável
    const right = document.createElement('aside');
    right.className = 'checkout-right';

    function updateSummary(discount, fixed = 0) {
      const finalTotal = fixed > 0 ? Math.max(0, total - fixed) : discount > 0 ? total * (1 - discount) : total;
      const discountRow = fixed > 0
        ? `<div class="summary-row" style="color:#4caf50"><span>Desconto (R$ ${fixed.toFixed(2).replace('.',',')})</span><strong>- ${formatBRL(fixed)}</strong></div>`
        : discount > 0
        ? `<div class="summary-row" style="color:#4caf50"><span>Desconto (${Math.round(discount * 100)}%)</span><strong>- ${formatBRL(total * discount)}</strong></div>`
        : '';
      right.innerHTML = `
        <div class="checkout-summary">
          <h4>Resumo</h4>
          <div class="summary-row"><span>Valor dos produtos</span><strong>${formatBRL(total)}</strong></div>
          ${discountRow}
          <div class="summary-row"><span>Frete</span><span>A calcular</span></div>
          <div class="summary-total"><span>Total da compra</span><strong>${formatBRL(finalTotal)}</strong></div>
        </div>`;
    }
    updateSummary(0, 0);

    // Logica do cupom
    couponWrap.querySelector('#couponApplyBtn').addEventListener('click', async () => {
      const code = couponWrap.querySelector('#couponInput').value.trim().toUpperCase();
      const msg = couponWrap.querySelector('#couponMsg');
      if (!code) { msg.textContent = 'Informe um cupom.'; msg.className = 'coupon-msg-error'; return; }

      const btn = couponWrap.querySelector('#couponApplyBtn');
      btn.textContent = 'Verificando...';
      btn.disabled = true;

      // 1. Verifica cupons de sorteio
      const sorteioRes = await fetch(`${SUPABASE_URL}/rest/v1/cupons_sorteio?codigo=eq.${encodeURIComponent(code)}&select=id,codigo,desconto_percent,limite,usados,ativo`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
      });
      const sorteioData = await sorteioRes.json();

      if (sorteioData && sorteioData.length) {
        const cupom = sorteioData[0];
        if (!cupom.ativo) {
          msg.textContent = 'Este cupom nao esta mais ativo.';
          msg.className = 'coupon-msg-error';
          btn.textContent = 'Aplicar'; btn.disabled = false;
          return;
        }
        if (cupom.usados >= cupom.limite) {
          msg.textContent = `Cupom esgotado! Todas as ${cupom.limite} vagas ja foram utilizadas.`;
          msg.className = 'coupon-msg-error';
          btn.textContent = 'Aplicar'; btn.disabled = false;
          return;
        }
        // Reserva o uso incrementando usados
        await fetch(`${SUPABASE_URL}/rest/v1/cupons_sorteio?id=eq.${cupom.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          },
          body: JSON.stringify({ usados: cupom.usados + 1 })
        });
        appliedDiscount = cupom.desconto_percent / 100;
        appliedCoupon = code;
        appliedCouponType = 'sorteio';
        const vagasRestantes = cupom.limite - cupom.usados - 1;
        msg.textContent = `Cupom aplicado! ${cupom.desconto_percent}% de desconto. ${vagasRestantes > 0 ? `Restam ${vagasRestantes} vagas.` : 'Ultima vaga!'}` ;
        msg.className = 'coupon-msg-success';
        updateSummary(appliedDiscount, appliedFixedDiscount);
        btn.textContent = 'Aplicado'; btn.disabled = true;
        return;
      }

      // 2. Verifica cupons pessoais (dados_clientes)
      const pessoalRes = await fetch(`${SUPABASE_URL}/rest/v1/dados_clientes?cupom=eq.${encodeURIComponent(code)}&select=nome,email,cupom`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
      });
      const pessoalData = await pessoalRes.json();

      if (pessoalData && pessoalData.length) {
        const donoEmail = pessoalData[0].email;
        const emailLogado = localStorage.getItem('gn_profile_email');
        if (!emailLogado || emailLogado.toLowerCase() !== donoEmail.toLowerCase()) {
          msg.textContent = 'Este cupom pertence a outra conta.';
          msg.className = 'coupon-msg-error';
          btn.textContent = 'Aplicar'; btn.disabled = false;
          return;
        }
        appliedDiscount = 0.1;
        appliedCoupon = code;
        appliedCouponType = 'pessoal';
        msg.textContent = 'Cupom aplicado! 10% de desconto.';
        msg.className = 'coupon-msg-success';
        updateSummary(appliedDiscount, appliedFixedDiscount);
        btn.textContent = 'Aplicado'; btn.disabled = true;
        return;
      }

      // 3. Verifica cupons conquistados por missão
      const conquRes = await fetch(`${SUPABASE_URL}/rest/v1/cupons_conquistados?codigo=eq.${encodeURIComponent(code)}&select=id,codigo,desconto,usado,cliente_email`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
      });
      const conquData = await conquRes.json();

      if (conquData && conquData.length) {
        const cupom = conquData[0];
        if (cupom.usado) {
          msg.textContent = 'Este cupom de missão já foi utilizado.';
          msg.className = 'coupon-msg-error';
          btn.textContent = 'Aplicar'; btn.disabled = false;
          return;
        }
        const emailLogado = localStorage.getItem('gn_profile_email');
        if (!emailLogado || emailLogado.toLowerCase() !== cupom.cliente_email.toLowerCase()) {
          msg.textContent = 'Este cupom pertence a outra conta.';
          msg.className = 'coupon-msg-error';
          btn.textContent = 'Aplicar'; btn.disabled = false;
          return;
        }
        const parsed = parseCouponDiscount(cupom.desconto, total);
        appliedDiscount = parsed.rate;
        appliedFixedDiscount = parsed.fixed;
        appliedCoupon = code;
        appliedCouponType = 'conquistado';
        appliedCouponId = cupom.id;
        msg.textContent = `Cupom aplicado! ${cupom.desconto}.`;
        msg.className = 'coupon-msg-success';
        updateSummary(appliedDiscount, appliedFixedDiscount);
        btn.textContent = 'Aplicado'; btn.disabled = true;
        return;
      }

      msg.textContent = 'Cupom invalido ou ja utilizado.';
      msg.className = 'coupon-msg-error';
      appliedDiscount = 0; appliedCoupon = ''; appliedCouponType = '';
      updateSummary(0, 0);
      btn.textContent = 'Aplicar'; btn.disabled = false;
    });

    inputs.customerCep.addEventListener('blur', async () => {
      const cepVal = sanitizeCep(inputs.customerCep.value);
      if (cepVal.length !== 8) return;
      const cepNum = parseInt(cepVal);
      const atibaia = cepNum >= 12940001 && cepNum <= 12954999;
      const braganca = cepNum >= 12900000 && cepNum <= 12959999;
      if (!atibaia && !braganca) {
        showMiniToast('Desculpe, entregamos apenas em Atibaia e Bragan\u00e7a Paulista.');
        inputs.customerCep.value = '';
        inputs.customerStreet.value = '';
        inputs.customerNeighborhood.value = '';
        return;
      }
      try {
        const res = await fetch('https://viacep.com.br/ws/' + cepVal + '/json/');
        const data = await res.json();
        if (data.erro) {
          inputs.customerStreet.readOnly = false;
          inputs.customerNeighborhood.readOnly = false;
          inputs.customerStreet.placeholder = 'Digite sua rua';
          inputs.customerNeighborhood.placeholder = 'Digite seu bairro';
          inputs.customerStreet.value = '';
          inputs.customerNeighborhood.value = '';
          inputs.customerStreet.focus();
          showMiniToast('CEP n\u00e3o encontrado na base. Preencha o endere\u00e7o manualmente.');
        } else {
          inputs.customerStreet.readOnly = true;
          inputs.customerNeighborhood.readOnly = true;
          inputs.customerStreet.value = data.logradouro || '';
          inputs.customerNeighborhood.value = data.bairro || '';
        }
      } catch {
        inputs.customerStreet.readOnly = false;
        inputs.customerNeighborhood.readOnly = false;
      }
    });

    const actions = document.createElement('div');
    actions.className = 'form-actions';
    const backBtn = document.createElement('button');
    backBtn.type = 'button'; backBtn.className = 'btn-back'; backBtn.textContent = '← Voltar';
    backBtn.addEventListener('click', renderCartPanel);
    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit'; submitBtn.className = 'checkout-continue'; submitBtn.textContent = 'Finalizar via WhatsApp';
    actions.append(backBtn, submitBtn);
    form.appendChild(actions);

    form.addEventListener('submit', async (e) => {
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

      const finalTotal = appliedFixedDiscount > 0
        ? Math.max(0, total - appliedFixedDiscount)
        : appliedDiscount > 0 ? total * (1 - appliedDiscount) : total;
      const discountLabel = appliedFixedDiscount > 0
        ? `(-R$ ${appliedFixedDiscount.toFixed(2).replace('.',',')})`
        : appliedDiscount > 0 ? `(-${Math.round(appliedDiscount * 100)}%)` : '';
      const items = cart.items.map(item => `- ${item.name} x${item.qty}`).join('\n');
      const discountLine = (appliedDiscount > 0 || appliedFixedDiscount > 0) ? `\nCupom: ${appliedCoupon} ${discountLabel} = ${formatBRL(finalTotal)}` : '';
      const message = `Novo Pedido - GN Mafia\n\nCliente: ${values.customerName}\n\nEndereco: Rua ${values.customerStreet}, n ${values.customerNumber}\nBairro: ${values.customerNeighborhood}\nCEP: ${sanitizeCep(values.customerCep)}\n\nForma de Pagamento: ${values.customerPayment}\nPagamento na entrega.${discountLine}\n\nTotal: ${formatBRL(finalTotal)}\n\nPedido:\n${items}`;

      // Remove o cupom do banco apos uso
      if (appliedCoupon && appliedCouponType === 'pessoal') {
        const patchRes = await fetch(`${SUPABASE_URL}/rest/v1/dados_clientes?cupom=eq.${encodeURIComponent(appliedCoupon)}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({ cupom: null })
        });
        const patchData = await patchRes.json().catch(() => null);
        console.log('Cupom removido:', patchRes.status, patchData);
      }

      // Marca cupom conquistado como usado
      if (appliedCoupon && appliedCouponType === 'conquistado' && appliedCouponId) {
        await fetch(`${SUPABASE_URL}/rest/v1/cupons_conquistados?id=eq.${appliedCouponId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` },
          body: JSON.stringify({ usado: true })
        });
      }

      window.open(`https://wa.me/${STORE_PHONE}?text=${encodeURIComponent(message)}`, '_blank');

      // Tela de confirmação antes de limpar o carrinho
      const confirmOverlay = document.createElement('div');
      confirmOverlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:9999;padding:24px';
      const confirmBox = document.createElement('div');
      confirmBox.style.cssText = 'background:#111010;border:1px solid rgba(213,166,81,0.35);border-radius:20px;padding:40px 32px;max-width:400px;width:100%;text-align:center';
      confirmBox.innerHTML = `
        <div style="font-size:2.5rem;margin-bottom:16px">✅</div>
        <h2 style="font-family:\'Cinzel\',serif;color:#d5a651;margin-bottom:10px">Pedido enviado!</h2>
        <p style="color:#a69e94;font-size:0.9rem;margin-bottom:8px">Seu pedido foi enviado pelo WhatsApp com sucesso.</p>
        <p style="color:#a69e94;font-size:0.85rem;margin-bottom:28px">O carrinho foi esvaziado e está pronto para uma nova compra.</p>
        <button id="confirmCloseBtn" style="width:100%;padding:13px;background:linear-gradient(135deg,#c9922a,#d5a651);border:none;border-radius:10px;color:#050404;font-weight:700;font-size:0.95rem;cursor:pointer">Fechar</button>
      `;
      confirmOverlay.appendChild(confirmBox);
      document.body.appendChild(confirmOverlay);
      confirmBox.querySelector('#confirmCloseBtn').addEventListener('click', () => confirmOverlay.remove());

      // Limpa o carrinho após confirmação
      saveCart({ items: [] });
      updateHeader({ items: [] });

      // Registra pedido no banco
      const emailCliente = localStorage.getItem('gn_profile_email') || '';
      const pedidoRes = await fetch(`${SUPABASE_URL}/rest/v1/pedidos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          cliente_email: emailCliente,
          cliente_nome: values.customerName,
          itens: cart.items.map(i => `${i.name} x${i.qty}`).join(', '),
          total: finalTotal,
          forma_pagamento: values.customerPayment,
          cupom_usado: appliedCoupon || null,
          desconto: appliedFixedDiscount > 0 ? appliedFixedDiscount : appliedDiscount > 0 ? total * appliedDiscount : 0,
          endereco: `${values.customerStreet}, ${values.customerNumber} - ${values.customerNeighborhood} - CEP ${sanitizeCep(values.customerCep)}`,
          missao_status: null
        })
      });
      const pedidoData = await pedidoRes.json().catch(() => null);
      const pedidoId = pedidoData && pedidoData[0] && pedidoData[0].id;

      // Progresso das missões é atualizado pelo admin ao aprovar o pedido
      const loggedEmail = localStorage.getItem('gn_profile_email');

      // Salva endereço no Supabase se logado
      if (loggedEmail) {
        const patchEndRes = await fetch(`${SUPABASE_URL}/rest/v1/dados_clientes?email=eq.${encodeURIComponent(loggedEmail)}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          },
          body: JSON.stringify({
            cep: sanitizeCep(values.customerCep),
            rua: values.customerStreet,
            numero: values.customerNumber,
            bairro: values.customerNeighborhood
          })
        });
        console.log('[PATCH endereço] status:', patchEndRes.status, await patchEndRes.text());
      }

      closeCartModal();
      if (!localStorage.getItem('gn_profile_email')) {
        localStorage.setItem('gn_register_pending', JSON.stringify({ name: values.customerName, cep: values.customerCep }));
        localStorage.setItem('gn_register_pending_addr', JSON.stringify({
          cep: sanitizeCep(values.customerCep),
          rua: values.customerStreet,
          numero: values.customerNumber,
          bairro: values.customerNeighborhood
        }));
        showRegisterPopup(values.customerName, values.customerCep, pedidoId);
      }
    });

    left.appendChild(form);
    content.append(left, right);
    container.appendChild(content);
    overlay.style.display = 'block';
  }



  async function saveCustomerSupabase(data) {
    // Verifica se email ja existe antes de inserir
    const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/dados_clientes?email=eq.${encodeURIComponent(data.email)}&select=email`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    const existing = await checkRes.json();
    if (existing && existing.length) return 'duplicate';

    const res = await fetch(`${SUPABASE_URL}/rest/v1/dados_clientes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        nome: data.name,
        email: data.email,
        whatsapp: data.phone,
        cupom: data.coupon
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('Supabase erro:', err);
      if (err.code === '23505') return 'duplicate';
      return 'error';
    }
    return 'ok';
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

  function showRegisterForm(overlay, modal, title, subtitle, onSuccess) {
    modal.innerHTML = `
      <button class="register-close" id="regClose">✕</button>
      <div class="register-top">
        <img src="logo.jpeg" alt="GN Máfia" class="register-logo" />
        <h2>${title}</h2>
        <p class="register-sub">${subtitle}</p>
        <div class="register-benefits">
          <span>10% OFF na próxima compra</span>
          <span>Promoções antecipadas</span>
          <span>Novidades em primeira mão</span>
        </div>
      </div>
      <form class="register-form" id="registerForm">
        <label class="form-field"><span>Nome completo</span><input type="text" name="regName" placeholder="Seu nome" required /></label>
        <label class="form-field"><span>E-mail</span><input type="email" name="regEmail" placeholder="seu@email.com" required /></label>
        <label class="form-field"><span>WhatsApp (com DDD)</span><input type="tel" name="regPhone" placeholder="11999999999" maxlength="11" required /></label>
        <button type="submit" class="checkout-continue">Criar cadastro e receber cupom</button>
      </form>
      <button class="register-skip" id="regSkip">Agora não</button>
    `;
    modal.querySelector('#regClose').addEventListener('click', () => overlay.remove());
    modal.querySelector('#regSkip').addEventListener('click', () => overlay.remove());
    modal.querySelector('#registerForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const coupon = 'GN' + Math.random().toString(36).substring(2,7).toUpperCase();
      const data = { name: fd.get('regName'), email: fd.get('regEmail'), phone: fd.get('regPhone'), coupon };
      const btn = e.target.querySelector('button[type="submit"]');
      btn.textContent = 'Salvando...'; btn.disabled = true;
      const ok = await saveCustomerSupabase(data);
      if (ok === 'duplicate') {
        // Loga automaticamente na conta existente
        localStorage.setItem('gn_profile_email', data.email);
        showMiniToast('Conta ja existente! Logado automaticamente.');
        btn.textContent = 'Criar cadastro e receber cupom'; btn.disabled = false;
        modal.innerHTML = `
          <div class="register-success">
            <img src="logo.jpeg" alt="GN Mafia" class="register-logo" />
            <h2 style="color:var(--gold-light)">Conta encontrada!</h2>
            <p style="color:var(--muted);font-size:0.9rem">Você já possui cadastro na GN Máfia.<br>Seu login foi realizado automaticamente.</p>
            <button class="checkout-continue" id="regSuccessClose" style="margin-top:8px">Fechar</button>
          </div>
        `;
        modal.querySelector('#regSuccessClose').addEventListener('click', () => overlay.remove());
        return;
      }
      if (ok === 'error') { showMiniToast('Erro ao salvar. Tente novamente.'); btn.textContent = 'Criar cadastro e receber cupom'; btn.disabled = false; return; }
      localStorage.setItem('gn_profile_email', data.email);
      localStorage.setItem('gn_register_done', '1');
      localStorage.removeItem('gn_register_pending');
      localStorage.removeItem('gn_register_pending_addr');
      if (onSuccess) onSuccess(data, coupon);
      modal.innerHTML = `
        <div class="register-success">
          <img src="logo.jpeg" alt="GN Máfia" class="register-logo" />
          <h2>Cadastro criado!</h2>
          <p>Seu cupom exclusivo:</p>
          <div class="register-coupon">${coupon}</div>
          <p class="register-coupon-note">Use na sua próxima compra e ganhe 10% OFF.</p>
          <button class="checkout-continue" id="regSuccessClose">Fechar</button>
        </div>
      `;
      modal.querySelector('#regSuccessClose').addEventListener('click', () => overlay.remove());
    });
  }

  function showRegisterPopup(prefillName, prefillCep, pedidoId) {
    if (localStorage.getItem('gn_profile_email')) return;
    const overlay = document.createElement('div');
    overlay.className = 'register-overlay';
    const modal = document.createElement('div');
    modal.className = 'register-modal';
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    overlay.style.display = 'flex';
    showRegisterForm(overlay, modal, 'Pedido enviado!',
      'Quer receber <strong>cupons exclusivos</strong> e ficar por dentro das promoções da GN Máfia?',
      async (data, coupon) => {
        if (pedidoId) {
          fetch(`${SUPABASE_URL}/rest/v1/pedidos?id=eq.${pedidoId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` },
            body: JSON.stringify({ cliente_email: data.email })
          });
        }
        const pendingAddr = localStorage.getItem('gn_register_pending_addr');
        if (pendingAddr) {
          fetch(`${SUPABASE_URL}/rest/v1/dados_clientes?email=eq.${encodeURIComponent(data.email)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` },
            body: JSON.stringify(JSON.parse(pendingAddr))
          });
          localStorage.removeItem('gn_register_pending_addr');
        }
      }
    );
    if (prefillName) modal.querySelector('[name="regName"]') && (modal.querySelector('[name="regName"]').value = prefillName);
  }

  // ── SISTEMA DE MISSOES ──
  const MISSOES = [
    { id: 'bronze',   tipo: 'gasto',   icone: '💰', titulo: 'Cliente Bronze',      meta: 500,  recompensa: '5% OFF',           descricao: 'Gaste R$ 500 em compras',   desconto: '5',  valor: null },
    { id: 'prata',    tipo: 'gasto',   icone: '🥈', titulo: 'Cliente Prata',       meta: 1000, recompensa: '10% OFF',          descricao: 'Gaste R$ 1.000 em compras', desconto: '10', valor: null },
    { id: 'ouro',     tipo: 'gasto',   icone: '🥇', titulo: 'Cliente Ouro',        meta: 2000, recompensa: 'Frete + 15% OFF',  descricao: 'Gaste R$ 2.000 em compras', desconto: '15', valor: null },
    { id: 'freq5',    tipo: 'pedidos', icone: '📦', titulo: 'Comprador Frequente', meta: 5,    recompensa: 'Cupom R$ 20',      descricao: 'Faca 5 pedidos',            desconto: null, valor: 20 },
    { id: 'vip10',    tipo: 'pedidos', icone: '🚀', titulo: 'Cliente VIP',         meta: 10,   recompensa: 'Cupom R$ 50',      descricao: 'Faca 10 pedidos',           desconto: null, valor: 50 },
    { id: 'lenda20',  tipo: 'pedidos', icone: '👑', titulo: 'Lenda GN',            meta: 20,   recompensa: 'Cupom R$ 100',     descricao: 'Faca 20 pedidos',           desconto: null, valor: 100 },
  ];

  // Faixas: [metaInicio, metaFim, nome, icone, cor]
  const NIVEIS = [
    { min: 0,    max: 500,  nome: 'Bronze',   icone: '🥉', cor: '#cd7f32' },
    { min: 500,  max: 1000, nome: 'Prata',    icone: '🥈', cor: '#c0c0c0' },
    { min: 1000, max: 2000, nome: 'Ouro',     icone: '🥇', cor: '#d5a651' },
    { min: 2000, max: null, nome: 'Diamante', icone: '💎', cor: '#a8d8ea' },
  ];

  function getNivel(totalGasto) {
    return NIVEIS.find(n => n.max === null || totalGasto < n.max) || NIVEIS[NIVEIS.length - 1];
  }

  // XP = pontos dentro do nível atual (0 a 100)
  function calcXP(totalGasto) {
    const n = getNivel(totalGasto);
    if (n.max === null) return 100;
    return Math.min(100, Math.round(((totalGasto - n.min) / (n.max - n.min)) * 100));
  }

  function gerarCodigoCupom(prefixo) {
    return prefixo + Math.random().toString(36).substring(2, 7).toUpperCase();
  }

  async function getProgresso(email) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/missoes_progresso?cliente_email=eq.${encodeURIComponent(email)}&select=*`, {
      cache: 'no-store',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    const data = await res.json();
    return data && data.length ? data[0] : null;
  }

  async function getCuponsConquistados(email) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/cupons_conquistados?cliente_email=eq.${encodeURIComponent(email)}&select=*&order=criado_em.desc`, {
      cache: 'no-store',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    return await res.json() || [];
  }

  async function atualizarProgressoMissoes(email, totalPedido) {
    if (!email) return;
    let prog = await getProgresso(email);
    const novoTotal = (prog ? prog.total_gasto : 0) + totalPedido;
    const novosPedidos = (prog ? prog.total_pedidos : 0) + 1;
    const novoXP = calcXP(novoTotal);
    const nivel = getNivel(novoTotal).nome.toLowerCase();

    const progPayload = { total_gasto: novoTotal, total_pedidos: novosPedidos, xp: novoXP, nivel, atualizado_em: new Date().toISOString() };
    if (prog) {
      const patchRes = await fetch(`${SUPABASE_URL}/rest/v1/missoes_progresso?cliente_email=eq.${encodeURIComponent(email)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Prefer': 'return=representation' },
        body: JSON.stringify(progPayload)
      });
      console.log('[missoes] PATCH progresso status:', patchRes.status, await patchRes.text());
    } else {
      const postRes = await fetch(`${SUPABASE_URL}/rest/v1/missoes_progresso`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Prefer': 'return=representation' },
        body: JSON.stringify({ cliente_email: email, ...progPayload })
      });
      console.log('[missoes] POST progresso status:', postRes.status, await postRes.text());
    }

    // Verifica missoes concluidas
    const cuponsExistentes = await getCuponsConquistados(email);
    const origensExistentes = cuponsExistentes.map(c => c.origem);
    const conquistados = [];

    for (const m of MISSOES) {
      if (origensExistentes.includes(m.id)) continue;
      const progValor = m.tipo === 'gasto' ? novoTotal : novosPedidos;
      if (progValor >= m.meta) {
        const codigo = gerarCodigoCupom('GN');
        await fetch(`${SUPABASE_URL}/rest/v1/cupons_conquistados`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Prefer': 'return=minimal' },
          body: JSON.stringify({ cliente_email: email, codigo, descricao: m.titulo, desconto: m.recompensa, origem: m.id, usado: false })
        });
        conquistados.push(m);
      }
    }

    if (conquistados.length) showConquistaAnimation(conquistados);
  }

  function showConquistaAnimation(missoes) {
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;top:80px;right:20px;z-index:9999;display:grid;gap:10px;max-width:320px';
    missoes.forEach(m => {
      const card = document.createElement('div');
      card.style.cssText = 'background:linear-gradient(135deg,#1a1400,#2a1e00);border:1px solid rgba(213,166,81,0.6);border-radius:14px;padding:16px 20px;display:flex;align-items:center;gap:12px;box-shadow:0 8px 32px rgba(0,0,0,0.6);animation:slideIn 0.4s ease';
      card.innerHTML = `<span style="font-size:2rem">${m.icone}</span><div><div style="color:#d5a651;font-weight:700;font-size:0.9rem">🏆 Missao Concluida!</div><div style="color:#f5f1ec;font-size:0.85rem">${m.titulo}</div><div style="color:#4caf50;font-size:0.78rem">+${m.recompensa}</div></div>`;
      el.appendChild(card);
    });
    document.body.appendChild(el);
    launchConfetti();
    setTimeout(() => { el.style.transition = 'opacity 0.5s'; el.style.opacity = '0'; }, 4000);
    setTimeout(() => el.remove(), 4600);
  }

  function launchConfetti() {
    const colors = ['#d5a651','#c9922a','#fff','#4caf50','#ffd700'];
    for (let i = 0; i < 80; i++) {
      const c = document.createElement('div');
      c.style.cssText = `position:fixed;top:-10px;left:${Math.random()*100}vw;width:8px;height:8px;border-radius:2px;background:${colors[Math.floor(Math.random()*colors.length)]};opacity:1;z-index:99999;pointer-events:none;animation:confettiFall ${1.2+Math.random()*1.6}s ease-in forwards;animation-delay:${Math.random()*0.6}s`;
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 3000);
    }
  }

  async function showProfilePanel() {
    const existing = document.getElementById('profileOverlay');
    if (existing) { existing.remove(); return; }

    const overlay = document.createElement('div');
    overlay.id = 'profileOverlay';
    overlay.className = 'profile-overlay';
    overlay.innerHTML = `<div class="profile-modal profile-modal-wide"><div class="profile-loading">Carregando...</div></div>`;
    document.body.appendChild(overlay);
    overlay.style.display = 'flex';
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    const savedEmail = localStorage.getItem('gn_profile_email');
    let cliente = null;

    if (savedEmail) {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/dados_clientes?email=eq.${encodeURIComponent(savedEmail)}&select=nome,email,cupom`, {
        cache: 'no-store',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
      });
      const data = await res.json();
      if (data && data.length) cliente = data[0];
    }

    const modal = overlay.querySelector('.profile-modal');

    if (!cliente) {
      modal.innerHTML = `
        <button class="register-close" id="profileClose">✕</button>
        <div style="text-align:center">
          <img src="logo.jpeg" class="register-logo" alt="GN Máfia" />
          <h2 style="color:var(--gold-light);margin-bottom:8px">Minha Conta</h2>
          <p style="color:var(--muted);font-size:0.88rem;margin-bottom:24px">Informe seu e-mail para acessar seu perfil</p>
        </div>
        <form id="profileLoginForm" style="display:grid;gap:14px">
          <label class="form-field"><span>E-mail</span><input type="email" name="loginEmail" placeholder="seu@email.com" required /></label>
          <button type="submit" class="checkout-continue">Acessar perfil</button>
        </form>
        <p style="text-align:center;margin-top:12px;font-size:0.78rem;color:var(--muted)">Ainda não tem cadastro? Finalize uma compra para criar.</p>
        <div style="margin-top:16px;border-top:1px solid var(--border);padding-top:16px">
          <button class="checkout-continue" id="profileRegisterBtn" style="font-size:0.85rem">Criar cadastro e ganhar 10% OFF</button>
        </div>
      `;
      modal.querySelector('#profileClose').addEventListener('click', () => overlay.remove());
      modal.querySelector('#profileRegisterBtn').addEventListener('click', () => {
        showRegisterForm(overlay, modal, 'Crie sua conta!',
          'Cadastre-se agora e ganhe <strong>10% OFF</strong> na sua primeira compra.');
      });
      modal.querySelector('#profileLoginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = new FormData(e.target).get('loginEmail');
        const btn = e.target.querySelector('button');
        btn.textContent = 'Buscando...';
        btn.disabled = true;
        const res = await fetch(`${SUPABASE_URL}/rest/v1/dados_clientes?email=eq.${encodeURIComponent(email)}&select=nome,email,cupom`, {
          cache: 'no-store',
          headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        const data = await res.json();
        if (!data || !data.length) {
          showMiniToast('E-mail não encontrado.');
          btn.textContent = 'Acessar perfil';
          btn.disabled = false;
          return;
        }
        localStorage.setItem('gn_profile_email', email);
        overlay.remove();
        showProfilePanel();
      });
      return;
    }

    // ── Busca progresso e cupons conquistados ──
    const [prog, cuponsConq] = await Promise.all([
      getProgresso(savedEmail),
      getCuponsConquistados(savedEmail)
    ]);

    const totalGasto   = prog ? prog.total_gasto   : 0;
    const totalPedidos = prog ? prog.total_pedidos  : 0;
    const nivel        = getNivel(totalGasto);
    const xp           = calcXP(totalGasto);
    const firstName    = cliente.nome.split(' ')[0];

    // Barra de XP dentro do nível atual
    const xpMin  = nivel.max === null ? totalGasto : nivel.min;
    const xpMax  = nivel.max === null ? totalGasto : nivel.max;
    const proximaMeta = nivel.max || null;
    const pctNivel = xp;

    // Cupons ativos vs usados
    const cuponsAtivos  = cuponsConq.filter(c => !c.usado);
    const cuponsUsados  = cuponsConq.filter(c => c.usado === true);
    // Cupom de cadastro
    const cupomCadastro = cliente.cupom ? [{ codigo: cliente.cupom, descricao: 'Boas-vindas', desconto: '10% OFF', usado: false, _cadastro: true }] : [];
    const todosCuponsAtivos = [...cupomCadastro, ...cuponsAtivos];

    // Renderiza abas
    modal.innerHTML = `
      <button class="register-close" id="profileClose">✕</button>
      <div class="profile-header">
        <img src="logo.jpeg" class="register-logo" alt="GN Máfia" />
        <h2>Olá, <span style="color:var(--gold-light)">${firstName}</span>! <span style="font-size:1.1rem">${nivel.icone}</span></h2>
        <p style="color:${nivel.cor};font-size:0.8rem;font-weight:700;letter-spacing:0.08em">Nível ${nivel.nome} · ${xp} XP</p>
        <p style="color:var(--muted);font-size:0.78rem;margin-top:2px">${cliente.email}</p>
      </div>

      <div class="profile-tabs">
        <button class="profile-tab profile-tab-active" data-tab="missoes">🏆 Missões</button>
        <button class="profile-tab" data-tab="cupons">🎁 Meus Cupons</button>
        <button class="profile-tab" data-tab="conquistas">⭐ Conquistas</button>
      </div>

      <div class="profile-tab-content" id="tab-missoes">
        <!-- Stats -->
        <div class="profile-stats">
          <div class="stat-card">
            <div class="stat-value">${formatBRL(totalGasto)}</div>
            <div class="stat-label">Total Gasto</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${totalPedidos}</div>
            <div class="stat-label">Pedidos</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color:${nivel.cor}">${nivel.icone} ${nivel.nome}</div>
            <div class="stat-label">Nível Atual</div>
          </div>
        </div>

        ${ proximaMeta ? `
        <div class="proxima-meta">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <span style="font-size:0.78rem;color:var(--muted)">XP — Nível ${nivel.nome}</span>
            <span style="font-size:0.75rem;color:${nivel.cor};font-weight:700">${xp}%</span>
          </div>
          <div class="missao-barra-wrap"><div class="missao-barra" style="width:${xp}%;background:${nivel.cor}"></div></div>
          <div style="font-size:0.72rem;color:var(--muted);margin-top:6px">${formatBRL(totalGasto)} / ${formatBRL(proximaMeta)} — Avance para <strong>${NIVEIS.find(n => n.min === (nivel.max || 0))?.nome || 'Diamante'}</strong></div>
        </div>` : `<div class="proxima-meta" style="text-align:center;color:var(--gold-light);font-size:0.85rem">💎 Nível máximo atingido: Diamante! XP: 100%</div>` }

        <div style="font-size:0.75rem;color:var(--muted);letter-spacing:0.1em;margin-bottom:10px;text-align:left">MISSÕES GN MÁFIA</div>
        <div class="missoes-lista" id="missoesList"></div>
      </div>

      <div class="profile-tab-content" id="tab-cupons" style="display:none">
        <div style="font-size:0.75rem;color:var(--muted);letter-spacing:0.1em;margin-bottom:12px">CUPONS DISPONÍVEIS</div>
        ${ todosCuponsAtivos.length ? todosCuponsAtivos.map(c => `
          <div class="missao-card" style="margin-bottom:10px">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
              <div>
                <div style="font-size:0.8rem;font-weight:700;color:var(--text)">${c.descricao}</div>
                <div style="font-size:0.72rem;color:var(--gold-light);margin-top:2px">${c.desconto}</div>
              </div>
              <div style="text-align:right">
                <div class="register-coupon" style="font-size:1rem;padding:8px 14px;letter-spacing:0.18em">${c.codigo}</div>
                <button class="coupon-copy" style="margin-top:6px;font-size:0.72rem;padding:5px 12px" onclick="navigator.clipboard.writeText('${c.codigo}');this.textContent='Copiado!';setTimeout(()=>this.textContent='Copiar',2000)">Copiar</button>
              </div>
            </div>
          </div>`).join('') : `<p style="color:var(--muted);font-size:0.85rem;text-align:center;padding:20px 0">Nenhum cupom disponível.<br><span style="font-size:0.78rem">Complete missões para ganhar cupons!</span></p>` }

        ${ cuponsUsados.length ? `
          <div style="font-size:0.75rem;color:var(--muted);letter-spacing:0.1em;margin:16px 0 10px">HISTÓRICO DE CUPONS USADOS</div>
          ${ cuponsUsados.map(c => `
            <div class="missao-card" style="opacity:0.5;margin-bottom:8px">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <div>
                  <div style="font-size:0.78rem;color:var(--muted);text-decoration:line-through">${c.descricao}</div>
                  <div style="font-size:0.7rem;color:var(--muted)">${c.desconto}</div>
                </div>
                <div style="font-size:0.78rem;color:var(--muted);text-decoration:line-through;letter-spacing:0.1em">${c.codigo}</div>
              </div>
            </div>`).join('') }` : '' }
      </div>

      <div class="profile-tab-content" id="tab-conquistas" style="display:none">
        <div style="font-size:0.75rem;color:var(--muted);letter-spacing:0.1em;margin-bottom:12px">MINHAS CONQUISTAS</div>
        <div id="conquistasList"></div>

        <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border)">
          <div style="font-size:0.75rem;color:var(--muted);letter-spacing:0.1em;margin-bottom:10px">BENEFÍCIOS DO SEU NÍVEL: <span style="color:${nivel.cor}">${nivel.icone} ${nivel.nome.toUpperCase()}</span></div>
          ${ renderBeneficios(nivel.nome) }
        </div>

        <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border)">
          <div style="font-size:0.75rem;color:var(--muted);letter-spacing:0.1em;margin-bottom:10px">DESAFIOS DE ENGAJAMENTO</div>
          <div class="missao-card" style="margin-bottom:8px">
            <div class="missao-header">
              <span class="missao-icone">📸</span>
              <div class="missao-info">
                <div class="missao-titulo">Poste sua compra</div>
                <div class="missao-desc">Publique uma foto usando a roupa e marque @gnmafia_oficial</div>
              </div>
              <div class="missao-recompensa">10% OFF</div>
            </div>
          </div>
          <div class="missao-card">
            <div class="missao-header">
              <span class="missao-icone">⭐</span>
              <div class="missao-info">
                <div class="missao-titulo">Avalie sua compra</div>
                <div class="missao-desc">Deixe uma avaliação do produto</div>
              </div>
              <div class="missao-recompensa">R$ 10 OFF</div>
            </div>
          </div>
        </div>
      </div>

      <button class="register-skip" id="profileLogout" style="margin-top:16px">Sair da conta</button>
    `;

    // Renderiza missões com progresso
    const missoesList = modal.querySelector('#missoesList');
    MISSOES.forEach(m => {
      const progValor  = m.tipo === 'gasto' ? totalGasto : totalPedidos;
      const pct        = Math.min(100, Math.round((progValor / m.meta) * 100));
      const concluida  = progValor >= m.meta;
      const origens    = cuponsConq.map(c => c.origem);
      const resgatada  = origens.includes(m.id);

      const card = document.createElement('div');
      card.className = 'missao-card' + (concluida ? ' missao-concluida' : '');
      card.innerHTML = `
        <div class="missao-header">
          <span class="missao-icone">${m.icone}</span>
          <div class="missao-info">
            <div class="missao-titulo">${m.titulo} ${resgatada ? '✅' : ''}</div>
            <div class="missao-desc">${m.descricao}</div>
          </div>
          <div>
            <div class="missao-recompensa">🎁 ${m.recompensa}</div>
            <div class="missao-pct">${pct}%</div>
          </div>
        </div>
        <div style="margin-top:8px">
          <div class="missao-barra-wrap"><div class="missao-barra" style="width:${pct}%"></div></div>
          <div style="display:flex;justify-content:space-between;font-size:0.7rem;color:var(--muted);margin-top:4px">
            <span>${m.tipo === 'gasto' ? formatBRL(Math.min(progValor, m.meta)) : Math.min(progValor, m.meta) + ' pedidos'}</span>
            <span>${m.tipo === 'gasto' ? formatBRL(m.meta) : m.meta + ' pedidos'}</span>
          </div>
        </div>
      `;
      missoesList.appendChild(card);
    });

    // Renderiza conquistas
    const conquistasList = modal.querySelector('#conquistasList');
    if (cuponsConq.length) {
      cuponsConq.forEach(c => {
        const missao = MISSOES.find(m => m.id === c.origem);
        const div = document.createElement('div');
        div.className = 'missao-card missao-concluida';
        div.style.marginBottom = '8px';
        div.innerHTML = `
          <div class="missao-header">
            <span class="missao-icone">${missao ? missao.icone : '🏆'}</span>
            <div class="missao-info">
              <div class="missao-titulo">${c.descricao}</div>
              <div class="missao-desc">${c.desconto}${c.usado ? ' — <span style="color:#f55e5e">Usado</span>' : ''}</div>
            </div>
            <div style="font-size:1.4rem">✅</div>
          </div>
        `;
        conquistasList.appendChild(div);
      });
    } else {
      conquistasList.innerHTML = `<p style="color:var(--muted);font-size:0.85rem;text-align:center;padding:20px 0">Nenhuma conquista ainda.<br><span style="font-size:0.78rem">Complete missões para desbloquear medalhas!</span></p>`;
    }

    // Lógica das abas
    modal.querySelectorAll('.profile-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        modal.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('profile-tab-active'));
        modal.querySelectorAll('.profile-tab-content').forEach(c => c.style.display = 'none');
        tab.classList.add('profile-tab-active');
        modal.querySelector('#tab-' + tab.dataset.tab).style.display = 'block';
      });
    });

    modal.querySelector('#profileClose').addEventListener('click', () => overlay.remove());
    modal.querySelector('#profileLogout').addEventListener('click', () => {
      localStorage.removeItem('gn_profile_email');
      overlay.remove();
    });
  }

  function renderBeneficios(nomeNivel) {
    const mapa = {
      'Bronze':   ['Cupons exclusivos de boas-vindas', 'Acesso a promoções da semana'],
      'Prata':    ['Cupons exclusivos 5% OFF', 'Acesso antecipado a lançamentos', 'Frete promocional'],
      'Ouro':     ['Cupons exclusivos 10% OFF', 'Acesso VIP a lançamentos', 'Frete grátis em pedidos acima de R$ 200'],
      'Diamante': ['Cupons exclusivos 15% OFF', 'Acesso VIP a lançamentos', 'Frete grátis em todos os pedidos', 'Sorteios mensais exclusivos'],
    };
    const itens = mapa[nomeNivel] || mapa['Bronze'];
    return itens.map(b => `<div style="display:flex;align-items:center;gap:8px;font-size:0.8rem;color:var(--muted);margin-bottom:7px"><span style="color:var(--gold-light)">✓</span>${b}</div>`).join('');
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
    // Desativa restauracao automatica do browser para controlar manualmente
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

    updateHeader(loadCart());

    // Restaura posicao de scroll
    const savedScroll = sessionStorage.getItem('gn_scroll');
    if (savedScroll) {
      sessionStorage.removeItem('gn_scroll');
      const target = parseInt(savedScroll);
      // Tenta restaurar após o layout estabilizar (imagens/fontes)
      const tryScroll = (attempts) => {
        window.scrollTo(0, target);
        if (Math.abs(window.scrollY - target) > 10 && attempts > 0) {
          requestAnimationFrame(() => tryScroll(attempts - 1));
        }
      };
      // Aguarda load completo para garantir altura total da página
      if (document.readyState === 'complete') {
        requestAnimationFrame(() => tryScroll(20));
      } else {
        window.addEventListener('load', () => requestAnimationFrame(() => tryScroll(20)), { once: true });
      }
    }
    const saveScroll = () => sessionStorage.setItem('gn_scroll', window.scrollY);
    window.addEventListener('beforeunload', saveScroll);
    window.addEventListener('pagehide', saveScroll);
    // Salva periodicamente para cobrir navegacao por SPA/hash
    window.addEventListener('scroll', () => sessionStorage.setItem('gn_scroll', window.scrollY), { passive: true });

    const pending = localStorage.getItem('gn_register_pending');
    if (pending && !localStorage.getItem('gn_profile_email')) {
      const { name, cep } = JSON.parse(pending);
      showRegisterPopup(name, cep);
    }

    // Popup de boas-vindas para visitantes novos
    if (!localStorage.getItem('gn_profile_email') && !localStorage.getItem('gn_welcome_seen')) {
      setTimeout(() => {
        localStorage.setItem('gn_welcome_seen', '1');
        const overlay = document.createElement('div');
        overlay.className = 'register-overlay';
        const modal = document.createElement('div');
        modal.className = 'register-modal';
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        overlay.style.display = 'flex';
        showRegisterForm(overlay, modal, 'Bem-vindo à GN Máfia!',
          'Cadastre-se agora e ganhe <strong>10% OFF</strong> na sua primeira compra.');
      }, 4000);
    }
    $all('.add-to-cart').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const card = e.target.closest('.product-card');
        if (!card) return;
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

    // Delegação para cards carregados dinamicamente (Supabase)
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.add-to-cart');
      if (!btn || btn.dataset.cartBound) return;
      const card = btn.closest('.product-card');
      if (!card) return;
      const imgEl = card.querySelector('.main-img, img');
      const rawSrc = card.getAttribute('data-image') || (imgEl ? imgEl.getAttribute('src') : '');
      const base = window.location.href.replace(/\/[^\/]*$/, '/');
      const absoluteImage = rawSrc ? (rawSrc.startsWith('http') ? rawSrc : base + rawSrc) : '';
      addToCart({
        id: card.getAttribute('data-name'),
        name: card.getAttribute('data-name'),
        price: Number(card.getAttribute('data-price')),
        image: absoluteImage
      });
    });

    const cartBtn = document.getElementById('cartBtn');
    cartBtn && cartBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleCartPanel();
    });

    const profileBtn = document.getElementById('profileBtn');
    profileBtn && profileBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showProfilePanel();
    });
  });

})();
