from django.urls import path
from . import views
from .views import ocean_view

urlpatterns = [
    path('', views.post, name='index'),
    path('api/endpoint/', views.my_api_endpoint, name='my_api_endpoint'),
    path('measures/', views.Measures, name='Measures'),
    path('visual/', views.visual, name='visual'),
    path('ocean/', ocean_view, name='ocean'),
]
