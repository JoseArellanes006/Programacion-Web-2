/*
  Pipe para formatear fechas.

  Se usará en:
  - pedidos
  - ventas
  - usuarios
  - reportes
  - tablas dinámicas

  Ejemplo de uso:
  {{ order.createdAt | dateFormat }}

  Resultado:
  19/05/2026
*/

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  /*
    Nombre del pipe para usarlo en plantillas HTML.
  */
  name: 'dateFormat',

  /*
    Pipe standalone para importarse directamente en componentes.
  */
  standalone: true
})
export class DateFormatPipe implements PipeTransform {
  /*
    Transforma una fecha a texto con formato regional.

    value:
    Puede recibir Date, string, null o undefined.

    locale:
    Región usada para el formato. Por defecto México.

    options:
    Opciones de formato de Intl.DateTimeFormat.
  */
  transform(
    value: Date | string | null | undefined,
    locale: string = 'es-MX',
    options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }
  ): string {
    /*
      Si no hay fecha, se regresa un guion.
    */
    if (!value) {
      return '-';
    }

    /*
      Convierte el valor recibido a Date.
    */
    const date = value instanceof Date ? value : new Date(value);

    /*
      Si la fecha no es válida, se regresa un guion.
    */
    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    /*
      Devuelve la fecha formateada.
    */
    return new Intl.DateTimeFormat(locale, options).format(date);
  }
}