from django.urls import path
from .views import (
    RegisterView, LoginView, MeView, LogoutView,
    AdminVerificationView, AdminVerificationLogsView, AdminUserListView,
    PasswordResetRequestView, PasswordResetConfirmView,
    ChangePasswordView, RevokeTokenView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('me/', MeView.as_view(), name='me'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('password-reset/request/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('revoke-token/', RevokeTokenView.as_view(), name='revoke-token'),
    path('admin/verification/', AdminVerificationView.as_view(), name='admin-verification'),
    path('admin/verification-logs/', AdminVerificationLogsView.as_view(), name='admin-verification-logs'),
    path('admin/verification/logs/', AdminVerificationLogsView.as_view(), name='admin-verification-logs-alias'),
    path('admin/users/', AdminUserListView.as_view(), name='admin-users'),
]
