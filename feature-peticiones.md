## Feature peticiones, 

# en que consiste
- este feature permite gestionar las solicitudes para cambiar la ubicacion de los clientes, de un cobrador a otro

# flujo
1. el cobrador solicita el cambio de ubicacion de un cliente
2. el administrador recibe la solicitud
3. el administrador aprueba o rechaza la solicitud
4. si el administrador aprueba la solicitud, se cambia la ubicacion del cliente
5. si el administrador rechaza la solicitud, simplemente no se ejecutara la peticion. 

# componentes
- notificaciones-modal debe ser unmodal que este dentro de shared/components (este modal se usara para mostrar las peticiones), alli incluira la informacion basica del cliente, el cobrador que lo solicito, nombre de la ruta, y debe permitir poder visualizar el mapa tanto con la ubicacion vieja (old_ubicacion), como la nueva (new_ubicacion), y debe permitir poder aprobar o rechazar la solicitud. recuerda que a contamos con un modal para poder visualizar el mapa shared/components/mapa-modal
- Al componente shared/components/headere se le debe agregar un icono en la parte derecha superior que permita abrir las peticiones que estan pendientes de revision, este icono debe tener un badge que muestre la cantidad de peticiones pendientes de revision, este icono solo debe aparecer si hay peticiones pendientes de revision
- se debe generar un servicio para manejar las peticiones, este servicio debe tener los siguientes metodos:
    - getPeticionesPendientes()
    - aprobarPeticion(id: string)
    - rechazarPeticion(id: string)
    - igual, se debe generar un bucle para poder obtener las peticiones pendientes de revision, este bucle se ejecutara cada 30 segundos, tambien se cargara al iniciar sesion, por lo tanto tiene que estar ligado al auth.service
    - enpoints: 
        - la base url recuerda que esta en environment.ts
        - GET /peticiones-ubicacion
          - este endpoint puede recibir como query params = estado, id_cliente, id_ruta, id_empresa, en nuesto caso para cargar el inicio y obtener las peticiones pendientes pues necesitamos el id_empresa y el estado en pendiente y lo que regresa es un arreglo de peticiones-ubicacion
        - PATCH /peticiones-ubicacion/:id
          - este es el enpoint que se usamos para aprobar o rechazar la peticion, debemos mandar un body con lo siguiente, {
            "esAprobado": boolean
          } y regresa un boolean como respuesta exitosa.
- se debe generar un modelo con el nombre peticiones-ubicacion para manejar las peticiones, este modelo debe tener los siguientes campos:
    - id: string
    - old_ubicacion: number[]
    - new_ubicacion: number[]
    - cobrador: {id: string, nombre: string}
    - cliente: {id: string, nombre: string, alias: string}
    - ruta: {id: string, nombre: string}
    - empresa: {id: string, nombre: string}
    - estado: string
    - fecha_solicitud: date;
    - fecha_actualizacion: date;

# Lineamientos
- usar sintaxis moderna de angular, codigo limpio, mejores practicas de angular
- apoyate de context7
- como prueba final, simplemente ejecuta ionic cap build y revisa que no haya errores
- recuerda que estoy en windows, asi que no ejecutes comandos que no puedas ejecutar en windows, por ejemplo, no ejecutes comandos de linux o mac