/*
  Servicio API específico del módulo de autenticación.

  Este servicio funciona como una capa intermedia entre las páginas
  de autenticación y el AuthService global del core.

  Ventaja:
  - Las páginas no dependen directamente de detalles internos del core.
  - El módulo auth tiene su propio servicio de entrada.
  - El login tradicional, registro y login con Google mantienen
    la misma estructura de sesión.
*/

import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import {
  AuthService,
  AuthSessionResponse,
  AuthUser,
  ForgotPasswordResponse,
  LoginPayload,
  RegisterPayload,
  ResetPasswordResponse
} from '../../../core/services/auth.service';

import { LoginRequest } from '../models/login-request.model';
import { RegisterRequest } from '../models/register-request.model';
import { AuthSession, User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthApiService {
  /*
    AuthService contiene la lógica global de sesión.
  */
  private readonly authService = inject(AuthService);

  /*
    Inicia sesión con correo y contraseña.
  */
  login(payload: LoginRequest): Observable<AuthSession> {
    const loginPayload: LoginPayload = {
      email: payload.email.trim().toLowerCase(),
      password: payload.password
    };

    return this.authService.login(loginPayload).pipe(
      map((session) => this.mapSession(session))
    );
  }

  /*
    Registra un nuevo usuario.

    confirmPassword no se envía al backend.
    Solo sirve para validación en frontend.
  */
  register(payload: RegisterRequest): Observable<AuthSession> {
    const registerPayload: RegisterPayload = {
      name: payload.name.trim(),
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
      role: payload.role
    };

    return this.authService.register(registerPayload).pipe(
      map((session) => this.mapSession(session))
    );
  }

  /*
    Solicita recuperación de contraseña.
  */
  forgotPassword(email: string): Observable<ForgotPasswordResponse> {
    return this.authService.forgotPassword(
      email.trim().toLowerCase()
    );
  }

  /*
    Restablece contraseña usando token.
  */
  resetPassword(
    resetToken: string,
    newPassword: string
  ): Observable<ResetPasswordResponse> {
    return this.authService.resetPassword(
      resetToken.trim(),
      newPassword
    );
  }

  /*
    Inicia sesión con Google.

    idToken:
    Es la credencial real emitida por Google Identity Services.
  */
  loginWithGoogle(idToken: string): Observable<AuthSession> {
    return this.authService.loginWithGoogle(idToken).pipe(
      map((session) => this.mapSession(session))
    );
  }

  /*
    Convierte la sesión del core al modelo del feature auth.
  */
  private mapSession(session: AuthSessionResponse): AuthSession {
    return {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken ?? null,
      user: this.mapUser(session.user)
    };
  }

  /*
    Convierte AuthUser del core a User del feature.
  */
  private mapUser(user: AuthUser): User {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: (user.status as User['status']) ?? 'ACTIVE',
      avatarUrl: user.avatarUrl ?? null,
      createdAt: user.createdAt ?? null,
      updatedAt: user.updatedAt ?? null
    };
  }
}