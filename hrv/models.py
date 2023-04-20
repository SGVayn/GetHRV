from django.db import models
from django.utils import timezone


class Question(models.Model):
    question_text = models.CharField(max_length=200)
    pub_date = models.DateTimeField('date published')


class Choice(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    choice_text = models.CharField(max_length=200)
    votes = models.IntegerField(default=0)


class PPG(models.Model):
    date = models.DateTimeField('date inserted')
    time_stamp = models.IntegerField(default=0)
    ppg_signal = models.FloatField(default=0.0)

class Measures(models.Model):
    bpm = models.FloatField(default=-1, null=True)
    ibi = models.FloatField(default=-1, null=True)
    sdnn = models.FloatField(default=-1, null=True)
    sdsd = models.FloatField(default=-1, null=True)
    rmssd = models.FloatField(default=-1, null=True)
    pnn20 = models.FloatField(default=-1, null=True)
    pnn50 = models.FloatField(default=-1, null=True)
    hr_mad = models.FloatField(default=-1, null=True)
    sd1 = models.FloatField(default=-1, null=True)
    sd2 = models.FloatField(default=-1, null=True)
    s = models.FloatField(default=-1, null=True)
    sd1_sd2 = models.FloatField(default=-1, null=True)
    breathingrate = models.FloatField(default=-1, null=True)
    vlf = models.FloatField(default=-1, null=True)
    lf = models.FloatField(default=-1, null=True)
    hf = models.FloatField(default=-1, null=True)
    lf_hf = models.FloatField(default=-1, null=True)
    p_total = models.FloatField(default=-1, null=True)
    vlf_perc = models.FloatField(default=-1, null=True)
    lf_perc = models.FloatField(default=-1, null=True)
    hf_perc = models.FloatField(default=-1, null=True)
    lf_nu = models.FloatField(default=-1, null=True)
    hf_nu = models.FloatField(default=-1, null=True)
    timeStamp = models.DateTimeField(default=timezone.now, null=True)

    #Django 的 FloatField 类型对应 SQLite 的 NUMERIC 数据类型

    class Meta:
        db_table = 'measures'

        #将数据库表名定义为measures


