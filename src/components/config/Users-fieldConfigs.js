export const userCreationFields = [
  {
    name: "USERNAME",
    type: "text",
    label: "Nombre de Usuario",
    placeholder: "Ingrese el nombre completo",
    required: true,
  },
  {
    name: "EMAIL",
    type: "email",
    label: "Correo Electrónico",
    placeholder: "usuario@empresa.com",
    required: true,
  },
  {
    name: "ALIAS",
    type: "text",
    label: "Alias",
    placeholder: "Ingrese el alias del usuario",
  },
  {
    name: "PHONENUMBER",
    type: "text",
    label: "Número Telefónico",
    placeholder: "+52 55 1234 5678",
  },
  {
    name: "EXTENSION",
    type: "text",
    label: "Extensión",
    placeholder: "Ej. 301",
  },
  {
    name: "COMPANYID",
    type: "number",
    label: "ID de Compañía",
    placeholder: "Ej. 101",
    required: true,
  },
  {
    name: "CEDIID",
    type: "number",
    label: "ID de CEDI",
    placeholder: "Ej. 5",
    required: true,
  },
  {
    name: "EMPLOYEEID",
    type: "number",
    label: "ID de Empleado",
    placeholder: "Ej. 45012",
    required: true,
  },
  {
    name: "ACTIVED",
    type: "checkbox",
    label: "Usuario Activo",
    default: true,
  },
  {
    name: "DELETED",
    type: "checkbox",
    label: "Usuario Eliminado",
    default: false,
  },
];

export const userEditFields = [
  {
    name: "USERNAME",
    type: "text",
    label: "Nombre de Usuario",
    placeholder: "Ingrese el nombre completo",
    required: true,
  },
  {
    name: "EMAIL",
    type: "email",
    label: "Correo Electrónico",
    placeholder: "usuario@empresa.com",
    required: true,
  },
  {
    name: "ALIAS",
    type: "text",
    label: "Alias",
    placeholder: "Ingrese el alias del usuario",
  },
  {
    name: "PHONENUMBER",
    type: "text",
    label: "Número Telefónico",
    placeholder: "+52 55 1234 5678",
  },
  {
    name: "EXTENSION",
    type: "text",
    label: "Extensión",
    placeholder: "Ej. 301",
  },
  {
    name: "COMPANYID",
    type: "number",
    label: "ID de Compañía",
  },
  {
    name: "CEDIID",
    type: "number",
    label: "ID de CEDI",
  },
  {
    name: "EMPLOYEEID",
    type: "number",
    label: "ID de Empleado",
  },
  {
    name: "ACTIVED",
    type: "checkbox",
    label: "Usuario Activo",
  },
  {
    name: "DELETED",
    type: "checkbox",
    label: "Usuario Eliminado",
  },
];
