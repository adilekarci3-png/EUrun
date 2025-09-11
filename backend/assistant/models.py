from django.db import models
from datetime import date

LANGUAGE_CHOICES = [
    ('tr', 'Türkçe'),
    ('en', 'English'),
    # başka diller eklersen buraya ekle
]

# class QAEntry(models.Model):
#     question = models.CharField("Soru", max_length=255)
#     answer = models.TextField("Cevap")
#     language = models.CharField("Dil", max_length=10, choices=LANGUAGE_CHOICES, default='tr')
#     category = models.ForeignKey("QACategory", on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Kategori")
#     active = models.BooleanField("Aktif", default=True)
#     created_at = models.DateField(default=date.today,null=True, blank=True)
    
#     def __str__(self):
#         return f"[{self.language}] {self.question}"
    
#     class Meta:
#         verbose_name = "Soru-Cevap"
#         verbose_name_plural = "Soru-Cevaplar"
        
class QACategory(models.Model):
    name = models.CharField("Kategori Adı", max_length=100, unique=True)
    slug = models.SlugField("Slug", max_length=100, unique=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Kategori"
        verbose_name_plural = "Kategoriler"

class QALanguage(models.Model):
    code = models.CharField("Dil Kodu", max_length=10, unique=True) 
    name = models.CharField("Dil Adı", max_length=50)  

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Dil"
        verbose_name_plural = "Diller"


class SoruCevap(models.Model):
    question = models.CharField("Soru", max_length=255)
    answer = models.TextField("Cevap")
    language = models.ForeignKey(
        QALanguage,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Dil"
    )
    category = models.ForeignKey(
        QACategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Kategori"
    )
    active = models.BooleanField("Aktif", default=True)
    created_at = models.DateField(default=date.today, null=True, blank=True)

    def __str__(self):
        return f"[{self.language}] {self.question}"

    class Meta:
        verbose_name = "Soru-Cevap"
        verbose_name_plural = "Soru-Cevaplar"