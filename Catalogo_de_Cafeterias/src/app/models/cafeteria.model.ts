// Este archivo define la estructura de datos que representa una cafetería.
// La interfaz permite que TypeScript valide que los datos recibidos del backend
// tengan la forma esperada dentro de toda la aplicación.

export interface Cafeteria {
  id: number;
  nombre: string;
  descripcion: string;
  ubicacion: string;
  categoria: string;
  horario: string;
  imagen: string;
  calificacion: number;
}