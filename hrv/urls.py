from django.urls import path
from . import views
## test
urlpatterns = [
    path('', views.post, name='index'),
    path('api/endpoint/', views.my_api_endpoint, name='my_api_endpoint'),
    path('measures/', views.Measures, name='Measures'),
    path('visual/', views.visual, name='visual'),
    path('threejs/', views.threejs_page, name='threejs_page'),  # Three.js page
]
