from django.urls import path
from .views import (
    CategoryListView, VillageListView, ProviderDirectoryView, ReviewListCreateView,
    HistoricalMachineryRateListView, HistoricalAgriculturalWageListView,
    AgriculturalReferenceRecordListView,
    InstitutionalResourceListView,
    WeatherForecastView
)

urlpatterns = [
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('villages/', VillageListView.as_view(), name='village-list'),
    path('providers/', ProviderDirectoryView.as_view(), name='provider-directory'),
    path('reviews/', ReviewListCreateView.as_view(), name='review-list-create'),
    path('reference-data/machinery-rates/', HistoricalMachineryRateListView.as_view(), name='historical-machinery-rates'),
    path('reference-data/wages/', HistoricalAgriculturalWageListView.as_view(), name='historical-wages'),
    path('reference-data/records/', AgriculturalReferenceRecordListView.as_view(), name='agricultural-reference-records'),
    path('government-connect/', InstitutionalResourceListView.as_view(), name='government-connect'),
    path('weather/', WeatherForecastView.as_view(), name='weather-forecast'),
]
