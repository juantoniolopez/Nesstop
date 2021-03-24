const getDB = require("../db");

const canEdit = async (req, res, next) => {
  let connection;

  try {
    connection = await getDB();

    const { id } = req.params;

    console.log(id, req.auth.id);

    //Compruebo que el id del usuario que queremos modificar se corresponde con el token o es administrador
    if (+id !== req.auth.id && req.auth.role !== "admin") {
      const error = new Error("El token no es válido");
      error.httpStatus = 401;
      throw error;
    }

    next();
  } catch (error) {
    next(error);
  } finally {
    if (connection) connection.release();
  }
};

module.exports = canEdit;
