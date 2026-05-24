/*
  Utilidades de validación.

  Este archivo contiene funciones puras para validar datos comunes
  del sistema.

  Se podrán usar en formularios de:
  - login
  - registro
  - productos
  - usuarios
  - reportes
  - carga de imágenes
*/

import { APP_CONSTANTS } from '../../core/config/app.constants';

/*
  Resultado estándar de validación.

  isValid:
  Indica si el valor evaluado es válido.

  errors:
  Lista de mensajes de error encontrados.
*/
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/*
  Valida si un texto tiene formato básico de correo electrónico.
*/
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];

  /*
    Expresión regular simple para validar correo.
    No intenta cubrir todos los casos posibles del estándar,
    pero es suficiente para validación de formularios comunes.
  */
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || email.trim().length === 0) {
    errors.push('El correo electrónico es obligatorio.');
  } else if (!emailPattern.test(email)) {
    errors.push('El correo electrónico no tiene un formato válido.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/*
  Valida una contraseña usando las reglas definidas en APP_CONSTANTS.
*/
export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];
  const rules = APP_CONSTANTS.passwordRules;

  if (!password || password.length === 0) {
    errors.push('La contraseña es obligatoria.');
  }

  if (password.length < rules.minLength) {
    errors.push(`La contraseña debe tener al menos ${rules.minLength} caracteres.`);
  }

  if (rules.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('La contraseña debe incluir al menos una letra mayúscula.');
  }

  if (rules.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('La contraseña debe incluir al menos una letra minúscula.');
  }

  if (rules.requireNumber && !/[0-9]/.test(password)) {
    errors.push('La contraseña debe incluir al menos un número.');
  }

  if (rules.requireSpecialCharacter && !/[^A-Za-z0-9]/.test(password)) {
    errors.push('La contraseña debe incluir al menos un carácter especial.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/*
  Valida que dos contraseñas coincidan.
*/
export function validatePasswordMatch(
  password: string,
  confirmPassword: string
): ValidationResult {
  const errors: string[] = [];

  if (password !== confirmPassword) {
    errors.push('Las contraseñas no coinciden.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/*
  Valida si un archivo corresponde a una imagen permitida.
*/
export function validateImageFile(file: File | null): ValidationResult {
  const errors: string[] = [];

  if (!file) {
    errors.push('Debe seleccionar una imagen.');

    return {
      isValid: false,
      errors
    };
  }

  /*
    APP_CONSTANTS.images.allowedTypes está definido con "as const".
    Eso hace que TypeScript lo trate como una lista estricta de literales:
    "image/jpeg" | "image/png" | "image/webp".

    Sin embargo, file.type viene del navegador y su tipo es string.
    Por eso aquí convertimos allowedTypes a readonly string[] para poder
    comparar correctamente contra file.type sin error de tipado.
  */
  const allowedImageTypes: readonly string[] = APP_CONSTANTS.images.allowedTypes;

  /*
    Validación de tipo MIME.

    file.type puede devolver:
    - image/jpeg
    - image/png
    - image/webp
    - image/gif
    - application/pdf
    - etc.

    Solo se aceptan los definidos en APP_CONSTANTS.
  */
  if (!allowedImageTypes.includes(file.type)) {
    errors.push('El formato de imagen no es válido. Use JPG, PNG o WEBP.');
  }

  /*
    Convierte el tamaño del archivo de bytes a megabytes.
  */
  const sizeInMb = file.size / (1024 * 1024);

  /*
    Valida el tamaño máximo permitido.
  */
  if (sizeInMb > APP_CONSTANTS.images.maxSizeMb) {
    errors.push(`La imagen no debe superar ${APP_CONSTANTS.images.maxSizeMb} MB.`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/*
  Valida que un número sea mayor o igual que cero.

  Puede usarse para:
  - precio
  - stock
  - cantidades
  - totales
*/
export function validateNonNegativeNumber(
  value: number,
  fieldName: string = 'El valor'
): ValidationResult {
  const errors: string[] = [];

  if (value === null || value === undefined || Number.isNaN(value)) {
    errors.push(`${fieldName} debe ser un número válido.`);
  } else if (value < 0) {
    errors.push(`${fieldName} no puede ser negativo.`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/*
  Valida que un texto no esté vacío.
*/
export function validateRequiredText(
  value: string,
  fieldName: string = 'El campo'
): ValidationResult {
  const errors: string[] = [];

  if (!value || value.trim().length === 0) {
    errors.push(`${fieldName} es obligatorio.`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}