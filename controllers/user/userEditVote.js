const getDB = require("../../db");

const  userEditVote = async (req, res, next) => {
    let connection;

    try {
        connection = await getDB();

        const { id, company_id } = req.params;
        const { aspect1_points, aspect2_points, aspect3_points, aspect4_points, aspect5_points } = req.body;

        //Compruebo que existe relación entre el usuario y la empresa
        const [relationship] = await connection.query(`
            SELECT id 
            FROM user_company
            WHERE user_id=? AND company_id=?
            `, [id, company_id]);
            console.log(relationship);
        //Sí no existe la relación lanzo un error
        if (relationship.length === 0) {
            const error = new Error('No existe relación entre el usuario y la empresa');
            error.httpStatus = 403;
            throw(error);
        }

        //Sí el usuario no ha votado lanzo un error
        const [currentVote] = await connection.query(`
            SELECT id
            FROM evaluation
            WHERE user_id=? AND company_id=?
        `, [id, company_id]);

        if (currentVote.length === 0) {
            const error = new Error('El usuario todavía no ha votado');
            error.httpStatus = 403;
            throw(error);
        }
        console.log(currentVote);
        //Comprobar que los datos mínimos vienen en el body

        if (!aspect1_points) {
            const error = new Error('Faltan campos');
            error.httpStatus = 400;
            throw(error);
        }

        const result = aspect1_points + aspect2_points + aspect3_points +aspect4_points +aspect5_points;
        console.log(result);
        //Calculo la ponderación en función de los años del usuario en la empresa
        const [startDate] = await connection.query(`
            SELECT starting_date 
            FROM user_company
            WHERE user_id=? AND company_id=?
        `, [id, company_id]);
        
        const [endDate] = await connection.query(`
            SELECT end_date 
            FROM user_company
            WHERE user_id=? AND company_id=?
        `, [id, company_id]);

        
        console.log(startDate[0].starting_date, endDate[0].end_date);

        const timeGap = endDate[0].end_date.getFullYear() - startDate[0].starting_date.getFullYear();
        console.log(result);

        const finalScore = Math.round(result * (1 + (timeGap * 0.1)));

        //Hacer la query de SQL
        const now = new Date();

        await connection.query(`
            UPDATE evaluation 
            SET evaluation_date=?, aspect1_points=?, aspect2_points=?, aspect3_points=?, aspect4_points=?, aspect5_points=?, total=?
            WHERE user_id=? AND company_id=?
        `, [now, aspect1_points, aspect2_points, aspect3_points, aspect4_points, aspect5_points, finalScore, id, company_id]);
        //Devolver una respuesta

        res.send ({
            status: "ok",
            data: {
                id,
                company_id,
                aspect1_points,
                aspect2_points,
                aspect3_points,
                aspect4_points,
                aspect5_points,
                total: finalScore
            }
        });

    } catch(error) {
        next(error);
    } finally {
        if(connection) connection.release();
    }
}


module.exports = userEditVote;