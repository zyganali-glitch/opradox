import uvicorn

if __name__ == "__main__":
    print(">>> opradox 2.0 Baslatiliyor...")
    print(">>> Tarayicidan http://localhost:8100 adresine gidin.")
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8100, reload=True)