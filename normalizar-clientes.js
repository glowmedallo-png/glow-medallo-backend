// normalizar-clientes.js (versión definitiva)
const mongoose = require('mongoose');
require('dotenv').config();
const Cliente = require('./models/Cliente');

async function normalizar() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado a MongoDB');

        // 1. Convertir es_registrado de objeto a booleano
        const conObjeto = await Cliente.find({ es_registrado: { $type: 'object' } });
        console.log(`🟡 Clientes con es_registrado tipo objeto: ${conObjeto.length}`);
        for (const c of conObjeto) {
            const tienePassword = c.password && typeof c.password === 'string' && c.password.length > 0;
            c.es_registrado = tienePassword;
            await c.save();
            console.log(`   → ${c.email}: es_registrado ahora = ${tienePassword}`);
        }

        // 2. Clientes con es_registrado true pero sin password válida
        const sinPassword = await Cliente.find({
            es_registrado: true,
            $or: [
                { password: { $exists: false } },
                { password: '' },
                { password: null },
                { password: { $eq: 'undefined' } }
            ]
        });
        console.log(`🟠 Clientes con es_registrado true pero sin password: ${sinPassword.length}`);
        for (const c of sinPassword) {
            c.es_registrado = false;
            await c.save();
            console.log(`   → ${c.email}: es_registrado cambiado a false`);
        }

        // 3. Clientes con password en texto plano (legítimos)
        const textoPlano = await Cliente.find({
            password: { $exists: true, $type: 'string', $ne: "", $not: /^\$2b\$/ }
        });
        console.log(`🔴 Clientes con posible password en texto plano: ${textoPlano.length}`);
        for (const c of textoPlano) {
            // Mostrar solo los primeros 10 caracteres para depuración
            const preview = c.password.length > 10 ? c.password.substring(0, 10) + '...' : c.password;
            console.log(`   → ${c.email}: password = ${preview} (texto plano).`);
        }

        console.log('🎉 Normalización completada.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

normalizar();