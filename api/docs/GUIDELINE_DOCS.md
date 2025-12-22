# 📚 Guideline: Padrão de Desenvolvimento NestJS

**Módulo de Referência:** Users  
**Última Atualização:** 2025-12-22

---

## 🎯 Índice

1. [Controllers](#controllers)
2. [Entities](#entities)
3. [DTOs](#dtos)
4. [Responses HTTP](#responses-http)
5. [Checklist de Validação](#checklist-de-validação)
6. [Exemplos Completos](#exemplos-completos)

---

## 📐 Controllers

### **Padrão Obrigatório**

```typescript
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Users')  // Plural, capitalizado
@ApiBearerAuth()   // Se requer autenticação
@Controller('users')
export class UsersController {
  
  @Post()
  @ApiOperation({ summary: 'Criar um novo usuário' })
  @ApiResponse({
    status: 201,
    description: 'Usuário criado com sucesso.',
    type: User,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Proibido.' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
}
```

### **Regras**

✅ **DEVE ter:**
- `@ApiTags()` - Nome do módulo no **plural** e **capitalizado**
- `@ApiBearerAuth()` - Se endpoints requerem autenticação
- `@ApiOperation()` - Summary conciso
- `@ApiResponse()` - Todos os status codes possíveis

✅ **ApiOperation - Formato de Summary:**
- **POST:** "Criar um novo {recurso}"
- **GET (lista):** "Listar todos os {recursos}"
- **GET/:id:** "Buscar um {recurso} pelo ID"
- **PATCH/:id:** "Atualizar um {recurso}"
- **DELETE/:id:** "Remover um {recurso}"

---

## 🏷️ Entities

### **Padrão Obrigatório**

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from 'prisma/generated/enums';

export class User {
  @ApiProperty({ example: 'fa4c178f-6595-40b9-a569-3d5c079288e5' })
  id: string;

  @ApiProperty({ example: 'João Silva' })
  name: string;

  @ApiProperty({ example: 'joao@empresa.com' })
  email: string;

  @ApiProperty({ 
    example: 'https://avatar.url/image.png', 
    required: false 
  })
  avatarUrl?: string;

  @ApiProperty({ 
    enum: UserRole, 
    example: UserRole.AGENT 
  })
  role: UserRole;

  @ApiProperty({ example: '2025-12-20T02:40:14.742Z' })
  createdAt: Date;
}
```

### **Regras**

✅ **DEVE ter:**
- `@ApiProperty()` em **todos os campos públicos**
- `example` - Valor realista (dados em português quando aplicável)
- `required: false` - Para campos opcionais
- `enum` - Para enums do Prisma
- `description` - Para campos complexos

---

## 📝 DTOs

### **CreateDto - Padrão Obrigatório**

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    example: 'João Silva',
    description: 'Nome completo do usuário',
  })
  @IsString({ message: 'O nome deve ser uma string' })
  @IsNotEmpty({ message: 'O nome não pode estar vazio' })
  name: string;

  @ApiProperty({
    example: 'joao@exemplo.com',
    description: 'Email do usuário',
  })
  @IsEmail({}, { message: 'O email deve ser um endereço de email válido' })
  @IsNotEmpty({ message: 'O email não pode estar vazio' })
  email: string;

  @ApiProperty({
    example: 'https://avatar.url/image.png',
    description: 'URL da foto de perfil',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'A URL deve ser uma string' })
  avatarUrl?: string;
}
```

### **UpdateDto - Padrão Obrigatório**

```typescript
import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {}
```

⚠️ **IMPORTANTE:** Usar `PartialType` do `@nestjs/swagger`, **NÃO** do `@nestjs/mapped-types`

### **Regras de DTOs**

✅ **Ordem dos Decorators (SEMPRE):**
1. `@ApiProperty()` - primeiro
2. Validadores (`@IsString`, `@IsNotEmpty`, etc.)

✅ **@ApiProperty DEVE ter:**
- `example` - Valor realista
- `description` - Descrição clara
- `required: false` - Para campos opcionais

✅ **Mensagens de Validação:**
- 🇧🇷 **TODAS em português**
- Estrutura: "O {campo} deve ser..." / "O {campo} não pode..."

### **Templates de Validação**

**String:**
```typescript
@IsString({ message: 'O nome deve ser uma string' })
@IsNotEmpty({ message: 'O nome não pode estar vazio' })
```

**Email:**
```typescript
@IsEmail({}, { message: 'O email deve ser um endereço de email válido' })
@IsNotEmpty({ message: 'O email não pode estar vazio' })
```

**UUID:**
```typescript
@IsUUID(undefined, { message: 'O ID deve ser um UUID válido' })
@IsNotEmpty({ message: 'O ID não pode estar vazio' })
```

**Array de UUIDs:**
```typescript
@IsArray({ message: 'Os IDs devem estar em um array' })
@IsUUID('4', { 
  each: true, 
  message: 'Cada ID deve ser um UUID válido' 
})
@ArrayMinSize(1, { message: 'Deve haver pelo menos um ID' })
```

**Enum:**
```typescript
@IsEnum(UserRole, { message: 'O papel deve ser um valor válido de UserRole' })
```

**Número com Limites:**
```typescript
@IsNumber({}, { message: 'A quantidade deve ser um número' })
@Min(1, { message: 'A quantidade deve ser no mínimo 1' })
@Max(1000, { message: 'A quantidade deve ser no máximo 1000' })
```

---

## 🎯 Responses HTTP Padrão

| Endpoint | Success | Errors |
|----------|---------|--------|
| **POST** | 201 + type | 400, 401, 403 |
| **GET** (list) | 200 + [type] | 401 |
| **GET/:id** | 200 + type | 401, 404 |
| **PATCH/:id** | 200 + type | 400, 401, 404 |
| **DELETE/:id** | 200 | 401, 403, 404 |

### **Status Codes e Quando Usar**

- `200` - Sucesso (GET, PATCH, DELETE)
- `201` - Criado (POST)
- `400` - Dados inválidos (validação falhou)
- `401` - Não autenticado (falta JWT)
- `403` - Sem permissão (falta role)
- `404` - Recurso não encontrado

---

## ✅ Checklist de Validação

### **Para cada Controller:**
- [ ] `@ApiTags()` com nome plural capitalizado
- [ ] `@ApiBearerAuth()` se protegido
- [ ] `@ApiOperation()` com summary no formato padrão
- [ ] `@ApiResponse()` para status 200/201 com `type`
- [ ] `@ApiResponse()` para todos erros possíveis

### **Para cada Entity:**
- [ ] `@ApiProperty()` em todos os campos
- [ ] `example` em todos os campos
- [ ] `required: false` em opcionais
- [ ] `enum` para enums

### **Para cada DTO:**
- [ ] `@ApiProperty()` primeiro
- [ ] `example` e `description`
- [ ] Validadores com mensagens em PT-BR
- [ ] `@IsOptional()` em campos opcionais
- [ ] UpdateDto usa `PartialType` do `@nestjs/swagger`

---

## 📝 Exemplos Completos

### **Controller Completo**

```typescript
@ApiTags('Teams')
@ApiBearerAuth()
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Criar um novo time' })
  @ApiResponse({
    status: 201,
    description: 'Time criado com sucesso.',
    type: Team,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Proibido.' })
  create(@Body() createTeamDto: CreateTeamDto, @Request() req) {
    return this.teamsService.create(createTeamDto, req.user.tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os times' })
  @ApiResponse({
    status: 200,
    description: 'Lista de times retornada com sucesso.',
    type: [Team],
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  findAll(@Request() req) {
    return this.teamsService.findAll(req.user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar um time pelo ID' })
  @ApiResponse({
    status: 200,
    description: 'Time encontrado.',
    type: Team,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Time não encontrado.' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.teamsService.findOne(id, req.user.tenantId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Atualizar um time' })
  @ApiResponse({
    status: 200,
    description: 'Time atualizado com sucesso.',
    type: Team,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Proibido.' })
  @ApiResponse({ status: 404, description: 'Time não encontrado.' })
  update(
    @Param('id') id: string,
    @Body() updateTeamDto: UpdateTeamDto,
    @Request() req,
  ) {
    return this.teamsService.update(id, updateTeamDto, req.user.tenantId, req.user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Remover um time' })
  @ApiResponse({ status: 200, description: 'Time removido com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Proibido.' })
  @ApiResponse({ status: 404, description: 'Time não encontrado.' })
  remove(@Param('id') id: string, @Request() req) {
    return this.teamsService.remove(id, req.user.tenantId, req.user);
  }
}
```

### **Entity Completa**

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { TeamRole } from 'prisma/generated/enums';

export class Team {
  @ApiProperty({ example: 'uuid-do-time' })
  id: string;

  @ApiProperty({ example: 'Suporte Técnico' })
  name: string;

  @ApiProperty({
    example: 'Equipe responsável pelo atendimento Nível 1',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Membros do time',
    type: [TeamMember],
    required: false,
  })
  members?: TeamMember[];

  @ApiProperty({ example: '2025-12-22T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-12-22T00:00:00.000Z' })
  updatedAt: Date;
}

export class TeamMember {
  @ApiProperty({ example: 'uuid-do-usuario' })
  userId: string;

  @ApiProperty({
    enum: TeamRole,
    example: TeamRole.MEMBER,
  })
  role: TeamRole;
}
```

### **DTOs Completos**

```typescript
// create-team.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray, IsUUID } from 'class-validator';

export class CreateTeamDto {
  @ApiProperty({
    example: 'Suporte Técnico',
    description: 'Nome da equipe',
  })
  @IsString({ message: 'O nome deve ser uma string' })
  @IsNotEmpty({ message: 'O nome não pode estar vazio' })
  name: string;

  @ApiProperty({
    example: 'Equipe responsável pelo Nível 1',
    description: 'Descrição da equipe',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'A descrição deve ser uma string' })
  description?: string;

  @ApiProperty({
    example: ['uuid-1', 'uuid-2'],
    description: 'Lista de IDs dos usuários que farão parte desta equipe',
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'Os IDs dos membros devem estar em um array' })
  @IsUUID('4', { 
    each: true, 
    message: 'Cada ID de membro deve ser um UUID válido' 
  })
  memberIds?: string[];
}

// update-team.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateTeamDto } from './create-team.dto';

export class UpdateTeamDto extends PartialType(CreateTeamDto) {}
```

---

## 🚀 Módulos Refatorados

### **✅ Controllers e Entities**
- [x] Users (referência)
- [x] Audit (audit-log.entity.ts criada)
- [x] Messages (forward endpoints corrigidos)

### **✅ DTOs**
- [x] Users (referência)
- [x] Teams (create, update, add-member)
- [x] Contacts (já padronizado)
- [x] Messages (forward, forward-batch)

---

## 🎓 Referências

**Módulos Exemplares:**
- [`users.controller.ts`](file:///home/luan/code/omni/api/src/modules/users/users.controller.ts) - Controller de referência
- [`user.entity.ts`](file:///home/luan/code/omni/api/src/modules/users/entities/user.entity.ts) - Entity de referência
- [`create-user.dto.ts`](file:///home/luan/code/omni/api/src/modules/users/dto/create-user.dto.ts) - DTO de referência

**Documentação NestJS:**
- [Swagger/OpenAPI](https://docs.nestjs.com/openapi/introduction)
- [Validation](https://docs.nestjs.com/techniques/validation)

---

**Última atualização:** 2025-12-22  
**Revisão:** v2.0 - Incluído padrão completo de DTOs com validações em PT-BR
