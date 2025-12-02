const PDFDocument = require('pdfkit'); // Librería para generar PDFs en el servidor
const preguntasService = require('../services/preguntasService');

// --- BÚSQUEDA ---
exports.searchQuestions = async (req, res) => {
  const { subject, difficulty, theme } = req.query;

  // Validación básica: requerimos al menos un filtro
  if (!subject && !difficulty && !theme) {
    return res.status(400).json({
      success: false,
      message: 'Error: Proporciona al menos un criterio (subject, difficulty o theme).'
    });
  }

  try {
    const questionsList = await preguntasService.getQuestionsByCriteria(subject, difficulty, theme);
    
    res.status(200).json({
      success: true,
      total_found: questionsList.length,
      questions: questionsList,
    });
  } catch (error) {
    console.error('Error al buscar preguntas:', error.message);
    res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

// --- DROPDOWNS ---
exports.getSubjects = async (req, res) => {
    try {
        const subjects = await preguntasService.getUniqueSubjects();
        res.status(200).json({ success: true, subjects });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getThemes = async (req, res) => {
    try {
        const { subject } = req.query; 
        const themes = await preguntasService.getUniqueThemes(subject);
        res.status(200).json({ success: true, themes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- CREACIÓN DE PREGUNTA ---
exports.addQuestion = async (req, res) => {
    try {
        // Desestructuramos los datos que vienen del frontend
        const { enunciado, asignatura, tema, dificultad, respuesta_correcta, incorrect_options } = req.body;

        // Validación estricta en servidor (nunca confíes solo en el frontend)
        if (!enunciado || !asignatura || !tema || !respuesta_correcta) {
            return res.status(400).json({ success: false, message: 'Faltan campos obligatorios.' });
        }

        if (!incorrect_options || !Array.isArray(incorrect_options) || incorrect_options.length === 0) {
            return res.status(400).json({ success: false, message: 'Debe proporcionar al menos una opción incorrecta.' });
        }

        // Llamamos al servicio con los datos limpios
        const newQuestion = await preguntasService.createQuestion({
            enunciado, 
            asignatura, 
            tema, 
            dificultad: parseInt(dificultad) || 1, 
            respuesta_correcta, 
            incorrect_options 
        });

        res.status(201).json({ 
            success: true, 
            message: 'Pregunta creada con éxito', 
            question: newQuestion 
        });

    } catch (error) {
        console.error("Error adding question:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- GENERACIÓN DE EXAMEN ---
exports.createExam = async (req, res) => {
    try {
        const { subject, amount } = req.body;

        if (!subject || !amount) {
            return res.status(400).json({ 
                success: false, 
                message: 'Se requiere una asignatura y la cantidad de preguntas.' 
            });
        }

        const examData = await preguntasService.generateExam(subject, parseInt(amount));

        res.status(200).json({
            success: true,
            exam: examData
        });

    } catch (error) {
        console.error('Error generating exam:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- DESCARGA DE PDF ---
exports.downloadPdf = (req, res) => {
    const examData = req.body;

    if (!examData || !examData.preguntas) {
        return res.status(400).send('No exam data provided');
    }

    try {
        // 1. Delegamos la creación del PDF al servicio
        const doc = preguntasService.generateExamPdf(examData);

        // 2. Configuración HTTP (Responsabilidad del Controlador)
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${examData.nombre}.pdf`);

        // 3. Conectamos el Stream del servicio a la Respuesta
        doc.pipe(res);
        doc.end(); // Finalizamos el stream aquí

    } catch (error) {
        console.error("Error generando PDF:", error);
        res.status(500).send("Error al generar el PDF");
    }
};