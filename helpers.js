const { format } = require("date-fns");
const sharp = require("sharp");
const uuid = require("uuid");
const path = require("path");
const crypto = require("crypto");
const sgMail = require("@sendgrid/mail");
const { ensureDir, unlink } = require("fs-extra");
//const { fstat } = require("fs");

 const { UPLOADS_DIRECTORY } = process.env;
 const uploadsDir = path.join(__dirname, UPLOADS_DIRECTORY);
 //Configuración Sendgrid
 sgMail.setApiKey(process.env.SENDGRID_API_KEY);

 //Formatea un objeto de fecha a DATETIME de SQL
function formatDateToDB (dateObject) {
    return format(dateObject, 'yyyy-MM-dd HH:mm:ss');
}

//Borra un fichero en el directorio uploads
async function deletePhoto(photo) {
    const photoPath = path.join(uploadsDir, photo);

    await unlink(photoPath);
}

//Guarda una foto en el directorio uploads
async function savePhoto(imageData) {
    
    //imageData es el objeto con información de la imagen
    //Asegurarse que el directorio de subida de imagenes exista
    await ensureDir(uploadsDir);

    //Leer la imagen con sharp
    const image = sharp(imageData.data);

    //Comprobar que la imagen no tenga un tamaño mayor a x pixeles de ancho
    const imageInfo = await image.metadata();

    //Si es mayor que ese tamaño redimensionarla a ese tamaño
    const IMAGE_MAX_WIDTH = 1000;
    if (imageInfo.width > IMAGE_MAX_WIDTH) {
        image.resize(IMAGE_MAX_WIDTH);
    }

    //Generar un nombre único para la imagen
    const savedImageName = `${uuid.v4()}.jpg`;

    //Guardar la imagen en el directorio de subida de imagenes
    await image.toFile(path.join(uploadsDir, savedImageName));
    
    //Devolver el nombre del fichero
    return savedImageName;
    }

    //Genera una cadena de caracteres aleatoria
    function generateRandomString(length) {
        return crypto.randomBytes(length).toString("hex");
    }

    //Enviar email
    async function sendMail({to, subject, body}) {
        try {
            const msg = {
           to,
           from: process.env.SENDGRID_FROM,
           subject,
           text: body,
           html: `
           <div>
               <h1>${subject}</h1>
               <p>${body}</p>
           </div>
           `,
        };

        await sgMail.send(msg);
        } catch(error) {
            throw new Error('Error enviando mail');
        }
    }
module.exports = { formatDateToDB, savePhoto, deletePhoto, generateRandomString, sendMail };