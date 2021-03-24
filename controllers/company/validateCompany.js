const getDB = require("../../db");

const validateCompany = async (req, res, next) => {
    let connection;

    try {
        connection = await getDB();

        const { registrationCode } = req.params;

        //Comprobar que hay una empresa en la BBDD pendiente de validar con ese código
        const [company] = await connection.query(`
            SELECT id FROM company WHERE registrationCode=?
        `, [registrationCode]);
        console.log(company);
        //Sí no lo hay enviamos un error
        if(company.length === 0) {
            const error = new Error('No hay ninguna empresa pendiente de validar con ese código');
            error.httpStatus = 404;
            throw(error);
        }

        //Activar la empresa y quitarle el registrationCode
        await connection.query(`
            UPDATE company 
            SET active=true, registrationCode=NULL
            WHERE registrationCode=?
        `, [registrationCode]);

        //Devolver una respuesta

        res.send({
            status: "ok",
            message: "Empresa validada"
        });
        
    } catch(error) {
        next(error);
    } finally {
        if(connection) connection.release();
    }
}

module.exports = validateCompany;