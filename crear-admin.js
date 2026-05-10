const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();
const Cliente = require('./models/Cliente');

async function crearAdmin() {
    await mongoose.connect(process.env.MONGODB_URI);
    const email = 'glowmedallo@gmail.com';
    const password = 'admin123'; // Cambia a la contraseña que quieras
    const hashed = await bcrypt.hash(password, 10);

    const existente = await Cliente.findOne({ email });
    if (existente) {
        existente.password = hashed;
        existente.es_registrado = true;
        existente.isAdmin = true;
        await existente.save();
        console.log('✅ Administrador actualizado');
    } else {
        const nuevo = new Cliente({
            nombre: 'Administrador',
            email,
            password: hashed,
            telefono: '',
            es_registrado: true,
            isAdmin: true
        });
        await nuevo.save();
        console.log('✅ Administrador creado');
    }
    process.exit();
}
crearAdmin();