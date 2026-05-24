/*
  Layout principal de la aplicación.

  Este layout se usa para las páginas internas del sistema, es decir,
  las páginas que requieren autenticación.

  Ejemplos:
  - Dashboard
  - Productos
  - Carrito
  - Pedidos
  - Mapa interactivo
  - Reportes
  - Usuarios

  Estructura general:
  - Contenedor Material con mat-sidenav-container
  - Sidebar lateral dentro de mat-sidenav
  - Navbar superior dentro de mat-sidenav-content
  - Área central donde se cargan las páginas mediante RouterOutlet
*/

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { MatSidenavModule } from '@angular/material/sidenav';

import { Sidebar } from '../sidebar/sidebar';
import { Navbar } from '../navbar/navbar';

@Component({
  /*
    Selector del layout principal.
  */
  selector: 'app-main-layout',

  /*
    Componente standalone.

    Importa:
    - MatSidenavModule: estructura base de layout Material.
    - Sidebar: menú lateral.
    - Navbar: barra superior.
    - RouterOutlet: espacio donde se cargarán las páginas hijas.
  */
  imports: [
    MatSidenavModule,
    Sidebar,
    Navbar,
    RouterOutlet
  ],

  /*
    Archivo HTML del layout.
  */
  templateUrl: './main-layout.html',

  /*
    Archivo SCSS del layout.
  */
  styleUrl: './main-layout.scss'
})
export class MainLayout {
  /*
    Este layout mantiene una estructura estable para escritorio.

    El sidebar se muestra fijo en modo side.
    El contenido principal se carga mediante RouterOutlet.
  */
}