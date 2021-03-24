const getDB = require("../../db");
const { generateRandomString, sendMail } = require("../../helpers");

const forgotCompanyPassword = async (req, res, next) => {
    let connection;

    try {
        //Creo conexión a la BBDD
        connection = await getDB();

        //Recojo el id
        const { id } = req.params
         console.log(id, req.auth.id);
        //Compruebo id proporcionado y el del token coinciden
        if(+id !== req.auth.id) {
            const error = new Error('No tiene permiso para realizar esta operación');
            error.httpStatus = 401;
            throw error;
        }

        const [email] = await connection.query(`
            SELECT email
            FROM company
            WHERE id=?
        `, [id]);

        //Creo un código de registro (contraseña temporal de un solo uso)
        const registrationCode = generateRandomString(40);

        await connection.query(`
            UPDATE company
            SET registrationCode=?
            WHERE id=?
        `, [registrationCode, id]);
        
        //Mando un email al usuario con el link de confirmación de email
        const emailBody = `
          Pulse este enlace para actualizar la contraseña de su empresa: ${process.env.PUBLIC_HOST}/company/${id}/forgottenCompanyPassword/${registrationCode}
        `;

        await sendMail({
            to: email,
            subject: 'Actualice la contraseña de su empresa en Nesstop',
            body: emailBody
        });
        
        res.send({
            message: 'Actualice la contraseña de su empresa. Revise su email'
        });
    } catch (error) {
        next(error);
    } finally {
        if(connection) connection.release();
    }
};

module.exports = forgotCompanyPassword;