const mongoose = require('mongoose');
require('dotenv').config();
const CalificacionServicio = require('./models/CalificacionServicio');
const Cita = require('./models/Cita');
const Cliente = require('./models/Cliente');

async function insertarOpinionPrueba() {
    await mongoose.connect(process.env.MONGODB_URI);
    // Buscar una cita completada existente
    const cita = await Cita.findOne({ estado: 'completada' });
    if (!cita) {
        console.log('No hay citas completadas. Crea una cita y cámbiala a completada desde admin.');
        process.exit();
    }
    const cliente = await Cliente.findOne({ email: cita.cliente.email });
    if (!cliente) {
        console.log('Cliente no encontrado');
        process.exit();
    }
    const nueva = new CalificacionServicio({
        id_cita: cita._id,
        id_cliente: cliente._id,
        estrellas: 5,
        comentario: 'Excelente servicio, muy profesionales.'
    });
    await nueva.save();
    console.log('Opinión de prueba insertada');
    process.exit();
}
insertarOpinionPrueba();