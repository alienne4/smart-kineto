from django.urls import path

from .views import (
    AddPatientView,
    MyPatientsView,
    PatientSearchView,
    SetMyTrainerView,
    TrainerListView,
)

urlpatterns = [
    path("trainers/", TrainerListView.as_view(), name="trainers"),
    path("patients/", MyPatientsView.as_view(), name="my-patients"),
    path("patients/search/", PatientSearchView.as_view(), name="patient-search"),
    path("me/patients/", AddPatientView.as_view(), name="add-patient"),
    path("me/trainer/", SetMyTrainerView.as_view(), name="set-my-trainer"),
]
