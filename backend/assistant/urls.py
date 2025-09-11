from django.urls import path
from . import views  # varsa ViewSet değil de function-based view'lar kullanıyorsanız

urlpatterns = [
    path("qa/", views.QAListAPIView.as_view(), name="qa-list"), 
    path("ask/", views.ask_ai, name="qa-list"),
    path("qa/category/", views.get_qa_by_category, name="qa-by-category"),
]