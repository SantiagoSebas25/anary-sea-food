(function () {
  "use strict";

  const config = window.ANARY;
  const storageKey = "anary-demo-orders-v1";
  const cart = {};
  let selectedProofData = null;
  let selectedProofName = "";
  const money = value => "$" + Number(value).toFixed(2).replace(".", ",");
  const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
  const $ = id => document.getElementById(id);

  function loadOrders() {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch (error) {
      console.warn("No se pudieron leer pedidos del demo.", error);
    }

    const sample = [
      {
        id: "A-0012",
        created: new Date().toISOString(),
        customer: "Juan Pérez",
        phone: "099 000 0000",
        items: [
          { id: "pescado", name: "Pescado frito", quantity: 2, price: 6 },
          { id: "jugo", name: "Jugo natural", quantity: 1, price: 1.5 }
        ],
        subtotal: 13.5,
        packaging: config.envase,
        deliveryFee: 0,
        total: 14,
        delivery: "retirar",
        pickupDate: "Sábado",
        pickupTime: "13:00",
        address: "",
        reference: "",
        notes: "sin cebolla",
        proofName: "comprobante-demo.svg",
        proofDataUrl: "imagenes/comprobante-demo.svg",
        proofIsDemo: true,
        paymentMethod: "Deuna",
        status: "por_confirmar",
        kitchenSent: false,
        riderNoticeOpened: false
      },
      {
        id: "A-0011",
        created: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        customer: "María López",
        phone: "098 111 2233",
        items: [
          { id: "pescado-completo", name: "Pescado completo", quantity: 1, price: 8.5 },
          { id: "jugo", name: "Jugo natural", quantity: 1, price: 1.5 }
        ],
        subtotal: 10,
        packaging: config.envase,
        deliveryFee: config.envio,
        total: 10 + config.envase + config.envio,
        delivery: "domicilio",
        pickupDate: "",
        pickupTime: "",
        address: "Av. Ejemplo 123, Ambato",
        reference: "Frente al parque",
        notes: "Llamar al llegar",
        proofName: "comprobante-domicilio-demo.svg",
        proofDataUrl: "imagenes/comprobante-domicilio-demo.svg",
        proofIsDemo: true,
        paymentMethod: "Transferencia",
        paymentVerifiedAt: new Date().toISOString(),
        status: "pago_verificado",
        kitchenSent: false,
        riderNoticeOpened: false
      }
    ];
    try {
      localStorage.setItem(storageKey, JSON.stringify(sample));
    } catch (error) {
      console.warn("No se pudo guardar el pedido de muestra.", error);
    }
    return sample;
  }

  let orders = loadOrders();

  function saveOrders(nextOrders) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(nextOrders));
    } catch (error) {
      showToast("No se pudo guardar. La imagen podría ser demasiado grande; usa otra captura.");
      return false;
    }
    orders = nextOrders;
    renderStaffViews();
    renderCustomerTracking();
    return true;
  }

  function getPaymentMethod() {
    const selected = document.querySelector('input[name="payment-method"]:checked');
    return selected ? selected.value : "Deuna";
  }

  function updatePaymentMethod() {
    const isDeuna = getPaymentMethod() === "Deuna";
    $("deuna-payment").hidden = !isDeuna;
    $("transfer-payment").hidden = isDeuna;
    document.querySelectorAll(".payment-choice").forEach(label => {
      label.classList.toggle("selected", label.querySelector("input").checked);
    });
  }

  function imageToDataUrl(file) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith("image/")) {
        reject(new Error("Selecciona una captura en formato de imagen."));
        return;
      }
      if (typeof createImageBitmap !== "function") {
        reject(new Error("Este navegador no puede procesar la imagen del comprobante."));
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        reject(new Error("La imagen debe pesar menos de 8 MB."));
        return;
      }
      createImageBitmap(file).then(bitmap => {
        const scale = Math.min(1, 1000 / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        const context = canvas.getContext("2d");
        if (!context) {
          bitmap.close();
          reject(new Error("No se pudo preparar la imagen."));
          return;
        }
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();
        canvas.toBlob(blob => {
          if (!blob) {
            reject(new Error("No se pudo procesar la captura."));
            return;
          }
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error("No se pudo leer la captura."));
          reader.readAsDataURL(blob);
        }, "image/jpeg", 0.78);
      }).catch(() => reject(new Error("No se pudo abrir la imagen seleccionada.")));
    });
  }

  async function selectProof(file) {
    selectedProofData = null;
    selectedProofName = "";
    $("proof-preview").hidden = true;
    if (!file) return;

    try {
      selectedProofData = await imageToDataUrl(file);
      selectedProofName = file.name;
      $("proof-preview-image").src = selectedProofData;
      $("proof-preview-name").textContent = file.name;
      $("proof-preview").hidden = false;
    } catch (error) {
      $("proof-file").value = "";
      showToast(error.message);
    }
  }

  function orderStage(order) {
    return ({
      por_confirmar: 0,
      pago_verificado: 1,
      preparando: 2,
      listo: 3,
      entregado: 4
    })[order.status] || 0;
  }

  function renderCustomerTracking() {
    const lastId = localStorage.getItem("anary-demo-last-order");
    const order = orders.find(item => item.id === lastId);
    const panel = $("customer-tracking");
    if (!panel) return;
    if (!order) {
      panel.hidden = true;
      return;
    }
    panel.hidden = false;
    $("tracking-title").textContent = "Pedido #" + order.id;
    $("tracking-status").textContent = statusLabel(order.status, order);
    const labels = order.delivery === "domicilio"
      ? ["Recibido", "Pago validado", "En cocina", "Listo", "Entregado"]
      : ["Recibido", "Pago validado", "En cocina", "Listo para retirar"];
    const stage = Math.min(orderStage(order), labels.length - 1);
    $("tracking-steps").innerHTML = labels.map((label, index) =>
      `<li class="${index <= stage ? "done" : ""}">${label}</li>`).join("");
    const messages = {
      por_confirmar: "Recibimos tu pedido y el comprobante. El restaurante está revisando el pago.",
      pago_verificado: "Pago confirmado. El restaurante enviará la comanda a cocina.",
      preparando: "Tu pedido se está preparando. Tiempo estimado: " + config.preparacionMinutos + " minutos.",
      listo: order.delivery === "domicilio" ? "Tu pedido está listo; el restaurante avisará al motorizado." : "Tu pedido está listo para retirar.",
      entregado: "Tu pedido fue entregado. ¡Gracias por elegirnos!"
    };
    $("tracking-message").textContent = messages[order.status] || "";
  }

  function sumItems() {
    return Object.keys(cart).reduce((sum, id) => {
      const dish = config.platos.find(item => item.id === id);
      return dish ? sum + dish.precio * cart[id] : sum;
    }, 0);
  }

  function cartCount() {
    return Object.values(cart).reduce((sum, count) => sum + count, 0);
  }

  function deliveryType() {
    const selected = document.querySelector('input[name="delivery"]:checked');
    return selected ? selected.value : "retirar";
  }

  function calculateTotal() {
    const subtotal = sumItems();
    const shipping = deliveryType() === "domicilio" ? config.envio : 0;
    return { subtotal, packaging: config.envase, shipping, total: subtotal + config.envase + shipping };
  }

  function renderMenu() {
    $("menu-lista").innerHTML = config.platos.filter(item => item.disponible).map(item => `
      <article class="food-card">
        <div class="food-photo">
          <img src="${escapeHtml(item.foto)}" alt="${escapeHtml(item.nombre)}">
          ${item.etiqueta ? `<span class="food-tag">${escapeHtml(item.etiqueta)}</span>` : ""}
        </div>
        <div class="food-info">
          <h3>${escapeHtml(item.nombre)}</h3>
          <p>${escapeHtml(item.descripcion)}</p>
          <div class="food-bottom">
            <span class="food-price">${money(item.precio)}</span>
            <button class="add-button" data-add="${escapeHtml(item.id)}" aria-label="Agregar ${escapeHtml(item.nombre)}">+</button>
          </div>
        </div>
      </article>`).join("");

    $("menu-lista").addEventListener("click", event => {
      const button = event.target.closest("[data-add]");
      if (!button) return;
      cart[button.dataset.add] = (cart[button.dataset.add] || 0) + 1;
      renderCart();
      showToast("Agregado a tu pedido");
    });
  }

  function renderCart() {
    const count = cartCount();
    $("cart-bar").hidden = count === 0;
    $("cart-count").textContent = count + (count === 1 ? " plato" : " platos");
    $("cart-total").textContent = money(calculateTotal().total);
    renderOrderSummary();
  }

  function renderOrderSummary() {
    const lines = Object.entries(cart).filter(([, quantity]) => quantity > 0).map(([id, quantity]) => {
      const dish = config.platos.find(item => item.id === id);
      if (!dish) return "";
      return `<div class="cart-line">
        <span class="cart-line-name"><b>${escapeHtml(dish.nombre)}</b><small>${money(dish.precio)} c/u</small></span>
        <span class="line-price">${money(dish.precio * quantity)}</span>
        <span class="quantity"><button data-change="${escapeHtml(id)}" data-by="-1" aria-label="Quitar uno">−</button><span>${quantity}</span><button data-change="${escapeHtml(id)}" data-by="1" aria-label="Agregar uno">+</button></span>
      </div>`;
    }).join("");
    $("cart-lines").innerHTML = lines || '<p class="empty-state">Agrega algo rico del menú para continuar.</p>';
    $("subtotal").textContent = money(sumItems());
    const values = calculateTotal();
    $("totals-box").innerHTML = `
      <div class="total-line"><span>Platos</span><b>${money(values.subtotal)}</b></div>
      <div class="total-line"><span>Envase para llevar</span><b>${money(values.packaging)}</b></div>
      ${values.shipping ? `<div class="total-line"><span>Envío a domicilio</span><b>${money(values.shipping)}</b></div>` : ""}
      <div class="total-line total"><span>Total a pagar</span><b>${money(values.total)}</b></div>`;
    $("cart-total").textContent = money(values.total);
  }

  function formatDate(date) {
    return new Intl.DateTimeFormat("es-EC", { weekday: "long", day: "numeric", month: "short" }).format(date);
  }

  function setupPickupOptions() {
    const select = $("pickup-date");
    const now = new Date();
    const dates = [];
    for (let offset = 0; dates.length < 4 && offset < 22; offset++) {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
      if (config.horario.dias.includes(date.getDay())) dates.push(date);
    }
    select.innerHTML = dates.map(date => `<option value="${date.toISOString().slice(0, 10)}">${formatDate(date)}</option>`).join("");

    const [startHour, startMinute] = config.horario.desde.split(":").map(Number);
    const [endHour, endMinute] = config.horario.hasta.split(":").map(Number);
    const start = startHour * 60 + startMinute;
    const end = endHour * 60 + endMinute;
    const times = [];
    for (let minutes = start; minutes < end; minutes += config.horario.intervaloMinutos) {
      times.push(String(Math.floor(minutes / 60)).padStart(2, "0") + ":" + String(minutes % 60).padStart(2, "0"));
    }
    $("pickup-time").innerHTML = times.map(time => `<option>${time}</option>`).join("");
  }

  function updateOpenStatus() {
    const now = new Date();
    const minute = now.getHours() * 60 + now.getMinutes();
    const [fromHour, fromMinute] = config.horario.desde.split(":").map(Number);
    const [toHour, toMinute] = config.horario.hasta.split(":").map(Number);
    const open = config.horario.dias.includes(now.getDay()) && minute >= fromHour * 60 + fromMinute && minute < toHour * 60 + toMinute;
    const text = open ? "Abierto ahora · Hasta las " + config.horario.hasta : "Cerrado ahora · Puedes programar para el fin de semana";
    $("estado-horario").textContent = text;
    $("tiempo-preparacion").textContent = config.preparacionMinutos + " minutos";
  }

  function updateDeliveryFields() {
    const isDelivery = deliveryType() === "domicilio";
    $("delivery-fields").hidden = !isDelivery;
    $("pickup-fields").hidden = isDelivery;
    $("choice-pickup").classList.toggle("selected", !isDelivery);
    $("choice-delivery").classList.toggle("selected", isDelivery);
    renderOrderSummary();
  }

  function makeRiderMessage(order) {
    const items = order.items.map(item => `${item.quantity} x ${item.name}`).join("\n");
    return [
      "🛵 NUEVO DOMICILIO – Anary Sea Food",
      "Pedido #" + order.id,
      "Pago revisado por el restaurante; cocina está preparando el pedido.",
      "Dirección: " + order.address,
      "Referencia: " + order.reference,
      "Cliente: " + order.customer + " – " + order.phone,
      "Pedido:\n" + items,
      "Total: " + money(order.total),
      order.notes ? "Notas: " + order.notes : ""
    ].filter(Boolean).join("\n");
  }

  async function createOrder() {
    if (!cartCount()) return showToast("Agrega al menos un plato para continuar");
    const customer = $("customer-name").value.trim();
    const phone = $("customer-phone").value.trim();
    const isDelivery = deliveryType() === "domicilio";
    const address = $("address").value.trim();
    const reference = $("reference").value.trim();
    if (!customer || !phone) return showToast("Completa tu nombre y teléfono");
    if (isDelivery && (!address || !reference)) return showToast("Completa la dirección y una referencia");
    if (!selectedProofData) return showToast("Adjunta la captura de tu pago para enviar el pedido");
    const totals = calculateTotal();
    if (isDelivery && totals.subtotal < config.minimoDomicilio) return showToast("El pedido mínimo a domicilio es " + money(config.minimoDomicilio));
    $("submit-order").disabled = true;

    const nextNumber = orders.reduce((max, order) => Math.max(max, Number(order.id.split("-")[1]) || 0), 0) + 1;
    const order = {
      id: "A-" + String(nextNumber).padStart(4, "0"),
      created: new Date().toISOString(),
      customer, phone,
      items: Object.entries(cart).map(([id, quantity]) => {
        const dish = config.platos.find(item => item.id === id);
        return { id, name: dish.nombre, quantity, price: dish.precio };
      }),
      subtotal: totals.subtotal,
      packaging: totals.packaging,
      deliveryFee: totals.shipping,
      total: totals.total,
      delivery: deliveryType(),
      pickupDate: $("pickup-date").selectedOptions[0] ? $("pickup-date").selectedOptions[0].textContent : "",
      pickupTime: $("pickup-time").value,
      address, reference,
      notes: $("customer-notes").value.trim(),
      proofName: selectedProofName,
      proofDataUrl: selectedProofData,
      proofIsDemo: false,
      paymentMethod: getPaymentMethod(),
      status: "por_confirmar",
      kitchenSent: false,
      riderNoticeOpened: false
    };
    const saved = saveOrders([order, ...orders]);
    $("submit-order").disabled = false;
    if (!saved) return;
    try {
      localStorage.setItem("anary-demo-last-order", order.id);
    } catch (error) {
      showToast("No se pudo guardar el seguimiento en este navegador.");
      return;
    }
    Object.keys(cart).forEach(id => delete cart[id]);
    renderCart();
    $("proof-file").value = "";
    $("proof-preview").hidden = true;
    selectedProofData = null;
    selectedProofName = "";
    $("order-modal").hidden = true;
    activateView("cliente");
    renderCustomerTracking();
    $("customer-tracking").scrollIntoView({ behavior: "smooth", block: "center" });
    showToast("Pedido y comprobante recibidos en este demo");
  }

  function statusLabel(status, order) {
    if (status === "listo") return order && order.delivery === "domicilio" ? "Listo para entregar" : "Listo para retirar";
    return ({
      por_confirmar: "Pago por confirmar",
      pago_verificado: "Pago verificado",
      preparando: "En preparación",
      entregado: "Entregado"
    })[status] || status;
  }

  function orderCard(order, actions) {
    const items = order.items.map(item => `${item.quantity} × ${escapeHtml(item.name)}`).join("<br>");
    const deliveryInfo = order.delivery === "domicilio"
      ? `${escapeHtml(order.address)}<br><span>${escapeHtml(order.reference)}</span>`
      : `${escapeHtml(order.pickupDate)} · ${escapeHtml(order.pickupTime)}`;
    const progress = Array.from({ length: 5 }, (_, index) =>
      `<span class="${index <= orderStage(order) ? "done" : ""}"></span>`).join("");
    const verified = order.status !== "por_confirmar" ? "verified" : "";
    return `<article class="order-card ${verified}">
      <div class="order-card-head"><div><h3>Pedido #${escapeHtml(order.id)}</h3><small>${new Date(order.created).toLocaleString("es-EC", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}</small></div><span class="order-status">${statusLabel(order.status, order)}</span></div>
      <div class="order-progress" aria-label="Proceso del pedido">${progress}<b>${statusLabel(order.status, order)}</b></div>
      <div class="order-items">${items}</div>
      <div class="order-meta"><div><span>Cliente</span><b>${escapeHtml(order.customer)} · ${escapeHtml(order.phone)}</b></div><div><span>${order.delivery === "domicilio" ? "Dirección" : "Retiro"}</span><b>${deliveryInfo}</b></div></div>
      ${order.notes ? `<div class="order-meta"><div><span>Nota para cocina</span><b>${escapeHtml(order.notes)}</b></div></div>` : ""}
      <div class="order-total"><span>Total</span><b>${money(order.total)}</b></div>
      ${actions}
    </article>`;
  }

  function renderStaffViews() {
    const cashierOrders = orders.filter(order => ["por_confirmar", "pago_verificado", "preparando"].includes(order.status));
    const pending = orders.filter(order => order.status === "por_confirmar");
    const verified = orders.filter(order => ["pago_verificado", "preparando"].includes(order.status)).length;
    const preparing = orders.filter(order => order.status === "preparando");
    const readyDelivery = orders.filter(order => order.status === "listo" && order.delivery === "domicilio");
    $("stats-cajera").innerHTML = `
      <div class="stat-card"><small>Comprobantes por revisar</small><b>${pending.length}</b></div>
      <div class="stat-card"><small>Pagos verificados</small><b>${verified}</b></div>
      <div class="stat-card"><small>Pedidos del demo</small><b>${orders.length}</b></div>`;

    $("lista-cajera").innerHTML = cashierOrders.length ? cashierOrders.map(order => orderCard(order, `
      <div class="proof-review">
        <a href="${escapeHtml(order.proofDataUrl || "imagenes/comprobante-demo.svg")}" target="_blank" rel="noopener" aria-label="Abrir comprobante">
          <img src="${escapeHtml(order.proofDataUrl || "imagenes/comprobante-demo.svg")}" alt="Comprobante ${escapeHtml(order.proofName)}">
        </a>
        <div><b>Comprobante · ${escapeHtml(order.paymentMethod || "Deuna")}</b>
          <small>${escapeHtml(order.proofName || "Sin imagen")}${order.proofIsDemo ? " · MUESTRA" : ""}</small>
          <small>Abre la imagen para revisarla en grande.</small>
        </div>
      </div>
      ${order.status === "por_confirmar" ? `
        <div class="order-actions"><button class="action-button" data-action="confirmar-pago" data-id="${escapeHtml(order.id)}">Confirmar pago</button></div>
      ` : `
        <p class="verified-label">✓ Pago comprobado · Pedido marcado en verde</p>
        <div class="order-actions">
          ${order.kitchenSent
            ? '<button class="action-button secondary" disabled>Comanda enviada a cocina</button>'
            : `<button class="action-button" data-action="imprimir-cocina" data-id="${escapeHtml(order.id)}">Enviar a imprimir a cocina</button>`}
          ${order.delivery === "domicilio"
            ? `<button class="action-button orange" data-action="avisar-motorizado" data-id="${escapeHtml(order.id)}">Abrir WhatsApp para motorizado</button>`
            : '<span class="action-hint">Aviso al motorizado: solo para domicilio</span>'}
        </div>
        <p class="action-footnote">La impresión abre el diálogo de impresora. WhatsApp abre un mensaje listo; hay que tocar Enviar.</p>
      `}`)).join("") : '<div class="empty-state">No hay pedidos por revisar ni comanda pendiente de envío.</div>';

    $("conteo-cocina").textContent = preparing.length + " pedido" + (preparing.length === 1 ? "" : "s");
    $("lista-cocina").innerHTML = preparing.length ? preparing.map(order => orderCard(order, `
      <div class="order-actions"><button class="action-button orange" data-action="listo" data-id="${escapeHtml(order.id)}">Marcar pedido listo</button></div>`)).join("") : '<div class="empty-state">Todavía no hay comandas. Al enviar una orden a imprimir, aparecerá aquí para la cocina.</div>';

    $("conteo-delivery").textContent = readyDelivery.length + " pedido" + (readyDelivery.length === 1 ? "" : "s");
    $("lista-motorizado").innerHTML = readyDelivery.length ? readyDelivery.map(order => orderCard(order, `
      <div class="order-actions"><button class="action-button" data-action="entregado" data-id="${escapeHtml(order.id)}">Marcar entregado</button></div>`)).join("") : '<div class="empty-state">No hay domicilios listos para retirar. Los pedidos aparecerán cuando cocina los marque como listos.</div>';
  }

  function printKitchenOrder(order) {
    const printWindow = window.open("", "_blank", "width=500,height=680");
    if (!printWindow) {
      showToast("Permite ventanas emergentes para enviar la comanda a imprimir.");
      return false;
    }
    const itemRows = order.items.map(item =>
      `<div><span>${item.quantity} × ${escapeHtml(item.name)}</span><b>${money(item.price * item.quantity)}</b></div>`).join("");
    const delivery = order.delivery === "domicilio"
      ? `<p><b>Domicilio:</b> ${escapeHtml(order.address)}<br><b>Referencia:</b> ${escapeHtml(order.reference)}</p>`
      : `<p><b>Retiro:</b> ${escapeHtml(order.pickupDate)} · ${escapeHtml(order.pickupTime)}</p>`;
    const html = `<!doctype html><html lang="es"><meta charset="utf-8"><title>Comanda ${escapeHtml(order.id)}</title>
      <style>body{font:14px Arial,sans-serif;max-width:380px;margin:25px auto;color:#102a3b}h1{font-size:20px}p{line-height:1.5}.ticket{border:1px dashed #789;padding:20px}.ticket-items{border-block:1px dashed #789;padding:10px 0}.ticket-items div{display:flex;justify-content:space-between;padding:5px 0}.total{display:flex;justify-content:space-between;margin-top:12px;font-size:17px;font-weight:bold}.note{margin-top:16px;padding:10px;background:#eee}.demo{text-align:center;color:#a45a1d;font-size:11px}@media print{body{margin:0}}</style>
      <div class="ticket"><h1>Anary Sea Food · Cocina</h1><p><b>COMANDA #${escapeHtml(order.id)}</b><br>Pago verificado: ${escapeHtml(order.paymentMethod)}</p>
      <p><b>Cliente:</b> ${escapeHtml(order.customer)} · ${escapeHtml(order.phone)}</p>${delivery}
      <div class="ticket-items">${itemRows}<div><span>Envase para llevar</span><b>${money(order.packaging)}</b></div>${order.deliveryFee ? `<div><span>Envío</span><b>${money(order.deliveryFee)}</b></div>` : ""}</div>
      <div class="total"><span>TOTAL</span><span>${money(order.total)}</span></div>
      <div class="note"><b>Notas:</b> ${escapeHtml(order.notes || "Sin notas")}</div>
      ${order.proofIsDemo ? '<p class="demo">COMANDA DE MUESTRA · DEMO</p>' : ""}</div>
      <script>window.onload=function(){window.print()}<\/script></html>`;
    printWindow.document.write(html);
    printWindow.document.close();
    order.status = "preparando";
    order.kitchenSent = true;
    order.kitchenSentAt = new Date().toISOString();
    saveOrders(orders);
    showToast("Comanda abierta para imprimir; cocina puede empezar a preparar.");
    return true;
  }

  function doAction(action, id) {
    const order = orders.find(item => item.id === id);
    if (!order) return;
    if (action === "confirmar-pago") {
      order.status = "pago_verificado";
      order.paymentVerifiedAt = new Date().toISOString();
      saveOrders(orders);
      showToast("Pago comprobado. Se habilitaron las dos acciones.");
      return;
    }
    if (action === "imprimir-cocina") {
      if (order.status !== "pago_verificado" && order.status !== "preparando") return;
      if (!order.kitchenSent) printKitchenOrder(order);
      return;
    }
    if (action === "avisar-motorizado") {
      if (order.status === "por_confirmar" || order.delivery !== "domicilio") return;
      const rawPhone = String(config.whatsappMotorizado);
      const phone = rawPhone.replace(/\D/g, "");
      if (/[Xx]/.test(rawPhone) || phone.length < 10 || phone.length > 15) {
        showToast("El WhatsApp del motorizado está pendiente de configurar.");
        return;
      }
      const url = "https://wa.me/" + phone + "?text=" + encodeURIComponent(makeRiderMessage(order));
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.click();
      order.riderNoticeOpened = true;
      saveOrders(orders);
      showToast("WhatsApp abrió el mensaje. Toca Enviar para avisar al motorizado.");
      return;
    }
    if (action === "listo") order.status = "listo";
    if (action === "entregado") order.status = "entregado";
    saveOrders(orders);
    showToast("Estado del pedido actualizado.");
  }

  let toastTimer;
  function showToast(message) {
    const toast = $("toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
  }

  function activateView(view) {
    document.querySelectorAll(".view").forEach(section => section.classList.toggle("active", section.id === "vista-" + view));
    document.querySelectorAll(".nav-button").forEach(button => button.classList.toggle("active", button.dataset.view === view));
    if (view === "cajera" || view === "cocina" || view === "motorizado") renderStaffViews();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function init() {
    renderMenu();
    setupPickupOptions();
    updateOpenStatus();
    renderCart();
    renderStaffViews();
    renderCustomerTracking();
    updatePaymentMethod();

    $("link-maps").href = config.enlaces.maps;
    $("link-instagram").href = config.enlaces.instagram;
    $("link-tiktok").href = config.enlaces.tiktok;
    $("payment-qr").src = config.pago.qr;
    $("bank-details").textContent = `${config.pago.banco} · ${config.pago.tipoCuenta}\n${config.pago.titular} · ${config.pago.cuenta}`;

    document.querySelectorAll(".nav-button").forEach(button => button.addEventListener("click", () => activateView(button.dataset.view)));
    $("cart-open").addEventListener("click", () => {
      $("order-modal").hidden = false;
      renderOrderSummary();
    });
    document.querySelectorAll("[data-close-modal]").forEach(element => element.addEventListener("click", () => $("order-modal").hidden = true));
    document.querySelector('input[name="delivery"][value="retirar"]').addEventListener("change", updateDeliveryFields);
    document.querySelector('input[name="delivery"][value="domicilio"]').addEventListener("change", updateDeliveryFields);
    document.querySelectorAll('input[name="payment-method"]').forEach(input => input.addEventListener("change", updatePaymentMethod));
    $("proof-file").addEventListener("change", () => selectProof($("proof-file").files[0]));
    $("remove-proof").addEventListener("click", () => {
      $("proof-file").value = "";
      selectProof(null);
    });
    $("submit-order").addEventListener("click", createOrder);
    $("cart-lines").addEventListener("click", event => {
      const button = event.target.closest("[data-change]");
      if (!button) return;
      const id = button.dataset.change;
      cart[id] = (cart[id] || 0) + Number(button.dataset.by);
      if (cart[id] <= 0) delete cart[id];
      renderCart();
    });
    document.querySelectorAll(".form-grid input, .form-grid select").forEach(element => element.addEventListener("change", renderOrderSummary));
    document.body.addEventListener("click", event => {
      const actionButton = event.target.closest("[data-action]");
      if (actionButton) doAction(actionButton.dataset.action, actionButton.dataset.id);
    });
  }

  init();
})();
