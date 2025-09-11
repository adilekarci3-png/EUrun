import requests
from rest_framework.views import APIView
from rest_framework.response import Response

from base.serializer import ProductSerializer
from .models import QACategory, SoruCevap, QALanguage
from rest_framework.permissions import AllowAny
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from rest_framework import status
from .qa_data import qa_data
from .ai_fallback import ask_gpt
from rest_framework.decorators import api_view
import os
from openai import OpenAI
from decouple import config
from django.conf import settings


OPENROUTER_API_KEY = "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"
client = OpenAI(api_key=OPENROUTER_API_KEY)

@swagger_auto_schema(
    method='post',
    manual_parameters=[
        openapi.Parameter(
            'lang',
            openapi.IN_QUERY,
            description="Dil kodu (örnek: tr veya en)",
            type=openapi.TYPE_STRING,
            default="tr"
        )
    ],
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        required=['question'],
        properties={
            'question': openapi.Schema(type=openapi.TYPE_STRING, description='Kullanıcının sorusu'),
        }
    ),
    responses={200: openapi.Response(description="GPT yanıtı")}
)

@api_view(["POST"])
def ask_ai(request):
    question = request.data.get("question")
    if not question:
        return Response({"error": "Soru zorunludur"}, status=400)

    headers = {
        "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost",  # OpenRouter için önerilen
        "X-Title": "Deneme Asistani"         # Türkçe olmayan karakterlerle
    }

    payload = {
        "model": "openai/gpt-4o",  # GPT-4o ya da desteklenen başka model
        "messages": [
            {"role": "system", "content": "Sen e-ürün asistanısın, kısa ve net cevap ver."},
            {"role": "user", "content": question}
        ],
        "max_tokens": 150
    }

    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            json=payload,
            headers=headers
        )
        response.raise_for_status()
        data = response.json()
        return Response({"answer": data["choices"][0]["message"]["content"].strip()})
    except requests.exceptions.RequestException as e:
        return Response({"error": "AI yanıtı alınamadı", "details": str(e)}, status=500)


class QAListAPIView(APIView):
    permission_classes = [AllowAny]
    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                'lang',
                openapi.IN_QUERY,
                description="Dil kodu (örnek: tr veya en)",
                type=openapi.TYPE_STRING,
                default="tr"
            )
        ],
        responses={200: openapi.Response("Soru-Cevap listesi")}
    )
    def get(self, request):
        lang = request.GET.get("lang", "tr")
        entries = SoruCevap.objects.filter(language=lang, active=True)
        result = [{"question": e.question, "answer": e.answer} for e in entries]
        return Response(result)
    
@api_view(["GET"])
def get_qa_by_category(request):
    category_slug = request.GET.get("category")
    lang_code = request.GET.get("lang", "tr")

    try:
        category = QACategory.objects.get(slug=category_slug)
        language = QALanguage.objects.get(code=lang_code)

        qa = SoruCevap.objects.filter(category=category, language=language, active=True).first()

        if qa:
            return Response({"question": qa.question, "answer": qa.answer})
        return Response({"error": "Kayıt bulunamadı"}, status=404)

    except Exception as e:
        return Response({"error": f"Hata oluştu: {str(e)}"}, status=400)
    
