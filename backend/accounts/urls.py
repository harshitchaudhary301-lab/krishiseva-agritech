from django.urls import path
from .views import (
    RegisterView, LoginView, MeView, LogoutView,
    AdminVerificationView, AdminVerificationLogsView, AdminUserListView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('me/', MeView.as_view(), name='me'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('admin/verification/', AdminVerificationView.as_view(), name='admin-verification'),
    path('admin/verification-logs/', AdminVerificationLogsView.as_view(), name='admin-verification-logs'),
    path('admin/verification/logs/', AdminVerificationLogsView.as_view(), name='admin-verification-logs-alias'),
    path('admin/users/', AdminUserListView.as_view(), name='admin-users'),
]
