from django.urls import path

from firmalar.views import FirmaAPIView, FirmaDetailAPIView

urlpatterns = [
    path('', FirmaAPIView.as_view(), name='firma-list-create'),
    path('<int:pk>/', FirmaDetailAPIView.as_view(), name='firma-detail'), 
]