import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { ContactosService } from '../../services/contactos';
import { ContactoCreate } from '../../models/contacto';

/**
 * ==========================================================
 * COMPONENTE: FormularioContactoComponent
 * ==========================================================
 *
 * Este componente captura los datos de un nuevo contacto.
 *
 * Su responsabilidad es:
 * - mostrar el formulario
 * - leer los valores escritos por el usuario
 * - validarlos de forma básica
 * - construir un ContactoCreate
 * - delegar el guardado al servicio
 */
@Component({
  selector: 'app-formulario-contacto',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <mat-card class="section-card">
      <mat-card-content>
        <div class="section-heading">
          <div class="heading-icon">
            <mat-icon>person_add</mat-icon>
          </div>

          <div class="heading-text">
            <h2>Formulario de contacto</h2>
            <p>Registra un nuevo contacto en el sistema</p>
          </div>
        </div>

        <form class="form-grid" (ngSubmit)="guardar()">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nombre</mat-label>
            <input
              matInput
              id="nombre"
              name="nombre"
              type="text"
              [(ngModel)]="nombre"
              required
            >
            <mat-icon matSuffix>person</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Teléfono</mat-label>
            <input
              matInput
              id="telefono"
              name="telefono"
              type="text"
              [(ngModel)]="telefono"
              required
            >
            <mat-icon matSuffix>phone</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Correo</mat-label>
            <input
              matInput
              id="correo"
              name="correo"
              type="email"
              [(ngModel)]="correo"
              required
            >
            <mat-icon matSuffix>mail</mat-icon>
          </mat-form-field>

          <div class="actions-row">
            <button mat-flat-button color="primary" type="submit">
              <mat-icon>save</mat-icon>
              Guardar contacto
            </button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    :host {
      display: block;
    }

    .section-card {
      border-radius: 24px;
      overflow: hidden;
      height: fit-content;
    }

    .section-heading {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 16px;
    }

    .heading-icon {
      display: grid;
      place-items: center;
      width: 44px;
      height: 44px;
      border-radius: 14px;
      background: rgba(37, 99, 235, 0.10);
      color: #2563eb;
      flex-shrink: 0;
    }

    .heading-text {
      min-width: 0;
    }

    .heading-text h2 {
      margin: 0 0 4px;
      font-size: 1.35rem;
      font-weight: 700;
      color: #0f172a;
    }

    .heading-text p {
      margin: 0;
      color: #64748b;
      font-size: 0.95rem;
      line-height: 1.4;
    }

    .form-grid {
      display: grid;
      gap: 14px;
    }

    .full-width {
      width: 100%;
    }

    .actions-row {
      display: flex;
      justify-content: flex-end;
      margin-top: 2px;
    }

    .actions-row button {
      min-width: 180px;
      height: 46px;
      border-radius: 14px;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    @media (max-width: 640px) {
      .actions-row {
        justify-content: stretch;
      }

      .actions-row button {
        width: 100%;
      }
    }
  `]
})
export class FormularioContactoComponent {
  private contactosService = inject(ContactosService);

  nombre = '';
  telefono = '';
  correo = '';

  /**
   * Construye el objeto de entrada y delega el guardado al servicio.
   * El id no se genera aquí; lo genera el backend.
   */
  guardar(): void {
    if (!this.nombre.trim() || !this.telefono.trim() || !this.correo.trim()) {
      return;
    }

    const nuevoContacto: ContactoCreate = {
      nombre: this.nombre.trim(),
      telefono: this.telefono.trim(),
      correo: this.correo.trim()
    };

    this.contactosService.agregar(nuevoContacto);
    this.limpiarFormulario();
  }

  /**
   * Limpia los campos del formulario después de guardar.
   */
  private limpiarFormulario(): void {
    this.nombre = '';
    this.telefono = '';
    this.correo = '';
  }
}