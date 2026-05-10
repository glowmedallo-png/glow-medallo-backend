const mongoose = require('mongoose');
require('dotenv').config();
const Cita = require('./models/Cita');

async function test() {
    await mongoose.connect(process.env.MONGODB_URI);
    const testCita = new Cita({
        cliente: { nombre: 'Test', telefono: '', email: 't@t.com' },
        vehiculo: { marca: 'test', modelo: 'test', ano: '2020', categoria: 'MEDIANO' },
        servicios: [{ id: 1, nombre: 'test', precioFinal: 1000 }],
        total: 1000,
        fechaCita: '2025-01-01 10:00'
    });
    await testCita.save();
    console.log('Cita guardada manualmente');
    process.exit();
}
test();