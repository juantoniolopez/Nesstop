const getDB = require("../../db");
const { savePhoto, generateRandomString, sendMail } = require("../../helpers");

const editCompany = async (req, res, next) => {
    let connection;

    try {
        connection = await getDB();

        const { id } = req.params;
        
        //Sacamos name y email
        const { name, city, description, email } = req.body;

        //Sacamos la información actual del usuario en la BBDD
        const [currentCompany] = await connection.query(`
            SELECT email, logo
            FROM company
            WHERE id=?
        `, [id]);

        //Sí existe req.file y req.files.avatar procesar el avatar
        if (req.files && req.files.logo) {
        // Se está subiendo un avatar
           const companyLogo = await savePhoto(req.files.logo);

           await connection.query(`
            UPDATE company
            SET logo=?
            WHERE id=?
            `, [companyLogo, id]);
        }

        //Sí el email enviado es diferente al de la BBDD procesamos el email
        if(email && email !== currentCompany[0].email) {
            //Comprobamos que no exista otro usuario con ese email
            const [existingEmail] = await connection.query(`
                SELECT id
                FROM company
                WHERE email=?
            `, [email]);

            if(existingEmail.length > 0) {
                const error = new Error('Ya existe empresa en la base de datos con el nuevo email');
                error.httpStatus = 409;
                throw(error);
            }

            //Creamos un código de registro
            const registrationCode = generateRandomString(40);

            //Mando un email al usuario con el link de confirmación de email
            const emailBody = `
               Acaba de modificar el email de su empresa en Nesstop. 
               Pulse este enlace para validar su nuevo email: ${process.env.PUBLIC_HOST}/company/validate/${registrationCode}
            `;

            await sendMail({
               to: email,
               subject: 'Confirme el nuevo email de su empresa en Nesstop',
               body: emailBody
            });

            //Actualizamos datos finales
            await connection.query(`
                UPDATE company
                SET name=?, city=?, description=?, email=?, lastAuthUpdate=?, active=0, registrationCode=?
                WHERE id=?
            `, [name, city, description, email, new Date(), registrationCode, id]);

            //Damos una respuesta
            res.send ({
               status: "ok",
               message: "Datos de empresa actualizados compruebe su email"
            });
        } else {
            await connection.query(`
                UPDATE company
                SET name=?, city=?, description=?, email=?
                WHERE id=?
            `, [name, city, description, email, id]);

            res.send ({
                status: "ok",
                message: "Datos de empresa actualizados"
            });
        } 
    
    } catch (error) {
       next(error);
    } finally {
        if(connection) connection.release();
    }
};
module.exports = editCompany;