from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ClienteViewSet,
    InmuebleViewSet,
    PedidoViewSet,
    EdificioViewSet,
    ActividadViewSet,
    FranquiciaViewSet,
    OficinaViewSet,
    UsuarioViewSet,
    RegistroAPIView,
    LoginAPIView,
    actividades_por_pedido,
    actividades_por_cliente,
    actividades_por_inmueble,
    listar_usuarios,
    global_search,
)

router = DefaultRouter()
router.register(r'clientes', ClienteViewSet)
router.register(r'inmuebles', InmuebleViewSet)
router.register(r'actividades', ActividadViewSet)
router.register(r'edificios', EdificioViewSet)
router.register(r'pedidos', PedidoViewSet)
router.register(r'franquicias', FranquiciaViewSet)
router.register(r'oficinas', OficinaViewSet)
router.register(r'usuarios', UsuarioViewSet)

urlpatterns = [

    # 🔐 AUTH
    path('api/auth/register/', RegistroAPIView.as_view(), name='register'),
    path('api/auth/login/', LoginAPIView.as_view(), name='login'),

    # 🔎 ENDPOINTS PERSONALIZADOS
    path('api/actividades/cliente/<int:cliente_id>/', actividades_por_cliente),
    path('api/actividades/inmueble/<int:inmueble_id>/', actividades_por_inmueble),
    path("api/actividades/pedido/<int:pedido_id>/", actividades_por_pedido),

    # 🧑 LISTA DE USUARIOS
    path('api/listar-usuarios/', listar_usuarios),
    path("global-search/", global_search, name="global-search"),
    path("search/", global_search, name="global_search"),

    # 📌 TODAS LAS RUTAS DEL ROUTER BAJO /api/
    path('api/', include(router.urls)),
    path('', include(router.urls)),
]
