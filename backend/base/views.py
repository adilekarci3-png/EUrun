import random
from django.conf import settings
from django.shortcuts import get_object_or_404, render
from django.views.decorators.csrf import csrf_exempt
from django.core.cache import cache
from google.auth.transport import requests as g_requests
import json
from django.db import models
import requests

from accounts.models import CustomUser
from accounts.serializers import EmailTokenObtainPairSerializer
from base.models import Notification, Brand, CartItem, Category, CustomUserProfile, Product,ProductFavorite, ProductQuestionAnswer, ProductRating
from base.serializer import NotificationSerializer, BrandSerializer, CartItemSerializer, CategorySerializer, CustomUserSerializer, ProductQuestionAnswerSerializer, ProductRatingSerializer, ProductSerializer,ChangePasswordSerializer,RegisterSerializer

from rest_framework.decorators import api_view,permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from drf_yasg.utils import swagger_auto_schema
from django.template.loader import render_to_string

# from django.contrib.auth.models import User
from rest_framework import generics, permissions, filters,viewsets
from rest_framework.decorators import action
from django.core.mail import send_mail
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_decode
from .utils import CustomPasswordResetTokenGenerator

# from django.contrib.auth import get_user_model
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
# User = get_user_model()
from django.contrib.auth.models import User

import requests
from allauth.socialaccount.models import SocialLogin
from django.contrib.auth import login as django_login
from allauth.socialaccount.helpers import complete_social_login
from allauth.socialaccount.models import SocialApp

from django.contrib.auth import get_user_model
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as grequests

API_URL = "https://api.iletimerkezi.com/v1/send-sms/get"
API_KEY = "30367d635b24ad9069e34fbe2c8865f3"
HASH = "88a29e86a4ae0205697bd6e2f1680c7d32ff042b86e380c184717d944bf2b34e"
SENDER = "APITEST"
# Create your views here.
token_generator = CustomPasswordResetTokenGenerator()

@api_view(['GET'])
# @permission_classes([IsAuthenticated])
def get_products(request):
    products = Product.objects.all()
    serializer = ProductSerializer(products, many=True)
    print(products)
    return Response(serializer.data)

@api_view(['GET'])
def get_categories(request):
    categories = Category.objects.all()
    serializer = CategorySerializer(categories, many=True)
    print(categories)
    return Response(serializer.data)

@api_view(['GET'])
# @permission_classes([IsAuthenticated])
def get_brands(request):
    brands = Brand.objects.all()
    serializer = BrandSerializer(brands, many=True)
    print(brands)
    return Response(serializer.data)

@api_view(['GET'])
# @permission_classes([IsAuthenticated])
def get_product(request,pk):
    try:
        product = Product.objects.get(id=pk)
        serializer = ProductSerializer(product, many=False)
        return Response(serializer.data)
    except Product.DoesNotExist:
        return Response({"detail": "Ürün bulunamadı."}, status=404)
    
@swagger_auto_schema(method='post', request_body=ProductSerializer)
@api_view(['POST'])
def create_product(request):
    print(request.data)
    serializer = ProductSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST) 
    
@swagger_auto_schema(method='post', request_body=CategorySerializer)
@api_view(['POST'])
def create_category(request):
    print(request.data)
    serializer = CategorySerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST) 

@swagger_auto_schema(method='post', request_body=BrandSerializer)
@api_view(['POST'])
def create_brand(request):
    print(request.data)
    serializer = BrandSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST) 

@api_view(['PUT'])
def update_product(request,pk):
    print(request)
    print(pk)
    try:
        product = Product.objects.get(pk=pk)
        print(product)
    except Product.DoesNotExist:
       return Response({'error':'Ürün bulunmadı'}, status=status.HTTP_404_NOT_FOUND)   
       
    serializer = ProductSerializer(product,data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_404_NOT_FOUND)  

@api_view(['DELETE'])
def delete_product(request,pk):
    try:
        product = Product.objects.get(pk=pk)
        product.delete()
        return Response({'message': 'Ürün silindi'}, status=status.HTTP_204_NO_CONTENT)
    except Product.DoesNotExist:
       return Response({'error':'Ürün bulunmadı'}, status=status.HTTP_404_NOT_FOUND) 



class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

class UserDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = CustomUserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

class ChangePasswordView(generics.UpdateAPIView):
    serializer_class = ChangePasswordSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            old_password = serializer.validated_data.get("old_password")
            new_password = serializer.validated_data.get("new_password")

            if not user.check_password(old_password):
                return Response(
                    {"old_password": "Yanlış parola"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            user.set_password(new_password)
            user.save()

            # E-posta gönder
            send_mail(
                subject="Parola Değişikliği Yapıldı",
                message="Merhaba, parolanız başarıyla değiştirildi. Eğer bu işlemi siz yapmadıysanız lütfen hemen bizimle iletişime geçin.",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True,
            )

            return Response({"message": "Parola değiştirildi"}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetRequestView(APIView):
    def post(self, request):
        email = request.data.get("email")
        if not email:
            return Response({"error": "Email gerekli"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "Kullanıcı bulunamadı"}, status=status.HTTP_404_NOT_FOUND)

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = token_generator.make_token(user)

        # BURADA token kontrol ETMEYİN

        reset_link = f"http://localhost:3000/reset-password/{uid}/{token}"

        message = render_to_string(
            "email/mail.html",
            {"reset_link": reset_link}
        )

        send_mail(
            "Şifre Sıfırlama",
            message,
            "adile.karci@hotmail.com",
            [email],  # Kendi e-posta adresinizi yazmak yerine kullanıcının emaili olmalı
        )
       
        return Response({"message": "Sıfırlama bağlantısı gönderildi."})
    
class PasswordResetConfirmView(APIView):
    def post(self, request, uidb64, token):
        password = request.data.get("password")
        if not password:
            return Response({"error": "Parola gerekli"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = User.objects.get(pk=uid)
        except (User.DoesNotExist, ValueError, UnicodeDecodeError):
            return Response({"error": "Geçersiz bağlantı"}, status=status.HTTP_400_BAD_REQUEST)

        if not token_generator.check_token(user, token):
            return Response({"error": "Token geçersiz veya süresi dolmuş"}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(password)
        user.save()
        return Response({"message": "Parola başarıyla güncellendi."})

def rolesUser(user):
    if not user:
        return []
    return list(user.roles.values_list("name", flat=True))

@swagger_auto_schema(
    method='post',
    operation_description="Telefon numarasına SMS doğrulama kodu gönderir",
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        required=["phone"],
        properties={
            'phone': openapi.Schema(type=openapi.TYPE_STRING, description='Telefon numarası (05XXXXXXXXX)'),
        }
    )
) 
@api_view(['POST'])
def send_sms(request):
    phone = request.data.get("phone")
    if not phone:
        return Response({"success": False, "error": "Telefon gerekli"}, status=400)   
    
    # phone_normalized = phone.lstrip("0")
    
    if not CustomUser.objects.filter(phone=phone).exists():
        return Response({"success": False, "error": "Bu telefon sistemde kayıtlı değil."}, status=404)
    
    code = "123456"  
    cache.set(f"sms_code_{phone}", code, timeout=300)
    
    params = {
        "key": API_KEY,
        "hash": HASH,
        "text": "deneme deneme deneme",  
        "receipents": phone.lstrip("0"),
        "sender": SENDER,
        "iys": 1,
        "iysList": "BIREYSEL"
    }

    try:
        requests.get(API_URL, params=params)
        return Response({"success": True, "test_code": code}) 
    except Exception as e:
        return Response({"success": False, "error": str(e)}, status=500)

@swagger_auto_schema(
    method='post',
    operation_description="Telefon numarası ve doğrulama kodu ile giriş yapar. Kod doğruysa JWT token döner.",
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        required=["phone", "test_code"],
        properties={
            'phone': openapi.Schema(type=openapi.TYPE_STRING, description='Telefon numarası (05XXXXXXXXX)'),
            'test_code': openapi.Schema(type=openapi.TYPE_STRING, description='Doğrulama kodu (örn: 1234)'),
        },
    )
)
@api_view(['POST']) 
def verify_code(request):
    
    data = json.loads(request.body)
    phone_number = data.get("phone")
    code = data.get("test_code")

    saved_code = cache.get(f"sms_code_{phone_number}")
    # if code == saved_code:
    print("deneme")
    
    User = get_user_model()
    user, created = User.objects.get_or_create(
        phone=phone_number,
        defaults={"is_active": True},
    )
    print(user)
    if created:
        user.set_unusable_password()
        user.save()
    
    # Use the custom EmailTokenObtainPairSerializer to generate tokens with claims
    refresh = EmailTokenObtainPairSerializer.get_token(user)
    
    cache.delete(f"sms_code_{phone_number}")  
    
    roles = []
    if hasattr(user, "roles"):
        try:
            roles = list(user.roles.values_list("name", flat=True))
        except Exception:
            pass
            
    return Response({
        "success": True,
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": getattr(user, "full_name", ""),
            "roles": roles,
        }
    }, status=200)

        
        # return JsonResponse({
        # "success": True,
        # "access": str(access),   # <-- ÖNEMLİ
        # "refresh": str(refresh), # <-- ÖNEMLİ
        # "user": {
        #     "id": user.id,
        #     "email": user.email,
        #     "full_name": user.full_name,
        #     "phone": user.phone,
        #     "roles": roles,
        #     "is_staff": user.is_staff,
        #     "is_superuser": user.is_superuser,
        # },
        # }, status=200)
    # else:
    #     return JsonResponse({"success": False, "error": "Kod hatalı veya süresi doldu."})


@swagger_auto_schema(
    method='put',
    request_body=CustomUserSerializer,
    operation_description="Kullanıcı profilini (ad, soyad, email, telefon) günceller"
)
@api_view(['GET', 'PUT'])
# @permission_classes([IsAuthenticated])
def user_profile_view(request):
    user = request.user

    if request.method == 'GET':
        serializer = CustomUserSerializer(user)
        print(serializer.data)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = CustomUserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            print(request.data)
            profile = user.userprofile
            phone = request.data.get("phone")
            address = request.data.get("address")
            if phone:
                profile.phone = phone
            if address:
                profile.address = address
            profile.save()

            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def rate_product(request, pk):
    try:
        product = Product.objects.get(pk=pk)
    except Product.DoesNotExist:
        return Response({'detail': 'Ürün bulunamadı.'}, status=status.HTTP_404_NOT_FOUND)
    
    try:
        rating = int(request.data.get('rating', 0))
    except (TypeError, ValueError):
        return Response({'detail': 'Geçersiz puan değeri.'}, status=status.HTTP_400_BAD_REQUEST)
       
    if rating < 1 or rating > 5:
        return Response({'detail': 'Geçersiz puan.'}, status=400)
    
    ProductRating.objects.update_or_create(
        user=request.user,
        product=product,
        defaults={'rating': rating}
    )
    
    product.update_average_rating()
    
    return Response({
        "message": "Puan kaydedildi.",
        "update_average_rating": product.rating
    }, status=status.HTTP_200_OK)
    
    
@api_view(['POST', 'DELETE'])
# @permission_classes([IsAuthenticated])
def favorite_product(request, pk):
    user = request.user

    if request.method == 'POST':
        ProductFavorite.objects.get_or_create(user=user, product_id=pk)
        return Response({'favorited': True, 'message': 'Favorilere eklendi.'})

    if request.method == 'DELETE':
        ProductFavorite.objects.filter(user=user, product_id=pk).delete()
        return Response({'favorited': False, 'message': 'Favorilerden çıkarıldı.'})

    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_product_rating(request, product_id):
    user = request.user
    try:
        rating_obj = ProductRating.objects.get(user=user, product_id=product_id)
        return Response({"rating": rating_obj.rating})
    except ProductRating.DoesNotExist:
        return Response({"rating": 0})
    
@api_view(['GET'])
# @permission_classes([IsAuthenticated])
def is_favorited(request, pk):
    user = request.user
    exists = ProductFavorite.objects.filter(user=user, product_id=pk).exists()
    return Response({'favorited': exists})


@api_view(['GET', 'POST', 'DELETE'])
# @permission_classes([IsAuthenticated])
def cart_view(request):
    user = request.user

    if request.method == 'GET':
        cart_items = CartItem.objects.filter(user=user)
        serializer = CartItemSerializer(cart_items, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        product_id = request.data.get("product_id")
        quantity = int(request.data.get("quantity", 1))

        if not product_id:
            return Response({"error": "Ürün ID gerekli."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({"error": "Ürün bulunamadı."}, status=status.HTTP_404_NOT_FOUND)

        cart_item, created = CartItem.objects.get_or_create(user=user, product=product)

        if not created:
            cart_item.quantity += quantity
        else:
            cart_item.quantity = quantity

        cart_item.save()
        return Response({"message": "Sepete eklendi."}, status=status.HTTP_201_CREATED)
    
    elif request.method == 'DELETE':
        cart_item_id = request.data.get("cart_item_id")
        if not cart_item_id:
            return Response({"error": "cart_item_id gerekli."}, status=status.HTTP_400_BAD_REQUEST)

        deleted_count, _ = CartItem.objects.filter(user=user, id=cart_item_id).delete()
        if deleted_count == 0:
            return Response({"error": "Ürün bulunamadı veya silinemedi."}, status=status.HTTP_404_NOT_FOUND)

        return Response({"message": "Ürün sepetten silindi."}, status=status.HTTP_204_NO_CONTENT)

class ReviewListCreateAPIView(APIView):
    # permission_classes = [permissions.IsAuthenticated]

    def get(self, request, product_pk):
        print(product_pk)
        reviews = ProductRating.objects.filter(product_id=product_pk)
        serializer = ProductRatingSerializer(reviews, many=True)
        return Response(serializer.data)

    def post(self, request, product_pk):
        print(product_pk)
        product = get_object_or_404(Product, pk=product_pk)
        rating = request.data.get("rating")
        comment = request.data.get("comment", "").strip()
        
        try:
            rating = int(rating)
            if not 1 <= rating <= 5:
                return Response({"detail": "Puan 1 ile 5 arasında olmalı."}, status=status.HTTP_400_BAD_REQUEST)
        except (TypeError, ValueError):
            return Response({"detail": "Geçersiz puan formatı."}, status=status.HTTP_400_BAD_REQUEST)
    
        
        rating_obj, created = ProductRating.objects.update_or_create(
            user=request.user,
            product=product,            
            defaults={"rating": rating, "comment": comment}
        )
    
        product.update_average_rating() 
    
        return Response({
            "message": "Puan kaydedildi." if created else "Puan güncellendi.",
            "update_average_rating": product.rating
        }, status=status.HTTP_200_OK)

class QAListCreateAPIView(APIView):
    # permission_classes = [permissions.IsAuthenticated]

    def get(self, request, product_pk):
        print(product_pk)
        questions = ProductQuestionAnswer.objects.filter(product_id=product_pk)
        serializer = ProductQuestionAnswerSerializer(questions, many=True)
        return Response(serializer.data)

    def post(self, request, product_pk):
        product = get_object_or_404(Product, pk=product_pk)
        question = request.data.get("question", "").strip()

        if not question:
            return Response({"detail": "Soru boş olamaz."}, status=400)
        
        obj, created = ProductQuestionAnswer.objects.update_or_create(
            user=request.user,
            product=product,
            defaults={"question": question}
        )
        
        serializer = ProductQuestionAnswerSerializer(obj)

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        ) 

# class GoogleLoginAPI(SocialLoginView):
#     adapter_class = GoogleOAuth2Adapter
      
class GoogleLoginAPIView(APIView):
    authentication_classes = []
    permission_classes = []

    @swagger_auto_schema(
        operation_description="Google ID Token ile giriş yapar. \
            Token doğrulanırsa JWT access/refresh token ve kullanıcı bilgileri döner.",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=["id_token"],  # swagger UI’da zorunlu parametre
            properties={
                "id_token": openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description="Google'dan gelen ID Token (credential)",
                ),
            },
            example={"id_token": "<GOOGLE_ID_TOKEN_JWT>"}
        ),
        responses={
            200: openapi.Response(
                description="JWT token ve kullanıcı bilgileri",
                examples={
                    "application/json": {
                        "success": True,
                        "access": "<ACCESS_TOKEN>",
                        "refresh": "<REFRESH_TOKEN>",
                        "user": {
                            "id": 1,
                            "email": "user@example.com",
                            "full_name": "Test User",
                            "roles": ["Koordinator", "Egitmen"]
                        }
                    }
                }
            ),
            400: openapi.Response(
                description="Hatalı istek",
                examples={
                    "application/json": {"success": False, "error": "credential (id_token) gerekli."}
                }
            ),
        }
    )
    def post(self, request):
        # credential (id_token) + geriye dönük uyum
        raw_id_token = (
            request.data.get("credential")
            or request.data.get("id_token")
            or request.data.get("access_token")  # eski koda uyum için
        )
        print(request.data.get("credential"))
        if not raw_id_token:
            return Response({"success": False, "error": "credential (id_token) gerekli."}, status=400)

        try:
            # ID token doğrulama + audience kontrolü
            info = google_id_token.verify_oauth2_token(
                raw_id_token,
                g_requests.Request(),        # ✅ doğru Request sınıfı
                settings.GOOGLE_CLIENT_ID,
            )
            if info.get("iss") not in ("accounts.google.com", "https://accounts.google.com"):
                return Response({"success": False, "error": "Geçersiz issuer."}, status=400)

            email = info.get("email")
            full_name = info.get("name") or ""
            if not email:
                return Response({"success": False, "error": "Email bilgisi alınamadı."}, status=400)

            User = get_user_model()
            user, created = User.objects.get_or_create(
                email=email,
                defaults={"full_name": full_name, "is_active": True},
            )
            if created:
                user.set_unusable_password()
                user.save()

            refresh = EmailTokenObtainPairSerializer.get_token(user)
            roles = []
            if hasattr(user, "roles"):
                try:
                    roles = list(user.roles.values_list("name", flat=True))
                except Exception:
                    pass

            return Response({
                "success": True,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "full_name": getattr(user, "full_name", ""),
                    "roles": roles,
                }
            }, status=200)

        except Exception as e:
            return Response({"success": False, "error": f"Invalid token: {e}"}, status=400)
        
class NotificationListAPIView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Notification.objects.filter(
            models.Q(recipient__isnull=True) | models.Q(recipient=user)
        ).order_by("-created_at")
        
class NotificationMarkReadAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            notif = Notification.objects.get(pk=pk)
        except Notification.DoesNotExist:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        if notif.recipient and notif.recipient != request.user:
            return Response({"detail": "Yetkiniz yok"}, status=status.HTTP_403_FORBIDDEN)

        notif.read = True
        notif.save(update_fields=["read"])
        return Response({"detail": "Marked as read"})
    
class NotificationMarkAllReadAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        qs = Notification.objects.filter(
            models.Q(recipient__isnull=True) | models.Q(recipient=request.user),
            read=False
        )
        qs.update(read=True)
        return Response({"detail": "All read"})