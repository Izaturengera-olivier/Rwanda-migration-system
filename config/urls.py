"""
URL configuration for Rwanda Migration Risk Mapping System.
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse
from django.shortcuts import render

def serve_react(request, path=""):
    index_file = settings.BASE_DIR / 'frontend' / 'build' / 'index.html'
    if index_file.exists():
        return HttpResponse(index_file.read_text(encoding='utf-8'), content_type='text/html')
    return render(request, 'index.html')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    re_path(r'^(?:(?!admin|api|static|media).)*$', serve_react, name='react_app'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

