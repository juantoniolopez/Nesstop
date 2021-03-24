const getDB = require("../../db");

const editCompanyAspects = async (req, res, next) => {
    let connection;

    try {
        connection = await getDB();

        const { id } = req.params;

        //Compruebar que ya existe una entrada en company_aspects para la empresa
        const [currentAspects] = await connection.query(`
            SELECT id FROM company_aspects WHERE company_id=?
        `, [id]);
        console.log(currentAspects);
        //Sí todavía no existe una entrada con aspectos enviamos un error
        if(currentAspects.length === 0) {
            const error = new Error('No existen todavía aspectos a valorar para esta empresa');
            error.httpStatus = 404;
            throw(error);
        }

        //Comprobar que los datos mínimos vienen en el body
        const { aspect1, aspect2, aspect3, aspect4, aspect5 } = req.body;

        if (!aspect1) {
            const error = new Error('Debe de añadir al menos un aspecto a valorar');
            error.httpStatus = 400;
            throw error;
        }
        //Hacer la query de SQL
        await connection.query(`
            UPDATE company_aspects SET aspect1=?, aspect2=?, aspect3=?, aspect4=?, aspect5=? WHERE company_id=? AND id=?
        `, [ aspect1, aspect2, aspect3, aspect4, aspect5, id, currentAspects[0].id]);
        //Devolver una respuesta

        res.send ({
            status: "ok",
            data: {
                company_id: id,
                aspect1,
                aspect2,
                aspect3,
                aspect4,
                aspect5
            }
        })
    } catch (error) {
        next(error);
    } finally {
        if(connection) connection.release();
    }
}

module.exports = editCompanyAspects;