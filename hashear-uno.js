const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();
const Cliente = require('./models/Cliente');

async function hashear() {
    await mongoose.connect(process.env.MONGODB_URI);
    const cliente = await Cliente.findOne({ email: 'juan.meneses921@pascualbravo.edu.co' });
    if (cliente && cliente.password && !cliente.password.startsWith('$2b$')) {
        const hash = await bcrypt.hash(cliente.password, 10);
        cliente.password = hash;
        await cliente.save();
        console.log('Contraseña hasheada correctamente');
    } else {
        console.log('No se encontró cliente con password en texto plano');
    }
    process.exit();
}
hashear();