/*
  Navbar superior del sistema.

  Este componente aparece dentro del MainLayout y muestra información
  del usuario actual.

  Responsabilidades:
  - Mostrar nombre y rol del usuario.
  - Mostrar correo del usuario.
  - Mostrar avatar real si existe avatarUrl.
  - Mostrar iniciales si no existe avatarUrl.
  - Mostrar botón de notificaciones con ícono.
  - Mostrar acceso rápido al carrito con contador.
  - Permitir abrir/cerrar menú de usuario.
  - Permitir cerrar sesión desde el menú desplegable.
*/

import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { CartService } from '../../features/cart/services/cart.service';
import { formatStatus } from '../../shared/utils/formatters';

@Component({
  /*
    Selector usado por MainLayout.
  */
  selector: 'app-navbar',

  /*
    Solo se importa MatIconModule.

    No usamos mat-button ni mat-menu porque en este navbar
    necesitamos conservar el diseño propio del sistema.
  */
  imports: [
    MatIconModule
  ],

  /*
    Archivo HTML.
  */
  templateUrl: './navbar.html',

  /*
    Archivo SCSS.
  */
  styleUrl: './navbar.scss'
})
export class Navbar implements OnInit {
  /*
    AuthService permite consultar usuario y cerrar sesión.
  */
  private readonly authService = inject(AuthService);

  /*
    CartService permite consultar el carrito actual y su contador.
  */
  private readonly cartService = inject(CartService);

  /*
    Router permite navegar al login, carrito u otras rutas.
  */
  private readonly router = inject(Router);

  /*
    Servicio de notificaciones globales.
  */
  private readonly notificationService = inject(NotificationService);

  /*
    Controla si el menú del usuario está abierto.
  */
  protected readonly userMenuOpen = signal(false);

  /*
    Total de productos dentro del carrito.

    CartService.totalItems ya calcula considerando cantidades.
  */
  protected readonly cartTotalItems = this.cartService.totalItems;

  /*
    Indica si el carrito tiene productos.
  */
  protected readonly hasCartItems = computed(() => {
    return this.cartTotalItems() > 0;
  });

  /*
    Usuario actual expuesto al HTML mediante computed.
  */
  protected readonly currentUser = computed(() => {
    return this.authService.currentUser();
  });

  /*
    Nombre que se mostrará en la barra superior.
  */
  protected readonly displayName = computed(() => {
    return this.currentUser()?.name ?? 'Usuario';
  });

  /*
    Correo del usuario actual.
  */
  protected readonly displayEmail = computed(() => {
    return this.currentUser()?.email ?? 'Sin correo registrado';
  });

  /*
    Rol formateado para mostrarlo de forma legible.
  */
  protected readonly displayRole = computed(() => {
    const role = this.currentUser()?.role;

    if (!role) {
      return 'Sin rol';
    }

    return formatStatus(role);
  });

  /*
    URL del avatar del usuario.

    Si el backend devuelve avatarUrl, aquí se mostrará.
  */
  protected readonly avatarUrl = computed(() => {
    const avatarUrl = this.currentUser()?.avatarUrl;

    if (!avatarUrl || avatarUrl.trim().length === 0) {
      return null;
    }

    return avatarUrl;
  });

  /*
    Iniciales del usuario para mostrar avatar textual
    cuando no existe avatarUrl.
  */
  protected readonly userInitials = computed(() => {
    const name = this.displayName().trim();

    if (!name || name === 'Usuario') {
      return 'US';
    }

    const parts = name
      .split(' ')
      .map((part) => part.trim())
      .filter((part) => part.length > 0);

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  });

  /*
    Al iniciar el navbar se consulta el carrito actual.

    Esto permite que el contador aparezca aunque el usuario recargue
    la página después de haber agregado productos.
  */
  ngOnInit(): void {
    this.loadCurrentCart();
  }

  /*
    Carga el carrito actual.

    Si falla, no bloquea el navbar porque el carrito es una acción secundaria.
  */
  private loadCurrentCart(): void {
    if (!this.authService.isAuthenticated()) {
      return;
    }

    this.cartService.getCart().subscribe({
      next: () => {
        /*
          El estado queda actualizado dentro de CartService.
        */
      },
      error: () => {
        /*
          No se muestra alerta para no molestar al usuario al cargar el layout.
          Si el usuario entra al carrito, ahí se manejará el error específico.
        */
      }
    });
  }

  /*
    Abre o cierra el menú del usuario.
  */
  protected toggleUserMenu(): void {
    this.userMenuOpen.update((open) => !open);
  }

  /*
    Cierra el menú del usuario.
  */
  protected closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  /*
    Navega al carrito.

    Se cierra el menú de usuario por si estaba abierto.
  */
  protected goToCart(): void {
    this.closeUserMenu();
    this.router.navigate(['/cart']);
  }

  /*
    Muestra una notificación informativa.

    Después puede conectarse con un panel real de notificaciones.
  */
  protected showNotifications(): void {
    this.notificationService.info(
      'Notificaciones',
      'No hay notificaciones nuevas.'
    );
  }

  /*
    Cierra la sesión del usuario.

    Limpia tokens, usuario actual y redirige al login.
  */
  protected logout(): void {
    this.closeUserMenu();

    this.authService.logout();
    this.cartService.clearCartState();

    this.notificationService.info(
      'Sesión cerrada',
      'Has cerrado sesión correctamente.'
    );

    this.router.navigate(['/auth/login']);
  }
}