// Component permite definir un componente Angular.
// signal permite crear estado reactivo moderno.
// computed permite crear valores derivados que se recalculan automáticamente.
import { Component, computed, signal } from '@angular/core';

// FormsModule permite usar [(ngModel)] en los campos del formulario.
import { FormsModule } from '@angular/forms';

// Importaciones de Angular Material.
// Cada módulo habilita ciertos componentes visuales dentro del HTML.
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';

// Esta interfaz define la forma que debe tener cada tarea.
// Gracias a esto, TypeScript puede validar que todos los objetos tarea
// tengan la misma estructura.
interface Tarea {
  id: number;
  titulo: string;
  materia: string;
  prioridad: 'Alta' | 'Media' | 'Baja';
  completada: boolean;
}

// Este tipo restringe los filtros posibles.
// Así evitamos errores por escribir cadenas no válidas.
type FiltroEstado = 'todas' | 'pendientes' | 'completadas';

@Component({
  // selector indica el nombre de la etiqueta HTML del componente.
  selector: 'app-root',

  // standalone: true significa que este componente no depende
  // de un NgModule clásico.
  standalone: true,

  // imports registra todos los módulos que este componente necesita
  // para poder usar sus etiquetas y directivas en el HTML.
  imports: [
    FormsModule,
    MatToolbarModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatChipsModule,
    MatListModule,
    MatCheckboxModule,
    MatDividerModule,
    MatIconModule
  ],

  // templateUrl enlaza este componente con su vista HTML.
  templateUrl: './app.html',

  // styleUrl enlaza este componente con sus estilos locales SCSS.
  styleUrl: './app.scss'
})
export class App {

  // Este texto se mostrará en la barra superior de la aplicación.
  tituloApp = 'Gestor de tareas con Angular Material';

  // Variables del formulario.
  // Aquí se almacenan temporalmente los datos que el usuario captura.
  nuevoTitulo = '';
  nuevaMateria = '';
  nuevaPrioridad: 'Alta' | 'Media' | 'Baja' = 'Media';

  // Signal que guarda el filtro actualmente seleccionado.
  // Comienza con "todas", por eso inicialmente se muestran todas las tareas.
  filtroActual = signal<FiltroEstado>('todas');

  // Este signal almacena la lista completa de tareas.
  // Se inicializa con datos de ejemplo para que la interfaz no aparezca vacía.
  tareas = signal<Tarea[]>([
    {
      id: 1,
      titulo: 'Estudiar Angular Material',
      materia: 'Programación Web II',
      prioridad: 'Alta',
      completada: false
    },
    {
      id: 2,
      titulo: 'Practicar selectores CSS',
      materia: 'Programación Web I',
      prioridad: 'Media',
      completada: true
    },
    {
      id: 3,
      titulo: 'Revisar signals en Angular',
      materia: 'Programación Web II',
      prioridad: 'Baja',
      completada: false
    }
  ]);

  // Este contador interno sirve para asignar IDs nuevos y únicos
  // a las tareas que se vayan agregando.
  private siguienteId = 4;

  // computed calcula automáticamente el total de tareas.
  // Cada vez que cambie this.tareas(), este valor se recalculará.
  totalTareas = computed(() => this.tareas().length);

  // Este computed cuenta cuántas tareas NO están completadas.
  totalPendientes = computed(() =>
    this.tareas().filter(t => !t.completada).length
  );

  // Este computed cuenta cuántas tareas sí están completadas.
  totalCompletadas = computed(() =>
    this.tareas().filter(t => t.completada).length
  );

  // Este computed genera la lista visible según el filtro actual.
  // No altera la lista original; solo devuelve la versión que debe verse.
  tareasFiltradas = computed(() => {
    // Guardamos el filtro activo en una constante para reutilizarlo.
    const filtro = this.filtroActual();

    // Guardamos la lista actual completa de tareas.
    const lista = this.tareas();

    // Si el filtro es "pendientes", devolvemos solo las no completadas.
    if (filtro === 'pendientes') {
      return lista.filter(t => !t.completada);
    }

    // Si el filtro es "completadas", devolvemos solo las completadas.
    if (filtro === 'completadas') {
      return lista.filter(t => t.completada);
    }

    // Si el filtro es "todas", devolvemos la lista completa.
    return lista;
  });

  // agregarTarea crea una nueva tarea usando los datos capturados en el formulario.
  agregarTarea(): void {

    // trim() elimina espacios sobrantes al inicio y al final.
    const titulo = this.nuevoTitulo.trim();
    const materia = this.nuevaMateria.trim();

    // Validación básica:
    // si el título o la materia están vacíos, se detiene el método.
    if (!titulo || !materia) {
      return;
    }

    // Creamos el nuevo objeto siguiendo la estructura de la interfaz Tarea.
    const nuevaTarea: Tarea = {
      id: this.siguienteId++,
      titulo,
      materia,
      prioridad: this.nuevaPrioridad,
      completada: false
    };

    // update modifica el valor del signal tareas.
    // En este caso colocamos la nueva tarea al inicio del arreglo.
    this.tareas.update(lista => [nuevaTarea, ...lista]);

    // Después de agregar la tarea, limpiamos los campos del formulario.
    this.nuevoTitulo = '';
    this.nuevaMateria = '';
    this.nuevaPrioridad = 'Media';
  }

  // toggleTarea cambia el estado de una tarea específica.
  // Si estaba pendiente pasa a completada.
  // Si estaba completada pasa a pendiente.
  toggleTarea(id: number): void {
    this.tareas.update(lista =>
      lista.map(t =>
        t.id === id
          ? { ...t, completada: !t.completada }
          : t
      )
    );
  }

  // eliminarTarea elimina una tarea según su identificador.
  eliminarTarea(id: number): void {
    this.tareas.update(lista =>
      lista.filter(t => t.id !== id)
    );
  }

  // cambiarFiltro actualiza el signal filtroActual.
  // Esto provoca que tareasFiltradas() se recalcule automáticamente.
  cambiarFiltro(filtro: FiltroEstado): void {
    this.filtroActual.set(filtro);
  }

  // obtenerClasePrioridad devuelve una clase CSS distinta según la prioridad.
  // Así el chip visual puede cambiar de color en el HTML.
  obtenerClasePrioridad(prioridad: Tarea['prioridad']): string {
    switch (prioridad) {
      case 'Alta':
        return 'chip-alta';

      case 'Media':
        return 'chip-media';

      case 'Baja':
        return 'chip-baja';

      default:
        return '';
    }
  }
}