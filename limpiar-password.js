const mongoose = require('mongoose');
require('dotenv').config();
const Cliente = require('./models/Cliente');

async function limpiar() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado');

    const result = await Cliente.updateMany(
        { password: { $exists: true, $not: { $type: 'string' } } },
        { $unset: { password: "" } }
    );
    console.log(`Documentos modificados: ${result.modifiedCount}`);

    // Adicional, si hay password vacío o undefined como string "undefined", también limpiar
    const result2 = await Cliente.updateMany(
        { password: { $in: [null, undefined, "", "undefined"] } },
        { $unset: { password: "" } }
    );
    console.log(`Documentos con password inválido removidos: ${result2.modifiedCount}`);

    process.exit(0);
}

limpiar().catch(console.error);