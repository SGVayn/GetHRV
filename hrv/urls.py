from django.urls import path
from . import views

urlpatterns = [
    path('', views.post, name='index'),
    path('api/endpoint/', views.my_api_endpoint, name='my_api_endpoint'),
    path('visual/', views.visual, name='visual'),
    path('threejs/', views.threejs_page, name='threejs_page'),
    path('api/latest-sdnn/', views.get_latest_sdnn, name='latest_sdnn'),
]

# print(urlpatterns)