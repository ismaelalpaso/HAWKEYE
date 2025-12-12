from rest_framework import viewsets, permissions, filters
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework import status, generics
from .mixins import TenantMixin

# 🔥 USAR SIEMPRE EL CUSTOM USER
from django.contrib.auth import get_user_model
User = get_user_model()

from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Q

from .models import Cliente, Edificio, Inmueble, Pedido, Actividad, Franquicia, Oficina
from .serializers import (
    ClienteSerializer,
    EdificioSerializer,
    InmuebleSerializer,
    PedidoSerializer,
    ActividadSerializer,
    RegistroSerializer,
    FranquiciaSerializer,
    OficinaSerializer,
    UserSerializer
)


class FranquiciaViewSet(viewsets.ModelViewSet):
    queryset = Franquicia.objects.all()
    serializer_class = FranquiciaSerializer
    permission_classes = [permissions.IsAuthenticated]


class OficinaViewSet(viewsets.ModelViewSet):
    queryset = Oficina.objects.select_related("franquicia").all()
    serializer_class = OficinaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        franquicia_id = self.request.query_params.get("franquicia_id")
        if franquicia_id:
            qs = qs.filter(franquicia_id=franquicia_id)
        return qs


class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]


# ---------------------------
# ViewSets con búsqueda optimizada
# ---------------------------

class ClienteViewSet(TenantMixin, viewsets.ModelViewSet):
    queryset = Cliente.objects.all()  # necesario para el router
    serializer_class = ClienteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        search = self.request.query_params.get('search', '').strip().lower()

        base_queryset = (
            Cliente.objects.all()
            .select_related('creado_por', 'ultima_modificacion_por')
            .prefetch_related(
                'actividades',
                'propiedades',
                'alquileres',
                'copropiedades',
                'coalquileres',
                'pedidos',
            )
        )

        if search:
            return base_queryset.filter(
                Q(nombre_apellido__icontains=search)
                | Q(nombre_apellidos_completo__icontains=search)
            ).order_by('nombre_apellido')[:50]

        return base_queryset

    def perform_create(self, serializer):
        user = self.request.user

        serializer.save(
            creado_por=user,
            ultima_modificacion_por=user,
            franquicia=user.franquicia,
            oficina=user.oficina,
        )

    def perform_update(self, serializer):
        user = self.request.user

        serializer.save(
            ultima_modificacion_por=user,
        )


class InmuebleViewSet(TenantMixin, viewsets.ModelViewSet):
    queryset = Inmueble.objects.all()
    serializer_class = InmuebleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        search = self.request.query_params.get('search', '').strip().lower()
        if search:
            return Inmueble.objects.filter(
                Q(direccion_busqueda__icontains=search) |
                Q(ref_catastral__icontains=search)
            ).order_by('direccion_busqueda')[:50]
        return super().get_queryset()
    
    def perform_create(self, serializer):
        user = self.request.user

        serializer.save(
            creado_por=user,
            ultima_modificacion_por=user,
            franquicia=user.franquicia,
            oficina=user.oficina,
        )

    def perform_update(self, serializer):
        user = self.request.user

        serializer.save(
            ultima_modificacion_por=user,
        )


class PedidoViewSet(TenantMixin, viewsets.ModelViewSet):
    queryset = Pedido.objects.all()
    serializer_class = PedidoSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        user = self.request.user

        serializer.save(
            creado_por=user,
            ultima_modificacion_por=user,
            franquicia=user.franquicia,
            oficina=user.oficina,
        )

    def perform_update(self, serializer):
        user = self.request.user

        serializer.save(
            ultima_modificacion_por=user,
        )


class EdificioViewSet(TenantMixin, viewsets.ModelViewSet):
    queryset = Edificio.objects.all()
    serializer_class = EdificioSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['calle', 'numero_calle', 'codigo_postal']
    
    def perform_create(self, serializer):
        user = self.request.user

        serializer.save(
            creado_por=user,
            ultima_modificacion_por=user,
            franquicia=user.franquicia,
            oficina=user.oficina,
        )

    def perform_update(self, serializer):
        user = self.request.user

        serializer.save(
            ultima_modificacion_por=user,
        )

class ActividadViewSet(TenantMixin, viewsets.ModelViewSet):
    queryset = Actividad.objects.all()
    serializer_class = ActividadSerializer
    permission_classes = [permissions.IsAuthenticated]

    # ==========================================================
    # 📌 CREATE
    # ==========================================================
    def perform_create(self, serializer):
        user = self.request.user

        actividad = serializer.save(
            creado_por=user,
            ultima_modificacion_por=user,
            franquicia=user.franquicia,
            oficina=user.oficina,
        )

        self._actualizar_relacionados(actividad)

    # ==========================================================
    # 📌 UPDATE
    # ==========================================================
    def perform_update(self, serializer):
        user = self.request.user

        actividad = serializer.save(
            ultima_modificacion_por=user
        )

        self._actualizar_relacionados(actividad)

    # ==========================================================
    # 📌 FUNCIÓN COMÚN PARA ACTUALIZAR INMUEBLE, CLIENTE, PEDIDO
    # ==========================================================
    def _actualizar_relacionados(self, actividad):
        """
        Actualiza fechas de contacto para inmueble, cliente y pedido.
        Este método es llamado tanto en create como update.
        """

        fecha_contacto = actividad.fecha_inicio

        # -------- Inmueble asociado --------
        if actividad.inmueble:
            actividad.inmueble.fecha_ultimo_contacto = fecha_contacto
            actividad.inmueble.save(update_fields=["fecha_ultimo_contacto"])

        # -------- Cliente asociado --------
        if actividad.cliente:
            actividad.cliente.fecha_ultimo_contacto = fecha_contacto
            actividad.cliente.save(update_fields=["fecha_ultimo_contacto"])

        # -------- Pedido asociado --------
        #if actividad.pedido:
        #    actividad.pedido.fecha_ultimo_contacto = fecha_contacto
        #    actividad.pedido.save(update_fields=["fecha_ultimo_contacto"])



# ---------------------------
# Registro y login
# ---------------------------

class RegistroAPIView(generics.CreateAPIView):
    queryset = User.objects.all()  # 🔥 AHORA SÍ es api.User
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegistroSerializer


class LoginAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        user = authenticate(username=username, password=password)
        if not user:
            return Response({"detail": "Credenciales inválidas"}, status=401)

        refresh = RefreshToken.for_user(user)

        return Response({
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role,              # 👈 AHORA SÍ
                "franquicia": user.franquicia_id,
                "oficina": user.oficina_id,
            }
        })


# ---------------------------
# Filtros específicos
# ---------------------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def actividades_por_pedido(request, pedido_id):
    actividades = Actividad.objects.filter(pedido_id=pedido_id).order_by('-fecha_inicio')
    serializer = ActividadSerializer(actividades, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def actividades_por_cliente(request, cliente_id):
    actividades = Actividad.objects.filter(cliente_id=cliente_id).order_by('-fecha_inicio')
    serializer = ActividadSerializer(actividades, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def actividades_por_inmueble(request, inmueble_id):
    actividades = Actividad.objects.filter(inmueble_id=inmueble_id).order_by('-fecha_inicio')
    serializer = ActividadSerializer(actividades, many=True)
    return Response(serializer.data)


# ---------------------------
# Listar usuarios
# ---------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def listar_usuarios(request):
    usuarios = User.objects.all()  # 🔥 ahora api.User
    data = [
        {
            "id": u.id,
            "username": u.username,
            "first_name": u.first_name,
            "last_name": u.last_name
        }
        for u in usuarios
    ]
    return Response(data, status=status.HTTP_200_OK)



# api/views.py
from django.db.models import Q, Value
from django.db.models.functions import Concat
from django.contrib.postgres.search import TrigramSimilarity
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Cliente, Inmueble, Edificio, Pedido, Actividad


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def global_search(request):
    q = request.GET.get("q", "").strip().lower()
    user = request.user

    if not q:
        return Response({"results": []})

    # 🔥 Filtro multi-tenant obligatorio
    filtro_tenant = Q(franquicia=user.franquicia)
    if user.oficina:
        filtro_tenant &= Q(oficina=user.oficina)

    resultados = {
        "clientes": [],
        "inmuebles": [],
        "edificios": [],
        "pedidos": [],
        "actividades": [],
    }

    # ===============================
    # 1️⃣ CLIENTES
    # ===============================
    clientes = (
        Cliente.objects.annotate(
            sim=TrigramSimilarity("nombre_apellidos_completo", q)
            + TrigramSimilarity("nombre_apellido", q)
            + TrigramSimilarity("email", q)
        )
        .filter(filtro_tenant)
        .filter(
            Q(nombre_apellidos_completo__icontains=q)
            | Q(nombre_apellido__icontains=q)
            | Q(email__icontains=q)
            | Q(telefono_movil__icontains=q)
            | Q(num_identificacion__icontains=q)
            | Q(sim__gt=0.2)  # 🔥 fuzzy search
        )
        .order_by("-sim")[:5]
    )

    resultados["clientes"] = [
        {
            "id": c.id,
            "tipo": "cliente",
            "nombre": c.nombre_apellidos_completo,
            "email": c.email,
            "telefono": c.telefono_movil,
        }
        for c in clientes
    ]

    # ===============================
    # 2️⃣ INMUEBLES
    # ===============================
    inmuebles = (
        Inmueble.objects.annotate(
            sim=TrigramSimilarity("direccion_busqueda", q)
            + TrigramSimilarity("ref_catastral", q)
        )
        .filter(filtro_tenant)
        .filter(
            Q(direccion_busqueda__icontains=q)
            | Q(ref_catastral__icontains=q)
            | Q(sim__gt=0.1)
        )
        .order_by("-sim")[:5]
    )

    resultados["inmuebles"] = [
        {
            "id": i.id,
            "tipo": "inmueble",
            "direccion": i.direccion_busqueda,
            "ref_catastral": i.ref_catastral,
        }
        for i in inmuebles
    ]

    # ===============================
    # 3️⃣ EDIFICIOS
    # ===============================
    edificios = (
        Edificio.objects.annotate(
            sim=TrigramSimilarity("calle", q)
            + TrigramSimilarity("numero_calle", q)
        )
        .filter(filtro_tenant)
        .filter(
            Q(calle__icontains=q)
            | Q(numero_calle__icontains=q)
            | Q(sim__gt=0.1)
        )
        .order_by("-sim")[:5]
    )

    resultados["edificios"] = [
        {
            "id": e.id,
            "tipo": "edificio",
            "direccion": f"{e.calle} {e.numero_calle}",
            "cp": e.codigo_postal,
        }
        for e in edificios
    ]

    # ===============================
    # 4️⃣ PEDIDOS
    # ===============================
    pedidos = (
        Pedido.objects.annotate(
            sim=TrigramSimilarity("descripcion", q)
            + TrigramSimilarity("motivacion", q)
            + TrigramSimilarity("tipo_inmueble", q)
        )
        .filter(filtro_tenant)
        .filter(
            Q(descripcion__icontains=q)
            | Q(motivacion__icontains=q)
            | Q(tipo_inmueble__icontains=q)
            | Q(sim__gt=0.1)
        )
        .order_by("-sim")[:5]
    )

    resultados["pedidos"] = [
        {
            "id": p.id,
            "tipo": "pedido",
            "descripcion": p.descripcion,
            "cliente": str(p.cliente),
        }
        for p in pedidos
    ]

    # ===============================
    # 5️⃣ ACTIVIDADES
    # ===============================
    actividades = (
        Actividad.objects.annotate(
            sim=TrigramSimilarity("descripcion_publica", q)
            + TrigramSimilarity("descripcion_empleado", q)
        )
        .filter(filtro_tenant)
        .filter(
            Q(descripcion_publica__icontains=q)
            | Q(descripcion_empleado__icontains=q)
            | Q(sim__gt=0.1)
        )
        .order_by("-sim")[:5]
    )

    resultados["actividades"] = [
        {
            "id": a.id,
            "tipo": "actividad",
            "descripcion": a.descripcion_publica or a.descripcion_empleado,
            "fecha": a.fecha_inicio,
        }
        for a in actividades
    ]

    return Response({"results": resultados})
