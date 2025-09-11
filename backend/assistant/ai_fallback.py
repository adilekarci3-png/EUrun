import openai
import os

openai.api_key = os.getenv("OPENAI_API_KEY")  # .env'den alınır
print(os.getenv("OPENAI_API_KEY"))
def ask_gpt(question, language="tr"):
    system_prompt = "Sen e-ürün platformunun destek asistanısın. Kısa ve net cevaplar ver."
    if language == "en":
        system_prompt = "You are a helpful assistant for an e-commerce platform. Answer shortly and clearly."

    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question}
            ],
            max_tokens=150
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return "GPT yanıtı alınamadı."
