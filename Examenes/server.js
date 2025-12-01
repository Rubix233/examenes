const express = require('express');
const cors = require('cors'); // Middleware para permitir peticiones desde otros dominios
const app = express();
const { connect } = require('./dataBase.js'); // Importamos nuestra función de conexión

// 1. Configuración de Middlewares
app.use(cors()); // Permite que el frontend hable con este backend
app.use(express.json()); // Permite que el servidor entienda datos JSON en el cuerpo de las peticiones (req.body)

// 2. Definición de Rutas
// Todas las rutas que empiecen por /api/preguntas se manejan en preguntasRoutes.js
app.use('/api/preguntas', require('./routes/preguntasRoutes.js'));

// 3. Inicio del Servidor
// Primero conectamos a la BD, y solo si tenemos éxito, levantamos el servidor express
connect().then(() => {
    app.listen(3000, () => {
        console.log('Servidor escuchando en el puerto 3000');
    });
});