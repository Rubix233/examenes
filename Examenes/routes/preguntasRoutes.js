const express = require('express');
const router = express.Router();
const preguntasController = require('../controllers/preguntasController');

// GET: Búsqueda avanzada
router.get('/search', preguntasController.searchQuestions);

// GET: Obtener lista de asignaturas (para dropdowns)
router.get('/subjects', preguntasController.getSubjects);

// GET: Obtener lista de temas (para dropdowns dependientes)
router.get('/themes', preguntasController.getThemes);

// POST: Crear una nueva pregunta
router.post('/', preguntasController.addQuestion);

// POST: Generar un examen aleatorio (devuelve JSON)
router.post('/exam', preguntasController.createExam);

// POST: Descargar PDF de un examen (devuelve archivo binario)
router.post('/download-pdf', preguntasController.downloadPdf);

module.exports = router;