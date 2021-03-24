const getDB = require("../../db");
const { generateRandomString, sendMail } = require("../../helpers");

const addUserComp = async (req, res, next) => {
    let connection;

    try {
        connection = await getDB();

        const { company_id, id } = req.params;

        //Compruebo si el usuario ya está relacionado con la empresa
        const [currentRelation] = await connection.query(`
            SELECT id FROM user_company WHERE user_id=? AND company_id=?
        `, [id, company_id]);
        
        //Si ya hay una relación usuario-empresa devolvemos un error
        if(currentRelation.length > 0) {
            const error = new Error('Ya existe una relación para este usuario y esta empresa');
            error.httpStatus = 403;
            throw error;
        }

        //Saco los campos necesarios de req.body
        let { work_position, starting_date, end_date } = req.body;

        //Sí alguno de los campos obligatorios no existe lanzo un error Bad Request
        if (!work_position || !starting_date) {
            const error = new Error("Faltan campos obligatorios");
            error.httpStatus = 400;
            throw error;
        }

        //Obtenemos el email de la empresa
        const [companyEmail] = await connection.query(`
            SELECT email
            FROM company
            WHERE id=?
        `, [company_id]);
        console.log(companyEmail);
        //Obtnemos datos de usuario
        const [userData] = await connection.query(`
            SELECT name, surname, dni
            FROM user
            WHERE id=?
        `, [id]);

        console.log(userData);

        //Creamos un código de registro
        const registrationCode = generateRandomString(40);

        //Mando un email al usuario con el link de confirmación de email
        const emailBody = `
            ${userData[0].name} ${userData[0].surname} con DNI: ${userData[0].dni}.
            Acaba de indicarnos que ha trabajado en su empresa y desearía añadir una valoración. 
            En caso afirmativo haga click en el siguiente enlace: ${process.env.PUBLIC_HOST}/validateUserCompany/${registrationCode} .
            De lo contrario ignore este email.
        `;

        await sendMail({
            to: companyEmail[0].email,
            subject: 'Usuario desea valorar su empresa',
            body: emailBody
        });

        //Ejecuto la inserción en la BBDD
            if (!end_date) {
            const now = new Date();
            end_date = now;
            }
            await connection.query(`
             INSERT INTO user_company (company_id, user_id, work_position, starting_date, end_date, registrationCode)
             VALUES(?, ?, ?, ?, ?, ?);
            `, [company_id, id, work_position, starting_date, end_date, registrationCode]);

            res.send({
            status: "ok",
            message: "Usuario vinculado con exito"
            });
    } catch(error) {
       next(error);
    } finally {
        if(connection) connection.release();
    }
}

module.exports = addUserComp;