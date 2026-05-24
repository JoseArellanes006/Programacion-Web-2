/*
  Modelo para tarjetas KPI.

  Los KPI's son indicadores clave que aparecerán principalmente
  en el dashboard.

  Este modelo está alineado con el backend FastAPI.

  El backend devuelve una lista de objetos con esta forma:
  - title
  - value
  - subtitle
  - icon
  - tone

  También se conservan algunas propiedades anteriores:
  - description
  - variant
  - trend
  - changePercentage
  - change

  Esto permite compatibilidad con componentes o datos previos.
*/

/*
  Tendencia visual de un KPI.

  Sirve para indicar si el indicador subió, bajó o se mantuvo estable.
*/
export type KpiTrend = 'up' | 'down' | 'neutral';

/*
  Tipo visual del KPI usado por versiones anteriores del frontend.
*/
export type KpiVariant =
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral';

/*
  Tono visual del KPI recibido desde backend.

  Es equivalente a variant, pero el backend usa el nombre tone.
*/
export type KpiTone =
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral';

/*
  Modelo principal de una tarjeta KPI.
*/
export interface Kpi {
  /*
    Título del indicador.

    Ejemplo:
    "Ventas totales"
  */
  title: string;

  /*
    Valor principal del indicador.

    Puede ser número o texto porque algunos KPI's pueden mostrar:
    - 120
    - "$4,500.00"
    - "Café americano"
  */
  value: string | number;

  /*
    Texto secundario recibido desde el backend.

    Ejemplo:
    "Ingresos registrados"
  */
  subtitle?: string | null;

  /*
    Descripción secundaria usada por versiones anteriores.

    Se conserva para compatibilidad.
  */
  description?: string | null;

  /*
    Nombre del ícono de Angular Material.

    Ejemplos:
    - payments
    - receipt_long
    - trending_up
    - inventory_2
    - group
    - pending_actions
  */
  icon?: string | null;

  /*
    Tono visual recibido desde backend.
  */
  tone?: KpiTone | string | null;

  /*
    Variante visual usada por versiones anteriores.

    Se conserva para compatibilidad.
  */
  variant?: KpiVariant | string | null;

  /*
    Tendencia del KPI.

    Se conserva para compatibilidad con la versión anterior.
  */
  trend?: KpiTrend | null;

  /*
    Porcentaje opcional de cambio.

    Ejemplo:
    15 indica +15%
    -8 indica -8%
  */
  changePercentage?: number | null;

  /*
    Texto alternativo de cambio.

    Se conserva por compatibilidad si después quieres mandar algo como:
    "+12% vs mes anterior"
  */
  change?: string | null;
}