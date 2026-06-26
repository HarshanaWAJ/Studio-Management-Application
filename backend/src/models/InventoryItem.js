import { EntitySchema } from "typeorm";

export const InventoryItem = new EntitySchema({
    name: "InventoryItem",
    tableName: "inventory_items",
    columns: {
        id:           { primary: true, type: "int", generated: true },
        studioId:     { type: "int",     nullable: false },
        itemType:     { type: "varchar", nullable: false }, // frame|glass|mat|print|other
        itemName:     { type: "varchar", nullable: false },
        sku:          { type: "varchar", nullable: true  },
        uom:          { type: "varchar", default: "units" },
        quantity:     { type: "decimal", precision: 10, scale: 2, default: 0 },
        minQuantity:  { type: "decimal", precision: 10, scale: 2, default: 0 },
        costPrice:    { type: "decimal", precision: 10, scale: 2, nullable: true },
        sellingPrice: { type: "decimal", precision: 10, scale: 2, nullable: true },
        location:     { type: "varchar", nullable: true  },
        notes:        { type: "text",    nullable: true  },
        frameId:      { type: "int",     nullable: true  }, // link to frame config if applicable
        createdAt:    { type: "datetime", createDate: true },
        updatedAt:    { type: "datetime", updateDate: true },
    },
    relations: {
        studio: { type: "many-to-one", target: "Studio", joinColumn: { name: "studioId" }, nullable: false },
        frame:  { type: "many-to-one", target: "Frame",  joinColumn: { name: "frameId" },  nullable: true  },
    },
});
