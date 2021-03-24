const getDB = require("../../db");
const { sendMail } = require("../../helpers");

const validateUserCompany = async (req, res, next) => {
    let connection;

    try {
        connection = await getDB();

        const { registrationCode } = req.params;

        //Comprobar que hay un usuario en la BBDD pendiente de validar con ese código
        const [user] = await connection.query(`
            SELECT id, user_id, company_id
            FROM user_company 
            WHERE registrationCode=?
        `, [registrationCode]);
        console.log(user);
        //Sí no lo hay enviamos un error
        if(user.length === 0) {
            const error = new Error('No hay ningún usuario pendiente de validar con ese código');
            error.httpStatus = 404;
            throw(error);
        }

        //Activar el usuario y quitarle el registrationCode
        await connection.query(`
            UPDATE user_company
            SET active=true, registrationCode=NULL
            WHERE registrationCode=?
        `, [registrationCode]);

        //Obtenemos email de usuario
        const [userEmail] = await connection.query(`
            SELECT email
            FROM user
            WHERE id=?
        `, [user[0].user_id]);

        //Obtenemos el nombre de la empresa
        const [companyName] = await connection.query(`
            SELECT name
            FROM company
            WHERE id=?
        `, [user[0].company_id]);

        //Mando un email al usuario con el link de confirmación de email
        const emailBody = `
            ${companyName[0].name} ha confirmado su relación laboral.
            Ya puede valorar a la empresa.
        `;

        await sendMail({
            to: userEmail[0].email,
            subject: 'Confirmación relación laboral',
            body: emailBody
        });


        //Devolver una respuesta

        res.send({
            status: "ok",
            message: "Relación confirmada"
        });
    } catch(error) {
        next(error);
    } finally {
        if(connection) connection.release();
    }
}

module.exports = validateUserCompany;