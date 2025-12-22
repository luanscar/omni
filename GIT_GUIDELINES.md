# 📝 Guia de Commits - Projeto Omni

Este documento serve como referência para manter o histórico de commits organizado, identificando claramente as alterações entre a **API** (Backend) e a **Web** (Frontend).

## 🚀 Padrão de Mensagem (Conventional Commits)

Utilize o formato: `tipo(escopo): descrição em português`

### 🏗️ Tipos de Commit
- `feat`: Uma nova funcionalidade.
- `fix`: Correção de um erro/bug.
- `docs`: Alterações apenas na documentação.
- `style`: Mudanças que não afetam o sentido do código (espaços, formatação, etc).
- `refactor`: Mudança que não corrige erro nem adiciona funcionalidade (melhoria de código).
- `chore`: Atualização de tarefas de build, dependências, configurações.

### 🎯 Escopos (Scopes)
Sempre use o escopo para dizer onde a mudança ocorreu:
- `(api)`: Alterações na pasta `/api`.
- `(web)`: Alterações na pasta `/web`.
- `(root)`: Alterações globais na raiz do repositório.

---

## 💡 Exemplos Práticos

### No Backend (API)
- `feat(api): implementa validação de usuários`
- `fix(api): corrige timeout na conexão com banco de dados`
- `docs(api): atualiza openapi.json`

### No Frontend (Web)
- `feat(web): adiciona tela de login`
- `style(web): ajusta cores do sidebar para modo escuro`
- `fix(web): resolve bug no formulário de contato`

---

## 🛠️ Como Comitar Separadamente

Se você editou arquivos em ambos os projetos, **não dê genericamente `git add .`**. Faça em partes:

1. **Prepare os arquivos da API**:
   ```bash
   git add api/
   git commit -m "feat(api): descrição da mudança"
   ```

2. **Prepare os arquivos da Web**:
   ```bash
   git add web/
   git commit -m "feat(web): descrição da mudança"
   ```

3. **Envie para o servidor**:
   ```bash
   git push origin main
   ```

---

## ⚠️ Regras de Ouro
1. **Nunca comite código que quebra o build.**
2. **Commits pequenos e frequentes** são melhores que um commit gigante.
3. **Mantenha as mensagens em português** (conforme sua preferência).
