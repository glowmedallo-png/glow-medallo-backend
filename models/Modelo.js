const mongoose = require('mongoose');

const modeloSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    marcaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Marca', required: true },
    nombre: { type: String, required: true },
    categoria: { type: String, enum: ['PEQUEÑO', 'MEDIANO', 'SUV'], default: 'MEDIANO' },
    imagen: { type: String, default: '' },
    activo: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Modelo', modeloSchema);