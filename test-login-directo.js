const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();
const Cliente = require('./models/Cliente');

async function testLogin() {
    await mongoose.connect(process.env.MONGODB_URI);
    const email = 'juanmanuelmeneseszapata@gmail.com';
    const password = 'dango1';

    const cliente = await Cliente.findOne({ email });
    if (!cliente) {
        console.log('Cliente no existe');
        return;
    }
    console.log('Hash almacenado:', cliente.password);
    const match = await bcrypt.compare(password, cliente.password);
    console.log('¿Contraseña coincide?', match);
    process.exit();
}
testLogin();