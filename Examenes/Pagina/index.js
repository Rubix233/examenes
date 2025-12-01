// --- Estado Global ---
// Almacenamos el examen actual aquí para poder enviarlo al endpoint de descarga PDF cuando el usuario haga clic.
let currentExamData = null; 

// --- Referencias al DOM (Elementos HTML) ---
const subjectSelect = document.getElementById('subjectInput');
const searchThemeSelect = document.getElementById('searchThemeInput');
const searchDifficultyInput = document.getElementById('searchDifficultyInput');
const examSubjectSelect = document.getElementById('examSubjectInput'); 
const resultsContainer = document.getElementById('resultsContainer');
const searchSection = document.getElementById('searchSection');

// Elementos del formulario "Nueva Pregunta"
const newAsignaturaSelect = document.getElementById('newAsignatura'); 
const newTemaSelect = document.getElementById('newTema'); 

// Elementos de la vista "Examen"
const examViewContainer = document.getElementById('examViewContainer');
const examQuestionsList = document.getElementById('examQuestionsList');
const examTitle = document.getElementById('examTitle');

// Contenedores de Formularios
const formContainer = document.getElementById('addQuestionForm');
const createExamForm = document.getElementById('createExamForm');
const incorrectOptionsContainer = document.getElementById('incorrectOptionsContainer');

// Botones
const toggleFormBtn = document.getElementById('toggleFormBtn');
const toggleExamFormBtn = document.getElementById('toggleExamFormBtn');
const addOptionBtn = document.getElementById('addOptionBtn');
const saveQuestionBtn = document.getElementById('saveQuestionBtn');
const searchBtn = document.getElementById('searchBtn');
const generateExamBtn = document.getElementById('generateExamBtn');
const downloadExamBtn = document.getElementById('downloadExamBtn');

//const API_URL = 'http://localhost:3000/api/preguntas';
//const API_URL = 'http://172.22.50.6:3000/api/preguntas';
const API_URL = '/api/preguntas';

// --- Event Listeners (Escuchadores de Eventos) ---

// Al cargar la página, cargamos las asignaturas disponibles
document.addEventListener('DOMContentLoaded', loadSubjects);

// Botones para mostrar/ocultar formularios
toggleFormBtn.addEventListener('click', toggleQuestionForm);
toggleExamFormBtn.addEventListener('click', toggleExamForm);

// Acciones principales
addOptionBtn.addEventListener('click', addOptionInput);
saveQuestionBtn.addEventListener('click', submitNewQuestion);
searchBtn.addEventListener('click', searchQuestions);
generateExamBtn.addEventListener('click', generateExam);
downloadExamBtn.addEventListener('click', downloadExamPDF);

// Carga dinámica de temas: Al cambiar la asignatura en "Nueva Pregunta"
newAsignaturaSelect.addEventListener('change', (e) => {
    const subject = e.target.value;
    if (subject) {
        loadThemes(subject, newTemaSelect);
    } else {
        resetThemeSelect(newTemaSelect);
    }
});

// Carga dinámica de temas: Al cambiar la asignatura en "Buscar"
subjectSelect.addEventListener('change', (e) => {
    const subject = e.target.value;
    if (subject) {
        loadThemes(subject, searchThemeSelect);
    } else {
        resetThemeSelect(searchThemeSelect);
    }
});


// --- Funciones de Lógica ---

/**
 * Carga la lista de asignaturas del backend y puebla todos los dropdowns relevantes en la página.
 */
async function loadSubjects() {
    try {
        const res = await fetch(`${API_URL}/subjects`);
        const data = await res.json();
        
        // Reiniciamos los dropdowns
        subjectSelect.innerHTML = '<option value="">-- Cualquiera --</option>';
        examSubjectSelect.innerHTML = '<option value="">-- Selecciona --</option>';
        newAsignaturaSelect.innerHTML = '<option value="">-- Selecciona --</option>';

        // Rellenamos con datos
        data.subjects.forEach(subj => {
            const opt1 = document.createElement('option');
            opt1.value = subj; opt1.textContent = subj;
            subjectSelect.appendChild(opt1);

            const opt2 = document.createElement('option');
            opt2.value = subj; opt2.textContent = subj;
            examSubjectSelect.appendChild(opt2);

            const opt3 = document.createElement('option');
            opt3.value = subj; opt3.textContent = subj;
            newAsignaturaSelect.appendChild(opt3);
        });
    } catch (err) {
        console.error("Error cargando asignaturas:", err);
    }
}

/**
 * Carga los temas dependientes de una asignatura.
 * @param {string} subject - La asignatura seleccionada.
 * @param {HTMLElement} targetSelect - El elemento <select> que vamos a rellenar.
 */
async function loadThemes(subject, targetSelect) {
    try {
        targetSelect.disabled = true;
        targetSelect.innerHTML = '<option>Cargando...</option>';

        const res = await fetch(`${API_URL}/themes?subject=${encodeURIComponent(subject)}`);
        const data = await res.json();

        targetSelect.innerHTML = '<option value="">-- Cualquiera --</option>';
        
        if (data.themes && data.themes.length > 0) {
            data.themes.forEach(tema => {
                const option = document.createElement('option');
                option.value = tema;
                option.textContent = tema;
                targetSelect.appendChild(option);
            });
            targetSelect.disabled = false;
        } else {
            targetSelect.innerHTML = '<option value="">No hay temas</option>';
        }

    } catch (err) {
        console.error("Error cargando temas:", err);
        targetSelect.innerHTML = '<option>Error al cargar</option>';
    }
}

function resetThemeSelect(targetSelect) {
    targetSelect.innerHTML = '<option value="">-- Elige Asignatura --</option>';
    targetSelect.disabled = true;
}

// --- Funciones UI (Mostrar/Ocultar Formularios) ---
function toggleQuestionForm() {
    if (!createExamForm.classList.contains('hidden')) createExamForm.classList.add('hidden');
    const isHidden = formContainer.classList.contains('hidden');
    formContainer.classList.toggle('hidden');
    // Si se abre y no hay inputs de opciones, añade uno por defecto
    if (isHidden && incorrectOptionsContainer.children.length === 0) addOptionInput();
}

function toggleExamForm() {
    if (!formContainer.classList.contains('hidden')) formContainer.classList.add('hidden');
    createExamForm.classList.toggle('hidden');
}

/**
 * Añade dinámicamente un input de texto para una opción incorrecta.
 */
function addOptionInput() {
    const wrapper = document.createElement('div');
    wrapper.className = 'flex items-center gap-2';
    wrapper.innerHTML = `
        <input type="text" class="incorrect-option flex-grow p-2 border rounded focus:ring-2 focus:ring-gray-200 outline-none" placeholder="Opción incorrecta">
        <button type="button" class="delete-option-btn text-gray-400 hover:text-red-500 px-2 font-bold" title="Eliminar opción">✕</button>
    `;
    // Listener para el botón eliminar de esta fila específica
    wrapper.querySelector('.delete-option-btn').addEventListener('click', () => wrapper.remove());
    incorrectOptionsContainer.appendChild(wrapper);
}

// --- Funciones de Envío de Datos ---

/**
 * Recopila los datos del formulario de nueva pregunta y los envía al backend.
 */
async function submitNewQuestion() {
    const enunciado = document.getElementById('newEnunciado').value;
    const asignatura = newAsignaturaSelect.value;
    const tema = newTemaSelect.value;
    const dificultad = document.getElementById('newDificultad').value;
    const correcta = document.getElementById('newCorrecta').value;

    const incorrectInputs = document.querySelectorAll('.incorrect-option');
    const opcionesIncorrectas = [];
    incorrectInputs.forEach(input => {
        if (input.value.trim() !== "") opcionesIncorrectas.push(input.value.trim());
    });

    // Validación simple en cliente
    if (!enunciado || !asignatura || !correcta || !tema) return alert("Rellena todos los campos.");
    
    // Enviamos los datos estructurados para que el servicio los procese
    const payload = {
        enunciado, 
        asignatura, 
        tema, 
        dificultad,
        respuesta_correcta: correcta,
        incorrect_options: opcionesIncorrectas
    };

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (data.success) {
            alert('Pregunta guardada!');
            // Limpiar formulario
            document.getElementById('newEnunciado').value = '';
            document.getElementById('newCorrecta').value = '';
            newAsignaturaSelect.value = "";
            resetThemeSelect(newTemaSelect);
            incorrectOptionsContainer.innerHTML = ''; 
            addOptionInput();
            loadSubjects(); // Recargar listas por si hay nuevos datos
        } else {
            alert('Error: ' + data.message);
        }
    } catch (err) {
        alert('Error de conexión.');
    }
}

/**
 * Realiza la búsqueda avanzada enviando parámetros query.
 */
async function searchQuestions() {
    const subject = subjectSelect.value;
    const theme = searchThemeSelect.value;
    const difficulty = searchDifficultyInput.value;

    if (!subject && !difficulty) return alert("Por favor elige al menos una asignatura o dificultad.");
    
    // Cambiar vista a Resultados
    resultsContainer.classList.remove('hidden');
    searchSection.classList.remove('hidden');
    examViewContainer.classList.add('hidden');
    
    resultsContainer.innerHTML = '<p class="text-center text-blue-500">Cargando...</p>';
    
    // Construir Query String
    const params = new URLSearchParams();
    if (subject) params.append('subject', subject);
    if (theme) params.append('theme', theme);
    if (difficulty) params.append('difficulty', difficulty);

    try {
        const res = await fetch(`${API_URL}/search?${params.toString()}`);
        const data = await res.json();
        displaySearchResults(data.questions);
    } catch (error) {
        resultsContainer.innerHTML = '<p class="text-red-500 text-center">Error de conexión</p>';
    }
}

function displaySearchResults(questions) {
    if (!questions || questions.length === 0) {
        resultsContainer.innerHTML = '<p class="text-center text-gray-500">No hay preguntas que coincidan.</p>';
        return;
    }
    // Renderizado del HTML de cada pregunta
    resultsContainer.innerHTML = questions.map((q, i) => `
        <div class="border-b last:border-b-0 py-4">
            <h3 class="font-semibold text-gray-800">${i+1}. ${q.enunciado}</h3>
            <div class="flex gap-2 mb-2">
                <span class="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">Tema: ${q.tema || 'N/A'}</span>
                <span class="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">Dif: ${q.dificultad || 'N/A'}</span>
            </div>
            <ul class="ml-4 list-disc text-sm text-gray-600 space-y-1">
                ${q.opciones.map(o => `<li>${o}</li>`).join('')}
            </ul>
        </div>
    `).join('');
}

/**
 * Genera un examen aleatorio solicitándolo al backend.
 */
async function generateExam() {
    const subject = examSubjectSelect.value;
    const amount = document.getElementById('examAmountInput').value;

    if (!subject) return alert("Selecciona una asignatura para el examen.");

    try {
        const res = await fetch(`${API_URL}/exam`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subject, amount })
        });
        const data = await res.json();

        if (data.success) {
            currentExamData = data.exam; // Guardamos datos para descarga PDF
            displayExam(data.exam);
            createExamForm.classList.add('hidden'); // Ocultar formulario para ver resultado
        } else {
            alert('Error: ' + data.message);
        }

    } catch (err) {
        console.error(err);
        alert("Error generando el examen.");
    }
}

function displayExam(examData) {
    searchSection.classList.add('hidden'); 
    resultsContainer.classList.add('hidden');
    examViewContainer.classList.remove('hidden');

    examTitle.textContent = `${examData.nombre} (${examData.totalPreguntas} preguntas)`;

    examQuestionsList.innerHTML = examData.preguntas.map((q, i) => `
        <div class="bg-white p-6 rounded-lg shadow border border-indigo-100">
            <div class="flex justify-between items-start mb-4">
                <h3 class="text-lg font-bold text-gray-800">Pregunta ${i + 1}</h3>
                <span class="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">${q.tema || 'General'}</span>
            </div>
            <p class="text-gray-700 mb-4 text-lg">${q.enunciado}</p>
            <div class="space-y-3">
                ${q.opciones.map(opcion => `
                    <div class="flex items-center p-3 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer transition">
                        <div class="w-4 h-4 border-2 border-gray-400 rounded-full mr-3"></div>
                        <span class="text-gray-700">${opcion}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

/**
 * Solicita al servidor el archivo PDF del examen actual.
 */
async function downloadExamPDF() {
    if (!currentExamData) return alert("No hay examen para descargar.");

    try {
        const downloadBtn = document.getElementById('downloadExamBtn');
        const originalText = downloadBtn.innerHTML;
        downloadBtn.innerHTML = 'Generando...';
        downloadBtn.disabled = true;

        // Pedimos el PDF como POST, enviando los datos del examen
        const response = await fetch(`${API_URL}/download-pdf`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentExamData)
        });

        if (!response.ok) throw new Error('Error generando PDF');

        // Recibimos la respuesta como un BLOB (Binary Large Object)
        const blob = await response.blob();
        
        // Creamos una URL temporal en el navegador que apunta a ese blob
        const url = window.URL.createObjectURL(blob);
        
        // Creamos un enlace <a> invisible para forzar la descarga
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentExamData.nombre}.pdf`; 
        document.body.appendChild(a);
        a.click();
        
        // Limpieza de memoria
        window.URL.revokeObjectURL(url);
        a.remove();

        downloadBtn.innerHTML = originalText;
        downloadBtn.disabled = false;

    } catch (err) {
        console.error(err);
        alert('Error al descargar el PDF');
        document.getElementById('downloadExamBtn').disabled = false;
        document.getElementById('downloadExamBtn').innerHTML = '⬇ Descargar PDF';
    }
}