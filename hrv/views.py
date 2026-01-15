from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
import json
from collections import deque
from django.template import loader
from .data_processing import enqueue, hrv_generator, get_ppg
from .models import Measures
from django.forms.models import model_to_dict


ppg_data = deque()
ppg = []
measures = {}
num = 0

# Create your views here.

def index(request):
  # global ppg, ppg_data, measures
  # sampling_rate, ppg, ppg_data = get_ppg(100, ppg_data)
  # working_data, measures = hrv_generator(measures, ppg, sampling_rate)
  return HttpResponse("hello HRV")



import sqlite3

## recieve the data from the watch
def post(request):
 global ppg_data, ppg, sampling_rate
 global measures
 global num

 if request.method == 'POST':  # when the form is submitted
     # 判断是否传参 # determine whether parameters are passed
     num += 1
     print(num)
     data = json.loads(request.body)
     # print(data["total_event"])

     print(data)
     print("time:" + data["time"])

     if num >= 50 and len(data): # num >= 100 这个判断可以去掉 # this judgment can be removed
         ppg_data = enqueue(ppg_data, data)
         sampling_rate, ppg, ppg_data = get_ppg(ppg_data, 60) #change back to 60
         working_data, measures = hrv_generator(measures, ppg, sampling_rate)
         #print("measures:")
         #print(measures)




         if len(measures):
         #is not empty,saving the data to the database using the 'Measures' model. ##this outputs the mess in chat when successfully saving a new item to the database
             measures_instance = Measures()
             for key, value in measures.items():
                 print("key")
                 print(key)
                 print(value)
                 setattr(measures_instance, key, value)

             #if 'timeStamp' in data:
                 measures_instance.timeStamp = data["time"]

             measures_instance.save()

 # return render(request, "measures.html", {"measures": measures})
 template = loader.get_template('measures.html')   ##change to whatever html template i make hrv/measures.html if i want the one inside the folder
 context = {
     "measures": measures,
     "bpm": measures.get("bpm", 0),  # Pass 'bpm' to control the background color
 }
 return HttpResponse(template.render(context, request))


#accepts an HTTP request
def my_api_endpoint(request):
   # Retrieve the required data here

   measure = Measures.objects.order_by('timeStamp').last()
   #measures_json = serializers.serialize("json", measures)
   measure_dict = model_to_dict(measure)
   measure_json = json.dumps(measure_dict, ensure_ascii=False, default=str, indent=1)
   # Return the data as a JSON response
   return JsonResponse(measure_json, safe=False)


def visual(request):
    measures_instance = Measures.objects.order_by('-timeStamp').first()

    # Convert the instance fields to a dictionary if `measures` is expected as a dictionary in the template
    measures = {field.name: getattr(measures_instance, field.name) for field in
                Measures._meta.fields} if measures_instance else {}

    context = {
        'measures': measures  # Pass the latest measures data to the template
    }
    return render(request, 'visual.html', context)





# def get_latest_sdnn(request):
#     # print("get_latest_sdnn view is being executed")
#     latest_measure = Measures.objects.order_by('-timeStamp').first()
#     latest_sdnn = latest_measure.sdnn if latest_measure else 0.445
#     return JsonResponse({'latest_sdnn': latest_sdnn})

from django.db.models import Avg


def get_latest_sdnn(request):
    # Get the number of entries to average from query parameters (default to 10)
    num_entries = int(request.GET.get('num_entries', 10))

    # Fetch the latest `num_entries` SDNN values
    latest_measures = Measures.objects.order_by('-timeStamp')[:num_entries]

    # Calculate the average SDNN
    if latest_measures.exists():
        sdnn_values = [measure.sdnn for measure in latest_measures if measure.sdnn is not None]
        average_sdnn = sum(sdnn_values) / len(sdnn_values) if sdnn_values else 0.445
    else:
        average_sdnn = 0.445  # Default fallback value

    return JsonResponse({'average_sdnn': average_sdnn})


def threejs_page(request):
    # Get the latest Measures instance
    latest_measure = Measures.objects.order_by('-timeStamp').first()

    # Extract the SDNN value, default to None if no instance exists
    latest_sdnn = latest_measure.sdnn if latest_measure else None

    # Pass the latest SDNN value to the template
    context = {
        'latest_sdnn': latest_sdnn
    }
    return render(request, 'index.html', context)


