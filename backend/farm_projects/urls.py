from django.urls import path
from .views import (
    FarmListCreateView, FarmDetailView, FieldListCreateView,
    CropTemplateListView, CropTemplateDetailView,
    FarmProjectListCreateView, FarmProjectDetailView,
    ProjectOperationListCreateView, ProjectOperationDetailView,
    ProjectAddServiceView
)

urlpatterns = [
    path('crop-templates/', CropTemplateListView.as_view(), name='crop-template-list'),
    path('crop-templates/<slug:slug>/', CropTemplateDetailView.as_view(), name='crop-template-detail'),
    path('farms/', FarmListCreateView.as_view(), name='farm-list-create'),
    path('farms/<int:pk>/', FarmDetailView.as_view(), name='farm-detail'),
    path('farms/<int:farm_pk>/fields/', FieldListCreateView.as_view(), name='field-list-create'),
    path('projects/', FarmProjectListCreateView.as_view(), name='project-list-create'),
    path('projects/<int:pk>/', FarmProjectDetailView.as_view(), name='project-detail'),
    path('projects/<int:project_pk>/operations/', ProjectOperationListCreateView.as_view(), name='project-operations-list-create'),
    path('operations/<int:pk>/', ProjectOperationDetailView.as_view(), name='project-operation-detail'),
    path('projects/<int:pk>/add-service/', ProjectAddServiceView.as_view(), name='project-add-service'),
]
