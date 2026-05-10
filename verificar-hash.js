const bcrypt = require('bcrypt');

// --- CAMBIA ESTOS VALORES ---
const hashDesdeDB = "$2b$10$tapcmhU4LcHi.ysNh2htYurqPDNXgh8dCHixItdZyg8m53hf4T3c2";
const passwordIngresada = "dango1";

bcrypt.compare(passwordIngresada, hashDesdeDB, (err, result) => {
    if (err) console.error(err);
    console.log("¿Coincide la contraseña con el hash?", result);
});