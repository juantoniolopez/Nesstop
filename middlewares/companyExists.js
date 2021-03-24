const getDb = require("../db");

const companyExists = async (req, res, next) => {
    let connection;
    try {
        connection = await getDb();

        const{ id } = req.params;

        const [result] = await connection.query(`
            SELECT id FROM company WHERE id=?
        `, [id]);

        if (result.length === 0) {
            const error = new Error('Entrada no encontrada');
            error.httpStatus = 404;
            throw error;
        }

        next();
    } catch(error) {
        next(error);
    } finally {
        if (connection) connection.release();
    }
};

module.exports = companyExists;