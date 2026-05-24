/*
  Página de mapa interactivo.

  Esta pantalla permite visualizar la distribución del establecimiento
  y consultar el estado de cada zona.

  Funcionalidades:
  - cargar mapa activo desde backend
  - mostrar imagen base del layout sin recortarla
  - cargar imagen base del mapa
  - dibujar zonas con el mouse
  - crear zonas en backend
  - mostrar zonas posicionadas sobre el layout
  - seleccionar una zona
  - cambiar estado de zona
  - liberar zona
  - mostrar resumen de ocupación

  El frontend no inventa zonas finales.
  Las zonas se crean en FastAPI y se guardan en MongoDB.
*/

import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { APP_CONSTANTS } from '../../../../core/config/app.constants';
import { NotificationService } from '../../../../core/services/notification.service';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';

import { MapZone, MapZoneStatus } from '../../models/map-zone.model';

import {
  CreateMapZoneRequest,
  MapService,
  MapZoneType
} from '../../services/map.service';

interface DrawingArea {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface DrawingPreview {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface DraftZoneGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
}

@Component({
  selector: 'app-interactive-map',
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    CurrencyFormatPipe
  ],
  templateUrl: './interactive-map.html',
  styleUrl: './interactive-map.scss'
})
export class InteractiveMap implements OnInit {
  /*
    Referencia al contenedor visual del mapa.
  */
  @ViewChild('mapCanvas')
  private readonly mapCanvasRef?: ElementRef<HTMLDivElement>;

  /*
    Referencia a la imagen base del mapa.
  */
  @ViewChild('mapImage')
  private readonly mapImageRef?: ElementRef<HTMLImageElement>;

  /*
    Servicio del mapa.
  */
  protected readonly mapService = inject(MapService);

  /*
    Servicio de notificaciones.
  */
  private readonly notificationService = inject(NotificationService);

  /*
    Estado de carga.
  */
  protected readonly loading = signal(false);

  /*
    Estado de procesamiento para acciones sobre zonas.
  */
  protected readonly processing = signal(false);

  /*
    Estado de carga de imagen base.
  */
  protected readonly uploadingBackground = signal(false);

  /*
    Mensaje de error visual.
  */
  protected readonly errorMessage = signal<string | null>(null);

  /*
    Zona seleccionada por el usuario.
  */
  protected readonly selectedZone = signal<MapZone | null>(null);

  /*
    Geometría pendiente de una zona dibujada.
  */
  protected readonly draftZoneGeometry = signal<DraftZoneGeometry | null>(null);

  /*
    Rectángulo visible mientras se arrastra el mouse.
  */
  protected readonly drawingPreview = signal<DrawingPreview | null>(null);

  /*
    Área real donde la imagen está visible dentro del canvas.

    Esto es necesario porque la imagen usa object-fit: contain.
    Entonces puede haber espacios vacíos alrededor.
  */
  private readonly drawingArea = signal<DrawingArea>({
    left: 0,
    top: 0,
    width: 0,
    height: 0
  });

  /*
    Control interno del dibujo con mouse.
  */
  private isDrawing = false;
  private drawStartX = 0;
  private drawStartY = 0;

  /*
    Datos del formulario para guardar una nueva zona.
  */
  protected readonly draftZoneName = signal('Nueva zona');
  protected readonly draftZoneType = signal<MapZoneType>('OTHER');
  protected readonly draftZoneStatus = signal<MapZoneStatus>('AVAILABLE');

  /*
    La capacidad puede llegar como string o number dependiendo
    del comportamiento del input type="number" con ngModel.
  */
  protected readonly draftZoneCapacity = signal<string | number | null>('');

  protected readonly draftZoneDescription = signal('');
  protected readonly draftZoneColor = signal('#2563eb');

  /*
    Layout actual.
  */
  protected readonly layout = this.mapService.layout;

  /*
    Resumen de ocupación.
  */
  protected readonly summary = this.mapService.summary;

  /*
    Zonas del mapa.
  */
  protected readonly zones = this.mapService.zones;

  /*
    Indica si hay zona seleccionada.
  */
  protected readonly hasSelectedZone = computed(() => {
    return this.selectedZone() !== null;
  });

  /*
    Indica si hay una zona dibujada pendiente de guardar.
  */
  protected readonly hasDraftZone = computed(() => {
    return this.draftZoneGeometry() !== null;
  });

  /*
    Opciones disponibles para cambiar estado de una zona.
  */
  protected readonly statusOptions: Array<{
    label: string;
    value: MapZoneStatus;
    icon: string;
  }> = [
    {
      label: 'Disponible',
      value: APP_CONSTANTS.mapZoneStatus.available,
      icon: 'event_available'
    },
    {
      label: 'Ocupada',
      value: APP_CONSTANTS.mapZoneStatus.occupied,
      icon: 'event_busy'
    },
    {
      label: 'Reservada',
      value: APP_CONSTANTS.mapZoneStatus.reserved,
      icon: 'bookmark'
    },
    {
      label: 'Inactiva',
      value: APP_CONSTANTS.mapZoneStatus.inactive,
      icon: 'block'
    }
  ];

  /*
    Opciones de tipo de zona.
  */
  protected readonly zoneTypeOptions: Array<{
    label: string;
    value: MapZoneType;
  }> = [
    {
      label: 'Mesa',
      value: 'TABLE'
    },
    {
      label: 'Mostrador',
      value: 'COUNTER'
    },
    {
      label: 'Entrega',
      value: 'DELIVERY'
    },
    {
      label: 'Terraza',
      value: 'TERRACE'
    },
    {
      label: 'Caja',
      value: 'CASHIER'
    },
    {
      label: 'Otra área',
      value: 'OTHER'
    }
  ];

  /*
    Carga inicial del mapa.
  */
  ngOnInit(): void {
    this.loadMap();
  }

  /*
    Recalcula el área útil cuando cambia el tamaño de la ventana.
  */
  @HostListener('window:resize')
  protected handleWindowResize(): void {
    this.recalculateDrawingArea();
  }

  /*
    Obtiene el mapa activo desde FastAPI.
  */
  protected loadMap(): void {
    if (
      this.loading() ||
      this.processing() ||
      this.uploadingBackground()
    ) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.mapService.getActiveMap().subscribe({
      next: () => {
        this.loading.set(false);

        const selected = this.selectedZone();

        if (selected) {
          const updatedSelected = this.zones().find((zone) => {
            return zone.id === selected.id;
          });

          this.selectedZone.set(updatedSelected ?? null);
        }

        setTimeout(() => {
          this.recalculateDrawingArea();
        });
      },
      error: () => {
        this.loading.set(false);

        this.errorMessage.set(
          'No fue posible cargar el mapa interactivo.'
        );
      }
    });
  }

  /*
    Sube imagen base del mapa.
  */
  protected uploadBackgroundImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const currentLayout = this.layout();

    /*
      Permite volver a seleccionar el mismo archivo después.
    */
    input.value = '';

    if (!file || !currentLayout) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.notificationService.warning(
        'Archivo inválido',
        'Seleccione un archivo de imagen válido.'
      );

      return;
    }

    this.uploadingBackground.set(true);
    this.errorMessage.set(null);

    this.mapService.updateLayoutBackground(
      currentLayout.id,
      file
    ).subscribe({
      next: () => {
        this.uploadingBackground.set(false);

        this.notificationService.success(
          'Imagen actualizada',
          'La imagen base del mapa fue actualizada correctamente.'
        );

        setTimeout(() => {
          this.recalculateDrawingArea();
        });
      },
      error: () => {
        this.uploadingBackground.set(false);

        this.notificationService.error(
          'Error',
          'No fue posible cargar la imagen del mapa.'
        );
      }
    });
  }

  /*
    Se ejecuta cuando la imagen termina de cargar.
  */
  protected onMapImageLoad(): void {
    this.recalculateDrawingArea();
  }

  /*
    Inicia el dibujo de una nueva zona.
  */
  protected startDrawing(event: MouseEvent): void {
    if (
      this.loading() ||
      this.processing() ||
      this.uploadingBackground() ||
      this.hasDraftZone() ||
      !this.layout()
    ) {
      return;
    }

    if (!this.getBackgroundImageUrl()) {
      this.notificationService.warning(
        'Mapa sin imagen',
        'Primero cargue una imagen del mapa para poder dibujar zonas.'
      );

      return;
    }

    const target = event.target as HTMLElement;

    if (target.closest('.interactive-map__zone')) {
      return;
    }

    const point = this.getClampedPointFromMouseEvent(event);

    if (!point) {
      return;
    }

    this.isDrawing = true;
    this.drawStartX = point.x;
    this.drawStartY = point.y;

    this.drawingPreview.set({
      left: point.x,
      top: point.y,
      width: 0,
      height: 0
    });

    this.selectedZone.set(null);
  }

  /*
    Actualiza el rectángulo mientras se arrastra el mouse.
  */
  protected continueDrawing(event: MouseEvent): void {
    if (!this.isDrawing) {
      return;
    }

    const point = this.getClampedPointFromMouseEvent(event);

    if (!point) {
      return;
    }

    const left = Math.min(this.drawStartX, point.x);
    const top = Math.min(this.drawStartY, point.y);
    const width = Math.abs(point.x - this.drawStartX);
    const height = Math.abs(point.y - this.drawStartY);

    this.drawingPreview.set({
      left,
      top,
      width,
      height
    });
  }

  /*
    Finaliza el dibujo y convierte el rectángulo a porcentajes.
  */
  protected finishDrawing(): void {
    if (!this.isDrawing) {
      return;
    }

    this.isDrawing = false;

    const preview = this.drawingPreview();

    if (!preview) {
      return;
    }

    /*
      Evita guardar selecciones accidentales muy pequeñas.
    */
    if (preview.width < 18 || preview.height < 18) {
      this.drawingPreview.set(null);
      return;
    }

    const area = this.drawingArea();

    if (!area.width || !area.height) {
      this.drawingPreview.set(null);
      return;
    }

    const geometry: DraftZoneGeometry = {
      x: this.roundTwoDecimals(
        ((preview.left - area.left) / area.width) * 100
      ),
      y: this.roundTwoDecimals(
        ((preview.top - area.top) / area.height) * 100
      ),
      width: this.roundTwoDecimals(
        (preview.width / area.width) * 100
      ),
      height: this.roundTwoDecimals(
        (preview.height / area.height) * 100
      )
    };

    this.draftZoneGeometry.set(geometry);
    this.drawingPreview.set(null);

    this.draftZoneName.set('Nueva zona');
    this.draftZoneType.set('OTHER');
    this.draftZoneStatus.set('AVAILABLE');
    this.draftZoneCapacity.set('');
    this.draftZoneDescription.set('');
    this.draftZoneColor.set('#2563eb');
  }

  /*
    Cancela el dibujo si el mouse sale del mapa.
  */
  protected cancelDrawingIfNeeded(): void {
    if (!this.isDrawing) {
      return;
    }

    this.isDrawing = false;
    this.drawingPreview.set(null);
  }

  /*
    Guarda la zona dibujada en FastAPI.
  */
  protected saveDraftZone(): void {
    const geometry = this.draftZoneGeometry();
    const currentLayout = this.layout();

    if (!geometry || !currentLayout || this.processing()) {
      return;
    }

    const cleanName = this.draftZoneName().trim();

    if (cleanName.length < 2) {
      this.notificationService.warning(
        'Nombre requerido',
        'La zona debe tener un nombre de al menos 2 caracteres.'
      );

      return;
    }

    /*
      El input type="number" puede entregar string o number.
      Por eso se convierte explícitamente a string antes de trim().
    */
    const rawCapacity = this.draftZoneCapacity();
    const capacityText = String(rawCapacity ?? '').trim();

    let capacity: number | null = null;

    if (capacityText) {
      const numericCapacity = Number(capacityText);

      if (
        Number.isNaN(numericCapacity) ||
        numericCapacity <= 0
      ) {
        this.notificationService.warning(
          'Capacidad inválida',
          'La capacidad debe ser un número mayor a cero.'
        );

        return;
      }

      capacity = numericCapacity;
    }

    const payload: CreateMapZoneRequest = {
      name: cleanName,
      type: this.draftZoneType(),
      status: this.draftZoneStatus(),
      x: geometry.x,
      y: geometry.y,
      width: geometry.width,
      height: geometry.height,
      capacity,
      color: this.draftZoneColor(),
      description: this.draftZoneDescription().trim(),
      layoutId: currentLayout.id
    };

    this.processing.set(true);
    this.errorMessage.set(null);

    this.mapService.createZone(payload).subscribe({
      next: (createdZone) => {
        this.processing.set(false);
        this.selectedZone.set(createdZone);
        this.clearDraftZone();

        this.notificationService.success(
          'Zona creada',
          'La zona fue marcada y guardada correctamente.'
        );
      },
      error: () => {
        this.processing.set(false);

        this.notificationService.error(
          'Error',
          'No fue posible crear la zona del mapa.'
        );
      }
    });
  }

  /*
    Cancela la zona dibujada antes de guardarla.
  */
  protected cancelDraftZone(): void {
    if (this.processing()) {
      return;
    }

    this.clearDraftZone();
  }

  /*
    Selecciona una zona del mapa.
  */
  protected selectZone(zone: MapZone): void {
    if (this.hasDraftZone()) {
      return;
    }

    this.selectedZone.set(zone);
  }

  /*
    Limpia la zona seleccionada.
  */
  protected clearSelectedZone(): void {
    this.selectedZone.set(null);
  }

  /*
    Actualiza el estado de la zona seleccionada.
  */
  protected updateSelectedZoneStatus(status: MapZoneStatus): void {
    const zone = this.selectedZone();

    if (!zone || this.processing()) {
      return;
    }

    this.processing.set(true);

    this.mapService.updateZoneStatus(zone.id, status).subscribe({
      next: (updatedZone) => {
        this.processing.set(false);
        this.selectedZone.set(updatedZone);

        this.notificationService.success(
          'Zona actualizada',
          'El estado de la zona fue actualizado correctamente.'
        );
      },
      error: () => {
        this.processing.set(false);

        this.notificationService.error(
          'Error',
          'No fue posible actualizar el estado de la zona.'
        );
      }
    });
  }

  /*
    Libera una zona ocupada o reservada.
  */
  protected releaseSelectedZone(): void {
    const zone = this.selectedZone();

    if (!zone || this.processing()) {
      return;
    }

    this.processing.set(true);

    this.mapService.releaseZone(zone.id).subscribe({
      next: (updatedZone) => {
        this.processing.set(false);
        this.selectedZone.set(updatedZone);

        this.notificationService.success(
          'Zona liberada',
          'La zona fue liberada correctamente.'
        );
      },
      error: () => {
        this.processing.set(false);

        this.notificationService.error(
          'Error',
          'No fue posible liberar la zona.'
        );
      }
    });
  }

  /*
    Devuelve estilos dinámicos de posición para una zona.

    Las zonas se calculan en pixeles respecto al área real visible
    de la imagen, no respecto al canvas completo.
  */
  protected getZoneStyle(zone: MapZone): Record<string, string> {
    const area = this.drawingArea();

    return {
      left: `${area.left + (zone.x / 100) * area.width}px`,
      top: `${area.top + (zone.y / 100) * area.height}px`,
      width: `${(zone.width / 100) * area.width}px`,
      height: `${(zone.height / 100) * area.height}px`
    };
  }

  /*
    Devuelve estilos para el rectángulo que se dibuja mientras
    se arrastra el mouse.
  */
  protected getDrawingPreviewStyle(): Record<string, string> {
    const preview = this.drawingPreview();

    if (!preview) {
      return {};
    }

    return {
      left: `${preview.left}px`,
      top: `${preview.top}px`,
      width: `${preview.width}px`,
      height: `${preview.height}px`
    };
  }

  /*
    Devuelve estilos para la zona dibujada pendiente de guardar.
  */
  protected getDraftZoneStyle(): Record<string, string> {
    const geometry = this.draftZoneGeometry();
    const area = this.drawingArea();

    if (!geometry) {
      return {};
    }

    return {
      left: `${area.left + (geometry.x / 100) * area.width}px`,
      top: `${area.top + (geometry.y / 100) * area.height}px`,
      width: `${(geometry.width / 100) * area.width}px`,
      height: `${(geometry.height / 100) * area.height}px`
    };
  }

  /*
    Devuelve clase visual según el estado de la zona.
  */
  protected getZoneStatusClass(zone: MapZone): string {
    return `interactive-map__zone--${zone.status.toLowerCase()}`;
  }

  /*
    Devuelve texto legible del estado.
  */
  protected getStatusLabel(status: MapZoneStatus): string {
    const option = this.statusOptions.find((item) => {
      return item.value === status;
    });

    return option?.label ?? status;
  }

  /*
    Devuelve ícono legible del estado.
  */
  protected getStatusIcon(status: MapZoneStatus): string {
    const option = this.statusOptions.find((item) => {
      return item.value === status;
    });

    return option?.icon ?? 'info';
  }

  /*
    Indica si se debe mostrar el botón para liberar zona.
  */
  protected canReleaseZone(zone: MapZone): boolean {
    return (
      zone.status === APP_CONSTANTS.mapZoneStatus.occupied ||
      zone.status === APP_CONSTANTS.mapZoneStatus.reserved
    );
  }

  /*
    Verifica si existe total actual asociado a la zona.
  */
  protected hasCurrentOrderTotal(zone: MapZone): boolean {
    return (
      zone.currentOrderTotal !== undefined &&
      zone.currentOrderTotal !== null
    );
  }

  /*
    Devuelve URL completa de imagen base o null.
  */
  protected getBackgroundImageUrl(): string | null {
    return this.mapService.buildPublicAssetUrl(
      this.layout()?.backgroundImageUrl
    );
  }

  /*
    Recalcula el área real donde la imagen se muestra dentro del canvas.

    Como la imagen usa object-fit: contain, puede tener márgenes.
    Por eso las zonas deben calcularse sobre el área visible real
    de la imagen y no sobre todo el contenedor.
  */
  private recalculateDrawingArea(): void {
    const canvas = this.mapCanvasRef?.nativeElement;

    if (!canvas) {
      return;
    }

    const canvasWidth = canvas.clientWidth;
    const canvasHeight = canvas.clientHeight;

    const image = this.mapImageRef?.nativeElement;

    if (!image || !this.getBackgroundImageUrl()) {
      this.drawingArea.set({
        left: 0,
        top: 0,
        width: canvasWidth,
        height: canvasHeight
      });

      return;
    }

    const naturalWidth = image.naturalWidth || canvasWidth;
    const naturalHeight = image.naturalHeight || canvasHeight;

    const imageRatio = naturalWidth / naturalHeight;
    const canvasRatio = canvasWidth / canvasHeight;

    let renderedWidth = canvasWidth;
    let renderedHeight = canvasHeight;
    let left = 0;
    let top = 0;

    if (imageRatio > canvasRatio) {
      renderedWidth = canvasWidth;
      renderedHeight = canvasWidth / imageRatio;
      left = 0;
      top = (canvasHeight - renderedHeight) / 2;
    } else {
      renderedHeight = canvasHeight;
      renderedWidth = canvasHeight * imageRatio;
      top = 0;
      left = (canvasWidth - renderedWidth) / 2;
    }

    this.drawingArea.set({
      left,
      top,
      width: renderedWidth,
      height: renderedHeight
    });
  }

  /*
    Convierte un evento de mouse a coordenadas dentro del canvas
    y limita el punto al área real de la imagen.
  */
  private getClampedPointFromMouseEvent(
    event: MouseEvent
  ): { x: number; y: number } | null {
    const canvas = this.mapCanvasRef?.nativeElement;

    if (!canvas) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();
    const area = this.drawingArea();

    const rawX = event.clientX - rect.left;
    const rawY = event.clientY - rect.top;

    return {
      x: this.clamp(rawX, area.left, area.left + area.width),
      y: this.clamp(rawY, area.top, area.top + area.height)
    };
  }

  /*
    Limpia la zona dibujada y el formulario.
  */
  private clearDraftZone(): void {
    this.draftZoneGeometry.set(null);
    this.drawingPreview.set(null);
    this.draftZoneName.set('Nueva zona');
    this.draftZoneType.set('OTHER');
    this.draftZoneStatus.set('AVAILABLE');
    this.draftZoneCapacity.set('');
    this.draftZoneDescription.set('');
    this.draftZoneColor.set('#2563eb');
  }

  /*
    Limita un valor entre mínimo y máximo.
  */
  private clamp(
    value: number,
    min: number,
    max: number
  ): number {
    return Math.min(Math.max(value, min), max);
  }

  /*
    Redondea a 2 decimales para guardar porcentajes limpios.
  */
  private roundTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100;
  }
}