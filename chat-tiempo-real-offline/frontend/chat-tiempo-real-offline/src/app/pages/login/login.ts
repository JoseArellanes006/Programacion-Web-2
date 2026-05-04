import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

/*
  LoginComponent

  Rol dentro del sistema:
  ----------------------
  Este componente representa el punto de entrada a la aplicación.
  Su única responsabilidad es autenticar al usuario.

  Principio aplicado:
  -------------------
  "Separación de responsabilidades"
  - El componente SOLO captura datos y dispara la acción.
  - La lógica de autenticación vive en AuthService.

  Flujo general:
  --------------
  1. Usuario escribe username y password.
  2. Signals almacenan el estado local del formulario.
  3. Se ejecuta iniciarSesion().
  4. Se delega la autenticación a AuthService.
  5. AuthService decide qué hacer (guardar sesión, redirigir, etc.).
*/

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <main class="page">
      <section class="card">
        <h1>Iniciar sesión</h1>

        <p>
          Accede al sistema de chat en tiempo real con modo offline.
        </p>

        <!--
          Campo de usuario.

          ngModel enlaza el valor del input con el signal username().
          ngModelChange actualiza el signal cada vez que el usuario escribe.
        -->
        <label>Usuario</label>
        <input
          type="text"
          [ngModel]="username()"
          (ngModelChange)="username.set($event)"
          placeholder="Ejemplo: alumno"
        />

        <!--
          Campo de contraseña.

          También usa binding bidireccional manual con signals.

          Evento adicional:
          keyup.enter → permite enviar el formulario presionando Enter,
          mejorando la experiencia de usuario.
        -->
        <label>Contraseña</label>
        <input
          type="password"
          [ngModel]="password()"
          (ngModelChange)="password.set($event)"
          placeholder="Ejemplo: 1234"
          (keyup.enter)="iniciarSesion()"
        />

        <!--
          Botón de envío.

          Dispara el proceso de autenticación.
        -->
        <button (click)="iniciarSesion()">
          Entrar
        </button>
      </section>
    </main>
  `,
  styles: `
    .page {
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #f4f6f8;
      padding: 24px;
      font-family: Arial, sans-serif;
    }

    .card {
      width: 100%;
      max-width: 420px;
      padding: 28px;
      background: white;
      border-radius: 20px;
      border: 1px solid #d1d5db;
    }

    h1 {
      margin-top: 0;
      color: #111827;
    }

    p {
      color: #4b5563;
    }

    label {
      display: block;
      margin-top: 16px;
      margin-bottom: 6px;
      font-weight: 700;
    }

    input {
      width: 100%;
      padding: 13px;
      border-radius: 10px;
      border: 1px solid #9ca3af;
      font-size: 16px;
    }

    button {
      width: 100%;
      margin-top: 20px;
      padding: 13px;
      border: none;
      border-radius: 10px;
      background: #1d4ed8;
      color: white;
      font-weight: 700;
      cursor: pointer;
    }
  `
})
export class LoginComponent {

  /*
    Inyección del servicio de autenticación.

    ¿Por qué inject()?
    ------------------
    Es la forma moderna en Angular standalone.
    Evita constructor y hace el código más declarativo.

    Responsabilidad del servicio:
    - Validar credenciales (backend o mock).
    - Guardar sesión.
    - Redirigir al chat.
  */
  private authService = inject(AuthService);


  /*
    Signals del formulario.

    ¿Por qué signals?
    -----------------
    - Representan el estado reactivo del formulario.
    - Evitan usar variables tradicionales + change detection manual.
    - Permiten leer/escribir de forma consistente (username(), username.set()).

    Estado local:
    - username → usuario ingresado.
    - password → contraseña ingresada.
  */
  username = signal('');
  password = signal('');


  /*
    Método principal de autenticación.

    Flujo:
    ------
    1. Se leen los valores actuales de los signals.
    2. Se construye el objeto de credenciales.
    3. Se delega completamente al AuthService.

    Importante:
    ----------
    Este componente NO:
    - valida credenciales complejas;
    - maneja tokens;
    - controla navegación.

    Todo eso debe estar en el servicio.

    Esto hace el componente:
    - simple
    - reutilizable
    - fácil de mantener
  */
  iniciarSesion(): void {
    this.authService.login({
      username: this.username(),
      password: this.password()
    });
  }
}