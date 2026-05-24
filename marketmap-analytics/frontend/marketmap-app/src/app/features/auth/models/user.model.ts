/*
  Modelo de usuario para el módulo de autenticación.

  Este modelo representa al usuario que inicia sesión en el sistema.
  Se usa principalmente en:
  - login
  - registro
  - guards
  - navbar
  - control de roles
*/

import { APP_CONSTANTS } from '../../../core/config/app.constants';

/*
  Roles permitidos dentro del sistema.

  Se toman desde APP_CONSTANTS para mantener consistencia entre:
  - frontend
  - guards
  - servicios
  - backend
*/
export type UserRole =
  | typeof APP_CONSTANTS.roles.admin
  | typeof APP_CONSTANTS.roles.manager
  | typeof APP_CONSTANTS.roles.seller
  | typeof APP_CONSTANTS.roles.customer;

/*
  Estado básico de un usuario.
*/
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';

/*
  Modelo principal del usuario autenticado.
*/
export interface User {
  /*
    Identificador único del usuario.

    En MongoDB normalmente corresponde al _id convertido a string.
  */
  id: string;

  /*
    Nombre completo del usuario.
  */
  name: string;

  /*
    Correo electrónico del usuario.
  */
  email: string;

  /*
    Rol del usuario dentro del sistema.
  */
  role: UserRole;

  /*
    Estado del usuario.
  */
  status: UserStatus;

  /*
    URL opcional del avatar o imagen de perfil.
  */
  avatarUrl?: string | null;

  /*
    Fecha de creación del usuario.
  */
  createdAt?: string | null;

  /*
    Fecha de última actualización.
  */
  updatedAt?: string | null;
}

/*
  Respuesta de sesión después de login, registro o Google login.
*/
export interface AuthSession {
  /*
    Token principal para autenticar peticiones HTTP.
  */
  accessToken: string;

  /*
    Token opcional para renovar sesión.
  */
  refreshToken?: string | null;

  /*
    Usuario autenticado.
  */
  user: User;
}