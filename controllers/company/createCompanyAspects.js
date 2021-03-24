const getDB = require("../../db");

const createCompanyAspects = async (req, res, next) => {
    let connection;

    try {
        connection = await getDB();

        //Saco los campos necesarios de req.body
        const { aspect1, aspect2, aspect3, aspect4, aspect5 } = req.body;
        const { id } = req.params;

        //Sí alguno de los campos obligatorios no existe lanzo un error Bad Request
        if (!aspect1) {
            const error = new Error("Debe de existir por lo menos un aspecto a valorar");
            error.httpStatus = 400;
            throw error;
        }

        //Ejecuto la inserción en la BBDD
        //Creo un objeto con la fecha actual
        await connection.query(`
            INSERT INTO company_aspects (company_id, aspect1, aspect2, aspect3, aspect4, aspect5)
            VALUES(?, ?, ?, ?, ?, ?);
        `, [id, aspect1, aspect2, aspect3, aspect4, aspect5]);


        res.send({
            status: "ok",
            message: "Aspectos añadidos correctamente",
            data: {
                company_id: id, 
                aspect1, 
                aspect2,
                aspect3, 
                aspect4, 
                aspect5
            }
        })
    } catch(error) {
        next(error);
    } finally {
        if(connection) connection.release();
    }
}

module.exports = createCompanyAspects;