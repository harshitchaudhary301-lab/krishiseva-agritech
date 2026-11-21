"""
KrishiSeva URL Configuration
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from .views import health_check

admin.site.site_header = "KrishiSeva Admin Panel | कृषि सेवा"
admin.site.site_title = "KrishiSeva Operations Portal"
admin.site.index_title = "Farm Operations Management"

urlpatterns = [
    path('health/', health_check, name='health-check-root'),
    path('api/health/', health_check, name='health-check-api'),
    path('admin/', admin.site.urls),
    path('api/accounts/', include('accounts.urls')),
    path('api/services/', include('services.urls')),
    path('api/bookings/', include('bookings.urls')),
    path('api/farm-projects/', include('farm_projects.urls')),
    path('api/matching/', include('matching.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

