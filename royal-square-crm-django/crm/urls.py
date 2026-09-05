from django.urls import path, re_path
from crm.views.client_views import ClientListCreateView, ClientDetailView
from crm.views.claim_views import (
    ClaimListCreateView,
    ClaimDetailView,
    ClaimAdvanceView,
    ClaimToggleChecklistView
)
from crm.views.reminder_views import ReminderListView, RuleListView, ReminderDismissView
from crm.views.ui_views import ClientFormSchemaView, ClaimFormSchemaView

urlpatterns = [
    # Clients
    path('clients', ClientListCreateView.as_view()),
    path('clients/', ClientListCreateView.as_view()),
    path('clients/<str:client_id>', ClientDetailView.as_view()),
    path('clients/<str:client_id>/', ClientDetailView.as_view()),

    # Claims
    path('claims', ClaimListCreateView.as_view()),
    path('claims/', ClaimListCreateView.as_view()),
    path('claims/<str:claim_id>', ClaimDetailView.as_view()),
    path('claims/<str:claim_id>/', ClaimDetailView.as_view()),
    path('claims/<str:claim_id>/advance', ClaimAdvanceView.as_view()),
    path('claims/<str:claim_id>/advance/', ClaimAdvanceView.as_view()),
    path('claims/<str:claim_id>/checklist/<str:item>/toggle', ClaimToggleChecklistView.as_view()),
    path('claims/<str:claim_id>/checklist/<str:item>/toggle/', ClaimToggleChecklistView.as_view()),

    # Reminders
    path('reminders', ReminderListView.as_view()),
    path('reminders/', ReminderListView.as_view()),
    path('reminders/rules', RuleListView.as_view()),
    path('reminders/rules/', RuleListView.as_view()),
    path('reminders/dismiss', ReminderDismissView.as_view()),
    path('reminders/dismiss/', ReminderDismissView.as_view()),

    # Server-Driven UI Schemas
    path('ui/schemas/client-form', ClientFormSchemaView.as_view()),
    path('ui/schemas/client-form/', ClientFormSchemaView.as_view()),
    path('ui/schemas/claim-form', ClaimFormSchemaView.as_view()),
    path('ui/schemas/claim-form/', ClaimFormSchemaView.as_view()),
]
