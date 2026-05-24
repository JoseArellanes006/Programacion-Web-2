/*
  Página de recuperación de contraseña.

  Permite solicitar al backend el envío de instrucciones para recuperar
  el acceso a una cuenta.

  En desarrollo, el backend puede devolver resetUrl para probar el flujo
  sin configurar SMTP.
*/

import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { NotificationService } from '../../../../core/services/notification.service';
import { validateEmail } from '../../../../shared/utils/validators';

import { AuthApiService } from '../../services/auth-api.service';

@Component({
  selector: 'app-forgot-password',
  imports: [
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss'
})
export class ForgotPassword {
  private readonly authApiService = inject(AuthApiService);
  private readonly notificationService = inject(NotificationService);

  protected readonly email = signal('');
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly resetUrl = signal<string | null>(null);

  /*
    Envía solicitud de recuperación de contraseña.
  */
  protected submit(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.resetUrl.set(null);

    const emailValidation = validateEmail(this.email());

    if (!emailValidation.isValid) {
      this.errorMessage.set(emailValidation.errors[0]);
      return;
    }

    this.loading.set(true);

    this.authApiService.forgotPassword(this.email()).subscribe({
      next: (response) => {
        this.loading.set(false);

        this.successMessage.set(
          response.message || 'Se enviaron instrucciones a su correo.'
        );

        if (response.resetUrl) {
          this.resetUrl.set(response.resetUrl);
        }

        this.notificationService.success(
          'Solicitud enviada',
          'Revise su correo electrónico para continuar.'
        );
      },
      error: () => {
        this.loading.set(false);

        this.errorMessage.set(
          'No fue posible procesar la solicitud. Intente nuevamente.'
        );
      }
    });
  }
}