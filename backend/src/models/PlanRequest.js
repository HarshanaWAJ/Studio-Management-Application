import { EntitySchema } from "typeorm";

export const PlanRequest = new EntitySchema({
    name: "PlanRequest",
    tableName: "plan_requests",

    columns: {
        id: { primary: true, type: "int", generated: true },

        studioId: { type: "int", nullable: false },
        requestedPlanKey: { type: "varchar", nullable: false },

        // pending | approved | rejected
        status: { type: "varchar", default: "pending", nullable: false },
        
        adminNotes: { type: "text", nullable: true },

        createdAt: { type: "datetime", createDate: true },
        updatedAt: { type: "datetime", updateDate: true },
    },

    relations: {
        studio: {
            type: "many-to-one",
            target: "Studio",
            joinColumn: { name: "studioId" },
            nullable: false,
        },
    },
});
