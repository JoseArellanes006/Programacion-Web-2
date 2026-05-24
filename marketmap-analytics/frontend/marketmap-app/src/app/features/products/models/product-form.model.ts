/*
  Modelo para formularios de productos.

  Este modelo representa los datos capturados al crear o editar un producto.

  Se separa de Product porque el formulario puede manejar:
  - archivos de imagen
  - campos opcionales
  - datos antes de existir un id
*/

import { ProductStatus } from './product.model';

export interface ProductForm {
  /*
    Nombre del producto.
  */
  name: string;

  /*
    Descripción del producto.
  */
  description: string;

  /*
    Categoría del producto.
  */
  category: string;

  /*
    Precio unitario.
  */
  price: number;

  /*
    Inventario disponible.
  */
  stock: number;

  /*
    Estado operativo.
  */
  status: ProductStatus;

  /*
    Producto destacado.
  */
  featured: boolean;

  /*
    Archivo de imagen opcional.

    Se usará más adelante cuando se conecte la carga real de imágenes.
  */
  imageFile?: File | null;

  /*
    URL de imagen opcional.

    Se usa principalmente al editar un producto existente.
  */
  imageUrl?: string | null;
}