/*
  Modelo para la solicitud de registro.

  Este modelo representa los datos que se envían al backend
  cuando un usuario crea una cuenta nueva.
*/

import { UserRole } from './user.model';

export interface RegisterRequest {
  /*
    Nombre completo del usuario.
  */
  name: string;

  /*
    Correo electrónico del usuario.
  */
  email: string;

  /*
    Contraseña del usuario.
  */
  password: string;

  /*
    Confirmación de contraseña.

    Este campo se valida en frontend.
    No se envía al backend desde AuthApiService.
  */
  confirmPassword: string;

  /*
    Rol opcional.

    Si no se envía, el backend debería asignar CUSTOMER por defecto.
  */
  role?: UserRole;
}