from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from crm.services.ui_service import UIService

class ClientFormSchemaView(APIView):
    def get(self, request):
        return Response(UIService.get_client_form_schema(), status=status.HTTP_200_OK)

class ClaimFormSchemaView(APIView):
    def get(self, request):
        return Response(UIService.get_claim_form_schema(), status=status.HTTP_200_OK)
