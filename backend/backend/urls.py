from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static

from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

# Google login view'ı import et
from base.views import GoogleLoginAPIView

# Swagger/OpenAPI
schema_view = get_schema_view(
    openapi.Info(
        title="E-Ürün Dokümantasyonu",
        default_version='v1',
        description="Bu proje için Swagger API dokümantasyonudur.",
        contact=openapi.Contact(email="destek@ornek.com"),
        license=openapi.License(name="MIT Lisansı"),
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)

urlpatterns = [
    # Swagger / ReDoc
    re_path(r'^swagger(?P<format>\.json|\.yaml)$', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),

    # Django Admin
    path('admin/', admin.site.urls),     

    # Uygulama içi URL'ler
    path('', include('base.urls')),
    path('api/', include('base.urls')),
    path("api/assistant/", include("assistant.urls")),    
]

# Geliştirme ortamı için medya dosyaları
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    
