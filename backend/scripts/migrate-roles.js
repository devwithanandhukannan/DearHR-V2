// scripts/migrate-roles.ts
import { prisma } from '../src/utils/prisma.ts';
import { ROLES } from '../src/constants/roles.ts';
async function migrateRoles() {
    console.log('Starting role migration...');
    // Map old enum values to new bitwise roles
    const roleMapping = {
        job_seeker: ROLES.JOB_SEEKER,
        company_admin: ROLES.COMPANY_ADMIN,
        company_hr: ROLES.COMPANY_HR,
        admin: ROLES.PLATFORM_ADMIN,
    };
    // Migrate User roles
    const users = await prisma.user.findMany();
    for (const user of users) {
        const oldRole = user.role; // Assuming old 'role' field still exists
        const newRole = roleMapping[oldRole] || ROLES.JOB_SEEKER;
        await prisma.user.update({
            where: { id: user.id },
            data: { globalRoles: newRole },
        });
    }
    // Migrate TeamMember roles
    const teamMembers = await prisma.teamMember.findMany();
    for (const member of teamMembers) {
        const oldRole = member.role;
        let newRoles = ROLES.COMPANY_VIEWER; // Default
        if (oldRole === 'admin') {
            newRoles = ROLES.COMPANY_ADMIN;
        }
        else if (oldRole === 'hr_manager') {
            newRoles = ROLES.COMPANY_HR;
        }
        else if (oldRole === 'interviewer') {
            newRoles = ROLES.COMPANY_INTERVIEWER;
        }
        await prisma.teamMember.update({
            where: { id: member.id },
            data: { roles: newRoles },
        });
    }
    console.log('Role migration completed!');
}
migrateRoles()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=migrate-roles.js.map