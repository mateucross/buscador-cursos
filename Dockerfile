# Usa a imagem oficial do Python como base
FROM python:3.10-slim

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia o arquivo de requisitos e instala as dependências
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia o arquivo .env para o diretório de trabalho
COPY .env .

# Copia a pasta backend e seu conteúdo para o diretório de trabalho
COPY backend/ ./backend/

# Expõe a porta que o Uvicorn vai usar
EXPOSE 8000

# Comando para rodar a aplicação com o Uvicorn
# O host 0.0.0.0 é necessário para que a aplicação seja acessível de fora do container
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]