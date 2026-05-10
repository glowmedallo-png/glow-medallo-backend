// migrar-password.js
const mongoose = require('mongoose');
require('dotenv').config();
const Cliente = require('./models/Cliente'); // Asegúrate de que la ruta es correcta

async function migrar() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado a MongoDB');

        // Renombrar campo password_hash a password, si existe
        const resultado = await Cliente.updateMany(
            { password_hash: { $exists: true } },
            { $rename: { password_hash: 'password' } }
        );
        console.log(`📝 Documentos modificados: ${resultado.modifiedCount}`);

        // Eliminar el campo password_hash si quedó (por seguridad)
        await Cliente.updateMany(
            { password_hash: { $exists: true } },
            { $unset: { password_hash: "" } }
        );

        console.log('🎉 Migración completada.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

migrar();