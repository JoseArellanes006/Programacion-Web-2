import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { ChatComponent } from './pages/chat/chat';
import { authGuard } from './guards/auth.guard';

/*
  Rutas principales de la aplicación.

  /login:
  Ruta pública para iniciar sesión.

  /chat:
  Ruta protegida. Solo se puede acceder si authGuard valida
  que existe una sesión activa.

  '':
  Redirige la ruta raíz hacia login.

  '**':
  Captura rutas inexistentes y las redirige a login.
*/

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'chat',
    component: ChatComponent,
    canActivate: [authGuard]
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];