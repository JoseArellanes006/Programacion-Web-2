/*
  Página de administración de usuarios.

  Esta pantalla permite:
  - consultar usuarios
  - buscar usuarios
  - filtrar por rol
  - filtrar por estado
  - crear usuarios
  - editar usuarios
  - cambiar estado
  - eliminar usuarios

  Toda operación se comunica con FastAPI mediante UsersService.
*/

import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { APP_CONSTANTS } from '../../../../core/config/app.constants';
import { NotificationService } from '../../../../core/services/notification.service';

import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { DynamicDialog } from '../../../../shared/components/dynamic-dialog/dynamic-dialog';
import { DynamicTable } from '../../../../shared/components/dynamic-table/dynamic-table';

import {
  DialogField,
  DynamicDialogConfig,
  DynamicDialogResult
} from '../../../../shared/models/dialog-field.model';

import {
  TableActionEvent,
  TableColumn
} from '../../../../shared/models/table-column.model';

import {
  CreateUserAdminRequest,
  UpdateUserAdminRequest,
  UserAdmin,
  UserAdminRole,
  UserAdminStatus
} from '../../models/user-admin.model';

import { UsersService } from '../../services/users.service';

@Component({
  selector: 'app-users-admin',
  imports: [
    FormsModule,
    DynamicTable,
    DynamicDialog,
    ConfirmDialog
  ],
  templateUrl: './users-admin.html',
  styleUrl: './users-admin.scss'
})
export class UsersAdmin implements OnInit {
  /*
    Servicio de usuarios.
  */
  protected readonly usersService = inject(UsersService);

  /*
    Servicio de notificaciones.
  */
  private readonly notificationService = inject(NotificationService);

  /*
    Estado de carga.
  */
  protected readonly loading = signal(false);

  /*
    Estado de procesamiento para acciones.
  */
  protected readonly processing = signal(false);

  /*
    Mensaje de error visual.
  */
  protected readonly errorMessage = signal<string | null>(null);

  /*
    Usuario seleccionado para editar o eliminar.
  */
  protected readonly selectedUser = signal<UserAdmin | null>(null);

  /*
    Controla apertura del diálogo dinámico.
  */
  protected readonly dialogOpen = signal(false);

  /*
    Configuración del diálogo dinámico.
  */
  protected readonly dialogConfig = signal<DynamicDialogConfig | null>(null);

  /*
    Controla confirmación de eliminación.
  */
  protected readonly deleteConfirmOpen = signal(false);

  /*
    Usuarios filtrados.
  */
  protected readonly users = computed(() => {
    return this.usersService.filteredUsers();
  });

  /*
    Filtros conectados al servicio.
  */
  protected readonly searchText = this.usersService.searchText;
  protected readonly selectedRole = this.usersService.selectedRole;
  protected readonly selectedStatus = this.usersService.selectedStatus;

  /*
    Opciones de rol.
  */
  protected readonly roleOptions: Array<{
    label: string;
    value: UserAdminRole | 'ALL';
  }> = [
    {
      label: 'Todos',
      value: 'ALL'
    },
    {
      label: 'Administrador',
      value: APP_CONSTANTS.roles.admin
    },
    {
      label: 'Gerente',
      value: APP_CONSTANTS.roles.manager
    },
    {
      label: 'Vendedor',
      value: APP_CONSTANTS.roles.seller
    },
    {
      label: 'Cliente',
      value: APP_CONSTANTS.roles.customer
    }
  ];

  /*
    Opciones de estado.
  */
  protected readonly statusOptions: Array<{
    label: string;
    value: UserAdminStatus | 'ALL';
  }> = [
    {
      label: 'Todos',
      value: 'ALL'
    },
    {
      label: 'Activo',
      value: 'ACTIVE'
    },
    {
      label: 'Inactivo',
      value: 'INACTIVE'
    },
    {
      label: 'Bloqueado',
      value: 'BLOCKED'
    }
  ];

  /*
    Columnas de la tabla.
  */
  protected readonly columns: TableColumn<UserAdmin>[] = [
    {
      key: 'avatarUrl',
      label: 'Avatar',
      type: 'image',
      width: '80px',
      hideOnMobile: true
    },
    {
      key: 'name',
      label: 'Nombre',
      type: 'text',
      sortable: true
    },
    {
      key: 'email',
      label: 'Correo',
      type: 'text'
    },
    {
      key: 'role',
      label: 'Rol',
      type: 'status',
      align: 'center'
    },
    {
      key: 'status',
      label: 'Estado',
      type: 'status',
      align: 'center'
    },
    {
      key: 'lastLoginAt',
      label: 'Último acceso',
      type: 'date',
      hideOnMobile: true
    },
    {
      key: 'actions',
      label: 'Acciones',
      type: 'actions',
      align: 'center',
      actions: [
        {
          key: 'edit',
          label: 'Editar'
        },
        {
          key: 'activate',
          label: 'Activar',
          visible: (user) => user.status !== 'ACTIVE'
        },
        {
          key: 'block',
          label: 'Bloquear',
          visible: (user) => user.status !== 'BLOCKED'
        },
        {
          key: 'delete',
          label: 'Eliminar',
          danger: true
        }
      ]
    }
  ];

  /*
    Carga inicial.
  */
  ngOnInit(): void {
    this.loadUsers();
  }

  /*
    Obtiene usuarios desde backend.
  */
  protected loadUsers(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.usersService.getUsers().subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);

        this.errorMessage.set(
          'No fue posible cargar los usuarios.'
        );
      }
    });
  }

  /*
    Consulta usuarios con filtros enviados al backend.
  */
  protected searchWithBackendFilters(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.usersService.getUsersByFilters({
      search: this.searchText(),
      role: this.selectedRole(),
      status: this.selectedStatus()
    }).subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);

        this.notificationService.error(
          'Error',
          'No fue posible aplicar los filtros.'
        );
      }
    });
  }

  /*
    Actualiza texto de búsqueda local.
  */
  protected updateSearchText(value: string): void {
    this.usersService.setSearchText(value);
  }

  /*
    Actualiza rol seleccionado local.
  */
  protected updateRole(value: UserAdminRole | 'ALL'): void {
    this.usersService.setSelectedRole(value);
  }

  /*
    Actualiza estado seleccionado local.
  */
  protected updateStatus(value: UserAdminStatus | 'ALL'): void {
    this.usersService.setSelectedStatus(value);
  }

  /*
    Limpia filtros y recarga.
  */
  protected clearFilters(): void {
    this.usersService.clearFilters();
    this.loadUsers();
  }

  /*
    Abre diálogo para crear usuario.
  */
  protected openCreateDialog(): void {
    this.selectedUser.set(null);

    this.dialogConfig.set({
      title: 'Crear usuario',
      description: 'Capture los datos del nuevo usuario del sistema.',
      confirmText: 'Guardar usuario',
      cancelText: 'Cancelar',
      fields: this.createUserFields()
    });

    this.dialogOpen.set(true);
  }

  /*
    Abre diálogo para editar usuario.
  */
  protected openEditDialog(user: UserAdmin): void {
    this.selectedUser.set(user);

    this.dialogConfig.set({
      title: 'Editar usuario',
      description: 'Actualice la información administrativa del usuario.',
      confirmText: 'Actualizar usuario',
      cancelText: 'Cancelar',
      fields: this.createUserFields(user)
    });

    this.dialogOpen.set(true);
  }

  /*
    Cierra diálogo.
  */
  protected closeDialog(): void {
    this.dialogOpen.set(false);
    this.dialogConfig.set(null);
    this.selectedUser.set(null);
  }

  /*
    Maneja confirmación del diálogo dinámico.
  */
  protected handleDialogConfirm(result: DynamicDialogResult): void {
    if (!result.confirmed || !result.data) {
      return;
    }

    const user = this.selectedUser();

    if (user) {
      const payload = this.mapDialogDataToUpdateRequest(result.data);
      this.updateUser(user.id, payload);
      return;
    }

    const payload = this.mapDialogDataToCreateRequest(result.data);
    this.createUser(payload);
  }

  /*
    Crea usuario.
  */
  private createUser(payload: CreateUserAdminRequest): void {
    this.processing.set(true);

    this.usersService.createUser(payload).subscribe({
      next: () => {
        this.processing.set(false);
        this.closeDialog();

        this.notificationService.success(
          'Usuario creado',
          'El usuario fue registrado correctamente.'
        );
      },
      error: () => {
        this.processing.set(false);

        this.notificationService.error(
          'Error',
          'No fue posible crear el usuario.'
        );
      }
    });
  }

  /*
    Actualiza usuario.
  */
  private updateUser(
    userId: string,
    payload: UpdateUserAdminRequest
  ): void {
    this.processing.set(true);

    this.usersService.updateUser(userId, payload).subscribe({
      next: () => {
        this.processing.set(false);
        this.closeDialog();

        this.notificationService.success(
          'Usuario actualizado',
          'Los cambios fueron guardados correctamente.'
        );
      },
      error: () => {
        this.processing.set(false);

        this.notificationService.error(
          'Error',
          'No fue posible actualizar el usuario.'
        );
      }
    });
  }

  /*
    Recibe acciones emitidas por la tabla.
  */
  protected handleTableAction(event: TableActionEvent<UserAdmin>): void {
    if (event.action === 'edit') {
      this.openEditDialog(event.row);
      return;
    }

    if (event.action === 'activate') {
      this.changeUserStatus(event.row, 'ACTIVE');
      return;
    }

    if (event.action === 'block') {
      this.changeUserStatus(event.row, 'BLOCKED');
      return;
    }

    if (event.action === 'delete') {
      this.openDeleteConfirm(event.row);
    }
  }

  /*
    Cambia estado de usuario.
  */
  private changeUserStatus(
    user: UserAdmin,
    status: UserAdminStatus
  ): void {
    this.processing.set(true);

    this.usersService.updateUserStatus(user.id, status).subscribe({
      next: () => {
        this.processing.set(false);

        this.notificationService.success(
          'Estado actualizado',
          'El estado del usuario fue actualizado correctamente.'
        );
      },
      error: () => {
        this.processing.set(false);

        this.notificationService.error(
          'Error',
          'No fue posible actualizar el estado del usuario.'
        );
      }
    });
  }

  /*
    Abre confirmación de eliminación.
  */
  protected openDeleteConfirm(user: UserAdmin): void {
    this.selectedUser.set(user);
    this.deleteConfirmOpen.set(true);
  }

  /*
    Cierra confirmación de eliminación.
  */
  protected closeDeleteConfirm(): void {
    this.deleteConfirmOpen.set(false);
    this.selectedUser.set(null);
  }

  /*
    Confirma eliminación.
  */
  protected confirmDeleteUser(): void {
    const user = this.selectedUser();

    if (!user) {
      return;
    }

    this.processing.set(true);

    this.usersService.deleteUser(user.id).subscribe({
      next: () => {
        this.processing.set(false);
        this.closeDeleteConfirm();

        this.notificationService.success(
          'Usuario eliminado',
          'El usuario fue eliminado correctamente.'
        );
      },
      error: () => {
        this.processing.set(false);

        this.notificationService.error(
          'Error',
          'No fue posible eliminar el usuario.'
        );
      }
    });
  }

  /*
    Campos para crear o editar usuario.
  */
  private createUserFields(user?: UserAdmin): DialogField[] {
    const isEdit = user !== undefined;

    const fields: DialogField[] = [
      {
        key: 'name',
        label: 'Nombre completo',
        type: 'text',
        placeholder: 'Ej. Ana López',
        value: user?.name ?? '',
        validations: {
          required: true,
          minLength: 3
        },
        fullWidth: true
      },
      {
        key: 'email',
        label: 'Correo electrónico',
        type: 'email',
        placeholder: 'usuario@correo.com',
        value: user?.email ?? '',
        validations: {
          required: true
        },
        fullWidth: true
      }
    ];

    if (!isEdit) {
      fields.push({
        key: 'password',
        label: 'Contraseña inicial',
        type: 'password',
        placeholder: 'Contraseña temporal',
        value: '',
        validations: {
          required: true,
          minLength: 8
        },
        fullWidth: true
      });
    }

    fields.push(
      {
        key: 'role',
        label: 'Rol',
        type: 'select',
        value: user?.role ?? APP_CONSTANTS.roles.customer,
        options: [
          {
            label: 'Administrador',
            value: APP_CONSTANTS.roles.admin
          },
          {
            label: 'Gerente',
            value: APP_CONSTANTS.roles.manager
          },
          {
            label: 'Vendedor',
            value: APP_CONSTANTS.roles.seller
          },
          {
            label: 'Cliente',
            value: APP_CONSTANTS.roles.customer
          }
        ],
        validations: {
          required: true
        }
      },
      {
        key: 'status',
        label: 'Estado',
        type: 'select',
        value: user?.status ?? 'ACTIVE',
        options: [
          {
            label: 'Activo',
            value: 'ACTIVE'
          },
          {
            label: 'Inactivo',
            value: 'INACTIVE'
          },
          {
            label: 'Bloqueado',
            value: 'BLOCKED'
          }
        ],
        validations: {
          required: true
        }
      }
    );

    return fields;
  }

  /*
    Convierte datos del diálogo a CreateUserAdminRequest.
  */
  private mapDialogDataToCreateRequest(
    data: Record<string, unknown>
  ): CreateUserAdminRequest {
    return {
      name: String(data['name'] ?? ''),
      email: String(data['email'] ?? ''),
      password: String(data['password'] ?? ''),
      role: String(data['role'] ?? APP_CONSTANTS.roles.customer) as UserAdminRole,
      status: String(data['status'] ?? 'ACTIVE') as UserAdminStatus
    };
  }

  /*
    Convierte datos del diálogo a UpdateUserAdminRequest.
  */
  private mapDialogDataToUpdateRequest(
    data: Record<string, unknown>
  ): UpdateUserAdminRequest {
    return {
      name: String(data['name'] ?? ''),
      email: String(data['email'] ?? ''),
      role: String(data['role'] ?? APP_CONSTANTS.roles.customer) as UserAdminRole,
      status: String(data['status'] ?? 'ACTIVE') as UserAdminStatus
    };
  }
}