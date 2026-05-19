const mongoose = require('mongoose');

const TecnicoSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    especialidad: { type: String, required: true },
    experiencia: { type: Number, required: true },
    certificaciones: { type: [String], default: [] },
    foto: { type: String, default: '' },
    activo: { type: Boolean, default: true },
    presentacion: { type: String, default: '' },        // biografía corta
    servicios: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Servicio' }]
}, { timestamps: true });

module.exports = mongoose.model('Tecnico', TecnicoSchema);