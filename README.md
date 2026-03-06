# bap-web (Buscador de Cursos)

## Configuração do sandbox da rede beckn disponivel em:

- link: 

## Apoś configurado o Sandbox da rede beckn siga as intruções abaixo para ter seu bap-web funcional

### Requisitos

- Docker

### Configuração

O projeto utiliza um arquivo `.env` na raiz para configurar a conexão com a API externa:

```
BASE_IP="coloque_o_ip_aqui"
```

**Importante:** O arquivo `.env` é copiado para o container Docker durante o build.

### Estrutura do Projeto

```
bap-web/
├── .env                # Variáveis de ambiente
├── backend/            # API FastAPI
│   └── main.py         # Endpoints da aplicação
├── frontend/           # Interface web (HTML/JS)
├── docker-compose.yml  # Orquestração dos containers
├── Dockerfile          # Configuração do container backend
└── requirements.txt    # Dependências Python
```

### Como Rodar

1. Entre na raiz do projeto
2. Execute o comando:
   ```bash
   docker compose up --build
   ```
3. Acesse:
   - **Frontend:** http://localhost:8080
   - **Backend:** http://localhost:8000

