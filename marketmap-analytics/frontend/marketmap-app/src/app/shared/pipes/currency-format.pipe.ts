/*
  Pipe para formatear cantidades monetarias.

  Se usará en:
  - productos
  - carrito
  - pedidos
  - ventas
  - reportes
  - dashboard

  Ejemplo de uso en HTML:
  {{ product.price | currencyFormat }}

  Resultado:
  $120.00
*/

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  /*
    Nombre del pipe para usarlo en plantillas HTML.
  */
  name: 'currencyFormat',

  /*
    Pipe standalone para poder importarlo directamente en componentes.
  */
  standalone: true
})
export class CurrencyFormatPipe implements PipeTransform {
  /*
    Transforma un número a formato de moneda.

    value:
    Cantidad numérica recibida.

    currency:
    Código de moneda. Por defecto se usa MXN.

    locale:
    Configuración regional. Por defecto se usa es-MX.
  */
  transform(
    value: number | string | null | undefined,
    currency: string = 'MXN',
    locale: string = 'es-MX'
  ): string {
    /*
      Si el valor es null, undefined o vacío, se muestra $0.00.
    */
    if (value === null || value === undefined || value === '') {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency
      }).format(0);
    }

    /*
      Convierte el valor a número.
      Esto permite recibir tanto number como string.
    */
    const numericValue = Number(value);

    /*
      Si no es un número válido, se muestra $0.00.
    */
    if (Number.isNaN(numericValue)) {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency
      }).format(0);
    }

    /*
      Devuelve el valor formateado como moneda.
    */
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency
    }).format(numericValue);
  }
}