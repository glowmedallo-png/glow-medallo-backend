const mongoose = require('mongoose');

const GaleriaSchema = new mongoose.Schema({
    titulo: { type: String, required: true },
    descripcion: { type: String, default: '' },
    categoria: { type: String, enum: ['ceramico', 'pulido', 'interior', 'motor'], default: 'ceramico' },
    url_antes: { type: String, required: true },
    url_despues: { type: String, required: true },
    activo: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Galeria', GaleriaSchema);