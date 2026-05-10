const mongoose = require('mongoose');
require('dotenv').config();
const Cliente = require('./models/Cliente');

async function agregar() {
    await mongoose.connect(process.env.MONGODB_URI);
    const clientes = await Cliente.find({ password_hash: { $exists: false } });
    console.log(`Clientes sin password_hash: ${clientes.length}`);
    for (const c of clientes) {
        c.password_hash = ''; // o lo eliminas del required
        await c.save();
        console.log(`Actualizado ${c.email}`);
    }
    process.exit();
}
agregar();