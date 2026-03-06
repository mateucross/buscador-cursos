from fastapi import FastAPI, HTTPException, Request, Body
from pydantic import BaseModel, Field, EmailStr
from fastapi.middleware.cors import CORSMiddleware
import httpx
import json
import uuid
from datetime import datetime
from typing import List, Optional
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_IP = os.getenv("BASE_IP")

# Endpoints externos usando a variável BASE_IP
ENDPOINT_EXTERNO_SEARCH = f"http://{BASE_IP}:5001/search"
ENDPOINT_EXTERNO_SELECT = f"http://{BASE_IP}:5001/select"
ENDPOINT_EXTERNO_INIT = f"http://{BASE_IP}:5001/init"
ENDPOINT_EXTERNO_CONFIRM = f"http://{BASE_IP}:5001/confirm"
ENDPOINT_EXTERNO_STATUS = f"http://{BASE_IP}:5001/status"
ENDPOINT_EXTERNO_TRACK = f"http://{BASE_IP}:5001/track"
ENDPOINT_EXTERNO_CANCEL = f"http://{BASE_IP}:5001/cancel"
ENDPOINT_EXTERNO_UPDATE = f"http://{BASE_IP}:5001/update"
ENDPOINT_EXTERNO_RATING = f"http://{BASE_IP}:5001/rating"
ENDPOINT_EXTERNO_SUPPORT = f"http://{BASE_IP}:5001/support"


# Criar um cliente HTTP global
client = httpx.AsyncClient()

@app.on_event("shutdown")
async def shutdown_event():
    await client.aclose()

@app.post("/search")
async def buscar_cursos_backend():
    # Gerar IDs e timestamp únicos
    transaction_id = str(uuid.uuid4())
    message_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat() + "Z"

    payload_final = {
        "context": {
            "domain": "dsep:gercom-courses",
            "action": "search",
            "version": "1.1.0",
            "bap_id": "bap-network",
            "bap_uri": "http://bap-network:5002",
            "bpp_id": "bpp-network",
            "bpp_uri": "http://bpp-network:6002",
            "location": {
                "city": {
                    "name": "Belém",
                    "code": "std:091"
                },
                "country": {
                    "name": "Brasil",
                    "code": "BRA"
                }
            },
            "transaction_id": transaction_id,
            "message_id": message_id,
            "timestamp": timestamp,
            "ttl": "PT10M"
        },
        "message": {
            "intent": {
                "provider": {
                    "id": "GERCOM"
                }
            }
        }
    }


    try:
        response = await client.post(ENDPOINT_EXTERNO_SEARCH, json=payload_final, timeout=60)
        response.raise_for_status()

        resposta_api_externa_bruta = response.json()
        print("Resposta tratada do backend (search):", resposta_api_externa_bruta)

        if isinstance(resposta_api_externa_bruta, list):
            resposta_final = resposta_api_externa_bruta[0]
        else:
            resposta_final = resposta_api_externa_bruta

        return resposta_final

    except httpx.HTTPStatusError as exc:
        print(f"Erro HTTP na requisição de search: {exc.response.text}")
        raise HTTPException(
            status_code=exc.response.status_code, 
            detail=f"Erro na requisição para a API externa (search): {exc.response.text}"
        )
    except httpx.RequestError as exc:
        print(f"Erro de requisição de search: {str(exc)}")
        raise HTTPException(
            status_code=500,
            detail=f"Não foi possível se conectar à API externa. Erro: {str(exc)}"
        )
    except Exception as e:
        print(f"Erro inesperado no search: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Erro inesperado: {str(e)}"
        )

@app.post("/select")
async def select_course_backend(payload: dict = Body(...)):
    curso_id = payload.get("id")  # recebe o id enviado do select.js

    transaction_id = str(uuid.uuid4())
    message_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat() + "Z"

    payload_final = {
        "context": {
            "domain": "dsep:gercom-courses",
            "action": "select",
            "version": "1.1.0",
            "bap_id": "bap-network",
            "bap_uri": "http://bap-network:5002",
            "bpp_id": "bpp-network",
            "bpp_uri": "http://bpp-network:6002",
            "location": {
                "city": {"name": "Belém", "code": "std:091"},
                "country": {"name": "Brasil", "code": "BRA"}
            },
            "transaction_id": transaction_id,
            "message_id": message_id,
            "timestamp": timestamp,
            "ttl": "PT10M"
        },
        "message": {
            "order": {
                "provider": {"id": "GERCOM"},
                "items": [
                    {"id": curso_id}  # agora dinâmico
                ]
            }
        }
    }

    try:
        response = await client.post(ENDPOINT_EXTERNO_SELECT, json=payload_final, timeout=60)
        response.raise_for_status()
        resposta_api_externa_bruta = response.json()
        print("Resposta tratada do backend (select):", resposta_api_externa_bruta)
        return resposta_api_externa_bruta if not isinstance(resposta_api_externa_bruta, list) else resposta_api_externa_bruta[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro inesperado: {str(e)}")

    except httpx.HTTPStatusError as exc:
        print(f"Erro HTTP na requisição de select: {exc.response.text}")
        raise HTTPException(
            status_code=exc.response.status_code, 
            detail=f"Erro na requisição para a API externa (select): {exc.response.text}"
        )
    except httpx.RequestError as exc:
        print(f"Erro de requisição de select: {str(exc)}")
        raise HTTPException(
            status_code=500,
            detail=f"Não foi possível se conectar à API externa. Erro: {str(exc)}"
        )
    except Exception as e:
        print(f"Erro inesperado no select: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Erro inesperado: {str(e)}"
        )
        
@app.post("/init")
async def init_course_backend(request: Request):
    body = await request.json()
    curso_id = body.get("id")  # Pega o id enviado pelo init.js

    # Gerar IDs e timestamp únicos
    transaction_id = str(uuid.uuid4())
    message_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat() + "Z"

    payload_final = {
        "context": {
            "domain": "dsep:gercom-courses",
            "action": "init",
            "version": "1.1.0",
            "bap_id": "bap-network",
            "bap_uri": "http://bap-network:5002",
            "bpp_id": "bpp-network",
            "bpp_uri": "http://bpp-network:6002",
            "location": {
                "city": {
                    "name": "Belém",
                    "code": "std:091"
                },
                "country": {
                    "name": "Brasil",
                    "code": "BRA"
                }
            },
            "transaction_id": transaction_id,   
            "message_id": message_id,           
            "ttl": "PT10M",
            "timestamp": timestamp              
        },
        "message": {
            "order": {
                "provider": {
                    "id": "GERCOM"
                },
                "items": [
                    {
                        "id": curso_id
                    }
                ],
                "billing": {
                    "name": "Jane Doe",
                    "phone": "+91-9663088848",
                    "email": "jane.doe@example.com",
                    "address": "No 27, XYZ Lane, etc"
                },
                "fulfillments": [
                    {
                        "customer": {
                            "person": {
                                "name": "Jane Doe",
                                "age": "13",
                                "gender": "female",
                                "tags": [
                                    {
                                        "descriptor": {
                                            "code": "professional-details",
                                            "name": "Professional Details"
                                        },
                                        "list": [
                                            {
                                                "descriptor": {
                                                    "code": "profession",
                                                    "name": "profession"
                                                },
                                                "value": "student"
                                            }
                                        ],
                                        "display": True
                                    }
                                ]
                            },
                            "contact": {
                                "phone": "+91-9663088848",
                                "email": "jane.doe@example.com"
                            }
                        },
                        "id": f"{curso_id}-turma-geral"
                    }
                ]
            }
        }
    }

    try:
        response = await client.post(ENDPOINT_EXTERNO_INIT, json=payload_final, timeout=60)
        response.raise_for_status()

        resposta_api_externa_bruta = response.json()
        print("Resposta tratada do backend (init):", resposta_api_externa_bruta)

        if isinstance(resposta_api_externa_bruta, list):
            resposta_final = resposta_api_externa_bruta[0]
        else:
            resposta_final = resposta_api_externa_bruta

        return resposta_final

    except httpx.HTTPStatusError as exc:
        print(f"Erro HTTP na requisição de init: {exc.response.text}")
        raise HTTPException(
            status_code=exc.response.status_code, 
            detail=f"Erro na requisição para a API externa (init): {exc.response.text}"
        )
    except httpx.RequestError as exc:
        print(f"Erro de requisição de init: {str(exc)}")
        raise HTTPException(
            status_code=500,
            detail=f"Não foi possível se conectar à API externa. Erro: {str(exc)}"
        )
    except Exception as e:
        print(f"Erro inesperado no init: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Erro inesperado: {str(e)}"
        )
    

@app.post("/confirm")
async def confirm_course_backend(request: Request):
    body = await request.json()
    curso_id = body.get("id")

    # Gerar IDs e timestamp únicos
    transaction_id = str(uuid.uuid4())
    message_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat() + "Z"

    payload_final = {
        "context": {
            "domain": "dsep:gercom-courses",
            "action": "confirm",
            "version": "1.1.0",
            "bap_id": "bap-network",
            "bap_uri": "http://bap-network:5002",
            "bpp_id": "bpp-network",
            "bpp_uri": "http://bpp-network:6002",
            "location": {
                "city": {
                    "name": "Belém",
                    "code": "std:091"
                },
                "country": {
                    "name": "Brasil",
                    "code": "BRA"
                }
            },
            "transaction_id": transaction_id,   
            "message_id": message_id,           
            "ttl": "PT10M",
            "timestamp": timestamp              
        },
        "message": {
            "order": {
                "provider": {
                    "id": "GERCOM"
                },
                "items": [
                    {
                        "id": curso_id
                    }
                ],
                "billing": {
                    "name": "Jane Doe",
                    "phone": "+91-9663088848",
                    "email": "jane.doe@example.com",
                    "address": "No 27, XYZ Lane, etc"
                },
                "fulfillments": [
                    {
                        "customer": {
                            "person": {
                                "name": "Jane Doe",
                                "age": "13",
                                "gender": "female"
                            },
                            "contact": {
                                "phone": "+91-9663088848",
                                "email": "jane.doe@example.com"
                            }
                        }
                    }
                ],
                "payments": [
                    {
                        "params": {
                            "amount": "0",
                            "currency": "BRL",
                        },
                        "status": "PAID"
                    }
                ]
            }
        }
    }

    try:
        response = await client.post(ENDPOINT_EXTERNO_CONFIRM, json=payload_final, timeout=60)
        response.raise_for_status()

        resposta_api_externa_bruta = response.json()
        print("Resposta tratada do backend (confirm):", resposta_api_externa_bruta)

        if isinstance(resposta_api_externa_bruta, list):
            resposta_final = resposta_api_externa_bruta[0]
        else:
            resposta_final = resposta_api_externa_bruta

        return resposta_final

    except httpx.HTTPStatusError as exc:
        print(f"Erro HTTP na requisição de confirm: {exc.response.text}")
        raise HTTPException(
            status_code=exc.response.status_code, 
            detail=f"Erro na requisição para a API externa (confirm): {exc.response.text}"
        )
    except httpx.RequestError as exc:
        print(f"Erro de requisição de confirm: {str(exc)}")
        raise HTTPException(
            status_code=500,
            detail=f"Não foi possível se conectar à API externa. Erro: {str(exc)}"
        )
    except Exception as e:
        print(f"Erro inesperado no confirm: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Erro inesperado: {str(e)}"
        )
    
@app.post("/status")
async def status_course_backend(request: Request):
    body = await request.json()
    order_id = body.get("order_id")  # corrigido aqui

    # Gerar IDs e timestamp únicos
    transaction_id = str(uuid.uuid4())
    message_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat() + "Z"

    payload_final = {
        "context": {
            "domain": "dsep:gercom-courses",
            "action": "status",
            "version": "1.1.0",
            "bap_id": "bap-network",
            "bap_uri": "http://bap-network:5002",
            "bpp_id": "bpp-network",
            "bpp_uri": "http://bpp-network:6002",
            "location": {
                "city": {"name": "Belém", "code": "std:091"},
                "country": {"name": "Brasil", "code": "BRA"}
            },
            "transaction_id": transaction_id,
            "message_id": message_id,
            "ttl": "PT10M",
            "timestamp": timestamp
        },
        "message": {
            "order_id": order_id
        }
    }

    try:
        response = await client.post(ENDPOINT_EXTERNO_STATUS, json=payload_final, timeout=60)
        response.raise_for_status()

        resposta_api_externa_bruta = response.json()
        print("Resposta tratada do backend (status):", resposta_api_externa_bruta)

        if isinstance(resposta_api_externa_bruta, list):
            resposta_final = resposta_api_externa_bruta[0]
        else:
            resposta_final = resposta_api_externa_bruta

        return resposta_final

    except httpx.HTTPStatusError as exc:
        print(f"Erro HTTP na requisição de status: {exc.response.text}")
        raise HTTPException(
            status_code=exc.response.status_code,
            detail=f"Erro na requisição para a API externa (status): {exc.response.text}"
        )
    except httpx.RequestError as exc:
        print(f"Erro de requisição de status: {str(exc)}")
        raise HTTPException(
            status_code=500,
            detail=f"Não foi possível se conectar à API externa. Erro: {str(exc)}"
        )
    except Exception as e:
        print(f"Erro inesperado no status: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro inesperado: {str(e)}"
        )


@app.post("/update")
async def update_course_backend(request: Request):
    body = await request.json()
    order_id = body.get("order_id")

    # Gerar IDs e timestamp únicos
    transaction_id = str(uuid.uuid4())
    message_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat() + "Z"

    payload_final = {
        "context": {
            "domain": "dsep:gercom-courses",
            "action": "update",
            "version": "1.1.0",
            "bap_id": "bap-network",
            "bap_uri": "http://bap-network:5002",
            "bpp_id": "bpp-network",
            "bpp_uri": "http://bpp-network:6002",
            "location": {
                "city": {
                    "name": "Belém",
                    "code": "std:091"
                },
                "country": {
                    "name": "Brasil",
                    "code": "BRA"
                }
            },
            "transaction_id": transaction_id,   
            "message_id": message_id,           
            "ttl": "PT10M",
            "timestamp": timestamp              
        },
        "message": {
            "order": {
                "id": order_id,
                "items": [
                    {
                        "id": "d4975df5-b18c-4772-80ad-368669856d52",
                        "fulfillments": [
                            {
                                "state": {
                                    "descriptor": {
                                        "code": "COMPLETED",
                                        "name": "COMPLETED"
                                    },
                                    "updated_at": "2023-02-06T09:55:41.161Z"
                                }
                            }
                        ]
                    }
                ]
            },
            "update_target": "order.items[0].fulfillments[0].state"
        }
    }

    try:
        response = await client.post(ENDPOINT_EXTERNO_UPDATE, json=payload_final, timeout=60)
        response.raise_for_status()

        resposta_api_externa_bruta = response.json()
        print("Resposta tratada do backend (update):", resposta_api_externa_bruta)

        if isinstance(resposta_api_externa_bruta, list):
            resposta_final = resposta_api_externa_bruta[0]
        else:
            resposta_final = resposta_api_externa_bruta

        return resposta_final

    except httpx.HTTPStatusError as exc:
        print(f"Erro HTTP na requisição de update: {exc.response.text}")
        raise HTTPException(
            status_code=exc.response.status_code, 
            detail=f"Erro na requisição para a API externa (update): {exc.response.text}"
        )
    except httpx.RequestError as exc:
        print(f"Erro de requisição de update: {str(exc)}")
        raise HTTPException(
            status_code=500,
            detail=f"Não foi possível se conectar à API externa. Erro: {str(exc)}"
        )
    except Exception as e:
        print(f"Erro inesperado no update: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Erro inesperado: {str(e)}"
        )

@app.post("/track")
async def track_course_backend(request: Request):
    body = await request.json()
    order_id = body.get("order_id")

    # Gerar IDs e timestamp únicos
    transaction_id = str(uuid.uuid4())
    message_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat() + "Z"

    payload_final = {
        "context": {
            "domain": "dsep:gercom-courses",
            "action": "track",
            "version": "1.1.0",
            "bap_id": "bap-network",
            "bap_uri": "http://bap-network:5002",
            "bpp_id": "bpp-network",
            "bpp_uri": "http://bpp-network:6002",
            "location": {
                "city": {
                    "name": "Belém",
                    "code": "std:091"
                },
                "country": {
                    "name": "Brasil",
                    "code": "BRA"
                }
            },
            "transaction_id": transaction_id,   
            "message_id": message_id,           
            "ttl": "PT10M",
            "timestamp": timestamp              
        },
        "message": {
            "order_id": order_id
        }
    }

    try:
        response = await client.post(ENDPOINT_EXTERNO_TRACK, json=payload_final, timeout=60)
        response.raise_for_status()

        resposta_api_externa_bruta = response.json()
        print("Resposta tratada do backend (track):", resposta_api_externa_bruta)

        if isinstance(resposta_api_externa_bruta, list):
            resposta_final = resposta_api_externa_bruta[0]
        else:
            resposta_final = resposta_api_externa_bruta

        return resposta_final

    except httpx.HTTPStatusError as exc:
        print(f"Erro HTTP na requisição de track: {exc.response.text}")
        raise HTTPException(
            status_code=exc.response.status_code, 
            detail=f"Erro na requisição para a API externa (track): {exc.response.text}"
        )
    except httpx.RequestError as exc:
        print(f"Erro de requisição de track: {str(exc)}")
        raise HTTPException(
            status_code=500,
            detail=f"Não foi possível se conectar à API externa. Erro: {str(exc)}"
        )
    except Exception as e:
        print(f"Erro inesperado no track: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Erro inesperado: {str(e)}"
        )
    
@app.post("/cancel")
async def cancel_course_backend(request: Request):
    body = await request.json()
    order_id = body.get("order_id")

    # Gerar IDs e timestamp únicos
    transaction_id = str(uuid.uuid4())
    message_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat() + "Z"

    payload_final = {
        "context": {
            "domain": "dsep:gercom-courses",
            "action": "cancel",
            "version": "1.1.0",
            "bap_id": "bap-network",
            "bap_uri": "http://bap-network:5002",
            "bpp_id": "bpp-network",
            "bpp_uri": "http://bpp-network:6002",
            "location": {
                "country": {
                    "name": "Brasil",
                    "code": "BRA"
                }
            },
            "transaction_id": transaction_id,   
            "message_id": message_id,           
            "ttl": "PT10M",
            "timestamp": timestamp              
        },
        "message": {
            "order_id": order_id,
            "cancellation_reason_id": "1",
            "descriptor": {
                "short_desc": "Not Satisfied"
            }
        }
    }

    try:
        response = await client.post(ENDPOINT_EXTERNO_CANCEL, json=payload_final, timeout=60)
        response.raise_for_status()

        resposta_api_externa_bruta = response.json()
        print("Resposta tratada do backend (cancel):", resposta_api_externa_bruta)

        if isinstance(resposta_api_externa_bruta, list):
            resposta_final = resposta_api_externa_bruta[0]
        else:
            resposta_final = resposta_api_externa_bruta

        return resposta_final

    except httpx.HTTPStatusError as exc:
        print(f"Erro HTTP na requisição de cancel: {exc.response.text}")
        raise HTTPException(
            status_code=exc.response.status_code, 
            detail=f"Erro na requisição para a API externa (cancel): {exc.response.text}"
        )
    except httpx.RequestError as exc:
        print(f"Erro de requisição de cancel: {str(exc)}")
        raise HTTPException(
            status_code=500,
            detail=f"Não foi possível se conectar à API externa. Erro: {str(exc)}"
        )
    except Exception as e:
        print(f"Erro inesperado no cancel: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Erro inesperado: {str(e)}"
        )
    
@app.post("/support")
async def support_course_backend(request: Request):
    body = await request.json()
    order_id = body.get("order_id")

    # Gerar IDs e timestamp únicos
    transaction_id = str(uuid.uuid4())
    message_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat() + "Z"

    payload_final = {
        "context": {
            "domain": "dsep:gercom-courses",
            "action": "support",
            "version": "1.1.0",
            "bap_id": "bap-network",
            "bap_uri": "http://bap-network:5002",
            "bpp_id": "bpp-network",
            "bpp_uri": "http://bpp-network:6002",
            "location": {
                "city": {
                    "name": "Belém",
                    "code": "std:091"
                },
                "country": {
                    "name": "Brasil", 
                    "code": "BRA"
                }
            },
            "transaction_id": transaction_id,   
            "message_id": message_id,           
            "ttl": "PT10M",
            "timestamp": timestamp              
        },
        "message": {
            "support": {
                "ref_id": order_id
            }
        }
    }

    try:
        response = await client.post(ENDPOINT_EXTERNO_SUPPORT, json=payload_final, timeout=60)
        response.raise_for_status()

        resposta_api_externa_bruta = response.json()
        print("Resposta tratada do backend (support):", resposta_api_externa_bruta)

        if isinstance(resposta_api_externa_bruta, list):
            resposta_final = resposta_api_externa_bruta[0]
        else:
            resposta_final = resposta_api_externa_bruta

        return resposta_final

    except httpx.HTTPStatusError as exc:
        print(f"Erro HTTP na requisição de support: {exc.response.text}")
        raise HTTPException(
            status_code=exc.response.status_code, 
            detail=f"Erro na requisição para a API externa (support): {exc.response.text}"
        )
    except httpx.RequestError as exc:
        print(f"Erro de requisição de support: {str(exc)}")
        raise HTTPException(
            status_code=500,
            detail=f"Não foi possível se conectar à API externa. Erro: {str(exc)}"
        )
    except Exception as e:
        print(f"Erro inesperado no support: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Erro inesperado: {str(e)}"
        )
    
@app.post("/rating")
async def rating_course_backend(request: Request):
    body = await request.json()
    order_id = body.get("order_id")

    # Gerar IDs e timestamp únicos
    transaction_id = str(uuid.uuid4())
    message_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat() + "Z"

    payload_final = {
        "context": {
            "domain": "dsep:gercom-courses",
            "action": "rating",
            "version": "1.1.0",
            "bap_id": "bap-network",
            "bap_uri": "http://bap-network:5002",
            "bpp_id": "bpp-network",
            "bpp_uri": "http://bpp-network:6002",
            "location": {
                "city": {
                    "name": "Belém",
                    "code": "std:091"
                },
                "country": {
                    "name": "Brasil",
                    "code": "BRA"
                }
            },
            "transaction_id": transaction_id,   
            "message_id": message_id,           
            "ttl": "PT10M",
            "timestamp": timestamp              
        },
        "message": {
            "ratings": [
                {
                    "id": order_id,
                    "rating_category": "Item",
                    "value": "4"
                }
            ]
        }
    }

    try:
        response = await client.post(ENDPOINT_EXTERNO_RATING, json=payload_final, timeout=60)
        response.raise_for_status()

        resposta_api_externa_bruta = response.json()
        print("Resposta tratada do backend (rating):", resposta_api_externa_bruta)

        if isinstance(resposta_api_externa_bruta, list):
            resposta_final = resposta_api_externa_bruta[0]
        else:
            resposta_final = resposta_api_externa_bruta

        return resposta_final

    except httpx.HTTPStatusError as exc:
        print(f"Erro HTTP na requisição de rating: {exc.response.text}")
        raise HTTPException(
            status_code=exc.response.status_code, 
            detail=f"Erro na requisição para a API externa (rating): {exc.response.text}"
        )
    except httpx.RequestError as exc:
        print(f"Erro de requisição de rating: {str(exc)}")
        raise HTTPException(
            status_code=500,
            detail=f"Não foi possível se conectar à API externa. Erro: {str(exc)}"
        )
    except Exception as e:
        print(f"Erro inesperado no rating: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Erro inesperado: {str(e)}"
        )