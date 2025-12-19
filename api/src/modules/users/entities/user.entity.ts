import { UserRole } from "prisma/generated/enums";

export class User {

    id: string;
    name: string;
    email: string;
    password: string;
    role: UserRole;
}
