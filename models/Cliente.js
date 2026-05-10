const mongoose = require('mongoose');

const ClienteSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    telefono: { type: String, default: '' },
    email: { type: String, required: true, unique: true },
    password: { type: String, default: null },      // opcional para anónimos
    es_registrado: { type: Boolean, default: false },
    resetToken: { type: String, default: null },
    resetExpires: { type: Date, default: null },
    isAdmin: { type: Boolean, default: false },
    vehiculos: Array,
    citas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Cita' }]
}, { timestamps: true });

module.exports = mongoose.model('Cliente', ClienteSchema);
