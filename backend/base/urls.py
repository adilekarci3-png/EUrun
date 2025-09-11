from django.urls import include, path

from accounts.views import LoginView, MeView
from . import views
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('',views.get_products, name="routes"),   
    path('products/', views.get_products, name='products'),  
    path('products/<int:pk>/', views.get_product, name='product-detail'),
    path('products/create/', views.create_product, name='product-create'),   
    path('products/<int:pk>/update/', views.update_product, name='product-update'),   
    path('products/delete/<int:pk>/', views.delete_product, name='product-delete'),   
    path('categories/', views.get_categories, name='categories'),    
    path('brands/', views.get_brands, name='brands'),   
    path('categories/create/', views.create_category, name='product-category'),  
    path('brands/create/', views.create_brand, name='product-brand'),  
    path('products/<int:pk>/rate/', views.rate_product, name='rate-product'),
    path('products/<int:pk>/favorite/', views.favorite_product, name='favorite-product'),
    path('products/<int:product_id>/user-rating/', views.get_user_product_rating, name='user-product-rating'),
    path('products/<int:pk>/is-favorited/', views.is_favorited, name='is-favorited'),
    path('cart/', views.cart_view, name='cart'),
    path('products/<int:product_pk>/reviews/', views.ReviewListCreateAPIView.as_view(), name='product-reviews'),
    path('products/<int:product_pk>/qa/', views.QAListCreateAPIView.as_view(), name='product-qa'),
    
    #Kullanıcı Yönetim
    path('register/', views.RegisterView.as_view(), name='register'),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("me/", MeView.as_view(), name="me"),
    path('change-password/', views.ChangePasswordView.as_view(), name='change-password'),
    path("password-reset/", views.PasswordResetRequestView.as_view()),
    path("password-reset-confirm/<uidb64>/<token>/", views.PasswordResetConfirmView.as_view()),
    path('profile/', views.user_profile_view, name='user-profile'),
    
    # dj-rest-auth
    # path('auth/', include('dj_rest_auth.urls')),
    path('auth/registration/', include('dj_rest_auth.registration.urls')),

    # allauth (Google sosyal login için gerekli)
    path('auth/social/', include('allauth.socialaccount.urls')),

    # Google login endpoint (React frontend'den access_token geldiğinde kullanılır)
    path('auth/google/', views.GoogleLoginAPIView.as_view(), name='google_login'), 
    #SMS
    path("send-sms/", views.send_sms),
    path("verify-code/", views.verify_code),
    
    #Firmalar
    path('firmalar/', include('firmalar.urls')),
    
    #notification
    path("notifications/", views.NotificationListAPIView.as_view(), name="notifications-list"),
    path("notifications/mark-all-read/", views.NotificationMarkAllReadAPIView.as_view(), name="notifications-mark-all"),
    path("notifications/<int:pk>/mark-read/", views.NotificationMarkReadAPIView.as_view(), name="notifications-mark"),
    
]
