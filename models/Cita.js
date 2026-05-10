const mongoose = require('mongoose');

const CitaSchema = new mongoose.Schema({
    cliente: {
        nombre: { type: String, required: true },
        telefono: { type: String, default: '' },
        email: { type: String, required: true }
    },
    vehiculo: {
        marca: { type: String, required: true },
        modelo: { type: String, required: true },
        ano: { type: String, required: true },
        categoria: { type: String, required: true }
    },
    servicios: [{
        id: { type: Number, required: true },
        nombre: { type: String, required: true },
        precioFinal: { type: Number, required: true }
    }],
    total: { type: Number, required: true },
    fechaCita: { type: String, required: true },
    estado: {
        type: String,
        enum: ['pendiente', 'confirmada', 'en_proceso', 'completada', 'cancelada'],
        default: 'pendiente'
    },
    fechaSolicitud: { type: Date, default: Date.now },
    id_tecnico: { type: mongoose.Schema.Types.ObjectId, ref: 'Tecnico', default: null }
}, { timestamps: true });

module.exports = mongoose.model('Cita', CitaSchema);