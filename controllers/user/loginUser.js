const getDB = require("../../db");
const jwt = require("jsonwebtoken");

const loginUser = async (req, res, next) => {
    let connection;

    try {
        connection = await getDB();

        //Recoger el email y la password de req.body
        const { email, password } = req.body;

        //Si el email o password están vacios enviamos un error
        if(!email || !password) {
            const error = new Error('Faltan campos');
            error.httpStatus = 400;
            throw(error);
        }

        //Seleccionar el usuario de la BBDD con ese email y password
        const [user] = await connection.query(`
            SELECT id, role, active
            FROM user
            WHERE email=? AND password=SHA2(?, 512)
        `, [email, password]);

        //Sí no existe asumimos que el email o la password son incorrectos
        if(user.length === 0) {
            const error = new Error('El email o la password son incorrectos');
            error.hhtpStatus = 401;
            throw(error);
        }

        //Sí existe y no está activo avisamos de que está pendiente de activar
        if(!user[0].active) {
            const error = new Error('El usuario existe pero está pendiente de validar. Comprueba tu email');
            error.httpStatus = 401;
            throw(error);
        }

        //Asumimos que el login es correcto
        //Creo el ojeto de información que irá en el token
        const info = {
            id: user[0].id,
            role: user[0].role
        };

        const token = jwt.sign(info, process.env.SECRET, {
            expiresIn: '30d'
        });

        res.send({
            status: "ok",
            data: {
                token
            }
        });
    } catch(error) {
        next(error);
    } finally {
        if(connection) connection.release();
    }
}

module.exports = loginUser;