const getDB = require("../../db");
const { deletePhoto } = require("../../helpers");

const deleteCompany = async (req, res, next) => {
    let connection;
    try {
        connection = await getDB();

        const { id } = req.params;

        //Seleccionar la foto relacionada y borrar los ficheros de disco
        const [photos] = await connection.query(`
            SELECT photo FROM company_photos WHERE company_id=?
        `, [id]);

        console.log(photos);

        if(photos.length > 0) {
            //Borrar la posible foto en company_photos
            await connection.query(`
                DELETE FROM company_photos WHERE company_id=?
            `, [id]);
        
            //y del disco
            for(const item of photos) {
                await deletePhoto(item.photo);
            }
        }
        //FUTURO: borrar los posibles entradas en tablas relacionadas
        await connection.query(`
            DELETE FROM user_company WHERE company_id=?
        `, [id]);

        await connection.query(`
            DELETE FROM evaluation WHERE company_id =?
        `, [id]);

        await connection.query(`
            DELETE FROM company_aspects WHERE company_id=?
        `, [id]);

        //Borrar la entrada de la tabla company
        await connection.query(`
            DELETE FROM company WHERE id=?
        `, [id]);
        //Mandar confirmación
        res.send({
            status: 'ok',
            message: `La empresa con id ${id} y todos sus datos relacionados fueron borrados del sistema`
        });
    } catch(error) {
        next(error);
    } finally {
        if (connection) connection.release();
    }
}

module.exports = deleteCompany;