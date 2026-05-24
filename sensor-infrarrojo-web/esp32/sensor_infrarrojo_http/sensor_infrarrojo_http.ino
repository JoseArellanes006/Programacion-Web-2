#include <WiFi.h>
#include <HTTPClient.h>

/*
  ============================================================
  PROYECTO: ESP32 + FASTAPI + ANGULAR
  ============================================================

  Este programa se carga en una ESP32.

  Objetivo:
  - Conectar la ESP32 a una red WiFi.
  - Generar eventos digitales simulados.
  - Enviar esos eventos a un backend desarrollado con FastAPI.
  - Guardar los eventos en una bitácora del backend.
  - Permitir que Angular consulte y visualice la información.

  Flujo general:

      ESP32
        ↓ HTTP POST
      Backend FastAPI
        ↓
      Archivo JSON
        ↓ HTTP GET
      Frontend Angular

  ------------------------------------------------------------
  IMPORTANTE PARA LOS ALUMNOS
  ------------------------------------------------------------

  La ESP32 NO envía datos directamente a Angular.

  La ESP32 envía datos al backend usando una petición HTTP POST.
  Angular consulta los datos desde el backend usando peticiones HTTP GET.

  Esto representa una arquitectura básica cliente-servidor.
*/


/*
  ============================================================
  CONFIGURACIÓN DE WIFI
  ============================================================

  WIFI_SSID:
  Nombre de la red WiFi a la que se conectará la ESP32.

  WIFI_PASSWORD:
  Contraseña de la red WiFi.

  La ESP32 normalmente trabaja con redes WiFi de 2.4 GHz.
*/

#define WIFI_SSID "CONECTAEZNO_2.4"
#define WIFI_PASSWORD "TU_CONTRASENA_WIFI"


/*
  ============================================================
  URL DEL BACKEND
  ============================================================

  SERVER_URL es la dirección del endpoint de FastAPI al que la ESP32
  enviará los eventos.

  IMPORTANTE:
  No se debe usar localhost ni 127.0.0.1 en la ESP32.

  ¿Por qué?
  Porque para la ESP32, localhost significa la propia ESP32,
  no la computadora donde está corriendo FastAPI.

  Se debe usar la IP real de la computadora donde corre el backend.

  En este caso, la computadora tiene la IP:

      192.168.7.75

  Por eso la URL queda:

      http://192.168.7.75:8000/api/sensor/eventos

  Para que la ESP32 pueda conectarse, FastAPI debe ejecutarse así:

      uvicorn main:app --host 0.0.0.0 --port 8000 --reload
*/

#define SERVER_URL "http://192.168.7.75:8000/api/sensor/eventos"


/*
  ============================================================
  IDENTIFICACIÓN DE LA ESP32
  ============================================================

  Este nombre permite identificar qué dispositivo envió el dato.

  Si se usan varias ESP32, cada una puede tener un nombre diferente:

      ESP32-ENTRADA
      ESP32-SALIDA
      ESP32-LABORATORIO
      ESP32-IR-01
*/

#define UNIDAD_ESP32 "ESP32-PRUEBA"


/*
  ============================================================
  NOMBRE DEL SENSOR O FUENTE DE DATOS
  ============================================================

  En este programa los datos se generan desde la ESP32 de forma simulada.

  Por eso se usa el nombre:

      SIMULADOR-DIGITAL

  Si después se conecta un sensor físico, este valor puede cambiarse por:

      E18-D80NK
      SENSOR-IR
      SENSOR-ENTRADA
*/

#define NOMBRE_SENSOR "SIMULADOR-DIGITAL"


/*
  ============================================================
  INTERVALO DE ENVÍO
  ============================================================

  INTERVALO_ENVIO define cada cuánto tiempo la ESP32 enviará un evento
  al backend.

  En este caso:

      5000 milisegundos = 5 segundos

  Cada 5 segundos se enviará un nuevo registro.
*/

const unsigned long INTERVALO_ENVIO = 5000;


/*
  ============================================================
  VARIABLES GLOBALES
  ============================================================

  ultimoEnvio:
  Guarda el tiempo en que se hizo el último envío.

  contador:
  Sirve para alternar los eventos enviados.

  Cuando contador es par:
      detectado = true
      estado = 0

  Cuando contador es impar:
      detectado = false
      estado = 1
*/

unsigned long ultimoEnvio = 0;
int contador = 0;


/*
  ============================================================
  FUNCIÓN: conectarWiFi()
  ============================================================

  Esta función conecta la ESP32 a la red WiFi configurada.

  Mientras intenta conectarse, imprime puntos en el Monitor Serial.

  Cuando la conexión es exitosa, muestra:

  - IP asignada a la ESP32.
  - Puerta de enlace.
  - Máscara de red.

  Esta información ayuda a verificar que la ESP32 está dentro de la red.
*/

void conectarWiFi() {
  Serial.println();
  Serial.println("========================================");
  Serial.println("Conectando a WiFi");
  Serial.println("========================================");

  Serial.print("SSID: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi conectado correctamente.");

  Serial.print("IP de la ESP32: ");
  Serial.println(WiFi.localIP());

  Serial.print("Gateway: ");
  Serial.println(WiFi.gatewayIP());

  Serial.print("Mascara: ");
  Serial.println(WiFi.subnetMask());
}


/*
  ============================================================
  FUNCIÓN: crearJsonEvento()
  ============================================================

  Esta función construye el JSON que será enviado al backend.

  El backend espera recibir datos con esta estructura:

  {
    "unidad": "ESP32-PRUEBA",
    "sensor": "SIMULADOR-DIGITAL",
    "estado": 0,
    "detectado": true
  }

  Campos:

  unidad:
  Identifica la ESP32 que envía el dato.

  sensor:
  Identifica el sensor o fuente de datos.

  estado:
  Representa un valor digital:
  - 0 cuando hay detección.
  - 1 cuando no hay detección.

  detectado:
  Representa el estado lógico:
  - true si hay detección.
  - false si no hay detección.
*/

String crearJsonEvento(int estado, bool detectado) {
  String json = "{";
  json += "\"unidad\":\"" + String(UNIDAD_ESP32) + "\",";
  json += "\"sensor\":\"" + String(NOMBRE_SENSOR) + "\",";
  json += "\"estado\":" + String(estado) + ",";
  json += "\"detectado\":" + String(detectado ? "true" : "false");
  json += "}";

  return json;
}


/*
  ============================================================
  FUNCIÓN: enviarEvento()
  ============================================================

  Esta función envía un evento al backend mediante HTTP POST.

  Proceso:

  1. Verifica que la ESP32 siga conectada a WiFi.
  2. Crea una conexión HTTP hacia FastAPI.
  3. Indica que el contenido enviado es JSON.
  4. Envía el JSON al endpoint del backend.
  5. Imprime el código de respuesta.
  6. Imprime la respuesta del backend.

  Si todo está correcto, el backend debe responder con código HTTP 200.

  En la consola de FastAPI debe aparecer:

      POST /api/sensor/eventos HTTP/1.1" 200 OK
*/

void enviarEvento(int estado, bool detectado) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println();
    Serial.println("WiFi desconectado. Intentando reconectar...");
    WiFi.reconnect();
    return;
  }

  HTTPClient http;

  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(5000);

  String json = crearJsonEvento(estado, detectado);

  Serial.println();
  Serial.println("========================================");
  Serial.println("Enviando evento al backend");
  Serial.println("========================================");

  Serial.print("URL: ");
  Serial.println(SERVER_URL);

  Serial.print("JSON: ");
  Serial.println(json);

  int codigoRespuesta = http.POST(json);

  Serial.print("Codigo HTTP: ");
  Serial.println(codigoRespuesta);

  if (codigoRespuesta > 0) {
    String respuesta = http.getString();

    Serial.println("Respuesta del backend:");
    Serial.println(respuesta);

    if (codigoRespuesta == 200) {
      Serial.println("Evento registrado correctamente.");
    } else {
      Serial.println("El backend respondio, pero con un codigo diferente de 200.");
    }
  } else {
    Serial.println("No se pudo conectar con el backend.");
    Serial.println("Revisar:");
    Serial.println("- IP del backend.");
    Serial.println("- Puerto 8000.");
    Serial.println("- Firewall de Windows.");
    Serial.println("- Que FastAPI este ejecutandose con --host 0.0.0.0.");
    Serial.println("- Que la ESP32 y la computadora esten en la misma red.");
  }

  http.end();
}


/*
  ============================================================
  FUNCIÓN: generarYEnviarEvento()
  ============================================================

  Esta función genera un evento digital alternado.

  La idea es simular el comportamiento de un sensor:

  Primer envío:
      estado = 0
      detectado = true

  Segundo envío:
      estado = 1
      detectado = false

  Tercer envío:
      estado = 0
      detectado = true

  Y así sucesivamente.

  Esto permite probar el flujo completo del sistema sin depender
  de un sensor físico.
*/

void generarYEnviarEvento() {
  bool detectado = contador % 2 == 0;
  int estado = detectado ? 0 : 1;

  enviarEvento(estado, detectado);

  contador++;
}


/*
  ============================================================
  FUNCIÓN: setup()
  ============================================================

  setup() se ejecuta una sola vez al encender o reiniciar la ESP32.

  Aquí se realiza:

  1. Inicio del Monitor Serial.
  2. Conexión a WiFi.
  3. Primer envío de datos al backend.
*/

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println();
  Serial.println("========================================");
  Serial.println("Sistema ESP32 + FastAPI iniciado");
  Serial.println("========================================");

  conectarWiFi();

  /*
    Se envía un primer evento inmediatamente al iniciar.

    Esto permite verificar rápido si el backend está recibiendo datos.
  */
  generarYEnviarEvento();
}


/*
  ============================================================
  FUNCIÓN: loop()
  ============================================================

  loop() se ejecuta continuamente mientras la ESP32 esté encendida.

  En este programa:

  - Se revisa el tiempo transcurrido con millis().
  - Cada 5 segundos se genera un nuevo evento.
  - El evento se envía al backend por HTTP POST.

  Se usa millis() en lugar de delay() para controlar el tiempo
  sin detener innecesariamente el flujo del programa.
*/

void loop() {
  unsigned long ahora = millis();

  if (ahora - ultimoEnvio >= INTERVALO_ENVIO) {
    ultimoEnvio = ahora;
    generarYEnviarEvento();
  }
}