# Dockerfile para o backend
FROM node:20-alpine

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar TODAS as dependências (incluindo devDependencies para compilar TypeScript)
RUN npm ci

# Copiar código fonte
COPY . .

# Compilar TypeScript (precisa das devDependencies)
RUN npm run build

# Remover devDependencies após build para reduzir tamanho da imagem
RUN npm prune --production

# Expor porta
EXPOSE 3001

# Comando de inicialização
CMD ["npm", "start"]

