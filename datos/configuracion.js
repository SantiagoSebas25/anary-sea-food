// DATOS DEL NEGOCIO. Edita aquí menú, precios, horario, pagos y enlaces.
// Los datos de muestra están marcados como [PENDIENTE]; cámbialos antes de publicar.
window.ANARY = {
  nombre: "Anary Sea Food",
  colores: { azul: "#0F2A3D", crema: "#F6F1E9", naranja: "#D9621F" },
  whatsappNegocio: "593XXXXXXXXX", // [PENDIENTE] Formato internacional, sin + ni espacios.
  whatsappMotorizado: "593XXXXXXXXX", // [PENDIENTE]
  horario: { dias: [6, 0], desde: "10:00", hasta: "16:00", intervaloMinutos: 30 },
  preparacionMinutos: 25,
  envase: 0.50,
  envio: 2.00, // [PENDIENTE] Valor de envío dentro de Ambato.
  minimoDomicilio: 8.00, // [PENDIENTE]
  pago: {
    qr: "imagenes/deuna-qr.svg", // Reemplazar por el QR real de Deuna.
    banco: "Banco Pichincha",
    titular: "Jonathan Galarza",
    cuenta: "2215229078",
    tipoCuenta: "Cuenta de ahorro transaccional"
  },
  enlaces: {
    maps: "https://maps.google.com/?q=Ambato+Ecuador",
    instagram: "https://instagram.com/anaryfood",
    tiktok: "https://tiktok.com/@anary.food"
  },
  platos: [
    { id: "pescado", nombre: "Pescado frito", descripcion: "Frito a leña, crujiente por fuera y jugoso por dentro.", precio: 6.00, foto: "imagenes/pescado-frito.svg", etiqueta: "Favorito", disponible: true },
    { id: "pescado-completo", nombre: "Pescado completo", descripcion: "Pescado frito con arroz, patacones y ensalada.", precio: 8.50, foto: "imagenes/pescado-completo.svg", etiqueta: "Recomendado", disponible: true },
    { id: "jugo", nombre: "Jugo natural", descripcion: "Fruta de temporada, preparado al momento.", precio: 1.50, foto: "imagenes/jugo-natural.svg", etiqueta: "", disponible: true },
    { id: "patacones", nombre: "Porción de patacones", descripcion: "Doraditos, recién hechos y perfectos para compartir.", precio: 2.00, foto: "imagenes/patacones.svg", etiqueta: "", disponible: true }
  ]
};
