from django.urls import path
from .views import (
    RequestListCreateView, RequestDetailView, RequestCancelView,
    QuotationCreateView, QuotationAcceptView,
    BookingListView, BookingDetailView, BookingConfirmView,
    BookingStatusUpdateView, BookingCancelView, BackupProvidersView,
    ComplaintListCreateView, NotificationListView
)

urlpatterns = [
    # Requests
    path('requests/', RequestListCreateView.as_view(), name='request-list-create'),
    path('requests/<int:pk>/', RequestDetailView.as_view(), name='request-detail'),
    path('requests/<int:pk>/cancel/', RequestCancelView.as_view(), name='request-cancel'),

    # Quotations
    path('quotations/', QuotationCreateView.as_view(), name='quotation-create'),
    path('quotations/<int:pk>/accept/', QuotationAcceptView.as_view(), name='quotation-accept'),

    # Bookings
    path('', BookingListView.as_view(), name='booking-list'),
    path('<int:pk>/', BookingDetailView.as_view(), name='booking-detail'),
    path('<int:pk>/confirm/', BookingConfirmView.as_view(), name='booking-confirm'),
    path('<int:pk>/status/', BookingStatusUpdateView.as_view(), name='booking-status'),
    path('<int:pk>/cancel/', BookingCancelView.as_view(), name='booking-cancel'),
    path('<int:pk>/backup-providers/', BackupProvidersView.as_view(), name='backup-providers'),

    # Complaints & Notifications
    path('complaints/', ComplaintListCreateView.as_view(), name='complaint-list-create'),
    path('notifications/', NotificationListView.as_view(), name='notification-list'),
]
