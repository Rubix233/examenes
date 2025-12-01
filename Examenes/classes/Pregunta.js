/**
 * Clase que representa una pregunta individual.
 * Separa la lógica de negocio (como aleatorizar opciones) de la base de datos.
 */
class Pregunta {
    /**
     * @param {object} data - Datos crudos traídos de la base de datos.
     */
    constructor({ _id, enunciado, opciones, respuestaCorrecta, asignatura, tema, dificultad }) {
      this._id = _id;
      this.enunciado = enunciado;
      this.opciones = opciones;
      this.respuestaCorrecta = respuestaCorrecta;
      this.asignatura = asignatura;
      this.tema = tema; 
      this.dificultad = dificultad;
  
      // Al instanciar la clase, generamos inmediatamente una versión mezclada de las opciones.
      // Usamos [...opciones] para crear una copia y no modificar el array original.
      this.opcionesRandomizadas = this.randomizeOptions([...opciones]);
    }
  
    /**
     * Algoritmo de Fisher-Yates para mezclar un array aleatoriamente.
     */
    randomizeOptions(optionsArray) {
      for (let i = optionsArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [optionsArray[i], optionsArray[j]] = [optionsArray[j], optionsArray[i]];
      }
      return optionsArray;
    }
  
    /**
     * Devuelve solo los datos seguros para el cliente.
     * IMPORTANTE: No incluimos 'respuestaCorrecta' aquí para evitar trampas en el frontend.
     */
    getClientData() {
      return {
        id: this._id,
        enunciado: this.enunciado,
        asignatura: this.asignatura,
        tema: this.tema,
        dificultad: this.dificultad,
        opciones: this.opcionesRandomizadas, // El cliente recibe las opciones ya mezcladas
      };
    }
  }
  
  module.exports = Pregunta;