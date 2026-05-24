/*
  Modelo administrativo de usuarios.

  Este archivo define la estructura de usuarios que se administran
  desde el panel interno del sistema.

  Importante:
  Angular NO guarda usuarios como base de datos local.
  El backend será responsable de:
  - consultar usuarios desde MongoDB
  - crear usuarios
  - actualizar información
  - cambiar roles
  - cambiar estados
  - eliminar o desactivar usuarios
  - validar permisos administrativos
*/

import { APP_CONSTANTS } from '../../../core/config/app.constants';

/*
  Roles disponibles dentro del sistema.
*/
export type UserAdminRole =
  | typeof APP_CONSTANTS.roles.admin
  | typeof APP_CONSTANTS.roles.manager
  | typeof APP_CONSTANTS.roles.seller
  | typeof APP_CONSTANTS.roles.customer;

/*
  Estados administrativos del usuario.
*/
export type UserAdminStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'BLOCKED';

/*
  Modelo principal de usuario administrativo.
*/
export interface UserAdmin {
  /*
    Identificador único del usuario.
  */
  id: string;

  /*
    Nombre completo del usuario.
  */
  name: string;

  /*
    Correo electrónico.
  */
  email: string;

  /*
    Rol asignado dentro del sistema.
  */
  role: UserAdminRole;

  /*
    Estado actual del usuario.
  */
  status: UserAdminStatus;

  /*
    URL opcional de avatar.
  */
  avatarUrl?: string;

  /*
    Fecha de creación.
  */
  createdAt?: string;

  /*
    Última actualización.
  */
  updatedAt?: string;

  /*
    Fecha del último acceso.
  */
  lastLoginAt?: string;
}

/*
  Modelo para crear usuario desde administración.
*/
export interface CreateUserAdminRequest {
  /*
    Nombre completo.
  */
  name: string;

  /*
    Correo electrónico.
  */
  email: string;

  /*
    Contraseña inicial.
  */
  password: string;

  /*
    Rol asignado.
  */
  role: UserAdminRole;

  /*
    Estado inicial.
  */
  status: UserAdminStatus;
}

/*
  Modelo para actualizar datos generales de usuario.
*/
export interface UpdateUserAdminRequest {
  /*
    Nombre completo.
  */
  name: string;

  /*
    Correo electrónico.
  */
  email: string;

  /*
    Rol asignado.
  */
  role: UserAdminRole;

  /*
    Estado actual.
  */
  status: UserAdminStatus;
}

/*
  Solicitud específica para cambiar rol.
*/
export interface UpdateUserRoleRequest {
  /*
    Nuevo rol del usuario.
  */
  role: UserAdminRole;
}

/*
  Solicitud específica para cambiar estado.
*/
export interface UpdateUserStatusRequest {
  /*
    Nuevo estado del usuario.
  */
  status: UserAdminStatus;
}

/*
  Filtros para consultar usuarios.
*/
export interface UserAdminFilters {
  /*
    Texto de búsqueda.
  */
  search?: string;

  /*
    Filtro por rol.
  */
  role?: UserAdminRole | 'ALL';

  /*
    Filtro por estado.
  */
  status?: UserAdminStatus | 'ALL';
}