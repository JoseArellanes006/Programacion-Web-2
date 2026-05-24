/*
  Componente de diálogo dinámico.

  Este componente permite crear formularios reutilizables a partir
  de una configuración de campos.

  Se podrá usar para:
  - crear producto
  - editar producto
  - crear usuario
  - editar zona de mapa
  - crear categoría
  - aplicar filtros

  Este componente no consulta directamente al backend.
  Solamente:
  - renderiza campos
  - administra valores internos
  - valida datos básicos
  - emite el resultado al componente padre

  El componente padre o servicio del módulo decide si llama a:
  - ProductService
  - UserService
  - CategoryService
  - MapService
*/

import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  SimpleChanges
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import {
  DialogField,
  DynamicDialogConfig,
  DynamicDialogResult
} from '../../models/dialog-field.model';

@Component({
  selector: 'app-dynamic-dialog',
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatOptionModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './dynamic-dialog.html',
  styleUrl: './dynamic-dialog.scss'
})
export class DynamicDialog implements OnChanges {
  /*
    Controla si el diálogo se muestra o no.
  */
  @Input() open = false;

  /*
    Configuración completa del diálogo.
  */
  @Input() config: DynamicDialogConfig | null = null;

  /*
    Evento emitido cuando el usuario confirma el formulario.
  */
  @Output() confirmed = new EventEmitter<DynamicDialogResult>();

  /*
    Evento emitido cuando el usuario cancela o cierra el diálogo.
  */
  @Output() closed = new EventEmitter<void>();

  /*
    Valores internos del formulario dinámico.
  */
  protected formValue: Record<string, unknown> = {};

  /*
    Errores internos por campo.
  */
  protected fieldErrors: Record<string, string> = {};

  /*
    Cada vez que cambia la configuración, se inicializan valores.
  */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config'] && this.config) {
      this.initializeForm();
    }

    if (changes['open'] && this.open && this.config) {
      this.initializeForm();
    }
  }

  /*
    Permite cerrar el diálogo con la tecla Escape.
  */
  @HostListener('document:keydown.escape')
  protected handleEscape(): void {
    if (this.open) {
      this.cancel();
    }
  }

  /*
    Inicializa el formulario usando los valores definidos en cada campo.
  */
  private initializeForm(): void {
    this.formValue = {};
    this.fieldErrors = {};

    for (const field of this.config?.fields ?? []) {
      this.formValue[field.key] = field.value ?? this.getDefaultValue(field);
    }
  }

  /*
    Define valor por defecto según el tipo de campo.
  */
  private getDefaultValue(field: DialogField): unknown {
    if (field.type === 'checkbox') {
      return false;
    }

    if (field.type === 'number') {
      return 0;
    }

    if (field.type === 'file' && field.multiple) {
      return [];
    }

    if (field.type === 'file') {
      return null;
    }

    return '';
  }

  /*
    Determina si un campo debe mostrarse.

    Si no tiene visibleWhen, se muestra normalmente.
    Si tiene visibleWhen, se compara con el valor actual del campo asociado.
  */
  protected isFieldVisible(field: DialogField): boolean {
    if (field.hidden) {
      return false;
    }

    if (!field.visibleWhen) {
      return true;
    }

    return this.formValue[field.visibleWhen.fieldKey] === field.visibleWhen.equals;
  }

  /*
    Obtiene valor de un campo.
  */
  protected getFieldValue(field: DialogField): unknown {
    return this.formValue[field.key];
  }

  /*
    Actualiza valor de un campo.

    Para campos numéricos convierte el valor a number cuando sea posible.
  */
  protected setFieldValue(field: DialogField, value: unknown): void {
    if (field.type === 'number') {
      if (value === null || value === undefined || value === '') {
        this.formValue[field.key] = '';
        return;
      }

      const numericValue = Number(value);

      this.formValue[field.key] = Number.isFinite(numericValue)
        ? numericValue
        : value;

      return;
    }

    this.formValue[field.key] = value;

    this.clearHiddenFieldErrors();
  }

  /*
    Limpia errores de campos que ya no están visibles.
  */
  private clearHiddenFieldErrors(): void {
    for (const field of this.config?.fields ?? []) {
      if (!this.isFieldVisible(field)) {
        delete this.fieldErrors[field.key];
      }
    }
  }

  /*
    Maneja selección de archivos.

    Si el campo acepta múltiples archivos, guarda un arreglo File[].
    Si no, guarda un único File o null.
  */
  protected handleFileChange(event: Event, field: DialogField): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);

    if (field.multiple) {
      this.formValue[field.key] = files;
      return;
    }

    this.formValue[field.key] = files[0] ?? null;
  }

  /*
    Cancela el diálogo.
  */
  protected cancel(): void {
    this.closed.emit();
  }

  /*
    Confirma el formulario si pasa validaciones básicas.
  */
  protected confirm(): void {
    if (!this.validateForm()) {
      return;
    }

    const data = this.buildSubmittedData();
    const payload = this.buildPayload(data);

    this.confirmed.emit({
      confirmed: true,
      data,
      payload
    });
  }

  /*
    Construye los datos que sí deben emitirse.

    Si field.submit === false, el campo no se incluye.
  */
  private buildSubmittedData(): Record<string, unknown> {
    const data: Record<string, unknown> = {};

    for (const field of this.config?.fields ?? []) {
      if (field.submit === false) {
        continue;
      }

      data[field.key] = this.formValue[field.key];
    }

    return data;
  }

  /*
    Construye el payload final.

    Si config.submitPayloadMapper existe, se usa.
    Si no existe, se devuelve data tal como está.
  */
  private buildPayload(
    data: Record<string, unknown>
  ): Record<string, unknown> | FormData {
    if (this.config?.submitPayloadMapper) {
      return this.config.submitPayloadMapper(data);
    }

    return data;
  }

  /*
    Valida todos los campos del formulario dinámico.
  */
  private validateForm(): boolean {
    this.fieldErrors = {};

    for (const field of this.config?.fields ?? []) {
      if (field.disabled) {
        continue;
      }

      if (!this.isFieldVisible(field)) {
        continue;
      }

      const error = this.validateField(field);

      if (error) {
        this.fieldErrors[field.key] = error;
      }
    }

    return Object.keys(this.fieldErrors).length === 0;
  }

  /*
    Valida un campo individual.
  */
  private validateField(field: DialogField): string | null {
    const value = this.formValue[field.key];
    const validations = field.validations;

    if (!validations) {
      return null;
    }

    if (validations.required && this.isEmptyValue(field, value)) {
      return validations.message ?? `${field.label} es obligatorio.`;
    }

    if (typeof value === 'string') {
      const trimmedValue = value.trim();

      if (
        validations.minLength !== undefined &&
        trimmedValue.length < validations.minLength
      ) {
        return `${field.label} debe tener al menos ${validations.minLength} caracteres.`;
      }

      if (
        validations.maxLength !== undefined &&
        trimmedValue.length > validations.maxLength
      ) {
        return `${field.label} no debe superar ${validations.maxLength} caracteres.`;
      }

      if (validations.pattern && !validations.pattern.test(trimmedValue)) {
        return validations.message ?? `${field.label} no tiene un formato válido.`;
      }
    }

    if (field.type === 'number') {
      const numericValue = Number(value);

      if (!Number.isFinite(numericValue)) {
        return `${field.label} debe ser un número válido.`;
      }

      if (validations.min !== undefined && numericValue < validations.min) {
        return `${field.label} debe ser mayor o igual a ${validations.min}.`;
      }

      if (validations.max !== undefined && numericValue > validations.max) {
        return `${field.label} debe ser menor o igual a ${validations.max}.`;
      }
    }

    return null;
  }

  /*
    Determina si un valor está vacío según el tipo de campo.
  */
  private isEmptyValue(field: DialogField, value: unknown): boolean {
    if (field.type === 'checkbox') {
      return value !== true;
    }

    if (field.type === 'file') {
      if (Array.isArray(value)) {
        return value.length === 0;
      }

      return value === null || value === undefined;
    }

    return value === null || value === undefined || value === '';
  }

  /*
    Indica si un campo tiene error.
  */
  protected hasError(field: DialogField): boolean {
    return Boolean(this.fieldErrors[field.key]);
  }

  /*
    Devuelve el mensaje de error de un campo.
  */
  protected getError(field: DialogField): string {
    return this.fieldErrors[field.key] ?? '';
  }

  /*
    Devuelve el texto auxiliar de archivos.
  */
  protected getFileHelperText(field: DialogField): string {
    const value = this.formValue[field.key];

    if (Array.isArray(value) && value.length > 0) {
      return `${value.length} archivo(s) seleccionado(s).`;
    }

    if (value instanceof File) {
      return value.name;
    }

    return field.helperText ?? 'Seleccione un archivo.';
  }
}