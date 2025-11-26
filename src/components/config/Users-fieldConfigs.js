export const userCreationFields = [
  {
    name: "EMPLOYEEID",
    type: "text",
    label: "ID de Empleado",
    placeholder: "Ej. 45012",
    required: true,
    pattern: "^[0-9]*$",
    errorMessage: "Este campo solo acepta números."
  },
  {
    name: "USERNAME",
    type: "text",
    label: "Nombre de Usuario",
    placeholder: "Ingrese el nombre completo",
    required: true,
    maxLength: 100,
    pattern:  "^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\\s]+$",
    errorMessage: "Ingrese un nombre válido (solo letras y espacios)."
    
  },
  {
    name: "USERID",
    type: "text",
    label: "Identificador de Usuario (ID)",
    placeholder: "USER1",
    required: true,
    maxLength: 20,
    pattern: "^(?!\\d)(?!.*[-_]{2})(?!.*[-_]$)[A-Za-z0-9_-]+$",
    errorMessage: "Ingrese un ID válido (ej. USR-01, LOPEZ_ANA)."
  },
  {
    name: "EMAIL",
    type: "email",
    label: "Correo Electrónico",
    placeholder: "usuario@empresa.com",
    required: true,
    maxLength: 100,
    pattern: "^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$",
    errorMessage: "Ingrese un correo válido (ej. usuario@empresa.com)."
  },
  {
    name: "ALIAS",
    type: "text",
    label: "Alias",
    placeholder: "Ingrese el alias del usuario",
    maxLength: 80,
    pattern:  "^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\\s]+$",
    errorMessage: "Ingrese un nombre válido (solo letras y espacios)."
  },
  {
    name: "PHONENUMBER",
    type: "text",
    label: "Número Telefónico",
    placeholder: "3112345678",
    maxLength: 10,
    pattern: "^[0-9]*$",
    errorMessage: "Solo se permiten números."
  },
  {
    name: "EXTENSION",
    type: "text",
    label: "Extensión",
    placeholder: "Ej. 301",
    maxLength: 10,
    pattern: "^[0-9]*$",
    errorMessage: "Este campo solo acepta números."
  },
    {
    name: "BIRTHDATE",
    type: "date",
    label: "Fecha de Nacimiento",
    //placeholder: "20-05-1990",
    //maxLength: 10,
    //pattern: "^[0-9]*$",
    //errorMessage: "Este campo solo acepta números."
  },
  {
    name: "COMPANYID",
    type: "text",
    label: "ID de Compañía",
    placeholder: "Ej. 101",
    required: true,
    maxLength: 10,
    pattern: "^[0-9]*$",
    errorMessage: "Este campo solo acepta números."
   
  },
  {
    name: "CEDIID",
    type: "text",
    label: "ID de CEDI",
    placeholder: "Ej. 5",
    required: true,
     maxLength: 10,
    pattern: "^[0-9]*$",
    errorMessage: "Este campo solo acepta números."
  },
  {
    name: "PROFILE_PIC_URL",
    type: "text",
    label: "URL de Foto de Perfil",
    placeholder: "http://example.com/foto.jpg",
    //required: true,
    maxLength: 512,
    pattern: "^(https?:\\/\\/)?([\\da-z.-]+)\\.([a-z.]{2,6})([\\/\\w .-]*)*\\/?$",
    errorMessage: "Ingrese una URL válida (ej. http://example.com/foto.jpg)."
  },
  {
    name: "DETAIL_ROW.ACTIVED",
    type: "checkbox",
    label: "Usuario Activo",
    default: true,
  }
];

export const userEditFields = [
  {
    name: "EMPLOYEEID",
    type: "number",
    label: "ID de Empleado",
    maxLength: 10,
    pattern: "^[+0-9]*$",
    disable: true,
  },
   {
    name: "USERID",
    type: "text",
    label: "Identificador de Usuario (ID)",
    placeholder: "USER1",
    required: true,
    disable: true,
  },
   {
    name: "USERNAME",
    type: "text",
    label: "Nombre de Usuario",
    placeholder: "Ingrese el nombre completo",
    required: true,
    maxLength: 100,
    pattern:  "^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\\s]+$",
    errorMessage: "Ingrese un nombre válido (solo letras y espacios)."
    
  },
  {
    name: "EMAIL",
    type: "email",
    label: "Correo Electrónico",
    placeholder: "usuario@empresa.com",
    required: true,
    maxLength: 100,
    pattern: "^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$",
    errorMessage: "Ingrese un correo válido (ej. usuario@empresa.com)."
  },
  {
    name: "ALIAS",
    type: "text",
    label: "Alias",
    placeholder: "Ingrese el alias del usuario",
    maxLength: 80,
    pattern:  "^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\\s]+$",
    errorMessage: "Ingrese un nombre válido (solo letras y espacios)."
  },
  {
    name: "PHONENUMBER",
    type: "text",
    label: "Número Telefónico",
    placeholder: "3112345678",
    maxLength: 10,
    pattern: "^[0-9]*$",
    errorMessage: "Solo se permiten números."
  },
  {
    name: "EXTENSION",
    type: "text",
    label: "Extensión",
    placeholder: "Ej. 301",
    maxLength: 10,
    pattern: "^[0-9]*$",
    errorMessage: "Este campo solo acepta números."
  },
  {
    name: "BIRTHDATE",
    type: "date",
    label: "Fecha de Nacimiento",
    placeholder: "20-05-1990",
    maxLength: 10,
    //pattern: "^[0-9]*$",
    //errorMessage: "Este campo solo acepta números."
  },
  {
    name: "COMPANYID",
    type: "text",
    label: "ID de Compañía",
    placeholder: "Ej. 101",
    required: true,
    maxLength: 10,
    pattern: "^[0-9]*$",
    errorMessage: "Este campo solo acepta números."
  },
  {
    name: "CEDIID",
    type: "text",
    label: "ID de CEDI",
    placeholder: "Ej. 5",
    required: true,
    maxLength: 10,
    pattern: "^[0-9]*$",
    errorMessage: "Este campo solo acepta números."
  },
   {
    name: "PROFILE_PIC_URL",
    type: "text",
    label: "URL de Foto de Perfil",
    placeholder: "http://example.com/foto.jpg",
    //required: true,
    maxLength: 512,
    pattern: "^(https?:\\/\\/)?([\\da-z.-]+)\\.([a-z.]{2,6})([\\/\\w .-]*)*\\/?$",
    errorMessage: "Ingrese una URL válida (ej. http://example.com/foto.jpg)."
  },
  {
    name: "DETAIL_ROW.ACTIVED",
    type: "checkbox",
    label: "Usuario Activo",
  }
];

export const userOrderFields = [
  {id: "All", label: "Todos" },
  {id: "Active", label: "Activos" },
  {id: "Delete", label: "Borrados" },
];
