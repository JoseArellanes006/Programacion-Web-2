/*
  Página de inicio de sesión.

  Esta pantalla permite que el usuario acceda al sistema usando:
  - correo electrónico
  - contraseña
  - Google Identity Services

  El botón de Google usa el SDK oficial de Google.
  Google devuelve un idToken real y Angular lo envía al backend.

  Redirección por rol:
  - ADMIN, MANAGER, SELLER -> /dashboard
  - CUSTOMER -> /catalog
*/

import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
  signal
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { environment } from '../../../../../environments/environment';

import { AuthApiService } from '../../services/auth-api.service';
import { AuthRole } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  validateEmail,
  validateRequiredText
} from '../../../../shared/utils/validators';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleInitializeConfig) => void;
          renderButton: (
            parent: HTMLElement,
            options: GoogleButtonConfig
          ) => void;
        };
      };
    };
  }
}

interface GoogleInitializeConfig {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
}

interface GoogleCredentialResponse {
  credential?: string;
  select_by?: string;
  clientId?: string;
}

interface GoogleButtonConfig {
  theme: 'outline' | 'filled_blue' | 'filled_black';
  size: 'large' | 'medium' | 'small';
  width?: number;
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
}

/*
  Forma mínima esperada de la respuesta de autenticación.

  Se usa flexible porque el backend puede devolver:
  - user.role
  - role
  - data.user.role
*/
interface LoginResponseLike {
  role?: AuthRole;
  user?: {
    role?: AuthRole;
  };
  data?: {
    role?: AuthRole;
    user?: {
      role?: AuthRole;
    };
  };
}

@Component({
  selector: 'app-login',
  imports: [
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login implements AfterViewInit, OnDestroy {
  /*
    Contenedor donde Google renderiza su botón oficial.
  */
  @ViewChild('googleButtonContainer')
  private readonly googleButtonContainer?: ElementRef<HTMLDivElement>;

  private readonly authApiService = inject(AuthApiService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly loading = signal(false);
  protected readonly googleLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  /*
    Evita actualizar signals si la vista ya fue destruida.
  */
  private destroyed = false;

  ngAfterViewInit(): void {
    this.loadGoogleIdentityScript()
      .then(() => {
        if (!this.destroyed) {
          this.initializeGoogleLogin();
        }
      })
      .catch(() => {
        if (!this.destroyed) {
          this.errorMessage.set(
            'No fue posible cargar el inicio de sesión con Google.'
          );
        }
      });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
  }

  /*
    Envía el formulario de login tradicional.
  */
  protected submit(): void {
    this.errorMessage.set(null);

    const emailValidation = validateEmail(this.email());

    if (!emailValidation.isValid) {
      this.errorMessage.set(emailValidation.errors[0]);
      return;
    }

    const passwordValidation = validateRequiredText(
      this.password(),
      'La contraseña'
    );

    if (!passwordValidation.isValid) {
      this.errorMessage.set(passwordValidation.errors[0]);
      return;
    }

    this.loading.set(true);

    this.authApiService.login({
      email: this.email(),
      password: this.password()
    }).subscribe({
      next: (response) => {
        this.loading.set(false);

        this.notificationService.success(
          'Inicio de sesión correcto',
          'Bienvenido a MarketMap Analytics.'
        );

        this.redirectAfterLogin(response as LoginResponseLike);
      },
      error: () => {
        this.loading.set(false);

        this.errorMessage.set(
          'No fue posible iniciar sesión. Verifique sus credenciales.'
        );
      }
    });
  }

  /*
    Redirige al usuario después de iniciar sesión.

    ADMIN, MANAGER y SELLER entran al dashboard.
    CUSTOMER entra directamente al catálogo.
  */
  private redirectAfterLogin(response: LoginResponseLike): void {
    const role = this.extractRoleFromResponse(response);

    if (role === 'CUSTOMER') {
      this.router.navigate(['/catalog']);
      return;
    }

    if (
      role === 'ADMIN' ||
      role === 'MANAGER' ||
      role === 'SELLER'
    ) {
      this.router.navigate(['/dashboard']);
      return;
    }

    /*
      Si por alguna razón no se pudo determinar el rol,
      se manda al catálogo para evitar intentar cargar dashboard
      con un usuario sin permisos administrativos.
    */
    this.router.navigate(['/catalog']);
  }

  /*
    Extrae el rol desde posibles formas de respuesta.

    Soporta:
    - response.user.role
    - response.role
    - response.data.user.role
    - response.data.role
  */
  private extractRoleFromResponse(
    response: LoginResponseLike | null | undefined
  ): AuthRole | null {
    return response?.user?.role ??
      response?.role ??
      response?.data?.user?.role ??
      response?.data?.role ??
      null;
  }

  /*
    Carga el SDK oficial de Google Identity Services.
  */
  private loadGoogleIdentityScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      const existingScript = document.getElementById('google-identity-script');

      if (existingScript) {
        resolve();
        return;
      }

      const script = document.createElement('script');

      script.id = 'google-identity-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;

      script.onload = () => resolve();
      script.onerror = () => reject();

      document.head.appendChild(script);
    });
  }

  /*
    Inicializa el login con Google usando el Client ID configurado.
  */
  private initializeGoogleLogin(): void {
    const container = this.googleButtonContainer?.nativeElement;

    if (!container) {
      this.errorMessage.set(
        'No se encontró el contenedor del botón de Google.'
      );
      return;
    }

    if (!window.google) {
      this.errorMessage.set(
        'Google Identity Services no está disponible.'
      );
      return;
    }

    if (!environment.googleClientId) {
      this.errorMessage.set(
        'No está configurado el Client ID de Google en Angular.'
      );
      return;
    }

    container.innerHTML = '';

    window.google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response) => this.handleGoogleCredential(response)
    });

    window.google.accounts.id.renderButton(
      container,
      {
        theme: 'outline',
        size: 'large',
        width: 420,
        text: 'continue_with',
        shape: 'rectangular'
      }
    );
  }

  /*
    Recibe el idToken generado por Google y lo envía al backend.
  */
  private handleGoogleCredential(response: GoogleCredentialResponse): void {
    this.errorMessage.set(null);

    if (!response.credential) {
      this.errorMessage.set(
        'Google no devolvió una credencial válida.'
      );
      return;
    }

    this.googleLoading.set(true);

    this.authApiService.loginWithGoogle(response.credential).subscribe({
      next: (loginResponse) => {
        this.googleLoading.set(false);

        this.notificationService.success(
          'Inicio de sesión con Google correcto',
          'Bienvenido a MarketMap Analytics.'
        );

        this.redirectAfterLogin(loginResponse as LoginResponseLike);
      },
      error: () => {
        this.googleLoading.set(false);

        this.errorMessage.set(
          'No fue posible iniciar sesión con Google.'
        );
      }
    });
  }
}