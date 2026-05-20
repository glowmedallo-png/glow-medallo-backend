const mongoose = require('mongoose');
const uri = 'mongodb+srv://glowmedallo_db_user:qgCvUauAf6jtwC2c@cluster0.kew4z97.mongodb.net/glow_medallo?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(uri)
  .then(() => {
    console.log('✅ Conexión exitosa');
    return mongoose.connection.db.listCollections().toArray();
  })
  .then(collections => {
    console.log('Colecciones:', collections.map(c => c.name));
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error de conexión:', err);
    process.exit(1);
  });