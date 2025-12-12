from django.contrib import admin
from .models import Cliente, Pedido, Inmueble, Edificio, Actividad

@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ('id', 'nombre', 'apellido1', 'nombre_apellidos_completo', 'telefono', 'fecha_ultima_modificacion')
    search_fields = ('nombre', 'apellido1', 'apellido2', 'nombre_apellido', 'nombre_apellidos_completo')
    list_filter = ('sexo', 'trato')
    ordering = ('nombre_apellido',)


@admin.register(Inmueble)
class InmuebleAdmin(admin.ModelAdmin):
    list_display = ('id', 'ref_catastral', 'estado_CRM', 'precio_pedido_cliente', 'fecha_ultima_modificacion')
    search_fields = ('ref_catastral', 'direccion_busqueda')
    list_filter = ('estado_CRM', 'ocupado_por')
    ordering = ('estado_CRM',)


@admin.register(Edificio)
class EdificioAdmin(admin.ModelAdmin):
    list_display = ('id', 'calle', 'numero_calle', 'codigo_postal', 'tipo_finca')
    search_fields = ('calle', 'numero_calle', 'codigo_postal')
    list_filter = ('tipo_finca',)
    ordering = ('codigo_postal',)


@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    list_display = ('id', 'cliente', 'precio_min', 'precio_max', 'fecha_ultima_modificacion')
    search_fields = ('cliente__nombre', 'cliente__apellido1', 'cliente__apellido2')
    list_filter = ('balcon', 'jardin')
    ordering = ('-fecha_ultima_modificacion',)


@admin.register(Actividad)
class ActividadAdmin(admin.ModelAdmin):
    list_display = ('id', 'tipo', 'estado', 'fecha_inicio', 'cliente', 'inmueble')
    search_fields = ('tipo', 'descripcion_empleado', 'cliente__nombre', 'inmueble__ref_catastral')
    list_filter = ('tipo', 'estado')
    ordering = ('-fecha_inicio',)
