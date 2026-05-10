const mongoose = require('mongoose');

const CalificacionServicioSchema = new mongoose.Schema({
    id_cita: { type: mongoose.Schema.Types.ObjectId, ref: 'Cita', required: true },
    id_cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', required: true },
    estrellas: { type: Number, min: 1, max: 5, required: true },
    comentario: { type: String, default: '' },
    fecha: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CalificacionServicio', CalificacionServicioSchema);