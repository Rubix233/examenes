const mongoose = require('mongoose');

// Definimos la estructura exacta que tendrá cada documento de pregunta en la BD
const PreguntaSchema = new mongoose.Schema({
    enunciado: String,
    opciones: [String],        // Array de strings con todas las opciones (correcta + incorrectas)
    respuesta_correcta: String, // Guardamos cuál es la correcta para validaciones futuras
    asignatura: String,
    tema: String,
    dificultad: Number         // Guardado como número para poder filtrar por rango si fuera necesario
}, { collection: 'Preguntas' }); // Forzamos el nombre de la colección en Atlas

module.exports = mongoose.model('Pregunta', PreguntaSchema);