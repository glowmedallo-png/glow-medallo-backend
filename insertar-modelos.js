const mongoose = require('mongoose');
require('dotenv').config();

const modeloEjemplos = [
    // Audi (marcaId=1)
    { id: 1, marcaId: 1, nombre: "A3", categoria: "MEDIANO" },
    { id: 2, marcaId: 1, nombre: "A4", categoria: "MEDIANO" },
    { id: 3, marcaId: 1, nombre: "A5", categoria: "MEDIANO" },
    { id: 4, marcaId: 1, nombre: "Q3", categoria: "SUV" },
    { id: 5, marcaId: 1, nombre: "Q5", categoria: "SUV" },
    // BMW (marcaId=2)
    { id: 6, marcaId: 2, nombre: "Serie 3", categoria: "MEDIANO" },
    { id: 7, marcaId: 2, nombre: "Serie 5", categoria: "MEDIANO" },
    { id: 8, marcaId: 2, nombre: "X3", categoria: "SUV" },
    { id: 9, marcaId: 2, nombre: "X5", categoria: "SUV" },
    // Chevrolet (marcaId=3)
    { id: 10, marcaId: 3, nombre: "Spark", categoria: "PEQUEÑO" },
    { id: 11, marcaId: 3, nombre: "Onix", categoria: "PEQUEÑO" },
    { id: 12, marcaId: 3, nombre: "Tracker", categoria: "SUV" },
    { id: 13, marcaId: 3, nombre: "Cruze", categoria: "MEDIANO" }
];

async function insertarModelos() {
    await mongoose.connect(process.env.MONGODB_URI);
    const Modelo = require('./models/Modelo'); // asegúrate de que la ruta sea correcta
    for (const m of modeloEjemplos) {
        await Modelo.updateOne(
            { id: m.id },
            { $set: m },
            { upsert: true }
        );
    }
    console.log('✅ Modelos insertados/actualizados');
    process.exit();
}
insertarModelos();