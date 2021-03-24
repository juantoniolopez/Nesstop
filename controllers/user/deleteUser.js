const getDB = require("../../db");

const deleteUser = async (req, res, next) => {
    let connection;
    try {
        connection = await getDB();

        const { id } = req.params;

        //FUTURO: borrar los posibles entradas en tablas relacionadas
        await connection.query(`
            DELETE FROM user_company WHERE user_id=?
        `, [id]);

        await connection.query(`
            DELETE FROM evaluation WHERE user_id=?
        `, [id]);
        //Borrar la entrada de la tabla user
        await connection.query(`
            DELETE FROM user WHERE id=?
        `, [id]);
        //Mandar confirmación
        res.send({
            status: 'ok',
            message: `El usuario con id ${id} y todos sus datos relacionados fueron borrados del sistema`
        });
    } catch(error) {
        next(error);
    } finally {
        if (connection) connection.release();
    }
}

module.exports = deleteUser;