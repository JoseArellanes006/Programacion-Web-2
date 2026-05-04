import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { LoginRequest, LoginResponse } from '../models/auth.model';
import { Usuario } from '../models/usuario.model';
import { LocalStorageService } from './local-storage.service';

/*
  AuthService

  Este servicio centraliza toda la lógica de autenticación.

  Problema que resuelve:
  - Evita que el login, logout y validación de sesión estén repartidos
    en distintos componentes.
  - Permite que cualquier parte de la aplicación pueda consultar
    si el usuario está autenticado.
  - Mantiene sincronizada la sesión en memoria y en LocalStorage.

  Responsabilidades principales:
  - Enviar credenciales al backend.
  - Guardar la sesión cuando el login es correcto.
  - Recuperar la sesión al recargar la página.
  - Exponer el usuario autenticado.
  - Indicar si el usuario tiene sesión activa.
  - Cerrar sesión y redirigir al login.
*/

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  /*
    HttpClient permite realizar peticiones HTTP al backend.

    En este caso se usa para enviar usuario y contraseña
    al endpoint de login.
  */
  private http = inject(HttpClient);

  /*
    Router permite navegar entre páginas desde el servicio.

    Se usa para:
    - enviar al usuario al chat después del login;
    - regresarlo al login después del logout.
  */
  private router = inject(Router);

  /*
    LocalStorageService centraliza el almacenamiento local.

    AuthService lo usa para guardar y recuperar la sesión
    sin manipular directamente localStorage.
  */
  private localStorageService = inject(LocalStorageService);

  /*
    URL base del backend FastAPI.

    Todos los endpoints de autenticación parten de esta dirección.
  */
  private readonly apiUrl = 'http://127.0.0.1:8000/api';

  /*
    Signal que almacena la sesión actual del usuario.

    Proceso:
    1. Al iniciar el servicio, intenta recuperar la sesión guardada
       en LocalStorage.
    2. Si existe sesión, la aplicación puede mantener al usuario autenticado.
    3. Si no existe, el valor inicial será null.

    Esto permite que el usuario no pierda la sesión al recargar la página.
  */
  sesion = signal<LoginResponse | null>(
    this.localStorageService.obtenerSesion()
  );

  /*
    Computed que obtiene el usuario autenticado.

    Depende directamente de sesion().

    Si existe sesión:
    - devuelve el objeto usuario.

    Si no existe sesión:
    - devuelve null.

    Ventaja:
    Cualquier componente puede leer usuarioActual() sin tener que revisar
    manualmente si la sesión existe.
  */
  usuarioActual = computed<Usuario | null>(() => {
    return this.sesion()?.usuario ?? null;
  });

  /*
    Computed que indica si el usuario está autenticado.

    La validación se basa en la existencia de un token dentro de la sesión.

    Si hay token:
    - autenticado() devuelve true.

    Si no hay token:
    - autenticado() devuelve false.

    Este valor es usado principalmente por el Auth Guard para proteger rutas.
  */
  autenticado = computed<boolean>(() => {
    return !!this.sesion()?.token;
  });

  /*
    Realiza el inicio de sesión.

    Proceso:
    1. Recibe las credenciales capturadas en LoginComponent.
    2. Envía una petición POST al backend.
    3. Si el backend valida correctamente:
       - guarda la respuesta en el signal sesion;
       - persiste la sesión en LocalStorage;
       - redirige al usuario a /chat.
    4. Si el backend rechaza las credenciales:
       - muestra un mensaje de error.

    La respuesta esperada del backend debe tener:
    - token;
    - datos del usuario.
  */
  login(credenciales: LoginRequest): void {
    this.http.post<LoginResponse>(`${this.apiUrl}/login`, credenciales)
      .subscribe({
        next: (respuesta) => {
          /*
            Actualiza la sesión en memoria.

            Al cambiar este signal, todos los computed que dependen de él
            se actualizan automáticamente.
          */
          this.sesion.set(respuesta);

          /*
            Guarda la sesión en LocalStorage.

            Esto permite mantener la sesión activa aunque el usuario
            recargue la página.
          */
          this.localStorageService.guardarSesion(respuesta);

          /*
            Redirige al usuario a la página protegida del chat.
          */
          this.router.navigateByUrl('/chat');
        },
        error: () => {
          /*
            Si ocurre un error, normalmente significa que:
            - el usuario no existe;
            - la contraseña es incorrecta;
            - el backend no está disponible.

            Para este ejemplo didáctico se muestra un alert simple.
          */
          alert('Usuario o contraseña incorrectos.');
        }
      });
  }

  /*
    Cierra la sesión del usuario.

    Proceso:
    1. Limpia la sesión en memoria.
    2. Elimina la sesión guardada en LocalStorage.
    3. Redirige al usuario a /login.

    Importante:
    Este método solo elimina la sesión.
    No borra necesariamente el historial local de mensajes.
  */
  logout(): void {
    this.sesion.set(null);
    this.localStorageService.eliminarSesion();
    this.router.navigateByUrl('/login');
  }

  /*
    Devuelve el token de la sesión actual.

    Uso principal:
    - abrir conexión WebSocket autenticada;
    - enviar token al backend;
    - validar sesión en flujos internos.

    Si no hay sesión activa, devuelve null.
  */
  obtenerToken(): string | null {
    return this.sesion()?.token ?? null;
  }
}