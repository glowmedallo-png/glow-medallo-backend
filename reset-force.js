const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();
const Cliente = require('./models/Cliente');

async function resetExplicito() {
    await mongoose.connect(process.env.MONGODB_URI);
    const email = 'juanmanuelmeneseszapata@gmail.com';
    const nuevaPassword = 'dango1';

    // 1. Buscar el cliente
    const cliente = await Cliente.findOne({ email });
    if (!cliente) {
        console.log('❌ Cliente no encontrado');
        process.exit();
    }
    console.log('Cliente encontrado:', cliente.email);
    console.log('Hash actual antes de cambiar:', cliente.password);

    // 2. Generar nuevo hash
    const nuevoHash = await bcrypt.hash(nuevaPassword, 10);
    console.log('Nuevo hash generado:', nuevoHash);

    // 3. Actualizar
    cliente.password = nuevoHash;
    cliente.es_registrado = true;
    await cliente.save();

    // 4. Verificar inmediatamente
    const verificar = await bcrypt.compare(nuevaPassword, cliente.password);
    console.log('Verificación post-guardado:', verificar ? '✅ Correcta' : '❌ Falló');

    // 5. Confirmar en BD
    const refresh = await Cliente.findOne({ email });
    console.log('Hash final en BD:', refresh.password);

    process.exit();
}
resetExplicito();