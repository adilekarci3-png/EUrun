# E-URUN/deneme.py
import os
import django
import sys

sys.path.append(os.path.abspath("."))  # E-URUN/ dizinini sys.path'e ekle
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from firmalar.models import Firma

Firma.objects.create(full_name="Test Firma", email="test@firma.com", phone="123456789")
print("Veri başarıyla eklendi.")
