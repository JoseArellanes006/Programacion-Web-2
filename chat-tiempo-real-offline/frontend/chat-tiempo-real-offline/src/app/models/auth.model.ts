/*
  Modelos de autenticación.

  LoginRequest:
  Datos que el usuario escribe en el formulario.

  LoginResponse:
  Datos que devuelve el backend si el inicio de sesión es correcto.
*/

import { Usuario } from './usuario.model';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}