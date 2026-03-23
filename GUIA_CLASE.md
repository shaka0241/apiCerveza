# Guía de Clase: Creando nuestra API de Cervezas con Node.js, Express y MongoDB

Esta guía está diseñada paso a paso para explicar a los alumnos el código de `api/index.ts`. Divide la clase en 6 secciones principales correspondientes a los bloques del código.

---

## 🎨 1. Importaciones y Configuración Inicial

Empezamos explicando cómo preparar nuestro entorno de trabajo.

```typescript
import express, { Request, Response } from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";

// 1. Activamos las variables de entorno (nuestro archivo secreto)
dotenv.config();

// 2. Creamos la aplicación Express
const app = express();
app.use(express.json()); // Permite que nuestra API entienda formato JSON
```

**Puntos clave a explicar a los alumnos:**
- **`express`**: Es nuestro servidor web. Se encarga de recibir las peticiones de los clientes (como si fuera un mesero).
- **`mongoose`**: Es la herramienta que nos permite hablar con la base de datos MongoDB desde nuestro código con mucha facilidad.
- **`dotenv.config()`**: Nos permite leer el archivo `.env` donde guardamos cosas secretas (como la contraseña de la base de datos). ¡Nunca debemos subir este archivo a GitHub!
- **`app.use(express.json())`**: Es un traductor. Permite que cuando un cliente nos envíe información (como los datos de una nueva cerveza), nuestro servidor la pueda leer en formato JSON, que es el formato estándar en la web.

---

## 🔌 2. Conectándonos a la Base de Datos

En este paso explicaremos cómo el servidor se conecta a MongoDB.

```typescript
// 3. Conexión a MongoDB
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error("Falta la variable de entorno MONGODB_URI");
}
//...
async function connectToMongo() {
  if (isMongoConnected) return; // Si ya está conectado, no hace nada
  
  //... usamos mongoose.connect()
  await mongoose.connect(mongoUriValidated, connectionOptions);
  
  isMongoConnected = true;
  console.log("¡Conectado a la Base de Datos!");
}
```

**Puntos clave a explicar a los alumnos:**
- **Validación**: Primero verificamos que exista `MONGODB_URI`. Es como preguntar: "¿Tenemos la dirección a la casa?". Si no la tenemos, nuestro programa "rompe" (`throw new Error`) porque no puede funcionar.
- **`async / await`**: La conexión a internet no es instantánea. Usamos `async` y `await` para decirle a nuestro código: *"Espera a que termine de conectarse a MongoDB antes de continuar"*.
- **Patrón Singleton (`isMongoConnected`)**: Evitamos conectarnos a la base de datos cada vez que alguien hace una petición. Si ya estamos conectados (`isMongoConnected = true`), simplemente usamos esa conexión existente.

---

## 📝 3. Creando el Esquema ("El Molde")

Aquí le enseñamos a Mongoose cómo luce exactamente una Cerveza.

```typescript
// 4. Creamos el "Molde" (Esquema) para nuestras cervezas
const CervezaSchema = new mongoose.Schema({
    marca: String,
    tipo: String,
    pais: String,
    grado_alcohol: Number,
}, {
    collection: "cervezas",
});

const Cerveza = mongoose.models.Cerveza || mongoose.model("Cerveza", CervezaSchema);
```

**Puntos clave a explicar a los alumnos:**
- **¿Qué es un Esquema?**: Es como el plano de una casa o un "molde de galletas". Le dice a MongoDB: *"Todas las cervezas que guardemos deben tener marca, tipo, país (como texto o String) y grado de alcohol (como número)"*.
- **`mongoose.model`**: Convierte nuestro "molde" en una herramienta funcional. Con el modelo `Cerveza` es que lograremos buscar, guardar y borrar cervezas más adelante.

---

## 🔍 4. La Ruta para Leer (GET)

Ahora hacemos nuestra primera ruta de la API para devolver los datos.

```typescript
// Ruta GET: Sirve para LEER todas las cervezas
app.get("/api/cervezas", async (req: Request, res: Response) => {
  try {
    await connectToMongo();
    const cervezas = await Cerveza.find(); // Busca todas las cervezas en MongoDB
    res.json(cervezas);
  } catch (error) {
    // Manejo de errores...
  }
});
```

**Puntos clave a explicar a los alumnos:**
- **`app.get`**: Define a dónde tienen que ir los usuarios para obtener datos (Ejm: escribiendo `/api/cervezas` en su navegador o en Postman).
- **`req` y `res`**: 
  - `req` (Request): Lo que el cliente nos pide o envía.
  - `res` (Response): Lo que nosotros le respondemos.
- **`Cerveza.find()`**: Es la magia de Mongoose. Al usar este comando, automáticamente va a la base de datos y trae todo lo que encuentre en la colección de cervezas. Luego lo enviamos al usuario con `res.json(cervezas)`.

---

## ➕ 5. La Ruta para Crear (POST)

En esta ruta le enseñamos a la API cómo recibir datos nuevos y guardarlos.

```typescript
// Ruta POST: Sirve para CREAR una nueva cerveza
app.post("/api/cervezas", async (req: Request, res: Response) => {
  try {
    const { marca, tipo, pais, grado_alcohol } = req.body; // Extraemos lo que envía el usuario
    
    // Validamos que envíe todo
    if (!marca || !tipo || !pais || !grado_alcohol) {
      res.status(400).json({ error: "Debes enviar marca, tipo, pais y grado_alcohol" });
      return;
    }

    await connectToMongo();
    
    // Creamos y guardamos
    const nuevaCerveza = new Cerveza({ marca, tipo, pais, grado_alcohol }); 
    await nuevaCerveza.save(); 
    
    res.status(201).json(nuevaCerveza);
  } catch (error) { ... }
});
```

**Puntos clave a explicar a los alumnos:**
- **`app.post`**: Usamos POST cuando queremos CREAR algo nuevo.
- **`req.body`**: Como configuramos `express.json()` al inicio, ahora podemos leer los datos que el usuario nos manda en el "cuerpo" (body) de su petición. ¡Aquí vienen los datos de la cerveza nueva!
- **Validación Básica**: El `if` verifica que no nos envíen datos incompletos. Si falta algo, le respondemos con el status `400` (Bad Request - "Hiciste mal la petición").
- **`new Cerveza(...)` y `.save()`**: Usamos nuestro modelo para empaquetar los datos nuevos y `.save()` para insertarlo oficialmente en MongoDB. ¡Si todo sale bien devolvemos un estado `201` (Creado)!

---

## 🚀 6. Exportando para el Mundo

Finalmente, el último paso.

```typescript
// 6. Exportamos la app para que Vercel pueda encenderla
export default app;
```

**Puntos clave a explicar a los alumnos:**
- **`export default app`**: Usualmente en Node ponemos un `app.listen(3000)`. Sin embargo, como vamos a subir este proyecto a lugares como Vercel (servidores "Serverless"), es Vercel quien se encarga de encender el servidor por nosotros. Solo necesita que le entreguemos (exportemos) la app lista.
