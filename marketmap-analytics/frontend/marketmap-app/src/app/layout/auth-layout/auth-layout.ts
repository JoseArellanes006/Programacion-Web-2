/*
  Layout de autenticación.

  Este layout se usará para páginas públicas relacionadas con acceso al sistema.

  Ejemplos:
  - Login
  - Registro
  - Recuperación de contraseña
  - Restablecimiento de contraseña

  La idea es separar visualmente las páginas públicas de autenticación
  de la zona interna del sistema.

  En esta versión se integra Angular Material de forma controlada:
  - MatCardModule para la tarjeta del formulario.
  - MatIconModule para los elementos visuales del panel informativo.
*/

import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { APP_CONSTANTS } from '../../core/config/app.constants';

@Component({
  /*
    Selector del layout de autenticación.
  */
  selector: 'app-auth-layout',

  /*
    Imports necesarios para el layout.
  */
  imports: [
    RouterOutlet,
    MatCardModule,
    MatIconModule
  ],

  /*
    Archivo HTML del layout.
  */
  templateUrl: './auth-layout.html',

  /*
    Archivo SCSS del layout.
  */
  styleUrl: './auth-layout.scss'
})
export class AuthLayout {
  /*
    Nombre del sistema mostrado en la pantalla de autenticación.
  */
  protected readonly appName = signal(APP_CONSTANTS.appName);

  /*
    Subtítulo descriptivo del sistema.
  */
  protected readonly appSubtitle = signal(APP_CONSTANTS.appSubtitle);

  /*
    Características principales mostradas en el panel visual.
  */
  protected readonly features = signal([
    {
      icon: 'shopping_cart',
      label: 'Carrito de compras'
    },
    {
      icon: 'map',
      label: 'Mapa interactivo'
    },
    {
      icon: 'analytics',
      label: "KPI's y reportes"
    }
  ]);
}