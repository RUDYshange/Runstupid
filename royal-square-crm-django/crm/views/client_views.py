from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from crm.services.client_service import ClientService
from crm.serializers.client_serializers import CreateClientSerializer, ClientSummarySerializer, ClientDetailSerializer

class ClientListCreateView(APIView):
    def get(self, request):
        query = request.query_params.get('q', None)
        clients = ClientService.list_clients(search=query)
        serializer = ClientSummarySerializer(clients, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = CreateClientSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        detail = ClientService.create_client(serializer.validated_data)
        out_serializer = ClientDetailSerializer(detail)
        return Response(out_serializer.data, status=status.HTTP_201_CREATED)

class ClientDetailView(APIView):
    def get(self, request, client_id):
        detail = ClientService.get_client_detail(client_id)
        if not detail:
            return Response({"detail": "Client not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = ClientDetailSerializer(detail)
        return Response(serializer.data, status=status.HTTP_200_OK)
