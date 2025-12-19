import { UserRole } from 'prisma/generated/enums';

export class User {
  id: string;
  name: string;
  email: string;
  active: boolean;
  avatar?: string;
  password: string;
  role: UserRole;
}
