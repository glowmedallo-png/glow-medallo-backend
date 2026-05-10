const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Asegúrate de que la ruta del modelo sea correcta
const Cliente = require('./models/Cliente');

async function hashear() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado a MongoDB');

    // Mostrar todos los clientes para identificar el email exacto
    const todos = await Cliente.find({});
    console.log('Clientes encontrados:');
    todos.forEach(c => {
        console.log(`- ${c.email}, password: ${c.password ? (c.password.startsWith('$2b$') ? 'HASH' : c.password) : 'sin password'}`);
    });

    // Buscar específicamente por el email
    const emailBuscado = 'juan.meneses921@pascualbravo.edu.co';
    const cliente = await Cliente.findOne({ email: emailBuscado });
    
    if (!cliente) {
        console.log(`❌ No se encontró cliente con email ${emailBuscado}`);
        process.exit();
    }

    console.log(`Cliente encontrado: ${cliente.email}, password actual: ${cliente.password}`);

    if (cliente.password && !cliente.password.startsWith('$2b$')) {
        const hash = await bcrypt.hash(cliente.password, 10);
        cliente.password = hash;
        await cliente.save();
        console.log(`✅ Contraseña hasheada para ${cliente.email}. Nuevo hash: ${hash}`);
    } else {
        console.log('⚠️ La contraseña ya es hash o no existe.');
    }
    process.exit();
}

hashear().catch(err => console.error(err));