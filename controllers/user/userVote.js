const getDB = require("../../db");

const userVote = async (req, res, next) => {
    let connection;

    try {
        connection = await getDB();
         
        const { id, company_id } = req.params;
        const { evaluation_date, aspect1_points, aspect2_points, aspect3_points, aspect4_points, aspect5_points } = req.body;

        //Compruebo que existe relación entre el usuario y la empresa
        const [relationship] = await connection.query(`
            SELECT id 
            FROM user_company
            WHERE user_id=? AND company_id=?
            `, [id, company_id]);

        //Sí no existe la relación lanzo un error
        if (relationship.length === 0) {
            const error = new Error('No existe relación entre el usuario y la empresa');
            error.httpStatus = 403;
            throw(error);
        }

        //Sí la puntuación no se encuentra entre 0 y 10 lanzo un error
        if(aspect1_points < 1 || aspect1_points > 10 || aspect2_points < 1 || aspect2_points > 10 || aspect3_points < 1 || aspect3_points > 10 || aspect4_points < 1 || aspect4_points > 10 || aspect5_points < 1 || aspect5_points > 10) {
            const error = new Error('La puntuación debe de estar entre 0 y 10');
            error.httpStatus = 400;
            throw(error);
        }
        //Compruebo si el usuario ya ha votado
        const [currentVotes] = await connection.query(`
            SELECT aspect1_points FROM evaluation WHERE user_id=? AND company_id=?
        `, [id, company_id]);

        //Si ya ha votado devolvemos un error
        if(currentVotes.length >= 1) {
            const error = new Error('El usuario ya ha votado a esta empresa');
            error.httpStatus = 403;
            throw error;
        }

        //Compruebo que el usuario puede votar
        const [userStatus] = await connection.query(`
            SELECT active
            FROM user_company
            WHERE user_id=?
        `, [id]);
        console.log(userStatus);
        if(userStatus[0].active !== 1) {
            const error = new Error('La empresa no ha confirmado la relación, todavía no puede votar');
            error.httpStatus = 403;
            throw error;
        }

        //Si falta alguno de los campo obligatorios lanzo un Bad request
        if (!id || !company_id || !aspect1_points) {
            const error = new Error("Faltan campos obligatorios");
            error.httpStatus = 400;
            throw error;
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

        //Ejecuto la inserción en la BBDD
        const now = new Date();

        await connection.query(`
            INSERT INTO evaluation (company_id, user_id, evaluation_date, aspect1_points, aspect2_points, aspect3_points, aspect4_points, aspect5_points, total)
            VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?);
        `, [company_id, id, now, aspect1_points, aspect2_points, aspect3_points, aspect4_points, aspect5_points, finalScore]);

        res.send({
            status: "ok",
            data: {
                company_id,
                id,
                evaluation_date,
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
};

module.exports = userVote;