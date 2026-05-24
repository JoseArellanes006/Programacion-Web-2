/*
  Guard de roles.

  Este guard protege rutas según el rol del usuario.

  Funcionamiento:
  - Lee los roles permitidos desde la configuración de la ruta.
  - Verifica si el usuario actual tiene alguno de esos roles.
  - Si tiene permiso, permite entrar.
  - Si no tiene permiso, redirige a una ruta segura según el rol.

  Regla actual:
  - CUSTOMER no debe entrar al dashboard ni a módulos administrativos.
  - Si CUSTOMER intenta entrar a una ruta no permitida, se manda a /catalog.
  - Usuarios administrativos se mandan a /dashboard.
*/

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthRole } from '../services/auth.service';
import { RoleService } from '../services/role.service';

/*
  Guard funcional para validar roles.
*/
export const roleGuard: CanActivateFn = (route) => {
  /*
    RoleService centraliza la lógica de permisos.
  */
  const roleService = inject(RoleService);

  /*
    Router permite redirigir si el usuario no tiene permiso.
  */
  const router = inject(Router);

  /*
    Lee los roles permitidos desde data.roles de la ruta.

    Si una ruta no define roles, se interpreta como ruta accesible
    para cualquier usuario autenticado.
  */
  const allowedRoles = (route.data?.['roles'] ?? []) as AuthRole[];

  /*
    Si la ruta no declara roles, se permite el acceso.
  */
  if (allowedRoles.length === 0) {
    return true;
  }

  /*
    Si el usuario tiene alguno de los roles permitidos, entra.
  */
  if (roleService.hasAnyRole(allowedRoles)) {
    return true;
  }

  /*
    Si no tiene permiso, se redirige según su rol.
    Esto evita ciclos como:
    CUSTOMER -> /dashboard -> bloqueado -> /dashboard otra vez.
  */
  if (roleService.hasAnyRole(['CUSTOMER'])) {
    return router.createUrlTree(['/catalog']);
  }

  /*
    Para roles administrativos sin permiso específico,
    se manda al dashboard como ruta segura general.
  */
  if (
    roleService.hasAnyRole(['ADMIN']) ||
    roleService.hasAnyRole(['MANAGER']) ||
    roleService.hasAnyRole(['SELLER'])
  ) {
    return router.createUrlTree(['/dashboard']);
  }

  /*
    Si no se puede determinar el rol, se manda al catálogo.
  */
  return router.createUrlTree(['/catalog']);
};