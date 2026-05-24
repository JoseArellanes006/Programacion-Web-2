/*
  Modelo de detalle de pedido.

  Este archivo representa cada producto incluido dentro de un pedido.

  Importante:
  El frontend no calcula precios definitivos ni subtotales como fuente de verdad.
  El backend debe validar:
  - producto existente
  - precio vigente
  - cantidad
  - subtotal
  - disponibilidad
*/

export interface OrderDetail {
  /*
    Identificador del detalle del pedido.

    Puede coincidir con el productId si el backend no maneja detalles
    como documentos independientes.
  */
  id: string;

  /*
    Identificador del producto vendido.
  */
  productId: string;

  /*
    Nombre del producto al momento de la venta.

    Se guarda como texto porque el nombre del producto podría cambiar después.
  */
  productName: string;

  /*
    Categoría del producto al momento de la venta.
  */
  category: string | null;

  /*
    Precio unitario validado por el backend.
  */
  unitPrice: number;

  /*
    Cantidad vendida.
  */
  quantity: number;

  /*
    Subtotal calculado por el backend.
  */
  subtotal: number;

  /*
    URL opcional de imagen del producto.
  */
  imageUrl?: string | null;
}