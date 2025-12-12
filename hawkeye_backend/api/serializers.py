from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Cliente,
    Inmueble,
    Edificio,
    Actividad,
    Pedido,
    Franquicia,    # 🔥 necesario
    Oficina        # 🔥 necesario
)

User = get_user_model()   # 🔥 Usamos tu CustomUser real


# ==========================================================
# 🏢 FRANQUICIA & OFICINA
# ==========================================================

class FranquiciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Franquicia
        fields = '__all__'


class OficinaSerializer(serializers.ModelSerializer):
    franquicia = FranquiciaSerializer(read_only=True)
    franquicia_id = serializers.PrimaryKeyRelatedField(
        queryset=Franquicia.objects.all(),
        source="franquicia",
        write_only=True,
        required=True,
    )

    class Meta:
        model = Oficina
        fields = '__all__'
        

class FranquiciaMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Franquicia
        fields = ["id", "nombre", "codigo"]

class OficinaMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Oficina
        fields = ["id", "nombre", "codigo"]


# ==========================================================
# 🧩 USUARIOS Y ACTIVIDADES
# ==========================================================

class UsuarioMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name']


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']


class ActividadSerializer(serializers.ModelSerializer):
    usuario_responsable = UsuarioMiniSerializer(source="creado_por", read_only=True)

    usuario_responsable_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source="creado_por",
        write_only=True,
        required=False
    )
    
    franquicia = FranquiciaMiniSerializer(read_only=True)
    oficina = OficinaMiniSerializer(read_only=True)

    class Meta:
        model = Actividad
        fields = '__all__'
        read_only_fields = (
            "franquicia",
            "oficina",
            "creado_por",
            "ultima_modificacion_por",
        )


# ==========================================================
# 🏢 EDIFICIO
# ==========================================================

class EdificioSerializer(serializers.ModelSerializer):
    creado_por = UserSerializer(read_only=True)
    ultima_modificacion_por = UserSerializer(read_only=True)
    actividades = ActividadSerializer(many=True, read_only=True)

    class Meta:
        model = Edificio
        fields = '__all__'
        read_only_fields = (
            "franquicia",
            "oficina",
            "creado_por",
            "ultima_modificacion_por",
        )



# ==========================================================
# 🏠 INMUEBLE
# ==========================================================

class InmuebleSerializer(serializers.ModelSerializer):
    creado_por = UserSerializer(read_only=True)
    ultima_modificacion_por = UserSerializer(read_only=True)
    actividades = ActividadSerializer(many=True, read_only=True)
    informadores = serializers.PrimaryKeyRelatedField(many=True, read_only=True)

    edificio = serializers.SerializerMethodField(read_only=True)
    propietario = serializers.SerializerMethodField(read_only=True)

    edificio_id = serializers.PrimaryKeyRelatedField(
        queryset=Edificio.objects.all(),
        source="edificio",
        write_only=True,
        required=False,
    )
    propietario_id = serializers.PrimaryKeyRelatedField(
        queryset=Cliente.objects.all(),
        source="propietario",
        write_only=True,
        required=False,
        allow_null=True,
    )

    # 🔓 Aseguramos que estos campos sigan siendo editables
    fecha_inicio_encargo = serializers.DateField(required=False, allow_null=True)
    fecha_fin_encargo = serializers.DateField(required=False, allow_null=True)
    motivacion = serializers.CharField(required=False, allow_blank=True)
    precio_valoracion = serializers.DecimalField(required=False, allow_null=True, max_digits=12, decimal_places=2)
    precio_encargo = serializers.DecimalField(required=False, allow_null=True, max_digits=12, decimal_places=2)
    precio_venta = serializers.DecimalField(required=False, allow_null=True, max_digits=12, decimal_places=2)
    comision = serializers.DecimalField(required=False, allow_null=True, max_digits=6, decimal_places=2)

    class Meta:
        model = Inmueble
        fields = '__all__'
        read_only_fields = (
            "franquicia",
            "oficina",
            "creado_por",
            "ultima_modificacion_por",
            "fecha_ultima_modificacion",
            "fecha_ultimo_contacto",
        )

    def get_edificio(self, obj):
        if obj.edificio:
            return {
                "id": obj.edificio.id,
                "calle": obj.edificio.calle,
                "numero_calle": obj.edificio.numero_calle,
                "tipo_finca": obj.edificio.tipo_finca,
                "latitud": obj.edificio.latitud,
                "longitud": obj.edificio.longitud,
            }
        return None


    def get_propietario(self, obj):
        if obj.propietario:
            return {
                "id": obj.propietario.id,
                "nombre": obj.propietario.nombre,
                "apellido1": obj.propietario.apellido1,
                "apellido2": obj.propietario.apellido2,
                "telefono": obj.propietario.telefono,
                "telefono_movil": obj.propietario.telefono_movil,
                "email": obj.propietario.email,
                "direccion": obj.propietario.direccion,
                "poblacion": getattr(obj.propietario, "poblacion", "—"),
            }
        return None


    def validate(self, attrs):
        request = self.context.get('request')
        if request and request.method == 'POST' and not attrs.get("edificio"):
            raise serializers.ValidationError({"edificio_id": "Debes seleccionar un edificio válido."})
        return attrs


    def create(self, validated_data):
        edificio = validated_data.get("edificio")
        if edificio:
            if not validated_data.get("latitud"):
                validated_data["latitud"] = edificio.latitud
            if not validated_data.get("longitud"):
                validated_data["longitud"] = edificio.longitud
        return super().create(validated_data)


    def update(self, instance, validated_data):
        edificio = validated_data.get("edificio")
        if edificio:
            if not validated_data.get("latitud"):
                validated_data["latitud"] = edificio.latitud
            if not validated_data.get("longitud"):
                validated_data["longitud"] = edificio.longitud
        return super().update(instance, validated_data)


class PedidoSerializer(serializers.ModelSerializer):
    # ===============================
    # USUARIOS (solo lectura)
    # ===============================
    creado_por = UserSerializer(read_only=True)
    ultima_modificacion_por = UserSerializer(read_only=True)

    # ===============================
    # ACTIVIDADES
    # ===============================
    actividades = ActividadSerializer(many=True, read_only=True)

    # ===============================
    # CLIENTE
    # ===============================
    cliente = serializers.SerializerMethodField(read_only=True)

    cliente_id = serializers.PrimaryKeyRelatedField(
        queryset=Cliente.objects.all(),
        source="cliente",
        write_only=True,
        required=True
    )

    # ===============================
    # ALIAS DEL FRONT → compatibilidad
    # tipo_pedido = Comprar / Alquiler / Traspaso
    # ===============================
    tipo_pedido = serializers.CharField(
        write_only=True,
        required=False,
        help_text="Alias del front. Se convierte en tipo_operacion (comprar/alquiler/traspaso)."
    )

    presupuesto = serializers.IntegerField(
        write_only=True,
        required=False,
        default=0,
        help_text="Alias del front. Se mapea a precio_max."
    )

    class Meta:
        model = Pedido
        fields = '__all__'
        read_only_fields = (
            "franquicia",
            "oficina",
            "creado_por",
            "ultima_modificacion_por",
            "fecha_ultima_modificacion",
        )

    # ===============================
    # REPRESENTACIÓN DEL CLIENTE
    # ===============================
    def get_cliente(self, obj):
        if not obj.cliente:
            return None
        c = obj.cliente
        return {
            "id": c.id,
            "nombre": c.nombre,
            "apellido1": c.apellido1,
            "apellido2": c.apellido2,
            "telefono": c.telefono or c.telefono_movil,
            "email": c.email,
        }

    # ===============================
    # VALIDACIÓN GLOBAL
    # ===============================
    def validate(self, attrs):
        # Validación: cliente obligatorio
        if self.context["request"].method == "POST":
            if "cliente" not in attrs:
                raise serializers.ValidationError({"cliente_id": "Debes seleccionar un cliente válido."})

        return attrs

    # ===============================
    # OVERRIDE CREATE
    # Mapea alias → campos reales
    # ===============================
    def create(self, validated_data):

        # Alias tipo_pedido → tipo_operacion
        tipo_pedido = validated_data.pop("tipo_pedido", None)

        if tipo_pedido:
            mapping = {
                "Compra": "comprar",
                "compra": "comprar",
                "Comprar": "comprar",
                "Alquiler": "alquiler",
                "alquiler": "alquiler",
                "Traspaso": "traspaso",
                "traspaso": "traspaso",
            }
            validated_data["tipo_operacion"] = mapping.get(tipo_pedido, "comprar")

        # Alias presupuesto → precio_max
        presupuesto = validated_data.pop("presupuesto", None)
        if presupuesto is not None:
            validated_data["precio_max"] = presupuesto

        return super().create(validated_data)

    # ===============================
    # OVERRIDE UPDATE
    # Mantiene la coherencia con castings
    # ===============================
    def update(self, instance, validated_data):

        tipo_pedido = validated_data.pop("tipo_pedido", None)
        if tipo_pedido:
            mapping = {
                "Compra": "comprar",
                "compra": "comprar",
                "Comprar": "comprar",
                "Alquiler": "alquiler",
                "alquiler": "alquiler",
                "Traspaso": "traspaso",
                "traspaso": "traspaso",
            }
            validated_data["tipo_operacion"] = mapping.get(tipo_pedido, instance.tipo_operacion)

        presupuesto = validated_data.pop("presupuesto", None)
        if presupuesto is not None:
            validated_data["precio_max"] = presupuesto

        return super().update(instance, validated_data)



# ==========================================================
# 👤 CLIENTE
# ==========================================================

class ClienteSerializer(serializers.ModelSerializer):
    creado_por = UserSerializer(read_only=True)
    ultima_modificacion_por = UserSerializer(read_only=True)
    actividades = ActividadSerializer(many=True, read_only=True)

    propiedades = InmuebleSerializer(many=True, read_only=True)
    alquileres = InmuebleSerializer(many=True, read_only=True)
    copropiedades = InmuebleSerializer(many=True, read_only=True)
    coalquileres = InmuebleSerializer(many=True, read_only=True)
    pedidos = PedidoSerializer(many=True, read_only=True)

    class Meta:
        model = Cliente
        fields = '__all__'
        read_only_fields = (
            "franquicia",
            "oficina",
            "creado_por",
            "ultima_modificacion_por",
            "fecha_ultima_modificacion",
        )


class ClienteSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = [
            'id',
            'nombre',
            'apellido1',
            'apellido2',
            'telefono',
            'telefono_movil',
            'email'
        ]

# ==========================================================
# 🔐 REGISTRO DE USUARIOS
# ==========================================================

class RegistroSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    # Usamos los roles reales del modelo User
    role = serializers.ChoiceField(choices=User._meta.get_field("role").choices)

    # Para asignar franquicia/opción
    franquicia_id = serializers.PrimaryKeyRelatedField(
        queryset=Franquicia.objects.all(),
        source="franquicia",
        write_only=True,
        required=False,
        allow_null=True
    )

    oficina_id = serializers.PrimaryKeyRelatedField(
        queryset=Oficina.objects.all(),
        source="oficina",
        write_only=True,
        required=False,
        allow_null=True
    )

    class Meta:
        model = User
        fields = [
            'username',
            'email',
            'password',
            'role',
            'franquicia_id',
            'oficina_id',
        ]

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user
