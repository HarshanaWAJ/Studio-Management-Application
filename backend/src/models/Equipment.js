import { EntitySchema } from "typeorm";

export const Equipment = new EntitySchema({
    name: "Equipment",
    tableName: "equipment",
    columns: {
        id:               { primary: true, type: "int", generated: true },
        studioId:         { type: "int",     nullable: false },
        name:             { type: "varchar", nullable: false },
        category:         { type: "varchar", nullable: false }, // camera|lens|light|accessory|other
        brand:            { type: "varchar", nullable: true  },
        model:            { type: "varchar", nullable: true  },
        serialNumber:     { type: "varchar", nullable: true  },
        purchaseDate:     { type: "date",    nullable: true  },
        purchasePrice:    { type: "decimal", precision: 10, scale: 2, nullable: true },
        condition:        { type: "varchar", default: "good" }, // excellent|good|fair|poor
        isAvailable:      { type: "bit",     default: 1 },
        lastMaintenance:  { type: "date",    nullable: true  },
        nextMaintenance:  { type: "date",    nullable: true  },
        maintenanceNotes: { type: "text",    nullable: true  },
        notes:            { type: "text",    nullable: true  },
        createdAt:        { type: "datetime", createDate: true },
        updatedAt:        { type: "datetime", updateDate: true },
    },
    relations: {
        studio: { type: "many-to-one", target: "Studio", joinColumn: { name: "studioId" }, nullable: false },
    },
});
