import express, { Request, Response } from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

// 1. Activamos las variables de entorno (nuestro archivo secreto)
dotenv.config();

// 2. Creamos la aplicación Express
const app = express();
app.use(cors()); // Permite peticiones desde el frontend
app.use(express.json()); // Permite que nuestra API entienda formato JSON

// 3. Conexión a MongoDB
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error("Falta la variable de entorno MONGODB_URI");
}

const mongoUriValidated: string = mongoUri;

let isMongoConnected = false;
let currentDatabase = ""; // Valor por defecto, se actualizará al conectar

async function connectToMongo() {
  if (isMongoConnected) return;

  // Si existe DB_NAME, forzamos ese nombre de base en la conexión.
  const dbNameFromEnv = process.env.DB_NAME;
  const connectionOptions = dbNameFromEnv ? { dbName: dbNameFromEnv } : undefined;

  await mongoose.connect(mongoUriValidated, connectionOptions);
  currentDatabase = mongoose.connection.name;

  isMongoConnected = true;
  console.log("¡Conectado a la Base de Datos!");
}

// 4. Creamos el "Molde" (Esquema) para nuestras cervezas
const CervezaSchema = new mongoose.Schema(
  {
    marca: String,
    tipo: String,
    pais: String,
    grado_alcohol: Number,
    
  },
  {
    collection: "cervezas",
  },
);
const Cerveza = mongoose.models.Cerveza || mongoose.model("Cerveza", CervezaSchema);

function getMongoDebugInfo() {
  return {
    database: currentDatabase || mongoose.connection.name,
    collection: Cerveza.collection.name,
    readyState: mongoose.connection.readyState,
  };
}

// 5. RUTAS DE NUESTRA API

app.get("/api/debug-db", async (req: Request, res: Response) => {
  try {
    await connectToMongo();
    res.json(getMongoDebugInfo());
  } catch (error) {
    console.error("Error al inspeccionar MongoDB:", error);
    res.status(500).json({
      error: "No se pudo inspeccionar la conexion",
      detail: error instanceof Error ? error.message : "Error desconocido",
    });
  }
});

// Ruta GET: Sirve para LEER todas las cervezas
app.get("/api/cervezas", async (req: Request, res: Response) => {
  try {
    await connectToMongo();
    const cervezas = await Cerveza.find(); // Busca todas las cervezas en MongoDB
    res.json(cervezas);
  } catch (error) {
    console.error("Error al leer frases:", error);
    res.status(500).json({
      error: "No se pudieron obtener las frases",
      detail: error instanceof Error ? error.message : "Error desconocido",
    });
  }
});

// Ruta POST: Sirve para CREAR una nueva cerveza
app.post("/api/cervezas", async (req: Request, res: Response) => {
  try {
    const { marca, tipo, pais, grado_alcohol } = req.body;

    if (!marca || !tipo || !pais || !grado_alcohol) {
      res.status(400).json({ error: "Debes enviar marca, tipo, pais y grado_alcohol" });
      return;
    }

    await connectToMongo();
    const nuevaCerveza = new Cerveza({ marca, tipo, pais, grado_alcohol }); // Toma los datos que envía el usuario
    await nuevaCerveza.save(); // Los guarda en MongoDB
    res.status(201).json(nuevaCerveza); // Responde con la cerveza recién creada
  } catch (error) {
    console.error("Error al crear cerveza:", error);
    res.status(500).json({
      error: "No se pudo guardar la frase",
      detail: error instanceof Error ? error.message : "Error desconocido",
    });
  }
});

// Ruta PUT: Sirve para ACTUALIZAR una cerveza existente
app.put("/api/cervezas/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { marca, tipo, pais, grado_alcohol } = req.body;

    await connectToMongo();

    const cervezaActualizada = await Cerveza.findByIdAndUpdate(
      id,
      { marca, tipo, pais, grado_alcohol },
      { new: true } // Para que devuelva el documento actualizado
    );

    if (!cervezaActualizada) {
      res.status(404).json({ error: "Cerveza no encontrada" });
      return;
    }

    res.json(cervezaActualizada);
  } catch (error) {
    console.error("Error al actualizar cerveza:", error);
    res.status(500).json({
      error: "No se pudo actualizar la cerveza",
      detail: error instanceof Error ? error.message : "Error desconocido",
    });
  }
});

// Ruta DELETE: Sirve para ELIMINAR una cerveza
app.delete("/api/cervezas/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await connectToMongo();

    const cervezaEliminada = await Cerveza.findByIdAndDelete(id);

    if (!cervezaEliminada) {
      res.status(404).json({ error: "Cerveza no encontrada" });
      return;
    }

    res.json({ mensaje: "Cerveza eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar cerveza:", error);
    res.status(500).json({
      error: "No se pudo eliminar la cerveza",
      detail: error instanceof Error ? error.message : "Error desconocido",
    });
  }
});

// 6. Exportamos la app para que Vercel pueda encenderla
export default app;
