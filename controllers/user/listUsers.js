const getDB = require("../../db");
const listUsers = async (req, res, next) => {
    let connection;
    
    try {
        connection = await getDB();

        if(req.auth.role !== 'admin') {
            const error = new Error('No puede realizar esta operación');
            error.httpStatus = 401;
            throw error;
        }

        //Saco querystring                                                          
        const { search, order, direction } = req.query;

        const validOrderFields = ['id', 'name', 'surname', 'city', 'email'];
        const validOrderDirection = ['DESC', 'ASC'];

        const orderBy = validOrderFields.includes(order) ? order : 'id';
        const orderDirection = validOrderDirection.includes(direction) ? direction : 'ASC';

        let results;

        if (search) {
          [results] = await connection.query(`
            SELECT user.signup_date, user.id, user.name, user.surname, user.bio, user.city, user.email
            FROM user
            WHERE user.city LIKE ? OR user.surname_1 LIKE ?
            GROUP BY user.signup_date, user.id, user.name, user.surname, user.bio, user.city, user.email
            ORDER BY ${orderBy} ${orderDirection};
            `, [`%${search}%`, `%${search}%`]);
        } else {
           //Leo las entradas de la tabla user
           [results] = await connection.query(`
            SELECT user.signup_date, user.id, user.name, user.surname, user.bio, user.city, user.email
            FROM user 
            GROUP BY user.signup_date, user.id, user.name, user.surname, user.bio, user.city, user.email
            ORDER BY ${orderBy} ${orderDirection};
           `,);
        }

        
        //Devuelvo un json con el resultado + array de fotos
        res.send({
            status: "ok",
            data: results,
        });
    } catch (error) {
        //Lo mandamos al middleware de error
        next(error);
    } finally {
        if(connection) connection.release();
    }
};

module.exports = listUsers;