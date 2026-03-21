from fastapi import FastAPI
from .database import engine
from . import models
from .routers import api, onboarding
from .seed import seed

# Создание таблиц и наполнение базы
models.Base.metadata.create_all(bind=engine)
seed()

app = FastAPI(title="LoLSochnikKeK API", version="1.0.0")

# Подключаем роутеры
app.include_router(api.router, prefix="/api/v1")
app.include_router(onboarding.router, prefix="/api/v1/onboarding")


@app.get("/")
def read_root():
    return {"message": "Welcome to LoLSochnikKeK API (PhysFac MSU)"}


@app.get("/health")
def health_check():
    return {"status": "ok"}
