# Anary Sea Food — demo de pedidos

Este demo muestra cómo podría verse la página del cliente y los paneles de cajera, cocina y motorizado. Está hecho para abrirse sin instalar programas.

## Cómo probarlo

1. Abre la carpeta `anary-pedidos` y haz doble clic en `index.html`.
2. En **Menú**, agrega platos y abre **Ver pedido** desde la barra inferior.
3. Completa nombre y teléfono. Prueba **Para retirar** o **Domicilio**; para domicilio, el pedido debe llegar al mínimo indicado.
4. Selecciona Deuna o transferencia, adjunta una captura de imagen y pulsa **Enviar pedido y comprobante**. El demo enseña el avance del pedido en la misma página.
5. Abre **Cajera**. Hay dos pedidos ficticios para revisar las dos situaciones: pago pendiente y pago verificado. La foto de muestra está marcada como falsa.
6. Para probar el cambio de estado, abre el pedido pendiente y pulsa **Confirmar pago**. La tarjeta queda verde y aparecen las acciones de cocina y motorizado (este último solo para domicilios).
7. **Enviar a imprimir a cocina** abre la vista de comanda y el diálogo de impresión del navegador. Escoge una impresora para imprimir.
8. **Abrir WhatsApp para motorizado** prepara el mensaje en WhatsApp cuando se configure el número real. En WhatsApp todavía hay que pulsar **Enviar**.
9. En **Cocina**, marca la comanda como lista. En **Motorizado** puedes revisar domicilios listos y marcarlos como entregados.

## Importante: es solo una vista de demostración

- Los pedidos y las capturas que adjuntes se guardan solo en el almacenamiento local de este navegador; otra persona o dispositivo no los verá.
- Las capturas de muestra son falsas y no representan pagos reales. Verificar el pago en el panel solo simula la acción de la cajera.
- El navegador abre el diálogo de impresión; no puede imprimir silenciosamente ni confirmar que el papel salió.
- El enlace `wa.me` abre un mensaje preparado. WhatsApp exige que una persona toque **Enviar**; no se manda automáticamente desde la página.
- No compartas ni uses este demo para recibir pedidos reales.
- Los botones de los paneles son una simulación, no tienen inicio de sesión ni permisos.

La versión real requerirá configurar Supabase para compartir pedidos e imágenes entre el cliente y el restaurante con acceso protegido. Para impresión directa sin diálogo se necesitará un servicio o programa conectado a la impresora. Para enviar mensajes de WhatsApp sin tocar **Enviar** se necesitaría la API oficial de WhatsApp.

## Dónde cambiar los datos

Abre `datos/configuracion.js` con un editor de texto:

- **Platos:** en `platos`, cambia nombre, descripción, precio, foto y disponibilidad.
- **Fotos:** guarda la foto en `imagenes` y cambia el campo `foto` del plato.
- **Envase y domicilio:** cambia `envase`, `envio` y `minimoDomicilio`.
- **Horario:** `horario.dias` usa 6 para sábado y 0 para domingo; cambia `desde`, `hasta` e `intervaloMinutos`.
- **Preparación:** cambia `preparacionMinutos`.
- **Pagos:** los datos de transferencia indicados están en `pago`; reemplaza el QR de muestra por el QR real en `imagenes`. El número de cédula no se publica.
- **Redes y WhatsApp:** reemplaza los enlaces; los números van con código de país, sin `+` ni espacios (por ejemplo, `593...`).
- **Colores:** los valores de ejemplo están agrupados al inicio de ese archivo y sus equivalentes visuales al comienzo de `css/estilos.css`.

Los valores que aún no conoces aparecen como `[PENDIENTE]` o son ejemplos.
