/*
  ============================================================
  SERVICIO DEL SENSOR
  ============================================================

  Este servicio centraliza la comunicación entre Angular y FastAPI.

  En Angular, un servicio se usa para colocar lógica que será compartida
  por uno o varios componentes.

  En este caso, el servicio se encarga de hacer peticiones HTTP al backend.

  El componente no necesita conocer todos los detalles de las URLs.
  El componente solamente llama métodos como:

  - obtenerEventos()
  - obtenerResumen()
  - obtenerGraficas()
  - limpiarBitacora()

  Esto hace que el código sea más limpio y fácil de mantener.

  ------------------------------------------------------------
  FLUJO GENERAL
  ------------------------------------------------------------

  ESP32
    ↓
  Backend FastAPI
    ↓
  Angular SensorService
    ↓
  DashboardSensorComponent
*/


import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import {
  SensorEvento,
  SensorResumen,
  SensorGraficas,
  GraficaDatos
} from '../models/sensor-evento.model';


/*
  ============================================================
  DECORADOR @Injectable
  ============================================================

  providedIn: 'root'

  Significa que Angular creará una única instancia del servicio
  disponible para toda la aplicación.
*/

@Injectable({
  providedIn: 'root'
})
export class SensorService {

  /*
    ============================================================
    INYECCIÓN DE HTTPCLIENT
    ============================================================

    HttpClient permite hacer peticiones HTTP desde Angular.

    Se usa para consumir los endpoints del backend FastAPI.

    Para que funcione correctamente, debe existir provideHttpClient()
    en app.config.ts.
  */

  private http = inject(HttpClient);


  /*
    ============================================================
    URL BASE DEL BACKEND
    ============================================================

    Esta URL apunta al backend FastAPI.

    En este proyecto, FastAPI se está ejecutando en:

        http://127.0.0.1:8000

    Y todas las rutas del sensor empiezan con:

        /api/sensor

    Por eso la URL base queda:

        http://127.0.0.1:8000/api/sensor

    ------------------------------------------------------------
    ¿Por qué usar 127.0.0.1 en lugar de localhost?
    ------------------------------------------------------------

    Ambos pueden funcionar.

    Sin embargo, 127.0.0.1 apunta directamente a la computadora local
    usando IPv4, y evita algunos problemas de resolución que a veces
    aparecen con localhost.

    Esta URL funciona cuando:

    - Angular corre en la misma computadora.
    - FastAPI corre en la misma computadora.
    - FastAPI está levantado en el puerto 8000.

    Ejemplo para levantar FastAPI:

        uvicorn main:app --reload

    Si después abres Angular desde otro dispositivo de la red,
    entonces deberás cambiar 127.0.0.1 por la IP real de la computadora.

    Ejemplo:

        http://192.168.1.70:8000/api/sensor
  */

  private apiUrl = 'http://127.0.0.1:8000/api/sensor';


  /*
    ============================================================
    MÉTODO: obtenerEventos()
    ============================================================

    Consume el endpoint:

        GET /api/sensor/eventos

    URL completa:

        http://127.0.0.1:8000/api/sensor/eventos

    Este endpoint devuelve la bitácora completa.

    El tipo esperado es:

        SensorEvento[]

    Es decir, un arreglo de eventos.
  */

  obtenerEventos() {
    return this.http.get<SensorEvento[]>(`${this.apiUrl}/eventos`);
  }


  /*
    ============================================================
    MÉTODO: obtenerResumen()
    ============================================================

    Consume el endpoint:

        GET /api/sensor/resumen

    URL completa:

        http://127.0.0.1:8000/api/sensor/resumen

    Devuelve los totales generales:

    - total_eventos
    - total_detectados
    - total_no_detectados

    Estos datos se muestran en las tarjetas superiores del dashboard.
  */

  obtenerResumen() {
    return this.http.get<SensorResumen>(`${this.apiUrl}/resumen`);
  }


  /*
    ============================================================
    MÉTODO: obtenerDeteccionesPorMinuto()
    ============================================================

    Consume el endpoint:

        GET /api/sensor/grafica/detecciones-por-minuto

    URL completa:

        http://127.0.0.1:8000/api/sensor/grafica/detecciones-por-minuto

    Devuelve únicamente los datos para la gráfica de línea.

    Esta gráfica muestra cuántas detecciones ocurrieron durante cada minuto.

    Ejemplo de respuesta esperada:

    {
      "labels": ["10:30", "10:31", "10:32"],
      "data": [2, 5, 1]
    }

    Este método se deja disponible aunque el dashboard principal use
    obtenerGraficas(), porque puede servir para ejercicios individuales
    con los alumnos.
  */

  obtenerDeteccionesPorMinuto() {
    return this.http.get<GraficaDatos>(`${this.apiUrl}/grafica/detecciones-por-minuto`);
  }


  /*
    ============================================================
    MÉTODO: obtenerGraficas()
    ============================================================

    Consume el endpoint:

        GET /api/sensor/graficas

    URL completa:

        http://127.0.0.1:8000/api/sensor/graficas

    Devuelve todos los datos necesarios para:

    - Gráfica de línea.
    - Gráfica de barras.
    - Gráfica de dona.

    El backend ya entrega los datos procesados para que Angular no tenga
    que hacer tantos cálculos.
  */

  obtenerGraficas() {
    return this.http.get<SensorGraficas>(`${this.apiUrl}/graficas`);
  }


  /*
    ============================================================
    MÉTODO: limpiarBitacora()
    ============================================================

    Consume el endpoint:

        DELETE /api/sensor/eventos

    URL completa:

        http://127.0.0.1:8000/api/sensor/eventos

    Este endpoint elimina todos los registros del archivo JSON.

    Se usa desde el botón "Limpiar bitácora".
  */

  limpiarBitacora() {
    return this.http.delete<{ mensaje: string }>(`${this.apiUrl}/eventos`);
  }
}