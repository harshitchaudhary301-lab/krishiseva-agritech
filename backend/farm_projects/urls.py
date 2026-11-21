from django.urls import path
from .views import (
    FarmListCreateView, FarmDetailView,
    FarmProjectListCreateView, FarmProjectDetailView,
    ProjectAddServiceView
)

urlpatterns = [
    path('farms/', FarmListCreateView.as_view(), name='farm-list-create'),
    path('farms/<int:pk>/', FarmDetailView.as_view(), name='farm-detail'),
    path('projects/', FarmProjectListCreateView.as_view(), name='project-list-create'),
    path('projects/<int:pk>/', FarmProjectDetailView.as_view(), name='project-detail'),
    path('projects/<int:pk>/add-service/', ProjectAddServiceView.as_view(), name='project-add-service'),
]
