// config/Roles-fieldConfigs.js
export const roleEditFields = [
  { label: 'ID Rol', name: 'ROLEID', required: true },
  { label: 'Nombre de Rol', name: 'ROLENAME', required: true },
  { label: 'Descripción', name: 'DESCRIPTION', required: false }
];
export const roleCreationFields = [
  { label: 'ID Rol', name: 'ROLEID', required: true },
  { label: 'Nombre de Rol', name: 'ROLENAME', required: true },
  { label: 'Descripción', name: 'DESCRIPTION', required: false }
];

export const appEditFields = [
  { label: 'ID Aplicación', name: 'APPID', required: true },
  { label: 'Nombre de Aplicación', name: 'Aplicacion', required: true },
  { label: "Descripción", name: "DESCRIPTION", required: false }
];

const appCreationFields = [
  { label: "ID de Aplicación", name: "APPID", required: true },
  { label: "Nombre de Aplicación", name: "NAMEAPP", required: true },
  { label: "Descripción", name: "DESCRIPTION", required: false },
];

