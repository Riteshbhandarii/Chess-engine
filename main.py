from dotenv import load_dotenv
import os

load_dotenv()

api_token = os.getenv("API_Token")

print(api_token)