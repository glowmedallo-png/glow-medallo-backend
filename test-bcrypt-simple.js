const bcrypt = require('bcrypt');

const password = 'dango1';

bcrypt.hash(password, 10, (err, hash) => {
    if ( err ) console.error(err);
    console.log('Hash generado:', hash);
    bcrypt.compare(password, hash, (err, res) => {
        console.log('¿Coincide?', res); // Debe ser true
    });
});