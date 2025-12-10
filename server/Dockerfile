# Dockerfile para o backend
FROM node:20-alpine

WORKDIR /app

# Copiar arquivos de dependências
COPY server/package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código fonte
COPY server/ .

# Compilar TypeScript
RUN npm run build

# Expor porta
EXPOSE 3001

# Comando de inicialização
CMD ["npm", "start"]

