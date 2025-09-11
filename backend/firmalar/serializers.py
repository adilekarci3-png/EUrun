from rest_framework import serializers
from firmalar.models import Firma, Address

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ['street', 'city', 'country', 'postal_code']

class FirmaSerializer(serializers.ModelSerializer):
    address = AddressSerializer(write_only=True)
    address_data = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Firma
        fields = ['id', 'full_name', 'email', 'phone', 'address', 'address_data']

    def get_address_data(self, obj):
        try:
            address = Address.objects.get(firma=obj)
            return AddressSerializer(address).data
        except Address.DoesNotExist:
            return None

    def create(self, validated_data):
        address_data = validated_data.pop('address')
        firma = Firma.objects.create(**validated_data)
        Address.objects.create(firma=firma, **address_data)
        return firma

    def update(self, instance, validated_data):
        address_data = validated_data.pop('address', None)
        instance.full_name = validated_data.get('full_name', instance.full_name)
        instance.email = validated_data.get('email', instance.email)
        instance.phone = validated_data.get('phone', instance.phone)
        instance.save()
        if address_data:
            Address.objects.update_or_create(firma=instance, defaults=address_data)
        return instance
