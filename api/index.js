// server.js - Servidor principal de Glow Medallo (VERSIÓN COMPLETA CON ADMIN, GALERÍA, ESTADÍSTICAS, ASIGNACIÓN DE SERVICIOS, CALIFICACIONES Y VALIDACIÓN DE HORARIOS)

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
require('dotenv').config();

const saltRounds = 10;

// ========================== CONFIGURACIÓN DE CORREO ==========================
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'glowmedallo@gmail.com',
        pass: process.env.EMAIL_PASS || 'ingf xnir pgco eodt'
    }
});
transporter.verify((error, success) => {
    if (error) console.log('❌ Error de configuración de correo:', error);
    else console.log('✅ Servidor de correo configurado correctamente');
});

// ========================== MODELOS ==========================
const Servicio = require('./models/Servicio');
const Marca = require('./models/Marca');
const Modelo = require('./models/Modelo');
const Cita = require('./models/Cita');
const Cliente = require('./models/Cliente');
const Tecnico = require('./models/Tecnico');
const Calificacion = require('./models/Calificacion');
const Galeria = require('./models/Galeria');
const CalificacionServicio = require('./models/CalificacionServicio');

// ========================== CONFIGURACIÓN DE EXPRESS ==========================
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error de conexión a la base de datos' });
    }
});
// ========================== MULTER (MULTIPLES DESTINOS) ==========================
// Función para crear directorios si no existen
const ensureDir = (dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const storageFactory = (subfolder) => multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = `./public/uploads/${subfolder}`;
        ensureDir(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, unique + path.extname(file.originalname));
    }
});

const uploadGaleria = multer({ storage: storageFactory('galeria'), limits: { fileSize: 2 * 1024 * 1024 } });
const uploadTecnico = multer({ storage: storageFactory('tecnicos'), limits: { fileSize: 2 * 1024 * 1024 } });
const uploadMarca = multer({ storage: storageFactory('marcas'), limits: { fileSize: 2 * 1024 * 1024 } });
const uploadModelo = multer({ storage: storageFactory('modelos'), limits: { fileSize: 2 * 1024 * 1024 } });


// ========================== MIDDLEWARE ADMIN ==========================
function verificarAdmin(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No autorizado' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded.isAdmin) return res.status(403).json({ error: 'No tienes permisos de administrador' });
        req.usuario = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido' });
    }
}

// ========================== RUTAS PÚBLICAS ==========================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Servicios
app.get('/api/servicios', async (req, res) => {
    try {
        let servicios = await Servicio.find({ activo: true });
        if (servicios.length === 0) {
            servicios = [
                { id: 1, nombre: "✨ Recubrimiento Cerámico", descripcion: "Protección avanzada con brillo espejo", precioBase: 800000 },
                { id: 2, nombre: "🔄 Pulido de Pintura", descripcion: "Eliminación de rayas superficiales", precioBase: 350000 },
                { id: 3, nombre: "🔧 Detallado de Motor", descripcion: "Limpieza profunda del motor", precioBase: 180000 },
                { id: 4, nombre: "🪑 Limpieza de Tapicería", descripcion: "Limpieza profunda de asientos", precioBase: 150000 },
                { id: 5, nombre: "✨ Tratamiento de Pintura", descripcion: "Aplicación de sellador cerámico", precioBase: 450000 },
                { id: 6, nombre: "🚿 Lavado Premium", descripcion: "Lavado completo profesional", precioBase: 80000 },
                { id: 7, nombre: "🔦 Restauración de Faros", descripcion: "Pulido de faros opacos", precioBase: 120000 },
                { id: 8, nombre: "🛞 Limpieza de Llantas", descripcion: "Desengrase y brillo profesional", precioBase: 60000 }
            ];
        }
        res.json(servicios);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener servicios' });
    }
});

// Marcas
app.get('/api/marcas', async (req, res) => {
    try {
        let marcas = await Marca.find({ activo: true });
        if (marcas.length === 0) {
            marcas = [
                { id: 1, nombre: "audi", nombreMostrar: "Audi" },
                { id: 2, nombre: "bmw", nombreMostrar: "BMW" },
                { id: 3, nombre: "chevrolet", nombreMostrar: "Chevrolet" }
            ];
        }
        res.json(marcas);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener marcas' });
    }
});


// ========== MODELOS POR MARCA ==========
// ========== MODELOS POR MARCA (DESDE BD) ==========
app.get('/api/modelos/:marcaNombre', async (req, res) => {
    try {
        const marcaNombre = req.params.marcaNombre.toLowerCase();
        const marca = await Marca.findOne({ nombre: marcaNombre });
        if (!marca) return res.json([]);
        // Usar marca._id (ObjectId) y activo como string "true"
        const modelos = await Modelo.find({ 
            marcaId: marca._id, 
            activo: "true" 
        }).select('_id nombre categoria imagen');
        res.json(modelos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});
// ========== OBTENER MODELOS CON IMÁGENES (PÚBLICO) ==========
app.get('/api/modelos-con-imagenes', async (req, res) => {
    try {
        const modelos = await Modelo.find({ activo: true }).populate('marcaId', 'nombre nombreMostrar');
        const resultado = modelos.map(m => ({
            _id: m._id,
            nombre: m.nombre,
            marca: m.marcaId ? m.marcaId.nombre : null,        // ← añadido
            marcaMostrar: m.marcaId ? m.marcaId.nombreMostrar : null,
            imagen: m.imagen || null,
            categoria: m.categoria
        }));
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Técnicos (público)
app.get('/api/tecnicos', async (req, res) => {
    try {
        let tecnicos = await Tecnico.find({ activo: true });
        if (tecnicos.length === 0) {
            tecnicos = [
                { nombre: "Carlos Restrepo", especialidad: "Recubrimientos Cerámicos", experiencia: 8 },
                { nombre: "Ana María López", especialidad: "Restauración de Pintura", experiencia: 6 },
                { nombre: "Julián Pérez", especialidad: "Detallado de Interiores", experiencia: 5 }
            ];
        }
        res.json(tecnicos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener técnicos' });
    }
});

// Obtener un técnico por ID (público)
app.get('/api/tecnicos/:id', async (req, res) => {
    try {
        const tecnico = await Tecnico.findById(req.params.id).populate('servicios', 'nombre');
        if (!tecnico) return res.status(404).json({ error: 'Técnico no encontrado' });
        res.json(tecnico);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Registro
app.post('/api/registro', async (req, res) => {
    try {
        const { nombre, email, telefono, password } = req.body;
        if (!nombre || !email || !password || password.length < 6) return res.status(400).json({ error: 'Datos inválidos' });
        let clienteExistente = await Cliente.findOne({ email });
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        if (clienteExistente && clienteExistente.es_registrado) {
            return res.status(400).json({ error: 'Este correo ya está registrado' });
        }
        if (clienteExistente && !clienteExistente.es_registrado) {
            clienteExistente.nombre = nombre;
            clienteExistente.password = hashedPassword;
            clienteExistente.telefono = telefono || clienteExistente.telefono;
            clienteExistente.es_registrado = true;
            await clienteExistente.save();
            return res.json({ mensaje: 'Cuenta activada correctamente', success: true });
        }
        const nuevoCliente = new Cliente({
            nombre, email, telefono: telefono || '', password: hashedPassword, es_registrado: true
        });
        await nuevoCliente.save();
        res.json({ mensaje: 'Registro exitoso', success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error interno' });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const cliente = await Cliente.findOne({ email });
        if (!cliente || !cliente.es_registrado) return res.status(401).json({ error: 'Credenciales incorrectas' });
        const match = await bcrypt.compare(password, cliente.password);
        if (!match) return res.status(401).json({ error: 'Credenciales incorrectas' });
        const isAdmin = (cliente.email === 'glowmedallo@gmail.com') || (cliente.isAdmin === true);
        const token = jwt.sign(
            { id: cliente._id, email: cliente.email, nombre: cliente.nombre, isAdmin },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        res.json({
            success: true, token,
            cliente: { id: cliente._id, nombre: cliente.nombre, email: cliente.email, telefono: cliente.telefono || '', isAdmin }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error en login' });
    }
});

// Olvidé contraseña
app.post('/api/olvide-password', async (req, res) => {
    try {
        const { email } = req.body;
        const cliente = await Cliente.findOne({ email, es_registrado: true });
        if (!cliente) return res.status(404).json({ error: 'No hay cuenta registrada con ese correo' });
        const token = crypto.randomBytes(32).toString('hex');
        cliente.resetToken = token;
        cliente.resetExpires = Date.now() + 3600000;
        await cliente.save();
        const resetUrl = `http://localhost:5000/restablecer.html?token=${token}`;
        await transporter.sendMail({
            from: '"Glow Medallo" <glowmedallo@gmail.com>',
            to: cliente.email,
            subject: 'Recuperación de contraseña',
            html: `<a href="${resetUrl}">Restablecer contraseña</a><br>Válido por 1 hora.`
        });
        res.json({ mensaje: 'Correo enviado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al procesar' });
    }
});

// Restablecer contraseña
app.post('/api/restablecer', async (req, res) => {
    try {
        const { token, nuevaPassword } = req.body;
        if (!token || !nuevaPassword || nuevaPassword.length < 6) return res.status(400).json({ error: 'Datos inválidos' });
        const cliente = await Cliente.findOne({ resetToken: token, resetExpires: { $gt: Date.now() } });
        if (!cliente) return res.status(400).json({ error: 'Token inválido o expirado' });
        cliente.password = await bcrypt.hash(nuevaPassword, 10);
        cliente.resetToken = undefined;
        cliente.resetExpires = undefined;
        await cliente.save();
        res.json({ mensaje: 'Contraseña actualizada' });
    } catch (error) {
        res.status(500).json({ error: 'Error al restablecer' });
    }
});

// ========== NUEVO ENDPOINT PARA OBTENER HORAS DISPONIBLES ==========
app.get('/api/horarios-disponibles', async (req, res) => {
    try {
        const { fecha, id_tecnico } = req.query;
        if (!fecha) return res.status(400).json({ error: 'Se requiere fecha' });

        const fechaObj = new Date(fecha);
        const dia = fechaObj.getDay(); // 0=domingo, 6=sábado
        let inicio, fin;
        if (dia === 0) {
            return res.json({ disponibles: [], mensaje: 'Domingos cerrado' });
        } else if (dia === 6) {
            inicio = 9; fin = 16;
        } else {
            inicio = 8; fin = 18;
        }

        // Generar horas cada 30 minutos
        const horas = [];
        for (let h = inicio; h < fin; h++) {
            horas.push(`${h.toString().padStart(2, '0')}:00`);
            horas.push(`${h.toString().padStart(2, '0')}:30`);
        }

        let ocupadas = [];
        if (id_tecnico) {
            const citas = await Cita.find({
                id_tecnico,
                fechaCita: { $regex: `^${fecha}` }
            });
            ocupadas = citas.map(c => c.fechaCita.split(' ')[1]);
        }

        const disponibles = horas.filter(h => !ocupadas.includes(h));
        res.json({ disponibles, horario: { inicio, fin } });
    } catch (error) {
        console.error('Error en /api/horarios-disponibles:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== GUARDAR CITA (con técnico recomendado, validación de horario y conflictos) ==========
app.post('/api/citas', async (req, res) => {
    try {
        const citaData = req.body;
        if (!citaData.cliente || !citaData.vehiculo || !citaData.servicios || !citaData.fechaCita) {
            return res.status(400).json({ error: 'Faltan datos' });
        }
        if (!citaData.cliente.telefono) citaData.cliente.telefono = '';

        // Validar fecha y hora dentro del horario laboral
        const fechaCita = new Date(citaData.fechaCita);
        const dia = fechaCita.getDay();
        let inicio, fin;
        if (dia === 0) return res.status(400).json({ error: 'Domingos no laborables' });
        else if (dia === 6) { inicio = 9; fin = 16; }
        else { inicio = 8; fin = 18; }
        const hora = parseInt(citaData.fechaCita.split(' ')[1].split(':')[0]);
        const minutos = parseInt(citaData.fechaCita.split(' ')[1].split(':')[1]);
        if (hora < inicio || hora >= fin || (hora === fin - 1 && minutos > 30)) {
            return res.status(400).json({ error: 'Horario no válido' });
        }

        // Asignar técnico si no viene
        if (!citaData.id_tecnico && citaData.servicios.length) {
            const idsServicios = citaData.servicios.map(s => s._id).filter(id => id);
            if (idsServicios.length) {
                const tecnicos = await Tecnico.find({ activo: true }).populate('servicios');
                let mejorTecnico = null;
                let maxMatch = 0;
                for (const tecnico of tecnicos) {
                    const serviciosTecnicoIds = tecnico.servicios.map(s => s._id.toString());
                    const match = idsServicios.filter(id => serviciosTecnicoIds.includes(id)).length;
                    if (match > maxMatch) {
                        maxMatch = match;
                        mejorTecnico = tecnico;
                    }
                }
                if (mejorTecnico) citaData.id_tecnico = mejorTecnico._id;
            }
        }

        // Validar que el técnico no tenga otra cita a la misma hora
        if (citaData.id_tecnico) {
            const conflicto = await Cita.findOne({
                id_tecnico: citaData.id_tecnico,
                fechaCita: citaData.fechaCita
            });
            if (conflicto) return res.status(409).json({ error: 'El técnico ya tiene una cita a esa hora' });
        }

        const nuevaCita = new Cita(citaData);
        await nuevaCita.save();

        let clienteExistente = await Cliente.findOne({ email: citaData.cliente.email });
        if (!clienteExistente) {
            clienteExistente = new Cliente({
                nombre: citaData.cliente.nombre,
                telefono: citaData.cliente.telefono,
                email: citaData.cliente.email,
                citas: [nuevaCita._id]
            });
            await clienteExistente.save();
        } else {
            clienteExistente.citas.push(nuevaCita._id);
            await clienteExistente.save();
        }

        res.json({ success: true, mensaje: 'Cita guardada', citaId: nuevaCita._id });
        setTimeout(() => enviarCorreoConfirmacion(citaData, nuevaCita._id), 100);
    } catch (error) {
        console.error('Error guardando cita:', error);
        res.status(500).json({ error: error.message });
    }
});

// Perfil
app.get('/api/perfil', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No autorizado' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const cliente = await Cliente.findById(decoded.id).select('-password');
        res.json({ success: true, cliente });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener perfil' });
    }
});

// Actualizar perfil
app.put('/api/clientes/actualizar', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No autorizado' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { nombre, telefono, password } = req.body;
        const cliente = await Cliente.findById(decoded.id);
        if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
        if (nombre) cliente.nombre = nombre;
        if (telefono) cliente.telefono = telefono;
        if (password && password.trim() !== '') {
            cliente.password = await bcrypt.hash(password, 10);
        }
        await cliente.save();
        res.json({ success: true, mensaje: 'Perfil actualizado', cliente: { id: cliente._id, nombre: cliente.nombre, email: cliente.email, telefono: cliente.telefono } });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar perfil' });
    }
});

// Mis citas (cliente)
app.get('/api/citas/mis-citas', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No autorizado' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const citas = await Cita.find({ 'cliente.email': decoded.email }).sort({ fechaCita: -1 });
        res.json(citas);
    } catch (error) {
        res.status(500).json({ error: 'Error al cargar citas' });
    }
});

// ========== ENDPOINTS PARA CALIFICACIONES (obtener y editar) ==========

// Obtener calificación de técnico por cita
app.get('/api/calificacion-tecnico/:citaId', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No autorizado' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const calificacion = await Calificacion.findOne({ id_cita: req.params.citaId, id_cliente: decoded.id });
        if (!calificacion) return res.json({ existe: false });
        res.json({ existe: true, estrellas: calificacion.estrellas, comentario: calificacion.comentario });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener calificación de servicio por cita
app.get('/api/calificacion-servicio/:citaId', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No autorizado' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const calificacion = await CalificacionServicio.findOne({ id_cita: req.params.citaId, id_cliente: decoded.id });
        if (!calificacion) return res.json({ existe: false });
        res.json({ existe: true, estrellas: calificacion.estrellas, comentario: calificacion.comentario });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Calificar (o actualizar) un técnico de una cita completada (POST y PUT)
app.post('/api/calificar-cita', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No autorizado' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { id_cita, estrellas, comentario } = req.body;
        const cita = await Cita.findById(id_cita);
        if (!cita) return res.status(404).json({ error: 'Cita no encontrada' });
        if (cita.estado !== 'completada') return res.status(400).json({ error: 'Solo puedes calificar citas completadas' });
        if (cita.cliente.email !== decoded.email) return res.status(403).json({ error: 'No autorizado' });
        const yaCalifico = await Calificacion.findOne({ id_cita });
        if (yaCalifico) return res.status(400).json({ error: 'Ya calificaste esta cita. Usa PUT para editar.' });
        const nueva = new Calificacion({
            id_cita,
            id_tecnico: cita.id_tecnico,
            id_cliente: decoded.id,
            estrellas,
            comentario: comentario || ''
        });
        await nueva.save();
        res.json({ success: true, mensaje: 'Calificación guardada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/calificar-cita/:citaId', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No autorizado' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { estrellas, comentario } = req.body;
        const cita = await Cita.findById(req.params.citaId);
        if (!cita) return res.status(404).json({ error: 'Cita no encontrada' });
        if (cita.estado !== 'completada') return res.status(400).json({ error: 'Solo puedes calificar citas completadas' });
        if (cita.cliente.email !== decoded.email) return res.status(403).json({ error: 'No autorizado' });
        let calificacion = await Calificacion.findOne({ id_cita: req.params.citaId, id_cliente: decoded.id });
        if (!calificacion) {
            return res.status(404).json({ error: 'Calificación no encontrada' });
        }
        calificacion.estrellas = estrellas;
        calificacion.comentario = comentario || '';
        await calificacion.save();
        res.json({ success: true, mensaje: 'Calificación actualizada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Calificar (o actualizar) servicio de una cita completada
app.post('/api/calificar-servicio', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No autorizado' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { id_cita, estrellas, comentario } = req.body;
        const cita = await Cita.findById(id_cita);
        if (!cita) return res.status(404).json({ error: 'Cita no encontrada' });
        if (cita.estado !== 'completada') return res.status(400).json({ error: 'Solo puedes calificar servicios de citas completadas' });
        if (cita.cliente.email !== decoded.email) return res.status(403).json({ error: 'No autorizado' });
        const yaCalifico = await CalificacionServicio.findOne({ id_cita, id_cliente: decoded.id });
        if (yaCalifico) return res.status(400).json({ error: 'Ya calificaste el servicio de esta cita. Usa PUT para editar.' });
        const nueva = new CalificacionServicio({
            id_cita,
            id_cliente: decoded.id,
            estrellas,
            comentario: comentario || ''
        });
        await nueva.save();
        res.json({ success: true, mensaje: 'Calificación de servicio guardada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/calificar-servicio/:citaId', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No autorizado' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { estrellas, comentario } = req.body;
        const cita = await Cita.findById(req.params.citaId);
        if (!cita) return res.status(404).json({ error: 'Cita no encontrada' });
        if (cita.estado !== 'completada') return res.status(400).json({ error: 'Solo puedes calificar servicios de citas completadas' });
        if (cita.cliente.email !== decoded.email) return res.status(403).json({ error: 'No autorizado' });
        let calificacion = await CalificacionServicio.findOne({ id_cita: req.params.citaId, id_cliente: decoded.id });
        if (!calificacion) {
            return res.status(404).json({ error: 'Calificación no encontrada' });
        }
        calificacion.estrellas = estrellas;
        calificacion.comentario = comentario || '';
        await calificacion.save();
        res.json({ success: true, mensaje: 'Calificación de servicio actualizada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Calificaciones de un técnico (público, con comentarios)
app.get('/api/calificaciones/:id_tecnico', async (req, res) => {
    try {
        const calificaciones = await Calificacion.find({ id_tecnico: req.params.id_tecnico });
        const promedio = calificaciones.reduce((a, c) => a + c.estrellas, 0) / (calificaciones.length || 1);
        const comentarios = calificaciones.map(c => ({
            estrellas: c.estrellas,
            comentario: c.comentario,
            fecha: c.fecha
        }));
        res.json({ promedio, total: calificaciones.length, comentarios });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== RUTAS ADMINISTRATIVAS ==========
app.get('/api/tecnicos-con-servicios', verificarAdmin, async (req, res) => {
    try {
        const tecnicos = await Tecnico.find().populate('servicios', 'nombre _id');
        res.json(tecnicos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/tecnicos/:id/asignar-servicios', verificarAdmin, async (req, res) => {
    try {
        const { serviciosIds } = req.body;
        const tecnico = await Tecnico.findById(req.params.id);
        if (!tecnico) return res.status(404).json({ error: 'Técnico no encontrado' });
        tecnico.servicios = serviciosIds || [];
        await tecnico.save();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/admin/stats', verificarAdmin, async (req, res) => {
    try {
        const citas = await Cita.find();
        const clientes = await Cliente.find({ es_registrado: true });
        const ventasPorMes = {};
        const clientesPorMes = {};

        citas.forEach(c => {
            const fecha = new Date(c.createdAt);
            const mes = `${fecha.getFullYear()}-${fecha.getMonth() + 1}`;
            ventasPorMes[mes] = (ventasPorMes[mes] || 0) + c.total;
        });
        clientes.forEach(c => {
            const fecha = new Date(c.createdAt);
            const mes = `${fecha.getFullYear()}-${fecha.getMonth() + 1}`;
            clientesPorMes[mes] = (clientesPorMes[mes] || 0) + 1;
        });

        res.json({
            totalVentas: citas.reduce((a, c) => a + c.total, 0),
            totalCitas: citas.length,
            totalClientes: clientes.length,
            ventasPorMes,
            clientesPorMes
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// CRUD Técnicos
app.post('/api/tecnicos', verificarAdmin, async (req, res) => {
    try {
        const { nombre, especialidad, experiencia, certificaciones, foto, presentacion } = req.body;
        if (!nombre || !especialidad || !experiencia) {
            return res.status(400).json({ error: 'Faltan datos obligatorios' });
        }
        const nuevo = new Tecnico({
            nombre,
            especialidad,
            experiencia: Number(experiencia),
            certificaciones: certificaciones || [],
            foto: foto || '',
            presentacion: presentacion || '',
            activo: true
        });
        await nuevo.save();
        res.json({ success: true, tecnico: nuevo });
    } catch (error) {
        console.error('❌ Error guardando técnico:', error);
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/tecnicos/:id', verificarAdmin, async (req, res) => {
    const actualizado = await Tecnico.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, tecnico: actualizado });
});

app.delete('/api/tecnicos/:id', verificarAdmin, async (req, res) => {
    await Tecnico.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

// ========== SUBIR FOTO DE TÉCNICO (ADMIN) ==========
app.post('/api/tecnicos/:id/foto', verificarAdmin, uploadTecnico.single('foto'), async (req, res) => {
    try {
        const tecnico = await Tecnico.findById(req.params.id);
        if (!tecnico) return res.status(404).json({ error: 'Técnico no encontrado' });
        if (req.file) {
            // Eliminar foto anterior si existe
            if (tecnico.foto) {
                const oldPath = path.join(__dirname, 'public', tecnico.foto);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            tecnico.foto = `/uploads/tecnicos/${req.file.filename}`;
            await tecnico.save();
            res.json({ success: true, foto: tecnico.foto });
        } else {
            res.status(400).json({ error: 'No se recibió ninguna imagen' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/servicios/:id', verificarAdmin, async (req, res) => {
    const { precioBase } = req.body;
    const servicio = await Servicio.findByIdAndUpdate(req.params.id, { precioBase }, { new: true });
    res.json({ success: true, servicio });
});

app.get('/api/admin/citas', verificarAdmin, async (req, res) => {
    const citas = await Cita.find().sort({ fechaCita: -1 });
    res.json(citas);
});

app.put('/api/admin/citas/:id/confirmar', verificarAdmin, async (req, res) => {
    const cita = await Cita.findById(req.params.id);
    if (!cita) return res.status(404).json({ error: 'Cita no encontrada' });
    cita.estado = 'confirmada';
    await cita.save();
    const mailOptions = {
        from: '"Glow Medallo" <glowmedallo@gmail.com>',
        to: cita.cliente.email,
        subject: '✅ Tu cita ha sido confirmada',
        html: `<h2>¡Cita confirmada!</h2><p>Hola ${cita.cliente.nombre}, tu cita para el ${cita.fechaCita} ha sido confirmada. Te esperamos.</p>`
    };
    await transporter.sendMail(mailOptions);
    res.json({ success: true, mensaje: 'Cita confirmada y correo enviado' });
});

app.put('/api/admin/citas/:id/estado', verificarAdmin, async (req, res) => {
    const { estado } = req.body;
    const estadosValidos = ['pendiente', 'confirmada', 'en_proceso', 'completada', 'cancelada'];
    if (!estadosValidos.includes(estado)) return res.status(400).json({ error: 'Estado no válido' });
    const cita = await Cita.findByIdAndUpdate(req.params.id, { estado }, { new: true });
    if (!cita) return res.status(404).json({ error: 'Cita no encontrada' });
    res.json({ success: true, cita });
});
// ========== GESTIÓN DE MARCAS (ADMIN) ==========
app.get('/api/admin/marcas', verificarAdmin, async (req, res) => {
    try {
        const marcas = await Marca.find().sort({ id: 1 });
        res.json(marcas);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/admin/marcas/:id', verificarAdmin, async (req, res) => {
    try {
        const marca = await Marca.findById(req.params.id);
        if (!marca) return res.status(404).json({ error: 'Marca no encontrada' });
        res.json(marca);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/admin/marcas', verificarAdmin, uploadMarca.single('imagen'), async (req, res) => {
    try {
        const { nombre, nombreMostrar } = req.body;
        if (!nombre || !nombreMostrar) return res.status(400).json({ error: 'Faltan datos' });
        const ultimaMarca = await Marca.findOne().sort({ id: -1 });
        const newId = ultimaMarca ? ultimaMarca.id + 1 : 1;
        const imagen = req.file ? `/uploads/marcas/${req.file.filename}` : '';
        const nuevaMarca = new Marca({
            id: newId,
            nombre: nombre.toLowerCase(),
            nombreMostrar,
            imagen,
            activo: true
        });
        await nuevaMarca.save();
        res.json({ success: true, marca: nuevaMarca });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/admin/marcas/:id', verificarAdmin, uploadMarca.single('imagen'), async (req, res) => {
    try {
        const { nombre, nombreMostrar, activo } = req.body;
        const marca = await Marca.findById(req.params.id);
        if (!marca) return res.status(404).json({ error: 'Marca no encontrada' });
        if (nombre) marca.nombre = nombre.toLowerCase();
        if (nombreMostrar) marca.nombreMostrar = nombreMostrar;
        if (activo !== undefined) marca.activo = activo === 'true' || activo === true;
        if (req.file) {
            if (marca.imagen) {
                const oldPath = path.join(__dirname, 'public', marca.imagen);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            marca.imagen = `/uploads/marcas/${req.file.filename}`;
        }
        await marca.save();
        res.json({ success: true, marca });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.delete('/api/admin/marcas/:id', verificarAdmin, async (req, res) => {
    try {
        const marca = await Marca.findById(req.params.id);
        if (!marca) return res.status(404).json({ error: 'Marca no encontrada' });
        if (marca.imagen) {
            const imgPath = path.join(__dirname, 'public', marca.imagen);
            if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
        }
        await Marca.deleteOne({ _id: req.params.id });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== GESTIÓN DE MODELOS (ADMIN) ==========
app.get('/api/admin/modelos', verificarAdmin, async (req, res) => {
    try {
        const modelos = await Modelo.find().populate('marcaId', 'nombre nombreMostrar');
        res.json(modelos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/admin/modelos/:id', verificarAdmin, async (req, res) => {
    try {
        const modelo = await Modelo.findById(req.params.id);
        if (!modelo) return res.status(404).json({ error: 'Modelo no encontrado' });
        res.json(modelo);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/admin/modelos', verificarAdmin, uploadModelo.single('imagen'), async (req, res) => {
    try {
        const { marcaId, nombre, categoria, activo } = req.body;
        if (!marcaId || !nombre) return res.status(400).json({ error: 'Faltan datos' });
        const ultimoModelo = await Modelo.findOne().sort({ id: -1 });
        const newId = ultimoModelo ? ultimoModelo.id + 1 : 1;
        const imagen = req.file ? `/uploads/modelos/${req.file.filename}` : '';
        const nuevoModelo = new Modelo({
            id: newId,
            marcaId,
            nombre,
            categoria: categoria || 'MEDIANO',
            imagen,
            activo: activo === 'true' || activo === true || true
        });
        await nuevoModelo.save();
        res.json({ success: true, modelo: nuevoModelo });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/admin/modelos/:id', verificarAdmin, uploadModelo.single('imagen'), async (req, res) => {
    try {
        const { marcaId, nombre, categoria, activo } = req.body;
        const modelo = await Modelo.findById(req.params.id);
        if (!modelo) return res.status(404).json({ error: 'Modelo no encontrado' });
        if (marcaId) modelo.marcaId = marcaId;
        if (nombre) modelo.nombre = nombre;
        if (categoria) modelo.categoria = categoria;
        if (activo !== undefined) modelo.activo = activo === 'true' || activo === true;
        if (req.file) {
            if (modelo.imagen) {
                const oldPath = path.join(__dirname, 'public', modelo.imagen);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            modelo.imagen = `/uploads/modelos/${req.file.filename}`;
        }
        await modelo.save();
        res.json({ success: true, modelo });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/admin/modelos/:id', verificarAdmin, async (req, res) => {
    try {
        const modelo = await Modelo.findById(req.params.id);
        if (!modelo) return res.status(404).json({ error: 'Modelo no encontrado' });
        if (modelo.imagen) {
            const imgPath = path.join(__dirname, 'public', modelo.imagen);
            if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
        }
        await Modelo.deleteOne({ _id: req.params.id });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== RECOMENDAR TÉCNICO (CON FOTO) ==========
app.post('/api/recomendar-tecnico', async (req, res) => {
    try {
        const { idsServicios } = req.body;
        if (!idsServicios || idsServicios.length === 0) {
            return res.json({ recomendado: null });
        }
        const tecnicos = await Tecnico.find({ activo: true }).populate('servicios');
        let mejorTecnico = null;
        let maxMatch = 0;
        for (const tecnico of tecnicos) {
            const serviciosTecnicoIds = tecnico.servicios.map(s => s._id.toString());
            const match = idsServicios.filter(id => serviciosTecnicoIds.includes(id)).length;
            if (match > maxMatch) {
                maxMatch = match;
                mejorTecnico = tecnico;
            }
        }
        if (mejorTecnico) {
            res.json({
                recomendado: {
                    id: mejorTecnico._id,
                    nombre: mejorTecnico.nombre,
                    especialidad: mejorTecnico.especialidad,
                    foto: mejorTecnico.foto || '',          // ← NUEVO: incluye la foto
                    matchCount: maxMatch,
                    totalSeleccionados: idsServicios.length
                }
            });
        } else {
            res.json({ recomendado: null });
        }
    } catch (error) {
        console.error('Error en recomendación:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========================== GALERÍA (ADMIN) ==========================
app.post('/api/admin/galeria', verificarAdmin, uploadGaleria.fields([{ name: 'antes' }, { name: 'despues' }]), async (req, res) => {
    try {
        const { titulo, descripcion, categoria } = req.body;
        const antes = req.files['antes'] ? `/uploads/galeria/${req.files['antes'][0].filename}` : '';
        const despues = req.files['despues'] ? `/uploads/galeria/${req.files['despues'][0].filename}` : '';
        const nueva = new Galeria({ titulo, descripcion, categoria, url_antes: antes, url_despues: despues });
        await nueva.save();
        res.json({ success: true, imagen: nueva });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/galeria', async (req, res) => {
    const imagenes = await Galeria.find({ activo: true });
    res.json(imagenes);
});

app.delete('/api/admin/galeria/:id', verificarAdmin, async (req, res) => {
    const img = await Galeria.findById(req.params.id);
    if (!img) return res.status(404).json({ error: 'No encontrada' });
    if (img.url_antes) {
        const filePath = path.join(__dirname, 'public', img.url_antes);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    if (img.url_despues) {
        const filePath = path.join(__dirname, 'public', img.url_despues);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await Galeria.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

// ========================== FUNCIÓN AUXILIAR CORREO ==========================
async function enviarCorreoConfirmacion(citaData, citaId) {
    try {
        const { cliente, vehiculo, servicios, total, fechaCita } = citaData;
        const fechaFormateada = new Date(fechaCita).toLocaleString('es-CO');
        const listaServicios = servicios.map(s => `• ${s.nombre}: $${s.precioFinal.toLocaleString('es-CO')} COP`).join('\n');
        const mailCliente = {
            from: '"Glow Medallo" <glowmedallo@gmail.com>',
            to: cliente.email,
            subject: '✅ Confirmación de cita - Glow Medallo',
            text: `Hola ${cliente.nombre},\n\nTu cita ha sido agendada exitosamente.\nFecha: ${fechaFormateada}\nVehículo: ${vehiculo.marca} ${vehiculo.modelo}\nServicios:\n${listaServicios}\nTotal: $${total.toLocaleString('es-CO')} COP\n\nTe esperamos.`
        };
        await transporter.sendMail(mailCliente);
        console.log(`📧 Correo de confirmación enviado a ${cliente.email}`);
    } catch (error) {
        console.error('❌ Error enviando correo:', error);
    }
}

// ========================== CONEXIÓN A MONGODB Y DATOS INICIALES ==========================
async function insertarDatosIniciales() {
    if ((await Servicio.countDocuments()) === 0) {
        await Servicio.insertMany([
            { id: 1, nombre: "✨ Recubrimiento Cerámico", descripcion: "Protección avanzada", precioBase: 800000, categoria: "premium" },
            { id: 2, nombre: "🔄 Pulido de Pintura", descripcion: "Eliminación de rayas", precioBase: 350000, categoria: "standard" },
            { id: 3, nombre: "🔧 Detallado de Motor", descripcion: "Limpieza profunda", precioBase: 180000, categoria: "standard" },
            { id: 4, nombre: "🪑 Limpieza de Tapicería", descripcion: "Limpieza profunda", precioBase: 150000, categoria: "standard" },
            { id: 5, nombre: "✨ Tratamiento de Pintura", descripcion: "Sellador cerámico", precioBase: 450000, categoria: "premium" },
            { id: 6, nombre: "🚿 Lavado Premium", descripcion: "Lavado completo", precioBase: 80000, categoria: "basico" },
            { id: 7, nombre: "🔦 Restauración de Faros", descripcion: "Pulido de faros", precioBase: 120000, categoria: "standard" },
            { id: 8, nombre: "🛞 Limpieza de Llantas", descripcion: "Desengrase", precioBase: 60000, categoria: "basico" }
        ]);
        console.log('📦 Servicios iniciales insertados');
    }
    if ((await Marca.countDocuments()) === 0) {
        await Marca.insertMany([
            { id: 1, nombre: "audi", nombreMostrar: "Audi" },
            { id: 2, nombre: "bmw", nombreMostrar: "BMW" },
            { id: 3, nombre: "chevrolet", nombreMostrar: "Chevrolet" },
            { id: 4, nombre: "renault", nombreMostrar: "Renault" },
            { id: 5, nombre: "mazda", nombreMostrar: "Mazda" },
            { id: 6, nombre: "toyota", nombreMostrar: "Toyota" },
            { id: 7, nombre: "hyundai", nombreMostrar: "Hyundai" },
            { id: 8, nombre: "kia", nombreMostrar: "Kia" },
            { id: 9, nombre: "nissan", nombreMostrar: "Nissan" },
            { id: 10, nombre: "ford", nombreMostrar: "Ford" }
        ]);
        console.log('📦 Marcas iniciales insertadas');
    }
    if ((await Tecnico.countDocuments()) === 0) {
        await Tecnico.insertMany([
            { nombre: "Carlos Restrepo", especialidad: "Recubrimientos Cerámicos", experiencia: 8, certificaciones: ["Ceramic Pro Certified"] },
            { nombre: "Ana María López", especialidad: "Restauración de Pintura", experiencia: 6, certificaciones: ["3M Advanced Training"] },
            { nombre: "Julián Pérez", especialidad: "Detallado de Interiores", experiencia: 5, certificaciones: ["Chemical Guys Pro"] }
        ]);
        console.log('📦 Técnicos iniciales insertados');
    }
}

// ========================== NUEVO: Obtener calificaciones de servicios (para página de inicio) ==========================
app.get('/api/calificaciones-servicio', async (req, res) => {
    try {
        const calificaciones = await CalificacionServicio.find()
            .sort({ fecha: -1 })
            .limit(6)
            .populate('id_cita', 'cliente servicios');
        
        const resultado = await Promise.all(calificaciones.map(async cal => {
            const nombreCliente = cal.id_cita?.cliente?.nombre || 'Cliente';
            const servicios = cal.id_cita?.servicios?.map(s => s.nombre).join(', ') || 'Servicio';
            return {
                id: cal._id,
                cliente: nombreCliente,
                servicios: servicios,
                estrellas: cal.estrellas,
                comentario: cal.comentario || 'Sin comentario',
                fecha: cal.fecha
            };
        }));
        res.json(resultado);
    } catch (error) {
        console.error('Error en /api/calificaciones-servicio:', error);
        res.status(500).json({ error: error.message });
    }
});

let cachedDb = null;
const connectDB = async () => {
    if (cachedDb && mongoose.connection.readyState === 1) {
        return cachedDb;
    }
    await mongoose.connect(process.env.MONGODB_URI);
    cachedDb = mongoose.connection;
    console.log('✅ Conectado a MongoDB');
    await insertarDatosIniciales();
    return cachedDb;
};

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.send('Servidor Glow Medallo funcionando 🚀');
});

// ========================== INICIAR SERVIDOR ==========================


module.exports = app;