from django.urls import path
from .views import CategoryListView, VillageListView, ProviderDirectoryView, ReviewListCreateView

urlpatterns = [
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('villages/', VillageListView.as_view(), name='village-list'),
    path('providers/', ProviderDirectoryView.as_view(), name='provider-directory'),
    path('reviews/', ReviewListCreateView.as_view(), name='review-list-create'),
]
