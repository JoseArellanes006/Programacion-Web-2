/*
  Modelo para la solicitud de inicio de sesión.

  Este modelo representa los datos que el frontend enviará al backend
  cuando el usuario intente iniciar sesión.
*/

export interface LoginRequest {
  /*
    Correo electrónico del usuario.
  */
  email: string;

  /*
    Contraseña del usuario.
  */
  password: string;
}