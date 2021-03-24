const getDB = require("../../db");
const { savePhoto, generateRandomString, sendMail } = require("../../helpers");

const editUser = async (req, res, next) => {
    let connection;

    try {
        connection = await getDB();

        const { id } = req.params;
        
        //Sacamos name y email
        const { name, surname, bio, city, dni, email } = req.body;

        //Sacamos la información actual del usuario en la BBDD
        const [currentUser] = await connection.query(`
            SELECT email, avatar
            FROM user
            WHERE id=?
        `, [id]);

        //Sí existe req.file y req.files.avatar procesar el avatar
        if (req.files && req.files.avatar) {
        // Se está subiendo un avatar
           const userAvatar = await savePhoto(req.files.avatar);

           await connection.query(`
            UPDATE user
            SET avatar=?
            WHERE id=?
            `, [userAvatar, id]);
        }

        //Sí el email enviado es diferente al de la BBDD procesamos el email
        if(email && email !== currentUser[0].email) {
            //Comprobamos que no exista otro usuario con ese email
            const [existingEmail] = await connection.query(`
                SELECT id
                FROM user
                WHERE email=?
            `, [email]);

            if(existingEmail.length > 0) {
                const error = new Error('Ya existe un usuario en la base de datos con el nuevo email');
                error.httpStatus = 409;
                throw(error);
            }

            //Creamos un código de registro
            const registrationCode = generateRandomString(40);

            //Mando un email al usuario con el link de confirmación de email
            const emailBody = `
               Acabas de modificar tú email en Nesstop. 
               Pulsa este enlace para validar tu nuevo email: ${process.env.PUBLIC_HOST}/user/validate/${registrationCode}
            `;

            await sendMail({
               to: email,
               subject: 'Confirma tu nuevo email en Nesstop',
               body: emailBody
            });

            //Actualizamos datos finales
            await connection.query(`
                UPDATE user
                SET name=?, surname=?, bio=?, city=?, dni=?, email=?, lastAuthUpdate=?, active=0, registrationCode=?
                WHERE id=?
            `, [name, surname, bio, city, dni, email, new Date(), registrationCode, id]);

            //Damos una respuesta
            res.send ({
               status: "ok",
               message: "Datos de usuario actualizados comprueba tu email"
            });
        } else {
            await connection.query(`
                UPDATE user
                SET name=?, surname=?, bio=?, city=?, dni=?, email=?
                WHERE id=?
            `, [name, surname, bio, city, dni, email, id]);

            res.send ({
                status: "ok",
                message: "Datos de usuario actualizados"
            });
        } 
    
    } catch (error) {
       next(error);
    } finally {
        if(connection) connection.release();
    }
};
module.exports = editUser;