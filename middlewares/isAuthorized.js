const getDB = require("../db");
const jwt = require("jsonwebtoken");

const isAuthorized = async (req, res, next) => {
  let connection;

  try {
    connection = await getDB();

    const { authorization } = req.headers;

    //La cabecera de autorización puede tener otro formato

    //Sí no hay authorization devuelvo un error
    if (!authorization) {
      const error = new Error("Falta la cabecera de autorización");
      error.httpStatus = 401;
      throw error;
    }

    //Valido el token y sí no es valido devuelvo un error
    let tokenInfo;
    console.log(process.env.SECRET);
    try {
      tokenInfo = jwt.verify(authorization, process.env.SECRET);
    } catch (e) {
      const error = new Error("El token no es válido");
      error.httpStatus = 401;
      throw error;
    }

    //Hacer comprobaciones de seguridad extra

    //Inyectamos en la request la información del token
    req.auth = tokenInfo;

    //Continúo
    next();
  } catch (error) {
    next(error);
  } finally {
    if (connection) connection.release();
  }
};

module.exports = isAuthorized;
