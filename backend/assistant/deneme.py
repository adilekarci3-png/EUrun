import openai

# OpenRouter istemcisi
client = openai.OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key="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",  # 🔐 API anahtarını buraya gir
)

# Mesajlar ve model ayarı
response = client.chat.completions.create(
    model="openai/gpt-4o",
    messages=[
        {"role": "system", "content": "Sen basit bir asistan botsun."},
        {"role": "user", "content": "Merhaba, hava bugün nasıl?"}
    ],
    max_tokens=100,
    extra_headers={
        "HTTP-Referer": "http://localhost",
        "X-Title": "Deneme Asistani"  # 'ı' yerine 'i'
    }
)

# Yanıtı yazdır
print("Asistan:", response.choices[0].message.content.strip())