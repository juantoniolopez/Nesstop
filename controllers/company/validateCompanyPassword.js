const getDB = require("../../db");

const validateCompanyPassword = async (req, res, next) => {
    let connection;

    try {
        connection = await getDB();

        const { registrationCode } = req.params;
        const { newPassword, repeatPassword } = req.body;

        if(newPassword !== repeatPassword) {
            const error = new Error('Las contraseñas no coinciden');
            error.httpStatus = 418;
            throw error;
        }

        //Activar el usuario y quitarle el registrationCode
        await connection.query(`
            UPDATE company
            SET password=SHA2(?, 512), registrationCode=NULL
            WHERE registrationCode=?
        `, [newPassword, registrationCode]);

        //Devolver una respuesta

        res.send({
            status: "ok",
            message: "Contraseña actualizada"
        });
    } catch(error) {
        next(error);
    } finally {
        if(connection) connection.release();
    }
}

module.exports = validateCompanyPassword;