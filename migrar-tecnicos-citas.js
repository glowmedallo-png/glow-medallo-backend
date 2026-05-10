const mongoose = require('mongoose');
require('dotenv').config();

const Cita = require('./models/Cita');
const Tecnico = require('./models/Tecnico');
const Servicio = require('./models/Servicio');

async function migrar() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const citas = await Cita.find({ id_tecnico: { $exists: false } });
    console.log(`📋 Citas sin técnico: ${citas.length}`);

    let actualizadas = 0;

    for (const cita of citas) {
        if (!cita.servicios || cita.servicios.length === 0) continue;

        // Extraer los ids numéricos de los servicios de la cita
        const idsServiciosCita = cita.servicios.map(s => s.id).filter(id => id);
        if (idsServiciosCita.length === 0) continue;

        // Obtener todos los técnicos con sus servicios poblados
        const tecnicos = await Tecnico.find({ activo: true }).populate('servicios');
        let mejorTecnico = null;
        let maxMatch = 0;

        for (const tecnico of tecnicos) {
            // Obtener los ids numéricos de los servicios del técnico
            const idsServiciosTecnico = tecnico.servicios.map(s => s.id);
            const match = idsServiciosCita.filter(id => idsServiciosTecnico.includes(id)).length;
            if (match > maxMatch) {
                maxMatch = match;
                mejorTecnico = tecnico;
            }
        }

        if (mejorTecnico && maxMatch > 0) {
            cita.id_tecnico = mejorTecnico._id;
            await cita.save();
            console.log(`✅ Cita ${cita._id} asignada a ${mejorTecnico.nombre} (${maxMatch} coincidencias)`);
            actualizadas++;
        } else {
            console.log(`⚠️ Cita ${cita._id} sin técnico compatible (ningún servicio coincide)`);
        }
    }

    console.log(`🎉 Migración completada. Se actualizaron ${actualizadas} citas.`);
    process.exit();
}

migrar().catch(console.error);