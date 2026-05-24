/*
  Modelo de elemento del carrito.

  Este modelo representa un producto agregado al carrito de compras.

  Importante:
  El frontend no calcula ni guarda el carrito como base de datos.
  El backend será quien valide producto, stock, precio y subtotales.

  Angular solamente representa lo que FastAPI responde.
*/

export interface CartItem {
  /*
    Identificador del registro del carrito.

    Puede venir de MongoDB como _id convertido a string.
    Si el backend no maneja items como documentos separados, puede coincidir
    con productId o con una clave interna generada.
  */
  id: string;

  /*
    Identificador del producto agregado.

    Este valor se usa para actualizar cantidad o eliminar el producto
    del carrito cuando el backend trabaja por productId.
  */
  productId: string;

  /*
    Nombre del producto al momento de agregarlo.
  */
  productName: string;

  /*
    Categoría del producto.

    Puede venir vacía o null si el producto no tiene categoría asociada.
  */
  category: string | null;

  /*
    Precio unitario validado por backend.
  */
  unitPrice: number;

  /*
    Cantidad agregada.
  */
  quantity: number;

  /*
    Subtotal del producto.

    Normalmente:
    unitPrice * quantity

    Pero debe venir calculado desde backend para evitar manipulación
    desde el frontend.
  */
  subtotal: number;

  /*
    URL opcional de imagen.
  */
  imageUrl?: string | null;

  /*
    Stock disponible informado por backend.
  */
  availableStock?: number | null;

  /*
    Indica si el producto todavía puede comprarse.
  */
  available: boolean;
}