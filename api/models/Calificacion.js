// models/Calificacion.js
const mongoose = require('mongoose');

const CalificacionSchema = new mongoose.Schema({
    id_cita: { type: mongoose.Schema.Types.ObjectId, ref: 'Cita', required: true },
    id_tecnico: { type: mongoose.Schema.Types.ObjectId, ref: 'Tecnico', required: true },
    id_cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', required: true },
    estrellas: { type: Number, min: 1, max: 5, required: true },
    comentario: { type: String, default: '' },
    fecha: { type: Date, default: Date.now }
});

// Índice único: un cliente no puede calificar dos veces la misma cita
CalificacionSchema.index({ id_cita: 1, id_cliente: 1 }, { unique: true });

module.exports = mongoose.model('Calificacion', CalificacionSchema);