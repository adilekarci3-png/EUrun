from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from firmalar.models import Firma
from firmalar.serializers import FirmaSerializer
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

class FirmaAPIView(APIView):
    def get(self, request):
        queryset = Firma.objects.all()
        serializer = FirmaSerializer(queryset, many=True)
        return Response(serializer.data)

    @swagger_auto_schema(
        operation_description="Yeni firma kaydı oluşturur",
        request_body=FirmaSerializer,
        responses={201: FirmaSerializer()}
    )
    def post(self, request):
        serializer = FirmaSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)
    
    def delete(self, request, pk):
        try:
            firma = Firma.objects.get(pk=pk)
            firma.delete()
            return Response(status=204)
        except Firma.DoesNotExist:
            return Response({'detail': 'Firma bulunamadı'}, status=404)
        
class FirmaDetailAPIView(APIView):
    def get_object(self, pk):
        try:
            return Firma.objects.get(pk=pk)
        except Firma.DoesNotExist:
            return None

    def get(self, request, pk):
        firma = self.get_object(pk)
        if not firma:
            return Response({'detail': 'Firma bulunamadı'}, status=404)
        serializer = FirmaSerializer(firma)
        return Response(serializer.data)

    @swagger_auto_schema(
        operation_description="Firma kaydını günceller",
        request_body=FirmaSerializer,
        responses={200: FirmaSerializer()}
    )
    def put(self, request, pk):
        firma = self.get_object(pk)
        if not firma:
            return Response({'detail': 'Firma bulunamadı'}, status=404)
        serializer = FirmaSerializer(firma, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        firma = self.get_object(pk)
        if not firma:
            return Response({'detail': 'Firma bulunamadı'}, status=404)
        firma.delete()
        return Response(status=204)
