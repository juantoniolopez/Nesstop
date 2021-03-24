const getDB = require("../../db");

const getUser = async (req, res, next) => {
    let connection;

    try {
        connection = await getDB();

        //Saco el id de los parámetros de ruta
        const { id } = req.params;
        
        //Saco la información del usuario
        const [user] = await connection.query(`
        SELECT id, signup_date, name, surname, city, email, avatar, role
        FROM user
        WHERE id=?
        `, [id]);
        console.log(user);
        //Creo la respuesta básica
        const userInfo = {
            avatar: user[0].avatar,
            name: user[0].name,
        }

        //Sí el usuario solicitado coincide con el del token añado a la respuesta básica los datos privados
        if(user[0].id === req.auth.id || req.auth.role === 'admin') {
            userInfo.surname = user[0].surname;
            userInfo.date = user[0].signup_date;
            userInfo.city = user[0].city;
            userInfo.email = user[0].email;
            userInfo.role = user[0].role;
        }

        //Devuelvo un json con las entradas
        res.send({
            status: "ok",
            data: userInfo
        });
    } catch (error) {
        //Lo mandamos al middleware de error
        next(error);
    } finally {
        if(connection) connection.release();
    }
};

module.exports = getUser;