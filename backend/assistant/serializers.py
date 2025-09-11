from rest_framework import serializers
from .models import QAEntry

class QAEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = QAEntry
        fields = '__all__'