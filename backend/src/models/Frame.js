import { EntitySchema } from "typeorm";

export const Frame = new EntitySchema({
    name: "Frame",
    tableName: "frames",
    columns: {
        id:              { primary: true, type: "int", generated: true },
        studioId:        { type: "int",     nullable: false },
        frameName:       { type: "varchar", nullable: false },
        woodType:        { type: "varchar", nullable: true  }, // teak|pine|oak|mahogany|mdf|aluminum|other
        uom:             { type: "varchar", default: "cm"  }, // cm|feet|inches
        pricePerUom:     { type: "decimal", precision: 10, scale: 2, nullable: false },
        glassType:       { type: "varchar", nullable: true  }, // clear|anti-glare|uv-protective|none
        glassPricePerUom:{ type: "decimal", precision: 10, scale: 2, default: 0 },
        description:     { type: "text",    nullable: true  },
        isActive:        { type: "bit",     default: 1 },
        createdAt:       { type: "datetime", createDate: true },
        updatedAt:       { type: "datetime", updateDate: true },
    },
    relations: {
        studio: { type: "many-to-one", target: "Studio", joinColumn: { name: "studioId" }, nullable: false },
    },
});
