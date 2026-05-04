import { Component, input, output } from '@angular/core';
import { Usuario } from '../../models/usuario.model';

/*
  ChatHeaderComponent

  Rol dentro de la arquitectura:
  - Componente PRESENTACIONAL (no maneja lógica de negocio).
  - Solo muestra información y emite eventos.

  Responsabilidades:
  - Mostrar información básica del usuario autenticado.
  - Permitir cerrar sesión mediante un evento hacia el componente padre.

  Qué NO hace (importante):
  - No gestiona sesión.
  - No accede a servicios.
  - No modifica estado global.

  Esto permite:
  - reutilización;
  - pruebas más simples;
  - separación clara entre UI y lógica.
*/

@Component({
  selector: 'app-chat-header',
  standalone: true,
  template: `
    <header class="header">
      <div>
        <!--
          Título estático del módulo de chat.
          Solo tiene propósito visual.
        -->
        <h1>Chat en tiempo real</h1>

        <!--
          Muestra el nombre del usuario.

          usuario() es un signal (input).
          Se usa optional chaining (?.) para evitar errores
          si el usuario aún no está cargado.
        -->
        <p>
          Usuario:
          <strong>{{ usuario()?.nombre }}</strong>
        </p>
      </div>

      <!--
        Botón de cierre de sesión.

        No ejecuta lógica directamente.
        Solo emite un evento hacia el componente padre,
        quien decide qué hacer (limpiar sesión, redirigir, etc.).
      -->
      <button (click)="cerrarSesion.emit()">
        Cerrar sesión
      </button>
    </header>
  `,
  styles: `
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      padding: 22px;
      background: #111827;
      color: white;
      border-radius: 18px;
    }

    h1 {
      margin: 0 0 6px;
      font-size: 28px;
    }

    p {
      margin: 0;
      color: #d1d5db;
    }

    button {
      padding: 10px 14px;
      border: none;
      border-radius: 10px;
      background: #b91c1c;
      color: white;
      font-weight: 700;
      cursor: pointer;
    }
  `
})
export class ChatHeaderComponent {

  /*
    INPUT: usuario

    Flujo:
    Página principal (ChatPage) → ChatHeaderComponent

    Tipo:
    Usuario | null

    Por qué puede ser null:
    - La sesión puede no estar cargada aún.
    - El usuario pudo haber cerrado sesión.

    Este componente NO valida autenticación,
    solo muestra lo que recibe.
  */
  usuario = input<Usuario | null>(null);


  /*
    OUTPUT: cerrarSesion

    Flujo:
    ChatHeaderComponent → Componente padre (ChatPage)

    Función:
    Notificar que el usuario desea cerrar sesión.

    Importante:
    - Este componente no elimina datos ni limpia LocalStorage.
    - Solo emite la intención.

    Esto mantiene:
    - desacoplamiento;
    - responsabilidad única;
    - control centralizado en el componente padre.
  */
  cerrarSesion = output<void>();
}