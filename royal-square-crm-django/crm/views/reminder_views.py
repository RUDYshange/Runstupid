from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from crm.services.reminder_service import ReminderService

class ReminderListView(APIView):
    def get(self, request):
        reminders = ReminderService.get_open_reminders()
        return Response(reminders, status=status.HTTP_200_OK)

class RuleListView(APIView):
    def get(self, request):
        rules = ReminderService.get_rules_summary()
        return Response(rules, status=status.HTTP_200_OK)

class ReminderDismissView(APIView):
    def post(self, request):
        key = request.data.get('key')
        if not key:
            return Response({"error": "key is required"}, status=status.HTTP_400_BAD_REQUEST)
        ReminderService.dismiss_reminder(key)
        return Response({"status": "dismissed", "key": key}, status=status.HTTP_200_OK)
