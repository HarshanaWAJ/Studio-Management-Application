import "reflect-metadata";
import "dotenv/config";

import { DataSource } from "typeorm";
import { Studio }        from "../models/Studio.js";
import { User }          from "../models/User.js";
import { Client }        from "../models/Client.js";
import { Package }       from "../models/Package.js";
import { Booking }       from "../models/Booking.js";
import { Equipment }     from "../models/Equipment.js";
import { Invoice }       from "../models/Invoice.js";
import { Gallery }       from "../models/Gallery.js";
import { Frame }         from "../models/Frame.js";
import { InventoryItem } from "../models/InventoryItem.js";
import { Quotation }     from "../models/Quotation.js";

export const AppDataSource = new DataSource({
    type: "mssql",

    host:     process.env.DB_HOST || "localhost",
    port:     parseInt(process.env.DB_PORT || "1433"),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    synchronize: false,
    logging: ["error", "warn", "info", "log"],

    entities: [
        Studio, User, Client, Package, Booking,
        Equipment, Invoice, Gallery, Frame, InventoryItem, Quotation,
    ],

    options: {
        encrypt: false,
        trustServerCertificate: true,
    },
});
