/*
  Página de registro.

  Permite crear una cuenta nueva dentro del sistema.
*/

import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { APP_CONSTANTS } from '../../../../core/config/app.constants';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validateRequiredText
} from '../../../../shared/utils/validators';

import { AuthApiService } from '../../services/auth-api.service';
import { UserRole } from '../../models/user.model';

@Component({
  selector: 'app-register',
  imports: [
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSelectModule
  ],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register {
  private readonly authApiService = inject(AuthApiService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  protected readonly name = signal('');
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly confirmPassword = signal('');
  protected readonly role = signal<UserRole>(APP_CONSTANTS.roles.customer);

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  /*
    Opciones de rol visibles para el registro.

    En un sistema real, normalmente el registro público solo debería crear
    clientes. Se conservan roles adicionales para pruebas académicas.
  */
  protected readonly roleOptions = [
    {
      label: 'Cliente',
      value: APP_CONSTANTS.roles.customer
    },
    {
      label: 'Vendedor',
      value: APP_CONSTANTS.roles.seller
    },
    {
      label: 'Gerente',
      value: APP_CONSTANTS.roles.manager
    }
  ];

  /*
    Envía el formulario de registro.
  */
  protected submit(): void {
    this.errorMessage.set(null);

    const nameValidation = validateRequiredText(this.name(), 'El nombre');

    if (!nameValidation.isValid) {
      this.errorMessage.set(nameValidation.errors[0]);
      return;
    }

    const emailValidation = validateEmail(this.email());

    if (!emailValidation.isValid) {
      this.errorMessage.set(emailValidation.errors[0]);
      return;
    }

    const passwordValidation = validatePassword(this.password());

    if (!passwordValidation.isValid) {
      this.errorMessage.set(passwordValidation.errors[0]);
      return;
    }

    const matchValidation = validatePasswordMatch(
      this.password(),
      this.confirmPassword()
    );

    if (!matchValidation.isValid) {
      this.errorMessage.set(matchValidation.errors[0]);
      return;
    }

    this.loading.set(true);

    this.authApiService.register({
      name: this.name(),
      email: this.email(),
      password: this.password(),
      confirmPassword: this.confirmPassword(),
      role: this.role()
    }).subscribe({
      next: () => {
        this.loading.set(false);

        this.notificationService.success(
          'Registro correcto',
          'La cuenta fue creada correctamente.'
        );

        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.loading.set(false);

        this.errorMessage.set(
          'No fue posible registrar la cuenta. Intente nuevamente.'
        );
      }
    });
  }
}