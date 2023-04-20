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


# 接口函数
import sqlite3

def post(request):
 global ppg_data, ppg, sampling_rate
 global measures
 global num
 if request.method == 'POST':  # 当提交表单时
     # 判断是否传参
     num += 1
     print(num)
     data = json.loads(request.body)
     # print(data["total_event"])

     print(data)
     print("time:" + data["time"])

     if num >= 50 and len(data): # num >= 100 这个判断可以去掉
         ppg_data = enqueue(ppg_data, data)
         sampling_rate, ppg, ppg_data = get_ppg(ppg_data, 60)
         working_data, measures = hrv_generator(measures, ppg, sampling_rate)
         #print("measures:")
         #print(measures)


 # 将processed data 存入数据库 （这一步之前在models.py 中创建class）

         if len(measures):
         # 防止空白内容
         #is not empty,saving the data to the database using the 'Measures' model.
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
 template = loader.get_template('measures.html')
 context = {
     "measures": measures
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





