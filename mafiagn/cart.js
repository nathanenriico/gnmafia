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

  function validateCheckoutForm(values) {
    if (!values.customerName.trim()) return 'Por favor, informe seu nome completo.';
    const phoneDigits = sanitizePhone(values.customerPhone);
    if (!/^[0-9]{10,13}$/.test(phoneDigits)) return 'Por favor, informe o WhatsApp com DDD (somente números).';
    const cepDigits = sanitizeCep(values.customerCep);
    if (!/^[0-9]{8}$/.test(cepDigits)) return 'Por favor, informe um CEP válido com 8 dígitos.';
    if (!values.customerNumber.trim()) return 'Por favor, informe o número do endereço.';
    if (!values.customerStreet.trim()) return 'Por favor, informe a rua/logradouro.';
    if (!values.customerNeighborhood.trim()) return 'Por favor, informe o bairro.';
    if (!values.customerCity.trim()) return 'Por favor, informe a cidade.';
    if (!values.customerState.trim()) return 'Por favor, informe o estado.';
    return null;
  }

  async function fetchAddressByCep(cep, form) {
    const inputStreet = form.querySelector('input[name="customerStreet"]');
    const inputNeighborhood = form.querySelector('input[name="customerNeighborhood"]');
    const inputCity = form.querySelector('input[name="customerCity"]');
    const inputState = form.querySelector('input[name="customerState"]');
    const cepValue = sanitizeCep(cep);
    if (cepValue.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepValue}/json/`);
      const data = await response.json();
      if (data.erro) {
        showMiniToast('CEP não encontrado. Confira o número e tente novamente.');
        return;
      }
      inputStreet.value = data.logradouro || '';
      inputNeighborhood.value = data.bairro || '';
      inputCity.value = data.localidade || '';
      inputState.value = data.uf || '';
    } catch (error) {
      showMiniToast('Não foi possível buscar o CEP. Tente novamente.');
    }
  }

  function createCheckoutForm(cart) {
    const form = document.createElement('form');
    form.className = 'whatsapp-form';
    const title = document.createElement('h4');
    title.textContent = 'Finalize pelo WhatsApp';
    form.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'checkout-grid';

    const personal = document.createElement('div');
    personal.className = 'checkout-section';
    const personalTitle = document.createElement('h5');
    personalTitle.textContent = 'Dados Pessoais';
    personal.appendChild(personalTitle);

    const personalFields = [
      { label: 'Nome Completo', name: 'customerName', placeholder: 'Seu nome completo', type: 'text' },
      { label: 'WhatsApp (com DDD)', name: 'customerPhone', placeholder: '11999999999', type: 'tel' }
    ];

    personalFields.forEach(field => {
      const wrapper = document.createElement('label');
      wrapper.className = 'form-field';
      const label = document.createElement('span');
      label.textContent = field.label;
      const input = document.createElement('input');
      input.type = field.type;
      input.name = field.name;
      input.placeholder = field.placeholder;
      wrapper.appendChild(label);
      wrapper.appendChild(input);
      personal.appendChild(wrapper);
    });

    const delivery = document.createElement('div');
    delivery.className = 'checkout-section';
    const deliveryTitle = document.createElement('h5');
    deliveryTitle.textContent = 'Dados de Entrega';
    delivery.appendChild(deliveryTitle);

    const deliveryFields = [
      { label: 'CEP', name: 'customerCep', placeholder: '00000-000', type: 'text' },
      { label: 'Número', name: 'customerNumber', placeholder: 'Número', type: 'text' },
      { label: 'Complemento (opcional)', name: 'customerComplement', placeholder: 'Apartamento, bloco, etc.', type: 'text' },
      { label: 'Rua / Logradouro', name: 'customerStreet', placeholder: 'Rua preenchida automaticamente', type: 'text' },
      { label: 'Bairro', name: 'customerNeighborhood', placeholder: 'Bairro preenchido automaticamente', type: 'text' },
      { label: 'Cidade', name: 'customerCity', placeholder: 'Cidade preenchida automaticamente', type: 'text' },
      { label: 'Estado', name: 'customerState', placeholder: 'UF preenchido automaticamente', type: 'text' }
    ];

    deliveryFields.forEach(field => {
      const wrapper = document.createElement('label');
      wrapper.className = 'form-field';
      const label = document.createElement('span');
      label.textContent = field.label;
      const input = document.createElement('input');
      input.type = field.type;
      input.name = field.name;
      input.placeholder = field.placeholder;
      if (['customerStreet', 'customerNeighborhood', 'customerCity', 'customerState'].includes(field.name)) {
        input.autocomplete = 'street-address';
      }
      wrapper.appendChild(label);
      wrapper.appendChild(input);
      delivery.appendChild(wrapper);
      if (field.name === 'customerCep') {
        input.addEventListener('blur', () => fetchAddressByCep(input.value, form));
      }
    });

    grid.appendChild(personal);
    grid.appendChild(delivery);
    form.appendChild(grid);

    const button = document.createElement('button');
    button.type = 'submit';
    button.className = 'whatsapp-button';
    button.textContent = '🟢 Finalizar Pedido via WhatsApp';
    form.appendChild(button);

    const note = document.createElement('p');
    note.className = 'cart-note';
    note.textContent = 'O WhatsApp será aberto com mensagem pronta. Se não atendermos na hora, o atendimento automático do WhatsApp Business vai confirmar seus dados e pedido.';
    form.appendChild(note);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const values = {
        customerName: formData.get('customerName')?.toString() || '',
        customerPhone: formData.get('customerPhone')?.toString() || '',
        customerCep: formData.get('customerCep')?.toString() || '',
        customerNumber: formData.get('customerNumber')?.toString() || '',
        customerComplement: formData.get('customerComplement')?.toString() || '',
        customerStreet: formData.get('customerStreet')?.toString() || '',
        customerNeighborhood: formData.get('customerNeighborhood')?.toString() || '',
        customerCity: formData.get('customerCity')?.toString() || '',
        customerState: formData.get('customerState')?.toString() || ''
      };
      const error = validateCheckoutForm(values);
      if (error) {
        showMiniToast(error);
        return;
      }
      const digits = sanitizePhone(values.customerPhone);
      const message = buildWhatsAppMessage(cart, values.customerName, digits, {
        cep: sanitizeCep(values.customerCep),
        number: values.customerNumber,
        complement: values.customerComplement,
        street: values.customerStreet,
        neighborhood: values.customerNeighborhood,
        city: values.customerCity,
        state: values.customerState
      });
      const partnerNumber = STORE_PHONE;
      if (!/^[0-9]{11,13}$/.test(partnerNumber)) {
        showMiniToast('Configure o número do WhatsApp da loja em cart.js antes de finalizar.');
        return;
      }
      const url = `https://wa.me/${partnerNumber}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
    });

    return form;
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

  function renderCartPanel() {
    // Render a centered checkout page/panel (similar to full checkout layout)
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
      overlay.addEventListener('click', (event) => {
        if (event.target === overlay) closeCartModal();
      });
    } else {
      container = document.getElementById('checkoutContainer');
    }

    const cart = loadCart();
    const { total } = cartTotals(cart);
    container.innerHTML = '';

    // Steps bar (top)
    const steps = document.createElement('div');
    steps.className = 'checkout-steps';
    steps.innerHTML = `
      <div class="step step-active"><span>1</span> Carrinho</div>
      <div class="step"><span>2</span> Identificação</div>
      <div class="step"><span>3</span> Pagamento</div>
    `;
    container.appendChild(steps);

    // Main content two columns
    const content = document.createElement('div');
    content.className = 'checkout-content';

    const left = document.createElement('div');
    left.className = 'checkout-left';
    const title = document.createElement('h2'); title.textContent = 'Produtos';
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
        minus.type = 'button';
        minus.className = 'qty-control';
        minus.textContent = '−';
        const qty = document.createElement('input');
        qty.type = 'number';
        qty.className = 'qty-input';
        qty.value = it.qty;
        qty.min = '1';
        const plus = document.createElement('button');
        plus.type = 'button';
        plus.className = 'qty-control';
        plus.textContent = '+';
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'remove-item';
        remove.textContent = 'Remover';

        minus.addEventListener('click', () => { updateCartItem(it.id, it.qty - 1); renderCartPanel(); });
        plus.addEventListener('click', () => { updateCartItem(it.id, it.qty + 1); renderCartPanel(); });
        qty.addEventListener('change', () => { const value = Number(qty.value) || 1; updateCartItem(it.id, value); renderCartPanel(); });
        remove.addEventListener('click', () => { removeCartItem(it.id); renderCartPanel(); });

        controls.appendChild(minus);
        controls.appendChild(qty);
        controls.appendChild(plus);
        controls.appendChild(remove);

        row.appendChild(details);
        row.appendChild(controls);
        itemList.appendChild(row);
      });
      left.appendChild(itemList);
    }

    // append form under items
    left.appendChild(createCheckoutForm(cart));

    const right = document.createElement('aside');
    right.className = 'checkout-right';
    const summary = document.createElement('div');
    summary.className = 'checkout-summary';
    summary.innerHTML = `
      <h4>Resumo</h4>
      <div class="summary-row"><span>Valor dos produtos</span><strong id="summaryProducts">${formatBRL(total)}</strong></div>
      <div class="summary-row"><span>Frete</span><span id="summaryShipping">A calcular</span></div>
      <div class="summary-total"><span>Total da compra</span><strong id="summaryTotal">${formatBRL(total)}</strong></div>
      <button class="checkout-continue">Continuar</button>
    `;
    right.appendChild(summary);

    content.appendChild(left);
    content.appendChild(right);
    container.appendChild(content);

    return container;
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
        const product = {
          id: card.getAttribute('data-name'),
          name: card.getAttribute('data-name'),
          price: Number(card.getAttribute('data-price'))
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
