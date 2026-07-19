import type { TourStep } from './components/ui/GuidedTour';

export const superAdminTourSteps: TourStep[] = [
  {
    title: 'Panel de Super Administración',
    body: 'Este es tu panel exclusivo como administrador global de Produsave. Desde acá gestionás todos los negocios, suscripciones, soporte técnico y el canal de difusión oficial.',
  },
  {
    title: 'Gestión de Clientes',
    body: 'Acá ves todos los negocios registrados. Podés pausar, suspender o reactivar cada uno. También podés subir el logo de marca blanca y ver cuántos días le quedan de suscripción.',
    highlightSelector: '[data-tour="sa-clients"]',
  },
  {
    title: 'Vencimiento de Suscripción',
    body: 'La columna "Vencimiento" muestra un contador en tiempo real con los días restantes de cada negocio. Rojo: 3 días o menos. Ámbar: 7 días o menos. Verde: más de 7 días.',
    highlightSelector: '[data-tour="expiry-cell"]',
  },
  {
    title: 'Branding por Negocio',
    body: 'Click en el ícono de imagen (lado derecho de cada fila) para personalizar colores, emoji y logo PNG del panel de cada Jefe. Recomendado: 256x256px para logo cuadrado.',
    highlightSelector: '[data-tour="branding-btn"]',
  },
  {
    title: 'Base de Datos Maestro',
    body: 'Esta sección te permite ver y gestionar todos los datos del sistema en bruto: productos, ventas, perfiles y más. Útil para auditorías.',
    highlightSelector: '[data-tour="sa-database"]',
  },
  {
    title: 'Canal de Difusión Oficial',
    body: 'Acá publicás avisos oficiales que TODOS los negocios ven en su sección de Chat como un canal de solo lectura. Solo vos podés escribir acá. Los jefes y empleados pueden leer pero no responder.',
    highlightSelector: '[data-tour="sa-broadcast"]',
  },
  {
    title: 'Chat de Soporte Técnico',
    body: 'Conversá directamente con cada Jefe y Empleado. Los mensajes que recibís acá son exclusivamente de soporte técnico — reportes de bugs, errores o consultas del sistema. Debajo del nombre ves la última conexión.',
    highlightSelector: '[data-tour="sa-chat"]',
  },
  {
    title: 'Cambio de Tema',
    body: 'El botón de sol/luna arriba a la derecha alterna entre modo claro y oscuro. La preferencia se guarda automáticamente.',
    highlightSelector: '[data-tour="theme-toggle"]',
  },
  {
    title: 'Cerrar Sesión',
    body: 'El botón con tu avatar arriba a la derecha te permite cerrar sesión cuando termines.',
    highlightSelector: '[data-tour="user-menu"]',
  },
];

export const bossTourSteps: TourStep[] = [
  {
    title: 'Panel del Jefe / Dueño',
    body: 'Bienvenido a tu panel de gestión. Desde acá controlás tu inventario, ventas, empleados, fiados y más. Todo en tiempo real, conectado a Supabase.',
  },
  {
    title: 'Dashboard',
    body: 'Tu pantalla principal. Muestra métricas de ventas, gráficos semanales, productividad de empleados y alertas de stock bajo en Bodega (en rojo).',
    highlightSelector: '[data-tour="boss-dashboard"]',
  },
  {
    title: 'Alertas de Stock Mínimo',
    body: 'Los productos con menos de 5 unidades en Bodega aparecen en rojo en el Dashboard. Es la señal para comprarle a tu proveedor antes de quedarte sin mercadería.',
  },
  {
    title: 'Gestión de Artículos',
    body: 'Acá ves y creás productos. La tabla muestra dos columnas clave: Bodega (depósito) y Caja (lo que el POS vende). Usá "Publicar en Caja" para mover stock.',
    highlightSelector: '[data-tour="boss-products"]',
  },
  {
    title: 'Publicar en Caja',
    body: 'El botón azul "Publicar" mueve unidades de Bodega a Caja. El empleado solo puede vender lo que está publicado en Caja. La Bodega es tu reserva.',
    highlightSelector: '[data-tour="publish-btn"]',
  },
  {
    title: 'Recepción de Mercadería',
    body: 'Cuando llega mercadería del proveedor, la cargás acá. Va directo al stock de Bodega. Después la publicás a Caja con el botón que vimos antes.',
    highlightSelector: '[data-tour="boss-reception"]',
  },
  {
    title: 'Tareas de Reposición',
    body: 'Enviá órdenes a tus empleados: "Reponer 20 unidades de Coca-Cola desde la bodega". El empleado la ve en su panel y la marca como completada.',
    highlightSelector: '[data-tour="boss-tasks"]',
  },
  {
    title: 'Movimientos de Stock',
    body: 'Historial completo de quién movió qué, cuándo y cuánto. Cada publicación a Caja, recepción o venta queda registrada acá automáticamente.',
    highlightSelector: '[data-tour="boss-stock-history"]',
  },
  {
    title: 'Gestión de Empleados',
    body: 'Creá empleados con email y contraseña. El plan Pro permite hasta 5 empleados. Ves su última conexión en caja en tiempo real.',
    highlightSelector: '[data-tour="boss-employees"]',
  },
  {
    title: 'Fiados y Alertas',
    body: 'Gestioná cuentas corrientes. El botón de WhatsApp abre el mensaje con el monto de deuda automáticamente, listo para enviar al cliente.',
    highlightSelector: '[data-tour="boss-credits"]',
  },
  {
    title: 'Chat y Comunicaciones',
    body: 'Acá encontrás tres canales: el Canal de Difusión oficial de Produsave (solo lectura), Soporte Técnico para contactar al equipo de Produsave, y conversaciones directas con tus empleados.',
    highlightSelector: '[data-tour="boss-chat"]',
  },
  {
    title: 'Cambio de Tema y Sesión',
    body: 'Arriba a la derecha: sol/luna para tema, avatar para cerrar sesión. En el menú lateral izquierdo también podés personalizar la marca de tu negocio.',
    highlightSelector: '[data-tour="theme-toggle"]',
  },
];

export const employeeTourSteps: TourStep[] = [
  {
    title: 'Punto de Venta (POS)',
    body: 'Esta es tu pantalla principal para cobrar. Es rápida y está pensada para usar con lector de código de barras USB o cámara del celular.',
  },
  {
    title: 'Buscar Productos',
    body: 'Usá el buscador arriba para encontrar productos por nombre, marca o código de barras. También podés filtrar por categoría con los botones de abajo.',
    highlightSelector: '[data-tour="pos-search"]',
  },
  {
    title: 'Lector de Código de Barras USB',
    body: 'Si tenés un lector USB conectado, simplemente escaneá el producto y se agrega al carrito automáticamente. No necesitas hacer click en nada.',
  },
  {
    title: 'Escanear con Cámara',
    body: 'El botón "Cámara" abre la cámara trasera de tu celular para escanear códigos de barras. Apuntá al producto y se agrega solo.',
    highlightSelector: '[data-tour="camera-btn"]',
  },
  {
    title: 'Alta Rápida',
    body: 'Si un producto no existe en el sistema, usá "Alta rápida" para crearlo al momento con nombre y precio. Útil para productos nuevos.',
    highlightSelector: '[data-tour="quick-add"]',
  },
  {
    title: 'Carrito de Compras',
    body: 'Click en un producto para agregarlo. Click en un item del carrito para cambiar cantidad o precio. El ícono de trash elimina el item.',
    highlightSelector: '[data-tour="cart-area"]',
  },
  {
    title: 'Cobrar',
    body: 'El botón verde "Cobrar" abre el checkout. Podés elegir efectivo, tarjeta, transferencia, QR o venta al fiado. El stock de Caja se descuenta automáticamente.',
    highlightSelector: '[data-tour="checkout-btn"]',
  },
  {
    title: 'Tareas Pendientes',
    body: 'Acá ves las órdenes de reposición que te manda tu jefe. Marcá "Hecho" cuando repongas el producto desde la bodega. Tu jefe lo ve en tiempo real.',
    highlightSelector: '[data-tour="emp-tasks"]',
  },
  {
    title: 'Cierre de Caja',
    body: 'Al terminar tu turno, hacé el arqueo. X-Read es parcial (sin cerrar turno), Z-Read es el cierre definitivo. Contá el efectivo y el sistema calcula la diferencia.',
    highlightSelector: '[data-tour="emp-cash-close"]',
  },
  {
    title: 'Historial del Turno',
    body: 'Ves todas las ventas que hiciste en el turno actual, con totales y métodos de pago.',
    highlightSelector: '[data-tour="emp-history"]',
  },
  {
    title: 'Chat y Soporte',
    body: 'Acá encontrás el Canal de Difusión oficial de Produsave (avisos del equipo, solo lectura), Soporte Técnico para reportar problemas, y conversaciones directas con tu jefe.',
    highlightSelector: '[data-tour="emp-chat"]',
  },
  {
    title: 'Atajos de Teclado',
    body: 'En producción: Lector USB = escanea y agrega automáticamente · Click en producto = agrega al carrito · Click en item = editar · Esc = cerrar modal.',
  },
];
