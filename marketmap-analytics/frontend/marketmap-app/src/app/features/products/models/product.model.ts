/*
  Modelo principal de producto.

  Este archivo define cómo se representa un producto dentro del frontend.

  Se usará en:
  - administración de productos
  - catálogo
  - carrito
  - pedidos
  - dashboard
  - reportes
*/

/*
  Estado operativo del producto.
*/
export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK';

/*
  Modelo principal del producto.
*/
export interface Product {
  /*
    Identificador único del producto.

    En MongoDB normalmente corresponde al _id convertido a string.
  */
  id: string;

  /*
    Nombre comercial del producto.
  */
  name: string;

  /*
    Descripción visible del producto.
  */
  description: string;

  /*
    Categoría del producto.

    Ejemplos:
    - Bebidas
    - Alimentos
    - Postres
    - Promociones
  */
  category: string;

  /*
    Precio unitario del producto.
  */
  price: number;

  /*
    Cantidad disponible en inventario.
  */
  stock: number;

  /*
    URL de imagen del producto.

    El backend puede devolver null.
  */
  imageUrl?: string | null;

  /*
    Estado actual del producto.
  */
  status: ProductStatus;

  /*
    Indica si el producto está marcado como destacado.
  */
  featured: boolean;

  /*
    Fecha de creación.
  */
  createdAt?: string | null;

  /*
    Fecha de última actualización.
  */
  updatedAt?: string | null;
}