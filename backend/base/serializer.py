from rest_framework import serializers
from accounts.models import CustomUser
from accounts.serializers import User
from .models import Brand, CartItem, Category, CustomUserProfile, Document, Notification, Product, ProductQuestionAnswer, ProductRating
from rest_framework import serializers
from rest_framework.validators import UniqueValidator

from django.contrib.auth.password_validation import validate_password

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = "__all__"
        read_only_fields = ["created_by"]

    def create(self, validated_data):
        user = self.context["request"].user
        validated_data["created_by"] = user if user.is_authenticated else None
        return super().create(validated_data)
    
class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model =Brand
        fields = ['id','name']
    
        
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model=Category
        fields = ['id','name']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True)

    email = serializers.EmailField(
        validators=[UniqueValidator(queryset=User.objects.all(), message="Bu e-posta zaten kullanılıyor.")]
    )

    class Meta:
        model = User
        # NOT: last_name alanı modelde yok; kaldırıldı
        fields = ("email", "full_name", "password", "password2")
        ref_name = "CustomRegisterSerializer"  # drf_yasg çakışmalarını engellemek isterseniz kalsın

    def validate(self, data):
        if data.get("password") != data.get("password2"):
            raise serializers.ValidationError("Parolalar eşleşmiyor.")
        return data

    def create(self, validated_data):
        validated_data.pop("password2", None)
        password = validated_data.pop("password")
        # CustomUserManager.create_user, set_password uygular varsayımıyla:
        user = User.objects.create_user(password=password, **validated_data)
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUserProfile
        fields = ["phone", "address"]


class CustomUserSerializer(serializers.ModelSerializer):
    # Nested profil: hem oku hem yaz (read_only=False). İsim "profile", instance tarafı "userprofile".
    profile = UserProfileSerializer(required=False)
    # Rolleri göstermek isterseniz (salt okunur metin olarak):
    roles = serializers.SlugRelatedField(
        many=True,
        slug_field="name",
        read_only=True,  # rolleri API ile atamak isterseniz read_only=False + queryset=Role.objects.all() yapın
    )

    class Meta:
        model = User
        fields = ("id", "email", "full_name", "is_staff", "roles", "profile")

    def update(self, instance, validated_data):
        # Nested profile verisi "profile" anahtarından gelir
        profile_data = validated_data.pop("profile", None)
        # Kullanıcı temel alanlarını güncelle
        instance = super().update(instance, validated_data)

        if profile_data is not None:
            # Kullanıcının profili yoksa oluştur
            profile, _ = CustomUserProfile.objects.get_or_create(user=instance)
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()

        return instance

class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer()

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'quantity']

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)

class ProductRatingSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = ProductRating
        fields = ['id', 'user', 'user_name', 'product', 'rating', 'created_at','comment']
        read_only_fields = ['user', 'created_at','product','comment']
        
class ProductQuestionAnswerSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = ProductQuestionAnswer
        fields = ['id', 'user', 'user_name', 'product', 'question', 'answer', 'created_at']
        read_only_fields = ['user', 'created_at', 'answer','product']
        
class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            "id", "title", "message", "type", "channel",
            "read", "created_at", "content_type", "object_id"
        ]
        read_only_fields = ["id", "created_at", "content_type", "object_id"]
        
class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = "__all__"