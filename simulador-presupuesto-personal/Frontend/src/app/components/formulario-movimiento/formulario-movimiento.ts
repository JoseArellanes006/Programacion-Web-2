import { Component, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TipoMovimiento } from '../../models/movimiento.model';

/*
  FormularioMovimientoComponent

  Este componente representa el formulario encargado de capturar
  un movimiento financiero dentro del presupuesto personal.

  Un movimiento puede ser de dos tipos:
  - ingreso: dinero que entra al presupuesto;
  - gasto: dinero que sale del presupuesto.

  La responsabilidad de este componente es únicamente capturar,
  validar y enviar los datos hacia el componente padre.

  Importante:
  Este componente NO guarda información en LocalStorage.
  Este componente NO calcula el resumen del presupuesto.
  Este componente NO modifica directamente la lista general.

  Su función es emitir un evento con los datos capturados para que
  la página principal decida qué hacer con ellos.
*/

@Component({
  selector: 'app-formulario-movimiento',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="card">
      <h2>Registrar movimiento</h2>

      <p>
        Agrega ingresos o gastos para construir tu presupuesto personal.
      </p>

      <label>Tipo</label>
      <select [ngModel]="tipo()" (ngModelChange)="tipo.set($event)">
        <option value="ingreso">Ingreso</option>
        <option value="gasto">Gasto</option>
      </select>

      <label>Concepto</label>
      <input
        type="text"
        [ngModel]="concepto()"
        (ngModelChange)="concepto.set($event)"
        placeholder="Ejemplo: salario, renta, comida"
      />

      <label>Categoría</label>
      <input
        type="text"
        [ngModel]="categoria()"
        (ngModelChange)="categoria.set($event)"
        placeholder="Ejemplo: trabajo, vivienda, transporte"
      />

      <label>Monto</label>
      <input
        type="number"
        [ngModel]="monto()"
        (ngModelChange)="monto.set($event)"
        min="0"
        placeholder="Ejemplo: 1500"
      />

      <button (click)="registrarMovimiento()">
        Agregar movimiento
      </button>

      @if (mensajeError()) {
        <p class="error">{{ mensajeError() }}</p>
      }
    </section>
  `,
  styles: `
    .card {
      padding: 24px;
      background: #ffffff;
      border-radius: 16px;
      border: 1px solid #d1d5db;
    }

    h2 {
      margin-top: 0;
      color: #111827;
    }

    p {
      color: #4b5563;
    }

    label {
      display: block;
      margin-top: 16px;
      margin-bottom: 6px;
      font-weight: 700;
    }

    input,
    select {
      width: 100%;
      padding: 12px;
      border-radius: 10px;
      border: 1px solid #9ca3af;
      font-size: 16px;
    }

    button {
      margin-top: 18px;
      padding: 12px 18px;
      border: none;
      border-radius: 10px;
      background: #16a34a;
      color: white;
      font-weight: 700;
      cursor: pointer;
    }

    .error {
      margin-top: 14px;
      padding: 12px;
      background: #fee2e2;
      color: #991b1b;
      border-radius: 10px;
    }
  `
})
export class FormularioMovimientoComponent {
  /*
    Signal que almacena el tipo de movimiento seleccionado.

    El valor inicial es "ingreso", porque normalmente el formulario
    debe iniciar con una opción válida desde el principio.

    Este signal se actualiza cuando el usuario cambia el select.
  */
  tipo = signal<TipoMovimiento>('ingreso');

  /*
    Signal que almacena el concepto del movimiento.

    Ejemplos:
    - salario;
    - renta;
    - comida;
    - transporte.

    Se valida que no esté vacío antes de emitir el movimiento.
  */
  concepto = signal('');

  /*
    Signal que almacena la categoría del movimiento.

    La categoría permite clasificar los ingresos o gastos.
    Esto puede ser útil después para análisis o agrupaciones.
  */
  categoria = signal('');

  /*
    Signal que almacena el monto capturado.

    Se inicializa en 0 y se valida que sea mayor que cero.
    No se permiten movimientos con monto negativo o igual a cero.
  */
  monto = signal<number>(0);

  /*
    Signal usado para mostrar mensajes de validación.

    Si el usuario intenta registrar un movimiento incompleto,
    este signal almacena el texto del error que se mostrará en pantalla.
  */
  mensajeError = signal('');

  /*
    Evento de salida del componente.

    output permite que este componente se comunique con su componente padre.

    Cuando el formulario es válido, se emite un objeto con:
    - tipo;
    - concepto;
    - categoría;
    - monto.

    La página principal recibe este evento y lo envía al servicio
    correspondiente para guardarlo.
  */
  agregarMovimiento = output<{
    tipo: TipoMovimiento;
    concepto: string;
    categoria: string;
    monto: number;
  }>();

  /*
    Método principal del formulario.

    Se ejecuta cuando el usuario presiona el botón
    "Agregar movimiento".

    Su flujo es:
    1. Validar que el concepto no esté vacío.
    2. Validar que la categoría no esté vacía.
    3. Validar que el monto sea mayor que cero.
    4. Emitir el movimiento hacia el componente padre.
    5. Limpiar el formulario.
  */
  registrarMovimiento(): void {
    /*
      Validación del concepto.

      trim() elimina espacios al inicio y al final.
      Esto evita aceptar entradas como "   ".
    */
    if (!this.concepto().trim()) {
      this.mensajeError.set('El concepto es obligatorio.');
      return;
    }

    /*
      Validación de la categoría.

      Al igual que el concepto, no debe permitirse una categoría vacía.
    */
    if (!this.categoria().trim()) {
      this.mensajeError.set('La categoría es obligatoria.');
      return;
    }

    /*
      Validación del monto.

      El monto debe representar una cantidad real de dinero,
      por eso debe ser mayor que cero.
    */
    if (this.monto() <= 0) {
      this.mensajeError.set('El monto debe ser mayor que cero.');
      return;
    }

    /*
      Emisión del movimiento.

      En este punto el formulario ya es válido, por lo que se envía
      la información al componente padre.

      Number(this.monto()) asegura que el valor se trate como número,
      aunque el input del navegador pueda entregarlo como texto.
    */
    this.agregarMovimiento.emit({
      tipo: this.tipo(),
      concepto: this.concepto(),
      categoria: this.categoria(),
      monto: Number(this.monto())
    });

    /*
      Limpieza del formulario.

      Después de registrar correctamente el movimiento:
      - se limpia el concepto;
      - se limpia la categoría;
      - se reinicia el monto;
      - se elimina cualquier mensaje de error previo.
    */
    this.concepto.set('');
    this.categoria.set('');
    this.monto.set(0);
    this.mensajeError.set('');
  }
}