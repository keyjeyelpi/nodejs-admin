import { seed as seedRoles } from "./roles.seed.ts";
import { seed as seedPermissions } from "./permissions.seed.ts";
import { seed as seedRolePermissions } from "./role-permissions.seed.ts";
import { seed as seedUsers } from "./users.seed.ts";
import { seed as seedUserSettings } from "./user-settings.seed.ts";

async function runAllSeeds() {
    console.log("\n=== Starting Database Seeding ===\n");

    try {
        await seedRoles();
        await seedPermissions();
        await seedRolePermissions();
        await seedUsers();
        await seedUserSettings();
    } catch (err) {
        console.error("Seeding Failed.:", err);
        throw err;
    }

    console.log("\n=== All Seeds Completed Successfully ===\n");
}

runAllSeeds()
    .then(() => {
        process.exit(0);
    })
    .catch((err) => {
        console.error("Seeding failed:", err);
        process.exit(1);
    });
