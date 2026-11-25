from django.urls import path
from .views import (
    CategoryListView, VillageListView, ProviderDirectoryView, ReviewListCreateView,
    HistoricalMachineryRateListView, HistoricalAgriculturalWageListView,
    AgriculturalReferenceRecordListView,
    InstitutionalResourceListView,
    WeatherForecastView,
    StateListView, DistrictListView, SubDistrictListView, DevelopmentBlockListView,
    LocalBodyListView, WardListView, NationwideVillageListView, LocationSearchView,
    LocationValidateView
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

    # Nationwide LGD Central Location Engine Endpoints
    path('locations/states/', StateListView.as_view(), name='location-states'),
    path('locations/districts/', DistrictListView.as_view(), name='location-districts'),
    path('locations/subdistricts/', SubDistrictListView.as_view(), name='location-subdistricts'),
    path('locations/blocks/', DevelopmentBlockListView.as_view(), name='location-blocks'),
    path('locations/local-bodies/', LocalBodyListView.as_view(), name='location-local-bodies'),
    path('locations/wards/', WardListView.as_view(), name='location-wards'),
    path('locations/villages/', NationwideVillageListView.as_view(), name='location-villages'),
    path('locations/search/', LocationSearchView.as_view(), name='location-search'),
    path('locations/validate/', LocationValidateView.as_view(), name='location-validate'),
]
