from django.contrib import admin
from .models import QACategory, QALanguage, SoruCevap
from django.db.models import Q

@admin.register(SoruCevap)
class SoruCevapAdmin(admin.ModelAdmin):
    list_display = ["get_language", "get_category", "question", "active", "created_at"]
    search_fields = ["question", "answer"]
    list_filter = ["language", "category", "active", "created_at"]
    ordering = ["-created_at"]

    def get_language(self, obj):
        return obj.language.name if obj.language else "-"
    get_language.short_description = "Dil"

    def get_category(self, obj):
        return obj.category.name if obj.category else "-"
    get_category.short_description = "Kategori"

admin.site.register(QALanguage)
admin.site.register(QACategory)