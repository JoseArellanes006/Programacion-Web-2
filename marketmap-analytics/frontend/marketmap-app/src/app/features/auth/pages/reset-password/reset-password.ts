/*
  Página de restablecimiento de contraseña.

  Esta pantalla permite definir una nueva contraseña usando un token
  de recuperación.

  El token puede venir en la URL como query param:
  /auth/reset-password?token=abc123
*/

import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { NotificationService } from '../../../../core/services/notification.service';
import {
  validatePassword,
  validatePasswordMatch
} from '../../../../shared/utils/validators';

import { AuthApiService } from '../../services/auth-api.service';

@Component({
  selector: 'app-reset-password',
  imports: [
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss'
})
export class ResetPassword implements OnInit {
  private readonly authApiService = inject(AuthApiService);
  private readonly notificationService = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly token = signal('');
  protected readonly password = signal('');
  protected readonly confirmPassword = signal('');

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  /*
    Al iniciar la página se intenta leer el token desde la URL.
  */
  ngOnInit(): void {
    const queryToken = this.route.snapshot.queryParamMap.get('token') ?? '';
    this.token.set(queryToken);
  }

  /*
    Envía la nueva contraseña al backend.
  */
  protected submit(): void {
    this.errorMessage.set(null);

    if (!this.token()) {
      this.errorMessage.set('El token de recuperación no es válido o no existe.');
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

    this.authApiService.resetPassword(
      this.token(),
      this.password()
    ).subscribe({
      next: () => {
        this.loading.set(false);

        this.notificationService.success(
          'Contraseña actualizada',
          'Ahora puede iniciar sesión con su nueva contraseña.'
        );

        this.router.navigate(['/auth/login']);
      },
      error: () => {
        this.loading.set(false);

        this.errorMessage.set(
          'No fue posible restablecer la contraseña. Verifique el token.'
        );
      }
    });
  }
}