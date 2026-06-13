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

  async function renderIdentificationPanel() {
    const { overlay, container } = buildCheckoutShell(2);
    const cart = loadCart();
    const { total } = cartTotals(cart);
    let appliedDiscount = 0;
    let appliedCoupon = '';
    let appliedCouponType = '';

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

    function updateSummary(discount) {
      const finalTotal = discount > 0 ? total * 0.9 : total;
      right.innerHTML = `
        <div class="checkout-summary">
          <h4>Resumo</h4>
          <div class="summary-row"><span>Valor dos produtos</span><strong>${formatBRL(total)}</strong></div>
          ${discount > 0 ? `<div class="summary-row" style="color:#4caf50"><span>Desconto (10%)</span><strong>- ${formatBRL(total * 0.1)}</strong></div>` : ''}
          <div class="summary-row"><span>Frete</span><span>A calcular</span></div>
          <div class="summary-total"><span>Total da compra</span><strong>${formatBRL(finalTotal)}</strong></div>
        </div>`;
    }
    updateSummary(0);

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
        updateSummary(1);
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
        updateSummary(1);
        btn.textContent = 'Aplicado'; btn.disabled = true;
        return;
      }

      msg.textContent = 'Cupom invalido ou ja utilizado.';
      msg.className = 'coupon-msg-error';
      appliedDiscount = 0; appliedCoupon = ''; appliedCouponType = '';
      updateSummary(0);
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

      const finalTotal = appliedDiscount > 0 ? total * 0.9 : total;
      const items = cart.items.map(item => `- ${item.name} x${item.qty}`).join('\n');
      const discountLine = appliedDiscount > 0 ? `\nCupom: ${appliedCoupon} (-10%) = ${formatBRL(finalTotal)}` : '';
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
          desconto: appliedDiscount > 0 ? total * 0.1 : 0,
          endereco: `${values.customerStreet}, ${values.customerNumber} - ${values.customerNeighborhood} - CEP ${sanitizeCep(values.customerCep)}`
        })
      });
      const pedidoData = await pedidoRes.json().catch(() => null);
      const pedidoId = pedidoData && pedidoData[0] && pedidoData[0].id;

      // Salva endereço no Supabase se logado
      const loggedEmail = localStorage.getItem('gn_profile_email');
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

  const SUPABASE_URL = 'https://yhggzhyabuqjuxtetjpj.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloZ2d6aHlhYnVxanV4dGV0anBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NTc4MzIsImV4cCI6MjA5NjMzMzgzMn0.jvF7q0tkjFOzYp1JOBG_2e2RbpZZ2euSKc1r4VHUnJs';

  async function saveCustomerSupabase(data) {
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

  function showRegisterPopup(prefillName, prefillCep, pedidoId) {
    if (localStorage.getItem('gn_profile_email')) return;

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
          <label class="form-field"><span>WhatsApp (com DDD)</span><input type="tel" name="regPhone" placeholder="11999999999" maxlength="11" required /></label>
          <button type="submit" class="checkout-continue">Criar cadastro e receber cupom</button>
        </form>
        <button class="register-skip" id="regSkip">Agora não</button>
      </div>
    `;

    document.body.appendChild(overlay);
    overlay.style.display = 'flex';

    const close = () => { overlay.remove(); localStorage.removeItem('gn_register_pending'); localStorage.removeItem('gn_register_pending_addr'); };
    overlay.querySelector('#regClose').addEventListener('click', close);
    overlay.querySelector('#regSkip').addEventListener('click', close);

    overlay.querySelector('#registerForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const coupon = 'GN' + Math.random().toString(36).substring(2,7).toUpperCase();
      const data = {
        name: fd.get('regName'),
        email: fd.get('regEmail'),
        phone: fd.get('regPhone'),
        coupon
      };
      const btn = e.target.querySelector('button[type="submit"]');
      btn.textContent = 'Salvando...';
      btn.disabled = true;
      const ok = await saveCustomerSupabase(data);
      if (ok === 'duplicate') {
        showMiniToast('E-mail já cadastrado!');
        btn.textContent = 'Criar cadastro e receber cupom';
        btn.disabled = false;
        return;
      }
      if (ok === 'error') {
        showMiniToast('Erro ao salvar. Tente novamente.');
        btn.textContent = 'Criar cadastro e receber cupom';
        btn.disabled = false;
        return;
      }
      localStorage.setItem('gn_profile_email', data.email);
      localStorage.setItem('gn_register_done', '1');
      localStorage.removeItem('gn_register_pending');
      // Atualiza email no pedido recém-criado
      if (pedidoId) {
        fetch(`${SUPABASE_URL}/rest/v1/pedidos?id=eq.${pedidoId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` },
          body: JSON.stringify({ cliente_email: data.email })
        });
      }
      // Salva endereço do pedido junto ao novo cadastro
      const pendingAddr = localStorage.getItem('gn_register_pending_addr');
      if (pendingAddr) {
        const addr = JSON.parse(pendingAddr);
        fetch(`${SUPABASE_URL}/rest/v1/dados_clientes?email=eq.${encodeURIComponent(data.email)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` },
          body: JSON.stringify(addr)
        });
        localStorage.removeItem('gn_register_pending_addr');
      }
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

  async function showProfilePanel() {
    const existing = document.getElementById('profileOverlay');
    if (existing) { existing.remove(); return; }

    const overlay = document.createElement('div');
    overlay.id = 'profileOverlay';
    overlay.className = 'profile-overlay';
    overlay.innerHTML = `<div class="profile-modal"><div class="profile-loading">Carregando...</div></div>`;
    document.body.appendChild(overlay);
    overlay.style.display = 'flex';
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    // Busca cliente pelo email salvo localmente
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
      // Tela de login por email
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
      `;
      modal.querySelector('#profileClose').addEventListener('click', () => overlay.remove());
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
        console.log('Profile login response:', res.status, data);
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
    } else {
      const firstName = cliente.nome.split(' ')[0];
      modal.innerHTML = `
        <button class="register-close" id="profileClose">✕</button>
        <div class="profile-header">
          <img src="logo.jpeg" class="register-logo" alt="GN Máfia" />
          <h2>Olá, <span style="color:var(--gold-light)">${firstName}</span>!</h2>
          <p style="color:var(--muted);font-size:0.82rem">${cliente.email}</p>
        </div>
        <div class="profile-section">
          <h4>Seus Cupons</h4>
          ${ cliente.cupom
            ? `<div class="profile-coupon">
                <div class="register-coupon">${cliente.cupom}</div>
                <p class="register-coupon-note">10% OFF na próxima compra — uso único</p>
                <button class="coupon-copy" onclick="navigator.clipboard.writeText('${cliente.cupom}');this.textContent='Copiado!';setTimeout(()=>this.textContent='Copiar cupom',2000)">Copiar cupom</button>
              </div>`
            : `<p style="color:var(--muted);font-size:0.85rem">Nenhum cupom disponível.<br><span style="font-size:0.78rem">O cupom é removido após o uso.</span></p>`
          }
        </div>
        <button class="register-skip" id="profileLogout">Sair da conta</button>
      `;
      modal.querySelector('#profileClose').addEventListener('click', () => overlay.remove());
      modal.querySelector('#profileLogout').addEventListener('click', () => {
        localStorage.removeItem('gn_profile_email');
        overlay.remove();
      });
    }
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

    const pending = localStorage.getItem('gn_register_pending');
    if (pending && !localStorage.getItem('gn_profile_email')) {
      const { name, cep } = JSON.parse(pending);
      showRegisterPopup(name, cep);
    }
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

    const profileBtn = document.getElementById('profileBtn');
    profileBtn && profileBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showProfilePanel();
    });
  });

})();
