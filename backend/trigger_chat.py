import httpx
import asyncio

async def main():
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            print("Sending request...")
            resp = await client.post(
                "http://127.0.0.1:8000/api/chat/",
                json={"message": "你是谁"}
            )
            print(f"Status: {resp.status_code}")
            print(f"Response: {resp.text}")
    except Exception as e:
        print(f"Request failed: {repr(e)}")

if __name__ == "__main__":
    asyncio.run(main())
