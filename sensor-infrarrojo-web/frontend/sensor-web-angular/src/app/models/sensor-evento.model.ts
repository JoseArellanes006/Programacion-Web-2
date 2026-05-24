/*
  ============================================================
  MODELOS DEL FRONTEND
  ============================================================

  En Angular, los modelos permiten definir la estructura de los datos
  que se reciben desde el backend.

  Esto ayuda a:

  - Tener mejor organización.
  - Evitar errores de nombres.
  - Saber qué campos tiene cada objeto.
  - Mejorar el autocompletado de TypeScript.

  Estos modelos deben coincidir con las respuestas enviadas por FastAPI.
*/


/*
  ============================================================
  INTERFACE: SensorEvento
  ============================================================

  Representa un evento ya registrado en la bitácora.

  Este modelo coincide con lo que devuelve el backend en:

  GET /api/sensor/eventos
*/

export interface SensorEvento {
  id: number;
  unidad: string;
  sensor: string;
  estado: number;
  detectado: boolean;
  fecha: string;
  hora: string;
  fecha_hora: string;
}


/*
  ============================================================
  INTERFACE: SensorEventoEntrada
  ============================================================

  Representa la estructura de un evento antes de ser guardado.

  Este modelo sería útil si Angular también enviara eventos al backend.

  En este proyecto, quien envía eventos es la ESP32, no Angular.
  Aun así se deja definido porque ayuda a entender la estructura
  de entrada del backend.
*/

export interface SensorEventoEntrada {
  unidad: string;
  sensor: string;
  estado: number;
  detectado: boolean;
}


/*
  ============================================================
  INTERFACE: SensorResumen
  ============================================================

  Representa los datos de resumen que devuelve el backend.

  Se usa para mostrar las tarjetas superiores del dashboard.
*/

export interface SensorResumen {
  total_eventos: number;
  total_detectados: number;
  total_no_detectados: number;
}


/*
  ============================================================
  INTERFACE: GraficaDatos
  ============================================================

  Representa la estructura general que necesita Chart.js.

  labels:
  Etiquetas del eje X o categorías.

  data:
  Valores numéricos que se van a graficar.

  Ejemplo para gráfica de línea:

  labels = ["10:30", "10:31", "10:32"]
  data   = [2, 5, 1]
*/

export interface GraficaDatos {
  labels: string[];
  data: number[];
}


/*
  ============================================================
  INTERFACE: SensorGraficas
  ============================================================

  Representa todas las gráficas que devuelve el backend.

  linea_detecciones_por_minuto:
  Datos para la gráfica de línea.

  barras_estado_sensor:
  Datos para la gráfica de barras.

  dona_estado_sensor:
  Datos para la gráfica circular tipo dona.
*/

export interface SensorGraficas {
  linea_detecciones_por_minuto: GraficaDatos;
  barras_estado_sensor: GraficaDatos;
  dona_estado_sensor: GraficaDatos;
}