from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def health_check(request):
    return JsonResponse({
        "status": "ok",
        "service": "Royal Square CRM Django API (Secure by Design)",
        "database": "SQLite"
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health', health_check),
    path('api/health/', health_check),
    path('api/', include('crm.urls')),
]
