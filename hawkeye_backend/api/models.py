from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
from django.db.models import Q, F, CheckConstraint, Index

# ============================================================
# HAWKEYE — MODELOS BASE MULTI-TENANT + ROLES + CUSTOM USER
# ============================================================


from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models import Q   # Para constraints lógicas complejas
from django.utils.translation import gettext_lazy as _

# ==========================================================
# 🔐 ROLES DEL SISTEMA
# ==========================================================
class Role(models.TextChoices):
    # ---- ROLES GLOBALES ----
    SUPERADMIN = "superadmin", _("Superadmin")
    SUPER_COORDINADOR = "super_coordinador", _("Super Coordinador")

    # ---- ROLES DE FRANQUICIA ----
    FRANQUICIA_ADMIN = "franquicia_admin", _("Administrador de Franquicia")

    # ---- ROLES DE OFICINA ----
    OFICINA_ADMIN = "oficina_admin", _("Administrador de Oficina")
    RESPONSABLE = "responsable", _("Responsable de Oficina")
    COORDINADOR = "coordinador", _("Coordinador")
    COMERCIAL = "comercial", _("Comercial")


# Jerarquía numérica para comparaciones rápidas (permisos, filtros, etc.)
ROLE_HIERARCHY = {
    Role.SUPERADMIN: 100,
    Role.SUPER_COORDINADOR: 90,

    Role.FRANQUICIA_ADMIN: 80,

    Role.OFICINA_ADMIN: 70,
    Role.RESPONSABLE: 60,
    Role.COORDINADOR: 50,
    Role.COMERCIAL: 40,
}


# ==========================================================
# 🏢 MODELO DE FRANQUICIA (TENANT NIVEL 1)
# ==========================================================
class Franquicia(models.Model):
    nombre = models.CharField(max_length=255, db_index=True)
    codigo = models.CharField(max_length=50, unique=True, db_index=True)

    direccion = models.CharField(max_length=255, blank=True)
    telefono = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    logo = models.ImageField(upload_to="franquicias/", blank=True, null=True)

    creado_en = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = "Franquicia"
        verbose_name_plural = "Franquicias"
        ordering = ["nombre"]

        indexes = [
            models.Index(fields=["codigo"]),
            models.Index(fields=["nombre"]),
            models.Index(fields=["creado_en"]),
        ]

        constraints = [
            models.CheckConstraint(
                check=~Q(codigo=""),
                name="franquicia_codigo_no_vacio",
            ),
        ]

    def __str__(self):
        return f"{self.nombre} ({self.codigo})"


# ==========================================================
# 🏢 MODELO DE OFICINA (TENANT NIVEL 2)
# ==========================================================
class Oficina(models.Model):
    franquicia = models.ForeignKey(
        Franquicia,
        on_delete=models.CASCADE,
        related_name="oficinas",
        db_index=True,
    )

    nombre = models.CharField(max_length=255, db_index=True)
    codigo = models.CharField(max_length=50, unique=True, db_index=True)

    direccion = models.CharField(max_length=255, blank=True)
    telefono = models.CharField(max_length=50, blank=True)

    creado_en = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = "Oficina"
        verbose_name_plural = "Oficinas"
        ordering = ["franquicia_id", "nombre"]

        indexes = [
            # Búsquedas rápidas por franquicia + código (muy útil en panel maestro)
            models.Index(fields=["franquicia", "codigo"]),
            models.Index(fields=["nombre"]),
            models.Index(fields=["creado_en"]),
        ]

        constraints = [
            models.CheckConstraint(
                check=~Q(codigo=""),
                name="oficina_codigo_no_vacio",
            ),
        ]

    def __str__(self):
        return f"{self.nombre} [{self.franquicia.codigo}]"


# ==========================================================
# 👤 MODELO DE USUARIO (CUSTOM USER)
# ==========================================================
class User(AbstractUser):
    # Rol de negocio (no confundir con is_staff/is_superuser de Django)
    role = models.CharField(
        max_length=32,
        choices=Role.choices,
        default=Role.COMERCIAL,
        db_index=True,
    )

    # Multi-tenant:
    #  - Superadmin / Super_coordinador → pueden no tener franquicia/oficina
    #  - Franquicia_admin → debe tener franquicia, oficina opcional
    #  - Roles de oficina → deben tener franquicia y oficina
    franquicia = models.ForeignKey(
        Franquicia,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="usuarios",
        db_index=True,
    )

    oficina = models.ForeignKey(
        Oficina,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="usuarios",
        db_index=True,
    )

    class Meta:
        indexes = [
            models.Index(fields=["role"]),
            models.Index(fields=["franquicia"]),
            models.Index(fields=["oficina"]),
        ]

        constraints = [
            # 🔒 Usuarios de oficina deben tener oficina asignada
            models.CheckConstraint(
                check=(
                    ~Q(
                        role__in=[
                            Role.OFICINA_ADMIN,
                            Role.RESPONSABLE,
                            Role.COORDINADOR,
                            Role.COMERCIAL,
                        ]
                    )
                    | Q(oficina__isnull=False)
                ),
                name="usuario_oficina_roles_requieren_oficina",
            ),
            # 🔒 Franquicia_admin debe tener franquicia
            models.CheckConstraint(
                check=(~Q(role=Role.FRANQUICIA_ADMIN) | Q(franquicia__isnull=False)),
                name="usuario_franquicia_admin_requiere_franquicia",
            ),
        ]

    # ====================================
    # Helpers de negocio / permisos
    # ====================================
    @property
    def role_level(self) -> int:
        """Devuelve el nivel numérico de poder del rol."""
        return ROLE_HIERARCHY.get(self.role, 0)

    def is_global(self) -> bool:
        """¿Tiene ámbito global (todas las franquicias/oficinas)?"""
        return self.role in {Role.SUPERADMIN, Role.SUPER_COORDINADOR}

    def is_franquicia_level(self) -> bool:
        """¿Opera a nivel de franquicia completa?"""
        return self.role == Role.FRANQUICIA_ADMIN

    def is_oficina_level(self) -> bool:
        """¿Opera solo dentro de una oficina concreta?"""
        return self.role in {
            Role.OFICINA_ADMIN,
            Role.RESPONSABLE,
            Role.COORDINADOR,
            Role.COMERCIAL,
        }

    def __str__(self):
        return f"{self.username} ({self.role})"


# -----------------------------
# CLIENTE
# -----------------------------
from django.conf import settings
from django.db import models
from django.db.models import Value
from django.db.models.functions import Concat
from django.contrib.postgres.indexes import GinIndex
from django.db.models import Index
from django.utils.translation import gettext_lazy as _


class Cliente(models.Model):

    # ============================
    # MULTI-TENANT (FRANQUICIA / OFICINA)
    # ============================
    franquicia = models.ForeignKey(
        Franquicia,
        on_delete=models.CASCADE,
        related_name="clientes",
        db_index=True
    )
    oficina = models.ForeignKey(
        Oficina,
        on_delete=models.CASCADE,
        related_name="clientes",
        db_index=True
    )

    # ============================
    # CAMPOS EXISTENTES
    # ============================
    class TipoDocumento(models.TextChoices):
        DNI = 'DNI', _('DNI')
        NIF = 'NIF', _('NIF')
        PASAPORTE = 'PASAPORTE', _('Pasaporte')

    class Sexo(models.TextChoices):
        MASCULINO = 'M', _('Masculino')
        FEMENINO = 'F', _('Femenino')
        OTRO = 'O', _('Otro')

    class Trato(models.TextChoices):
        SR = 'Sr.', _('Sr.')
        SRA = 'Sra.', _('Sra.')
        MR = 'Mr.', _('Mr.')
        MRS = 'Mrs.', _('Mrs.')


    nombre = models.CharField(max_length=50, default="Desconocido")
    apellido1 = models.CharField(max_length=50, default="Desconocido")
    apellido2 = models.CharField(max_length=50, blank=True, null=True)

    # 🔥 Campos normalizados para búsqueda avanzada
    nombre_apellido = models.CharField(max_length=120, db_index=True, editable=False, default="")
    nombre_apellidos_completo = models.CharField(max_length=160, db_index=True, editable=False, default="")

    tipo_documento = models.CharField(max_length=20, choices=TipoDocumento.choices, default=TipoDocumento.DNI)
    num_identificacion = models.CharField(max_length=50, unique=True, null=True, blank=True, db_index=True)

    direccion = models.CharField(max_length=255, default="")
    sexo = models.CharField(max_length=1, choices=Sexo.choices, default=Sexo.OTRO)
    trato = models.CharField(max_length=5, choices=Trato.choices, default=Trato.SR)
    info_adicional = models.TextField(blank=True, null=True)

    telefono = models.CharField(max_length=20, blank=True, null=True)
    telefono_movil = models.CharField(max_length=20, blank=True, null=True, db_index=True)
    email = models.EmailField(max_length=254, blank=True, null=True, db_index=True)
    email_secundario = models.EmailField(max_length=254, blank=True, null=True)

    actividades = models.ManyToManyField(
        'Actividad',
        related_name='clientes_asociados',
        blank=True
    )

    dias_ultimo_contacto = models.PositiveIntegerField(default=0)

    # ============================
    # AUDITORÍA
    # ============================
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='clientes_creados'
    )
    ultima_modificacion_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='clientes_modificados'
    )

    fecha_ultima_modificacion = models.DateTimeField(auto_now=True, db_index=True)
    creado_en = models.DateTimeField(auto_now_add=True, db_index=True)


    # ============================
    # PATHS INTERNOS — OPTIMIZADOS PARA BÚSQUEDA
    # ============================
    def save(self, *args, **kwargs):
        self.nombre_apellido = f"{self.nombre} {self.apellido1}".strip().lower()
        self.nombre_apellidos_completo = f"{self.nombre} {self.apellido1} {self.apellido2 or ''}".strip().lower()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.nombre} {self.apellido1}"

    # ============================
    # ÍNDICES OPTIMIZADOS (pg_trgm + multi-tenant)
    # ============================
    class Meta:
        ordering = ["-fecha_ultima_modificacion"]

        indexes = [
            # 🔥 MULTI-TENANT — consultas ultra rápidas por franquicia y oficina
            Index(fields=["franquicia", "oficina"], name="idx_cliente_tenant"),

            # 🔥 Búsqueda exacta acelerada
            Index(fields=["nombre_apellido"], name="idx_cliente_nombreact"),
            Index(fields=["nombre_apellidos_completo"], name="idx_cliente_nombreact2"),
            Index(fields=["email"], name="idx_cliente_email"),
            Index(fields=["telefono_movil"], name="idx_cliente_movil"),

            # ⚠️ GIN que tu Django sí soporta (campo directo, sin opclasses)
            # Esto acelera búsquedas por igualdad o contains básico
            # GinIndex(fields=["nombre_apellido"], name="idx_cliente_nombre_gin"),
            # GinIndex(fields=["nombre_apellidos_completo"], name="idx_cliente_nombre2_gin"),

            # 🧨 ATENCIÓN:
            # NO incluimos aquí TRGM ni opclasses ni expressions
            # porque tu versión de Django NO los soporta.
            #
            # Los añadiremos luego por migración SQL:
            #   CREATE EXTENSION pg_trgm;
            #   CREATE INDEX ... USING gin (campo gin_trgm_ops);
        ]



# -----------------------------
# EDIFICIO — Optimizado Enfermizamente
# -----------------------------

from django.conf import settings
from django.db import models
from django.db.models import Value
from django.db.models.functions import Concat
from django.contrib.postgres.indexes import GinIndex
from django.db.models import Index
from django.utils.translation import gettext_lazy as _



class Edificio(models.Model):

    # ============================
    # MULTI-TENANT
    # ============================
    franquicia = models.ForeignKey(
        Franquicia,
        on_delete=models.CASCADE,
        related_name="edificios",
        db_index=True
    )
    oficina = models.ForeignKey(
        Oficina,
        on_delete=models.CASCADE,
        related_name="edificios",
        db_index=True
    )

    # ============================
    # CAMPOS EXISTENTES
    # ============================
    class TipoFinca(models.TextChoices):
        RESIDENCIAL = 'Residencial', _('Residencial')
        SEÑORIAL = 'Señorial', _('Señorial')
        INDUSTRIAL = 'Industrial', _('Industrial')
        OTRO = 'Otro', _('Otro')

    codigo_postal = models.CharField(max_length=10, default="00000", db_index=True)
    provincia = models.CharField(max_length=100, default="Desconocida", db_index=True)

    # 🔥 Búsqueda flexible y error-tolerante → aplicamos TRGM
    calle = models.CharField(max_length=100, default="", db_index=True)
    numero_calle = models.CharField(max_length=10, default="S/N", db_index=True)

    latitud = models.FloatField(default=0.0, db_index=True)
    longitud = models.FloatField(default=0.0, db_index=True)

    tipo_finca = models.CharField(
        max_length=20,
        choices=TipoFinca.choices,
        default=TipoFinca.RESIDENCIAL,
        db_index=True
    )

    finca_vertical = models.BooleanField(default=True)
    anio_construccion = models.PositiveIntegerField(blank=True, null=True)
    numero_plantas = models.PositiveIntegerField(blank=True, null=True)

    # ============================
    # AUDITORÍA
    # ============================
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='edificios_creados'
    )
    ultima_modificacion_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='edificios_modificados'
    )

    fecha_ultima_modificacion = models.DateTimeField(auto_now=True, db_index=True)

    # ============================
    # RELACIONES
    # ============================
    actividades = models.ManyToManyField(
        'Actividad',
        related_name='edificios_asociados',
        blank=True
    )

    # ============================
    # REPRESENTACIÓN
    # ============================
    def __str__(self):
        return f"{self.calle}, {self.numero_calle} ({self.codigo_postal})"

    # ============================
    # ÍNDICES OPTIMIZADOS
    # ============================
    class Meta:
        ordering = ["-fecha_ultima_modificacion"]

        indexes = [

            # 🔥 MULTI-TENANT — consultas por oficina/franquicia instantáneas
            Index(fields=["franquicia", "oficina"], name="idx_edif_tenant"),

            # 🔥 ÍNDICES CLÁSICOS MUY USADOS
            Index(fields=["codigo_postal"], name="idx_edif_cp"),
            Index(fields=["provincia"], name="idx_edif_prov"),
            Index(fields=["tipo_finca"], name="idx_edif_tipo"),
            Index(fields=["latitud", "longitud"], name="idx_edif_coords"),
            Index(fields=["fecha_ultima_modificacion"], name="idx_edif_mod"),

            # ⚡ GIN BÁSICO — acelera búsquedas contains/startswith en estos campos
            # GinIndex(fields=["calle"], name="idx_edif_calle_gin"),
            # GinIndex(fields=["numero_calle"], name="idx_edif_numero_gin"),

            # 🧨 NO incluimos TRGM aquí porque tu Django no soporta expressions/opclasses.
            # Lo añadiremos luego vía migración SQL:
            #   CREATE INDEX ... USING gin (calle gin_trgm_ops);
            #   CREATE INDEX ... USING gin ((calle || ' ' || numero_calle) gin_trgm_ops);
        ]


# -----------------------------
# INMUEBLE — Optimizado al nivel enfermizo
# -----------------------------

from django.conf import settings
from django.db import models
from django.db.models import Q, F, Value
from django.db.models.functions import Concat
from django.contrib.postgres.indexes import GinIndex
from django.db.models import Index, CheckConstraint


class Inmueble(models.Model):

    # ============================
    # MULTI-TENANT
    # ============================
    franquicia = models.ForeignKey(
        Franquicia,
        on_delete=models.CASCADE,
        related_name="inmuebles",
        db_index=True
    )
    oficina = models.ForeignKey(
        Oficina,
        on_delete=models.CASCADE,
        related_name="inmuebles",
        db_index=True
    )

    # ============================
    # RELACIÓN CON EDIFICIO
    # ============================
    edificio = models.ForeignKey(
        Edificio,
        on_delete=models.CASCADE,
        db_index=True
    )

    # ============================
    # PROPIEDAD
    # ============================
    propietario = models.ForeignKey(
        'Cliente',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='propiedades',
        db_index=True
    )
    copropietarios = models.ManyToManyField(
        'Cliente',
        blank=True,
        related_name='copropiedades'
    )
    inquilino = models.ForeignKey(
        'Cliente',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='alquileres',
        db_index=True
    )
    coinquilinos = models.ManyToManyField(
        'Cliente',
        blank=True,
        related_name='coalquileres'
    )

    # ============================
    # UBICACIÓN INTERNA
    # ============================
    planta = models.CharField(max_length=10, default="0", db_index=True)
    puerta = models.CharField(max_length=10, default="A", db_index=True)
    interior = models.CharField(max_length=6, null=True, blank=True)

    ref_catastral = models.CharField(
        max_length=50,
        unique=True,
        blank=True,
        null=True,
        db_index=True
    )

    # 🔥 Campo optimizado para búsquedas tipo Google
    direccion_busqueda = models.CharField(
        max_length=200,
        db_index=True,
        editable=False,
        default=""
    )

    # ============================
    # CERTIFICADOS
    # ============================
    class CertificadoEficiencia(models.TextChoices):
        PRESENTE = 'Presente', _('Presente')
        EXENTO = 'Exento', _('Exento')
        EN_TRAMITE = 'En trámite', _('En trámite')

    estado_certificado = models.CharField(
        max_length=20,
        choices=CertificadoEficiencia.choices,
        default=CertificadoEficiencia.EN_TRAMITE,
        null=True,
        blank=True
    )
    emisiones_CO2 = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    consumo_energia = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    # ============================
    # CARACTERÍSTICAS
    # ============================
    habitaciones = models.PositiveIntegerField(default=1)
    banos = models.PositiveIntegerField(default=1)
    estancias = models.PositiveIntegerField(default=1)
    balcon = models.BooleanField(default=False)
    jardin = models.BooleanField(default=False)

    nota_simple = models.BooleanField(default=False)

    # ============================
    # AUDITORÍA
    # ============================
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='inmuebles_creados'
    )
    ultima_modificacion_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='inmuebles_modificados'
    )
    fecha_ultima_modificacion = models.DateTimeField(auto_now=True, db_index=True)

    # ============================
    # CRM EXTENDIDO
    # ============================
    class Ocupacion(models.TextChoices):
        NO_IDENTIFICADO = 'No identificado', _('No identificado')
        INQUILINO = 'Inquilino', _('Inquilino')
        PROPIETARIO = 'Propietario', _('Propietario')
        VACIO = 'Vacío', _('Vacío')

    ocupado_por = models.CharField(
        max_length=20,
        choices=Ocupacion.choices,
        default=Ocupacion.NO_IDENTIFICADO,
        db_index=True
    )

    informadores = models.ManyToManyField(
        'Cliente',
        blank=True,
        related_name='inmuebles_informados'
    )

    dias_ultimo_contacto = models.PositiveIntegerField(default=0)
    fecha_ultimo_contacto = models.DateField(null=True, blank=True, db_index=True)

    actividades = models.ManyToManyField(
        'Actividad',
        blank=True,
        related_name='inmuebles_asociados'
    )

    fecha_ultima_venta_alquiler = models.DateField(null=True, blank=True)

    zona_asignada = models.CharField(max_length=100, blank=True, default="", db_index=True)
    dia_zona = models.DateField(null=True, blank=True)
    
    class EstadoCRM(models.TextChoices):
        POR_DEFECTO = 'Por defecto', _('Por defecto')
        NOTICIA = 'Noticia', _('Noticia')
        ENCARGO = 'Encargo', _('Encargo')

    estado_CRM = models.CharField(
        max_length=20,
        choices=EstadoCRM.choices,
        default=EstadoCRM.POR_DEFECTO,
        db_index=True
    )

    motivacion = models.CharField(max_length=255, blank=True, default="")
    precio_pedido_cliente = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    precio_valoracion = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    precio_venta = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    precio_encargo = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    fecha_valoracion = models.DateField(null=True, blank=True)
    necesidad_venta = models.CharField(max_length=255, blank=True, default="")
    prioridad_noticia = models.PositiveIntegerField(default=0, db_index=True)
    tipo_procedencia = models.CharField(max_length=255, blank=True, default="")
    nota_inmueble = models.TextField(blank=True, null=True)
    nota_noticia = models.TextField(blank=True, null=True)
    comision = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)

    fecha_inicio_encargo = models.DateField(null=True, blank=True)
    fecha_fin_encargo = models.DateField(null=True, blank=True)

    # ============================
    # GEOLOCALIZACIÓN
    # ============================
    latitud = models.FloatField(null=True, blank=True, db_index=True)
    longitud = models.FloatField(null=True, blank=True, db_index=True)

    # ============================
    # SAVE OPTIMIZADO
    # ============================
    def save(self, *args, **kwargs):

        if self.edificio_id:
            edificio = getattr(self, "_edificio_cache", None) or Edificio.objects.get(pk=self.edificio_id)

            # Heredar lat/lng si faltan
            if not self.latitud or not self.longitud:
                self.latitud = edificio.latitud
                self.longitud = edificio.longitud

            # 🔥 dirección de búsqueda Google-like
            self.direccion_busqueda = (
                f"{edificio.calle} {edificio.numero_calle} "
                f"{self.planta or ''} {self.puerta or ''}"
            ).strip().lower()

        super().save(*args, **kwargs)

    # ============================
    # REPRESENTACIÓN
    # ============================
    def __str__(self):
        return f"Inmueble {self.puerta} - {self.edificio}"

    class Meta:
        ordering = ["-fecha_ultima_modificacion", "edificio_id", "planta", "puerta"]
        indexes = [

            # 🔥 MULTI-TENANT
            Index(fields=["franquicia", "oficina"], name="idx_inm_tenant"),

            Index(fields=["edificio", "planta", "puerta"]),
            Index(fields=["estado_CRM"]),
            Index(fields=["ocupado_por"]),
            Index(fields=["zona_asignada"]),
            Index(fields=["fecha_ultima_modificacion"]),
            Index(fields=["latitud", "longitud"]),

            # 🔥 TRGM búsqueda libre
            #GinIndex( name="idx_inm_direccion_trgm", fields=["direccion_busqueda"], opclasses=["gin_trgm_ops"]),
            #GinIndex( name="idx_inm_refcat_trgm", fields=["ref_catastral"], opclasses=["gin_trgm_ops"]),
        ]
        constraints = [
            CheckConstraint(
                check=(
                    Q(fecha_inicio_encargo__isnull=True, fecha_fin_encargo__isnull=True)
                    | Q(fecha_inicio_encargo__isnull=False, fecha_fin_encargo__isnull=True)
                    | Q(
                        fecha_inicio_encargo__isnull=False,
                        fecha_fin_encargo__isnull=False,
                        fecha_inicio_encargo__lte=F("fecha_fin_encargo"),
                    )
                ),
                name="inmueble_fechas_encargo_coherentes",
            ),
        ]


# ===============================
#             PEDIDO
#   Ultra-Optimizado para CRM
# ===============================

from django.conf import settings
from django.db import models
from django.db.models import Q, F
from django.contrib.postgres.indexes import GinIndex
from django.db.models import Index, CheckConstraint


class Pedido(models.Model):

    # ============================
    # MULTI-TENANT
    # ============================
    franquicia = models.ForeignKey(
        Franquicia,
        on_delete=models.CASCADE,
        related_name="pedidos",
        db_index=True
    )
    oficina = models.ForeignKey(
        Oficina,
        on_delete=models.CASCADE,
        related_name="pedidos",
        db_index=True
    )

    # ============================
    # DATOS BÁSICOS
    # ============================
    cliente = models.ForeignKey(
        "Cliente",
        on_delete=models.CASCADE,
        related_name="pedidos",
        db_index=True
    )

    tipo_operacion = models.CharField(
        max_length=20,
        choices=[
            ("comprar", "Comprar"),
            ("alquiler", "Alquiler"),
            ("traspaso", "Traspaso"),
        ],
        default="comprar",
        db_index=True
    )

    # 🔥 Campos críticos para matching → les activamos TRGM
    tipo_inmueble = models.CharField(max_length=100, blank=True, null=True)
    subtipo_inmueble = models.CharField(max_length=100, blank=True, null=True)

    prioridad = models.PositiveSmallIntegerField(
        default=3,
        db_index=True
    )

    fecha = models.DateField(auto_now_add=True, db_index=True)
    fecha_limite = models.DateField(blank=True, null=True, db_index=True)

    procedencia = models.CharField(
        max_length=50,
        choices=[
            ("zona", "Zona"),
            ("informador", "Informador"),
            ("agencia", "Agencia"),
            ("escaparate", "Escaparate"),
            ("red_agencias", "Red de agencias"),
            ("web_propia", "Web propia"),
            ("portales", "Portales inmobiliarios"),
            ("redes_sociales", "Redes sociales"),
        ],
        blank=True,
        null=True,
        db_index=True
    )

    # ============================
    # ESTADO DE GESTIÓN
    # ============================
    estado_pedido = models.CharField(
        max_length=30,
        choices=[
            ("cerrado", "Cerrado"),
            ("en_gestion", "En gestión"),
            ("en_visita", "En visita"),
            ("negociacion_avanzada", "Negociación avanzada"),
        ],
        default="en_gestion",
        db_index=True
    )

    estado_negociacion = models.CharField(
        max_length=30,
        choices=[
            ("pre_negociacion", "Pre-negociación"),
            ("reserva", "Reserva"),
            ("aceptacion", "Aceptación"),
            ("arras", "Arras firmadas"),
            ("escritura", "Escritura"),
        ],
        blank=True,
        null=True,
        db_index=True
    )

    # ============================
    # UBICACIÓN — 🔥 TRGM
    # ============================
    ubicaciones = models.TextField(
        help_text="Zonas separadas por comas",
        default="",
    )

    # ============================
    # CARACTERÍSTICAS — Matching
    # ============================
    superficie_min = models.PositiveIntegerField(default=0)
    superficie_max = models.PositiveIntegerField(default=0)

    habitaciones = models.PositiveIntegerField(default=0)
    banos = models.PositiveIntegerField(default=0)
    estancias = models.PositiveIntegerField(default=0)

    planta_min = models.PositiveIntegerField(default=0)
    planta_max = models.PositiveIntegerField(default=10)

    plazas_parking = models.PositiveIntegerField(default=0)

    amueblado = models.BooleanField(default=False)

    estado_inmueble = models.CharField(
        max_length=20,
        choices=[
            ("nuevo", "Nuevo"),
            ("casi_nuevo", "Casi nuevo"),
            ("muy_bien", "Muy bien"),
            ("bien", "Bien"),
            ("a_reformar", "A reformar"),
            ("reformado", "Reformado"),
        ],
        blank=True,
        null=True,
        db_index=True
    )

    exterior = models.BooleanField(default=True)
    balcon = models.BooleanField(default=False)
    terraza = models.BooleanField(default=False)
    jardin = models.BooleanField(default=False)
    ascensor = models.BooleanField(default=False)
    sotano = models.BooleanField(default=False)
    patio = models.BooleanField(default=False)
    piscina = models.BooleanField(default=False)
    mascotas = models.BooleanField(default=False)
    calefaccion = models.BooleanField(default=False)
    aire_acondicionado = models.BooleanField(default=False)

    # ============================
    # FINANCIERO
    # ============================
    precio_min = models.PositiveIntegerField(default=0, db_index=True)
    precio_max = models.PositiveIntegerField(default=0, db_index=True)

    entrada = models.PositiveIntegerField(default=0)
    cirbe = models.BooleanField(default=False)
    asesorado = models.BooleanField(default=False)
    info_financiacion = models.TextField(blank=True, null=True)

    tipo_pago = models.CharField(
        max_length=20,
        choices=[
            ("contado", "Al contado"),
            ("financiar", "A financiar"),
            ("inversion", "Inversión"),
        ],
        blank=True,
        null=True,
        db_index=True
    )

    rentabilidad_min = models.PositiveIntegerField(default=0)
    rentabilidad_max = models.PositiveIntegerField(default=0)

    # ============================
    # OBSERVACIONES — 🔥 TRGM
    # ============================
    motivacion = models.TextField(blank=True, null=True)
    motivacion_cambio = models.TextField(blank=True, null=True)
    notas_privadas = models.TextField(blank=True, null=True)
    descripcion = models.TextField(blank=True, null=True)
    privacidad_firmada = models.BooleanField(default=False)

    # ============================
    # AUDITORÍA
    # ============================
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="pedidos_creados"
    )
    ultima_modificacion_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="pedidos_modificados"
    )

    fecha_ultima_modificacion = models.DateTimeField(auto_now=True, db_index=True)

    # ============================
    # ACTIVIDADES
    # ============================
    actividades = models.ManyToManyField(
        "Actividad",
        related_name="pedidos_asociados",
        blank=True
    )

    # ============================
    # REPRESENTACIÓN
    # ============================
    def __str__(self):
        return f"Pedido {self.id} - {self.cliente}"

    # ============================
    # META / ÍNDICES ULTRA
    # ============================
    class Meta:
        ordering = ["-fecha_ultima_modificacion", "-fecha", "-prioridad"]
        indexes = [

            # Multi-tenant
            Index(fields=["franquicia", "oficina"], name="idx_pedido_tenant"),

            # Matching rápido
            Index(fields=["cliente", "fecha"]),
            Index(fields=["prioridad", "tipo_operacion"]),
            Index(fields=["estado_pedido"]),
            Index(fields=["estado_negociacion"]),
            Index(fields=["precio_min", "precio_max"]),
            Index(fields=["superficie_min", "superficie_max"]),
            Index(fields=["planta_min", "planta_max"]),
            Index(fields=["fecha_ultima_modificacion"]),

            # ⚠️ TRGM → ELIMINADOS DEL MODELO (van en migración SQL)
            # GinIndex(fields=["ubicaciones"], name="idx_pedido_ubic_trgm", opclasses=["gin_trgm_ops"]),
            # GinIndex(fields=["motivacion"], name="idx_pedido_motiv_trgm", opclasses=["gin_trgm_ops"]),
            # GinIndex(fields=["descripcion"], name="idx_pedido_desc_trgm", opclasses=["gin_trgm_ops"]),
            # GinIndex(fields=["tipo_inmueble"], name="idx_pedido_tipo_trgm", opclasses=["gin_trgm_ops"]),
            # GinIndex(fields=["subtipo_inmueble"], name="idx_pedido_subtipo_trgm", opclasses=["gin_trgm_ops"]),
        ]



# ===========================
# ======== ACTIVIDAD ========
# ======= ULTRA MODE ========
# ===========================

from datetime import timedelta
from django.core.exceptions import ValidationError
from django.conf import settings
from django.db import models
from django.db.models import Q, F
from django.contrib.postgres.indexes import GinIndex
from django.db.models import Index, CheckConstraint


class Actividad(models.Model):

    # ============================
    # MULTI-TENANT — crítico
    # ============================
    franquicia = models.ForeignKey(
        Franquicia,
        on_delete=models.CASCADE,
        related_name="actividades",
        db_index=True
    )
    oficina = models.ForeignKey(
        Oficina,
        on_delete=models.CASCADE,
        related_name="actividades",
        db_index=True
    )

    # ============================
    # ENUMS
    # ============================
    class EstadoActividad(models.TextChoices):
        REALIZADA = 'Realizada', _('Realizada')
        NO_REALIZADA = 'No realizada', _('No realizada')
        NEUTRO = 'En proceso', _('En proceso')

    class TipoActividad(models.TextChoices):
        # CONTACTO
        CONTACTO_GENERICO = 'Contacto genérico', _('Contacto genérico')
        LLAMADA_GENERICA = 'Llamada genérica', _('Llamada genérica')
        CONTACTO_DIRECTO = 'Contacto directo', _('Contacto directo')
        LLAMADA_CONTACTO_DIRECTO = 'Llamada de contacto directo', _('Llamada de contacto directo')

        # ADQUISICIÓN
        CITA_ADQUISICION = 'Cita de adquisición', _('Cita de adquisición')
        LLAMADA_ADQUISICION = 'Llamada de adquisición', _('Llamada de adquisición')
        CONTACTO_ADQUISICION = 'Contacto de adquisición', _('Contacto de adquisición')

        # SEGUIMIENTO ENCARGO
        CITA_SEGUIMIENTO_ENCARGO = 'Cita de seguimiento de encargo', _('Cita de seguimiento de encargo')
        LLAMADA_SEGUIMIENTO_ENCARGO = 'Llamada de seguimiento de encargo', _('Llamada de seguimiento de encargo')

        # SEGUIMIENTO PEDIDO
        LLAMADA_SEGUIMIENTO_PEDIDO = 'Llamada de seguimiento de pedido', _('Llamada de seguimiento de pedido')
        CONTACTO_SEGUIMIENTO_PEDIDO = 'Contacto de seguimiento de pedido', _('Contacto de seguimiento de pedido')

        # FASES COMERCIALES
        VISITA = 'Visita', _('Visita')
        RESERVA = 'Reserva', _('Reserva')
        PROPUESTA = 'Propuesta', _('Propuesta')
        ACEPTACION_PROPUESTA = 'Aceptación de la propuesta', _('Aceptación de la propuesta')
        FIRMA_ARRAS = 'Firma contrato de arras', _('Firma contrato de arras')
        ESCRITURA = 'Escritura', _('Escritura')

        # NUEVOS TIPOS INDEPENDIENTES (no ligados a inmueble ni pedido)
        REUNION = 'Reunión', _('Reunión')
        ACTIVIDAD_GENERICA = 'Actividad genérica', _('Actividad genérica')
        ZONA = 'Zona', _('Zona')


    # ============================
    # CAMPOS PRINCIPALES
    # ============================
    fecha_inicio = models.DateTimeField(db_index=True)
    fecha_fin = models.DateTimeField(db_index=True)

    tipo = models.CharField(
        max_length=50,
        choices=TipoActividad.choices,
        default=TipoActividad.CONTACTO_GENERICO,
        db_index=True
    )

    # 🔥 CRÍTICO PARA BÚSQUEDAS: TRGM
    descripcion_empleado = models.TextField(default="", blank=True, null=True)
    descripcion_publica = models.TextField(default="", blank=True, null=True)

    estado = models.CharField(
        max_length=20,
        choices=EstadoActividad.choices,
        default=EstadoActividad.NEUTRO,
        db_index=True
    )

    # ============================
    # RELACIONES
    # ============================
    cliente = models.ForeignKey(
        "Cliente",
        null=True, blank=True,
        on_delete=models.SET_NULL,
        db_index=True
    )
    inmueble = models.ForeignKey(
        "Inmueble",
        null=True, blank=True,
        on_delete=models.SET_NULL,
        db_index=True
    )
    pedido = models.ForeignKey(
        "Pedido",
        null=True, blank=True,
        on_delete=models.SET_NULL,
        db_index=True
    )

    # ============================
    # AUDITORÍA
    # ============================
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='actividades_creadas',
        db_index=True
    )
    ultima_modificacion_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='actividades_modificadas'
    )

    fecha_ultima_modificacion = models.DateTimeField(auto_now=True, db_index=True)

    # ============================
    # VALIDACIÓN
    # ============================
    def clean(self):
        if self.fecha_inicio and self.fecha_fin and self.fecha_inicio >= self.fecha_fin:
            raise ValidationError(_("La fecha de inicio debe ser anterior a la fecha de fin."))

    def save(self, *args, **kwargs):
        # Falla segura: nunca permitas fin <= inicio
        if self.fecha_inicio and self.fecha_fin and self.fecha_inicio >= self.fecha_fin:
            self.fecha_fin = self.fecha_inicio + timedelta(minutes=15)
        super().save(*args, **kwargs)

    # ============================
    # REPRESENTACIÓN
    # ============================
    def __str__(self):
        return f"Actividad {self.tipo} - {self.fecha_inicio.strftime('%Y-%m-%d')}"

    # ============================
    # META: ÍNDICES ULTRA-OPTIMIZADOS
    # ============================
    class Meta:
        ordering = ["-fecha_inicio", "-fecha_ultima_modificacion"]
        indexes = [

            # 🔥 MULTI-TENANT MUST-HAVE
            Index(fields=["franquicia", "oficina"], name="idx_act_tenant"),

            # 🔥 CALENDARIO: búsqueda por vista semanal/mensual
            Index(fields=["oficina", "fecha_inicio"], name="idx_act_oficina_fecha"),
            Index(fields=["creado_por", "fecha_inicio"], name="idx_act_user_fecha"),
            Index(fields=["tipo", "fecha_inicio"], name="idx_act_tipo_fecha"),
            Index(fields=["estado", "fecha_inicio"], name="idx_act_estado_fecha"),

            # 🔥 FECHAS para scroll infinito
            Index(fields=["fecha_inicio"], name="idx_act_fechainicio"),
            Index(fields=["fecha_fin"], name="idx_act_fechafin"),

            # 🔥 Relaciones con fecha para informes
            Index(fields=["cliente", "fecha_inicio"], name="idx_act_cliente_fecha"),
            Index(fields=["inmueble", "fecha_inicio"], name="idx_act_inmueble_fecha"),
            Index(fields=["pedido", "fecha_inicio"], name="idx_act_pedido_fecha"),

            # ============================
            # 🔥 TRGM en descripciones (búsqueda avanzada)
            # ============================
            # GinIndex( fields=["descripcion_empleado"], name="idx_act_desc_emp_trgm", opclasses=["gin_trgm_ops"]),
            # GinIndex( fields=["descripcion_publica"], name="idx_act_desc_pub_trgm", opclasses=["gin_trgm_ops"]),
        ]

        constraints = [
            CheckConstraint(
                check=Q(fecha_inicio__lt=F("fecha_fin")),
                name="actividad_fecha_inicio_menor_que_fin",
            ),
        ]
