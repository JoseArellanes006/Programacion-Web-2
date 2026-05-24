/*
  Componente de diálogo de confirmación.

  Se usará para acciones delicadas como:
  - eliminar producto
  - cancelar pedido
  - eliminar usuario
  - limpiar carrito
  - cerrar sesión manualmente si se requiere confirmación

  Este componente no se comunica directamente con el backend.
  Solo emite eventos:
  - confirmed
  - cancelled

  El componente padre decide qué hacer después:
  - llamar a un servicio HTTP
  - actualizar estado local
  - cerrar un modal
*/

import { Component, EventEmitter, Input, Output } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-confirm-dialog',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss'
})
export class ConfirmDialog {
  /*
    Controla si el diálogo está visible.
  */
  @Input() open = false;

  /*
    Título del diálogo.
  */
  @Input() title = 'Confirmar acción';

  /*
    Mensaje principal.
  */
  @Input() message = '¿Está seguro de que desea continuar?';

  /*
    Texto del botón de confirmación.
  */
  @Input() confirmText = 'Confirmar';

  /*
    Texto del botón de cancelación.
  */
  @Input() cancelText = 'Cancelar';

  /*
    Define si el botón principal representa una acción peligrosa.
  */
  @Input() danger = false;

  /*
    Ícono opcional del diálogo.

    Si no se proporciona, se decide según danger.
  */
  @Input() icon: string | null = null;

  /*
    Evento emitido al confirmar.
  */
  @Output() confirmed = new EventEmitter<void>();

  /*
    Evento emitido al cancelar.
  */
  @Output() cancelled = new EventEmitter<void>();

  /*
    Ícono seguro del diálogo.
  */
  protected get dialogIcon(): string {
    if (this.icon && this.icon.trim().length > 0) {
      return this.icon.trim();
    }

    return this.danger ? 'warning' : 'help_outline';
  }

  /*
    Clase visual del ícono.
  */
  protected get iconClass(): string {
    return this.danger
      ? 'confirm-dialog__icon confirm-dialog__icon--danger'
      : 'confirm-dialog__icon';
  }

  /*
    Confirma la acción.
  */
  protected confirm(): void {
    this.confirmed.emit();
  }

  /*
    Cancela la acción.
  */
  protected cancel(): void {
    this.cancelled.emit();
  }
}