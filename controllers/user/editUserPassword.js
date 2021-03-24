const getDB = require("../../db");

const editUserPassword = async (req, res, next) => {
  let connection;

  try {
    connection = await getDB();

    // Recoger de req.params el id de usario al que tengo que cambiar la contraseña
    const { id } = req.params;

    // Recoger de req.body oldPassword y newPassword
    const { oldPassword, newPassword } = req.body;

    // Comprobamos que la nueva contraseña tenga al menos 8 caracteres
    if (newPassword.length < 8) {
      const error = new Error("La nueva contraseña debe de tener más de 8 caractéres");
      error.httpStatus = 400;
      throw error;
    }

    // Comprobamos que la contraseña antigua es correcta
    const [current] = await connection.query(
      `
      SELECT id
      FROM user
      WHERE id=? AND password=SHA2(?, 512)
    `,
      [id, oldPassword]
    );

    if (current.length === 0) {
      const error = new Error("La contraseña antigua no es correcta");
      error.httpStatus = 401;
      throw error;
    }

    // Guardamos la nueva contraseña
    await connection.query(
      `
      UPDATE user
      SET password=SHA2(?, 512), lastAuthUpdate=?
      WHERE id=?
    `,
      [newPassword, new Date(), id]
    );

    res.send({
      status: "ok",
      message: "Contraseña cambiada",
    });
  } catch (error) {
    next(error);
  } finally {
    if (connection) connection.release();
  }
};

module.exports = editUserPassword;