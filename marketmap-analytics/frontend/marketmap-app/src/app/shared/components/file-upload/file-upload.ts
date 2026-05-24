/*
  Componente reutilizable para carga de archivos.

  Se usará para:
  - imagen de producto
  - imagen base del mapa interactivo
  - avatar de usuario
  - archivos futuros

  Este componente no sube archivos directamente al backend.

  Su responsabilidad es:
  - permitir seleccionar un archivo
  - permitir arrastrar y soltar un archivo
  - validar el archivo
  - mostrar vista previa
  - emitir el archivo válido al componente padre

  El componente padre o servicio correspondiente decide después si llama a:
  - ImageService
  - ProductService
  - UserService
  - MapService
*/

import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  signal
} from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { APP_CONSTANTS } from '../../../core/config/app.constants';
import { validateImageFile } from '../../utils/validators';
import { formatFileSize } from '../../utils/formatters';

@Component({
  selector: 'app-file-upload',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './file-upload.html',
  styleUrl: './file-upload.scss'
})
export class FileUpload implements OnDestroy {
  /*
    Título visible del componente.
  */
  @Input() label = 'Cargar archivo';

  /*
    Texto auxiliar.
  */
  @Input() helperText = 'Seleccione o arrastre una imagen en formato JPG, PNG o WEBP.';

  /*
    Tipos permitidos para el input file.
  */
  @Input() accept = APP_CONSTANTS.images.allowedTypes.join(',');

  /*
    Define si el componente está deshabilitado.
  */
  @Input() disabled = false;

  /*
    Evento emitido cuando el archivo es válido.
  */
  @Output() fileSelected = new EventEmitter<File>();

  /*
    Evento emitido cuando se limpia el archivo.
  */
  @Output() fileCleared = new EventEmitter<void>();

  /*
    Archivo seleccionado.
  */
  protected readonly selectedFile = signal<File | null>(null);

  /*
    URL temporal para previsualización.
  */
  protected readonly previewUrl = signal<string | null>(null);

  /*
    Mensaje de error.
  */
  protected readonly errorMessage = signal<string | null>(null);

  /*
    Indica si el usuario está arrastrando un archivo sobre el área.
  */
  protected readonly dragging = signal(false);

  /*
    Limpia URL temporal al destruir el componente.
  */
  ngOnDestroy(): void {
    this.revokePreviewUrl();
  }

  /*
    Maneja selección desde input.
  */
  protected handleInputChange(event: Event): void {
    if (this.disabled) {
      return;
    }

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.processFile(file);

    /*
      Permite seleccionar el mismo archivo nuevamente después de limpiarlo.
    */
    input.value = '';
  }

  /*
    Permite arrastrar archivo encima del contenedor.
  */
  protected handleDragOver(event: DragEvent): void {
    if (this.disabled) {
      return;
    }

    event.preventDefault();
    this.dragging.set(true);
  }

  /*
    Maneja salida del archivo arrastrado.
  */
  protected handleDragLeave(event: DragEvent): void {
    if (this.disabled) {
      return;
    }

    event.preventDefault();
    this.dragging.set(false);
  }

  /*
    Maneja archivo soltado en el contenedor.
  */
  protected handleDrop(event: DragEvent): void {
    if (this.disabled) {
      return;
    }

    event.preventDefault();
    this.dragging.set(false);

    const file = event.dataTransfer?.files?.[0] ?? null;
    this.processFile(file);
  }

  /*
    Procesa y valida el archivo recibido.
  */
  private processFile(file: File | null): void {
    const validation = validateImageFile(file);

    if (!validation.isValid || !file) {
      this.clearPreviewOnly();
      this.errorMessage.set(validation.errors[0] ?? 'Archivo no válido.');
      return;
    }

    this.revokePreviewUrl();

    this.selectedFile.set(file);
    this.errorMessage.set(null);
    this.fileSelected.emit(file);

    /*
      Genera URL temporal para previsualizar imagen.
    */
    const objectUrl = URL.createObjectURL(file);
    this.previewUrl.set(objectUrl);
  }

  /*
    Limpia el archivo seleccionado.
  */
  protected clearFile(): void {
    this.clearPreviewOnly();
    this.fileCleared.emit();
  }

  /*
    Limpia estado visual sin emitir evento.
  */
  private clearPreviewOnly(): void {
    this.revokePreviewUrl();
    this.selectedFile.set(null);
    this.previewUrl.set(null);
    this.errorMessage.set(null);
    this.dragging.set(false);
  }

  /*
    Libera memoria de la URL temporal.
  */
  private revokePreviewUrl(): void {
    const currentPreviewUrl = this.previewUrl();

    if (currentPreviewUrl) {
      URL.revokeObjectURL(currentPreviewUrl);
    }
  }

  /*
    Devuelve el tamaño del archivo en formato legible.
  */
  protected getFileSize(file: File): string {
    return formatFileSize(file.size);
  }
}