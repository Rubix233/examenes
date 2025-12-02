const PreguntaModel = require('../models/Pregunta'); // Modelo de BD
const PreguntaClass = require('../classes/Pregunta'); // Clase de Negocio
const ExamenClass = require('../classes/Examen'); // Clase de Negocio

/**
 * Busca preguntas en la BD según múltiples criterios.
 * Implementa filtros dinámicos y "case insensitive" (ignora mayúsculas/minúsculas).
 */
exports.getQuestionsByCriteria = async (asignatura, dificultad, tema) => {
    try {
        const matchCriteria = {};

        // 1. Filtro por Asignatura (Regex 'i' = case insensitive)
        if (asignatura) {
            matchCriteria.asignatura = { $regex: new RegExp(asignatura, 'i') };
        }

        // 2. Filtro por Tema
        if (tema) {
            matchCriteria.tema = { $regex: new RegExp(tema, 'i') };
        }

        // 3. Filtro por Dificultad (Conversión a entero para asegurar comparación numérica)
        if (dificultad) {
            matchCriteria.dificultad = parseInt(dificultad, 10);
        }

        // .lean() devuelve objetos JS planos en lugar de documentos Mongoose (más rápido)
        const rawQuestions = await PreguntaModel.find(matchCriteria).lean();

        // Transformamos los datos crudos a instancias de nuestra clase para proteger la respuesta correcta
        return rawQuestions.map(q => {
            const preguntaInstance = new PreguntaClass(q);
            return preguntaInstance.getClientData();
        });
    } catch (error) {
        throw new Error('No se pudieron recuperar preguntas: ' + error.message);
    }
};

/**
 * Obtiene una lista de todas las asignaturas únicas existentes en la BD.
 * Útil para poblar los dropdowns del frontend.
 */
exports.getUniqueSubjects = async () => {
    try {
        const subjects = await PreguntaModel.distinct('asignatura');
        return subjects.sort();
    } catch (error) {
        throw new Error('Error al obtener asignaturas: ' + error.message);
    }
};

/**
 * Obtiene temas únicos, opcionalmente filtrados por una asignatura específica.
 */
exports.getUniqueThemes = async (subject) => {
    try {
        const query = subject ? { asignatura: subject } : {};
        const themes = await PreguntaModel.distinct('tema', query);
        return themes.sort();
    } catch (error) {
        throw new Error('Error al obtener temas: ' + error.message);
    }
};

/**
 * Lógica para crear una pregunta.
 * Recibe las opciones separadas (correcta vs incorrectas) y las fusiona antes de guardar.
 */
exports.createQuestion = async (data) => {
    try {
        const { incorrect_options, respuesta_correcta, ...rest } = data;
        
        // Fusión de arrays: [Correcta, ...Incorrectas]
        const allOptions = [respuesta_correcta, ...incorrect_options];

        const questionToSave = {
            ...rest, // Resto de campos (enunciado, dificultad, etc.)
            respuesta_correcta,
            opciones: allOptions
        };

        const newQuestion = new PreguntaModel(questionToSave);
        return await newQuestion.save();
    } catch (error) {
        throw new Error('Error al guardar la pregunta: ' + error.message);
    }
};

/**
 * Genera un examen aleatorio.
 * Utiliza la agregación $sample de MongoDB para obtener registros aleatorios eficientemente.
 */
exports.generateExam = async (subject, amount) => {
    try {
        const randomQuestions = await PreguntaModel.aggregate([
            { $match: { asignatura: subject } }, // Primero filtramos por materia
            { $sample: { size: amount } }        // Luego tomamos 'N' aleatorias
        ]);

        if (randomQuestions.length === 0) {
            throw new Error(`No se encontraron preguntas para la asignatura: ${subject}`);
        }

        // Usamos la clase Examen para empaquetar todo
        const examen = new ExamenClass(null, randomQuestions);
        return examen.getClientData();

    } catch (error) {
        throw new Error('Error generando el examen: ' + error.message);
    }
};

/**
 * Genera un objeto PDFKit con el contenido del examen.
 * El controlador decide qué hacer con el PDF (stream, guardar, etc.)
 */

exports.generateExamPdf = (examData) => {
    // 1. Creamos el documento
    const doc = new PDFDocument();

    // 2. Lógica de Diseño (Movida desde el controlador)
    
    // Título
    doc.fontSize(20).text(examData.nombre, { align: 'center' });
    doc.moveDown();
    
    // Metadatos
    doc.fontSize(12).text(`Asignatura: ${examData.preguntas[0]?.asignatura || 'Varios'}`);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`);
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke(); // Línea separadora
    doc.moveDown();

    // Loop de Preguntas
    doc.fontSize(12);
    examData.preguntas.forEach((q, i) => {
        // Evitar corte de página
        if (doc.y > 700) doc.addPage();

        doc.font('Helvetica-Bold').text(`${i + 1}. ${q.enunciado}`);
        doc.moveDown(0.5);
        
        doc.font('Helvetica');
        q.opciones.forEach(opt => {
            doc.text(`   O  ${opt}`);
        });
        doc.moveDown(1);
    });

    // Devolvemos el objeto doc para que el controlador decida qué hacer con él
    return doc;
};