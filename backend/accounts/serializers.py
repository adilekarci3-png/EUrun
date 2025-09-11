from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate

User = get_user_model()

class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    # SimpleJWT alan adını buradan alır; request body'de "email" bekler.
    username_field = getattr(User, "USERNAME_FIELD", "email")

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Custom claims
        token["email"] = user.email
        token["full_name"] = getattr(user, "full_name", "")
        token["roles"] = list(getattr(user, "roles").values_list("name", flat=True)) if hasattr(user, "roles") else []
        token["phone"] = getattr(user, "phone", "")
        return token

    def validate(self, attrs):
        # Tek doğrulama: SimpleJWT yapacak ve self.user set edilecek
        data = super().validate(attrs)

        user = self.user  # SimpleJWT burada authenticated kullanıcıyı set ediyor
        data["user"] = {
            "id": user.id,
            "email": user.email,
            "full_name": getattr(user, "full_name", ""),
            "roles": list(getattr(user, "roles").values_list("name", flat=True)) if hasattr(user, "roles") else [],
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
        }
        return data
