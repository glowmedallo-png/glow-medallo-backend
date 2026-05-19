const mongoose = require('mongoose');

const ServicioSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    nombre: { type: String, required: true },
    descripcion: { type: String, required: true },
    precioBase: { type: Number, required: true },
    categoria: { type: String, enum: ['basico', 'standard', 'premium'], default: 'standard' },
    activo: { type: Boolean, default: true }
}, {
    timestamps: true // Agrega createdAt y updatedAt automáticamente
});

module.exports = mongoose.model('Servicio', ServicioSchema);