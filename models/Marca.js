const mongoose = require('mongoose');

const MarcaSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    nombre: { type: String, required: true, unique: true }, // ej: "audi"
    nombreMostrar: { type: String, required: true }, // ej: "Audi"
    imagen: { type: String, default: '' }, // ruta de la imagen representativa de la marca
    activo: { type: Boolean, default: true }
}, {
    timestamps: true
});

module.exports = mongoose.model('Marca', MarcaSchema);