// migrar-passwords.js (versión con depuración)
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const Cliente = require('./models/Cliente');

async function migrar() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado a MongoDB');

        // Encuentra clientes que tengan campo password (exista) y que NO sean hash
        // Nota: No filtramos por tipo porque puede venir null/undefined
        const clientes = await Cliente.find({
            password: { $exists: true, $nin: [null, "", undefined] }
        });

        console.log(`🔍 Total de clientes con campo password no nulo/vacío: ${clientes.length}`);

        let contador = 0;
        for (const cliente of clientes) {
            const rawPassword = cliente.password;
            console.log(`📧 Cliente: ${cliente.email}, tipo password: ${typeof rawPassword}, valor: ${rawPassword}`);

            // Verificar si ya es hash de bcrypt (comienza con $2b$)
            if (typeof rawPassword === 'string' && rawPassword.startsWith('$2b$')) {
                console.log(`⏩ El cliente ${cliente.email} ya tiene contraseña hasheada. Se omite.`);
                continue;
            }

            // Si no es string o es vacío, omitir
            if (typeof rawPassword !== 'string' || rawPassword.trim() === '') {
                console.warn(`⚠️ Cliente ${cliente.email} tiene password no string o vacío (${rawPassword}). Se omite.`);
                continue;
            }

            // Es texto plano, proceder a hashear
            try {
                const hash = await bcrypt.hash(rawPassword, 10);
                cliente.password = hash;
                await cliente.save();
                console.log(`✔️ Contraseña hasheada para ${cliente.email}`);
                contador++;
            } catch (err) {
                console.error(`❌ Error al hashear para ${cliente.email}:`, err.message);
            }
        }

        console.log(`🎉 Migración completada. Se hashearon ${contador} contraseñas.`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error general:', error);
        process.exit(1);
    }
}

migrar();