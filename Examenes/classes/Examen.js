const Pregunta = require('./Pregunta');

/**
 * Clase que representa un Examen completo.
 * Actúa como contenedor de múltiples objetos Pregunta.
 */
class Examen {
    constructor(nombre = null, preguntasData = []) {
        // Generación de nombre aleatorio si no se proporciona uno
        this.nombre = nombre || `Examen_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

        // Convertimos cada objeto de datos crudos en una instancia de la clase Pregunta
        this.preguntas = preguntasData.map(data => {
            if (data instanceof Pregunta) {
                return data;
            }
            return new Pregunta(data);
        });
    }

    /**
     * Prepara la estructura JSON final del examen para enviar al frontend.
     */
    getClientData() {
        return {
            nombre: this.nombre,
            totalPreguntas: this.preguntas.length,
            // Delegamos en cada pregunta la responsabilidad de formatearse a sí misma
            preguntas: this.preguntas.map(p => p.getClientData())
        };
    }
}

module.exports = Examen;