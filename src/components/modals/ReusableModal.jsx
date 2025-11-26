import { useEffect, useState } from 'react';
import styles from '../../styles/Components.module.css';
import { getSociedades } from '../../services/usersService';

import {
    Button,
    Input,
    CheckBox,
    Select,
    Label,
    Option,
    Dialog,
    Text,
    MessageBox,
    ComboBox,
    ComboBoxItem,
    DatePicker
} from '@ui5/webcomponents-react';

// --- Helpers para manejar objetos anidados ---
// (DETAIL_ROW.ACTIVED)

// Lee un valor anidado
const getNestedValue = (obj, path) => {
    return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), obj);

};

// Escribe un valor anidado
// Se usa para construir el estado inicial.
const setNestedValue = (obj, path, value) => {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const deep = keys.reduce((acc, key) => {
        if (!acc[key] || typeof acc[key] !== 'object') {
            acc[key] = {};
        }
        return acc[key];
    }, obj);
    deep[lastKey] = value;
};

// para actualizar el estado
const updateNestedValue = (obj, path, value) => {
    const keys = path.split('.');
    const key = keys[0];

    if (keys.length === 1) {
        return {
            ...obj,
            [key]: value,
        };
    }

    const nextObj = obj[key] || {};
    return {
        ...obj,
        [key]: updateNestedValue(nextObj, keys.slice(1).join('.'), value),
    };
};

// --- Generador de ID de Usuario ---
const generateUserIdFromName = (fullName) => {
    if (!fullName) return null; // Retornamos null para indicar error o vacío

    const particles = ['de', 'del', 'la', 'las', 'los', 'y', 'san', 'santa', 'el', 'von', 'van', 'da', 'di'];
    const rawParts = fullName.trim().split(/\s+/);

    // --- 1. VALIDACIÓN DE APELLIDO FALTANTE (Tu lógica) ---
    // Recorremos las palabras. Si encontramos una partícula y la palabra SIGUIENTE
    // es la ÚLTIMA de la cadena, asumimos que es un nombre compuesto incompleto.
    // Ej: "Maria de Jesus" -> 'de' está en índice 1. Siguiente es 'Jesus' (índice 2). 
    // 'Jesus' es la última palabra. -> ERROR.

    for (let i = 0; i < rawParts.length - 1; i++) {
        const currentWord = rawParts[i].toLowerCase();
        const nextWordIndex = i + 1;

        if (particles.includes(currentWord)) {
            // Si la palabra que sigue a la partícula es la última del arreglo...
            if (nextWordIndex === rawParts.length - 1) {
                return "INCOMPLETE_NAME"; // Código especial de error
            }
        }
    }

    // --- 2. FILTRADO Y GENERACIÓN ---
    const meaningfulParts = rawParts.filter(part => !particles.includes(part.toLowerCase()));

    // Si después de limpiar no hay al menos 2 palabras (1 nombre + 1 apellido), es error
    if (meaningfulParts.length < 2) return null;

    let prefix = "";
    const randomNumbers = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');

    // CASO A: Exactamente 2 palabras significativas (Ej: "Juan Perez")
    if (meaningfulParts.length === 2) {
        const nameL = meaningfulParts[0][0];
        const surnameL = meaningfulParts[1][0];
        const randomChar = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        prefix = nameL + surnameL + randomChar;
    }
    // CASO B: 3 o más palabras (Ej: "Maria Perez Gonzales" o "Maria de Jesus Lopez")
    else {
        const nameL = meaningfulParts[0][0]; // 1ra letra Nombre
        const surname1L = meaningfulParts[meaningfulParts.length - 2][0]; // 1ra letra Penúltimo
        const surname2L = meaningfulParts[meaningfulParts.length - 1][0]; // 1ra letra Último
        prefix = nameL + surname1L + surname2L;
    }

    return (prefix + randomNumbers).toUpperCase();
};

// --- Generar ID de Empleado (4 números) ---
const generateEmployeeId = () => {
    // Genera un número entre 1000 y 9999
    return Math.floor(1000 + Math.random() * 9000).toString();
};

const ReusableModal = ({
    open,
    onClose,
    title,
    fields,
    onSubmit,
    submitButtonText = "Guardar",
    initialData = {},
    existingUsers = [] // <-- RECIBIMOS LA LISTA DE USUARIOS EXISTENTES
}) => {

    // --- Estados ---
    const [formData, setFormData] = useState({}); // Los datos del formulario
    const [errors, setErrors] = useState({}); // Errores de validación en tiempo real
    const [showErrorAlert, setShowErrorAlert] = useState(false); // Para el MessageBox
    const [alertMessage, setAlertMessage] = useState(''); // Mensaje del MessageBox
    const [alertTitle, setAlertTitle] = useState(''); // Título del MessageBox

    //estados para las sociedades y CEDIs dependientes
    const [sociedades, setSociedades] = useState([]);
    const [cedisDisponibles, setCedisDisponibles] = useState([]);

    // --- Detectar si estamos editando ---
    // Si initialData tiene un USERID, asumimos que es edición.
    const isEditMode = !!initialData && !!getNestedValue(initialData, 'USERID');

    /**
     * Carga el formulario cuando se abre el modal.
     * Llena 'formData' con 'initialData' o los valores por defecto.
     */
    // Cargar sociedades y configurar la cascada inicial
    useEffect(() => {
        if (open) {
            // 1. Construir la data del formulario
            const initialFormData = {};
            fields.forEach(field => {
                let value =
                    getNestedValue(initialData, field.name) ??
                    field.default ??
                    (field.type === 'checkbox' ? false : '');
                // --- Autogenerar EMPLOYEEID---
                if (!isEditMode && field.name === 'EMPLOYEEID') {
                    // Si no estamos editando y es el campo de empleado, generamos el ID
                    value = generateEmployeeId();
                }
                setNestedValue(initialFormData, field.name, value);
            });
            setFormData(initialFormData);
            setErrors({});

            // Llamada a API y Configuración de Edición
            // Cargar las sociedades y FILTRAR IDs no numéricos
            getSociedades().then((res) => {
                const rawList = res || [];

                // Regex que permite SOLO números (del 0 al 9)
                // ^ = inicio, \d = digito, + = uno o más, $ = fin
                const soloNumerosRegex = /^\d+$/;

                const listaSociedades = rawList.reduce((acc, sociedad) => {
                    // --- PASO 1: Validar ID de la Sociedad ---
                    // Convertimos a String para evaluar el regex de forma segura
                    const idSociedadStr = String(sociedad.IDVALOR || "");

                    // Si NO pasa la prueba (tiene letras o es vacío), la saltamos
                    if (!soloNumerosRegex.test(idSociedadStr)) {
                        return acc;
                    }

                    // --- PASO 2: Validar IDs de los Cedis (Hijos) ---
                    // Filtramos el arreglo de hijos bajo la misma regla
                    const hijosValidos = (sociedad.hijos || []).filter(cedi => {
                        const idCediStr = String(cedi.IDVALOR || "");
                        return soloNumerosRegex.test(idCediStr);
                    });

                    // --- PASO 3: Guardar la sociedad limpia ---
                    // Agregamos la sociedad válida con su nueva lista de hijos filtrados
                    acc.push({
                        ...sociedad,
                        hijos: hijosValidos
                    });

                    return acc;
                }, []);
                setSociedades(listaSociedades);

                // --- LÓGICA DE EDICIÓN (Con la lista ya filtrada) ---
                const initialCompanyId = getNestedValue(initialData, "COMPANYID");

                if (initialCompanyId) {
                    // Buscamos usando == por si uno es string y el otro number
                    const sociedadEncontrada = listaSociedades.find(s => s.IDVALOR == initialCompanyId);


                    if (sociedadEncontrada && sociedadEncontrada.hijos) {
                        setCedisDisponibles(sociedadEncontrada.hijos);
                    }
                } else {
                    setCedisDisponibles([]);
                }

            });
        }

    }, [open, fields]);

    // Cuando cambia la compañía, filtramos los CEDIs
    const handleCompanyChange = (selectedCompanyId) => {
        const sociedad = sociedades.find(s => s.IDVALOR === selectedCompanyId);

        const hijos = sociedad?.hijos || [];
        setCedisDisponibles(hijos);

        // Limpia CEDI anterior y actualiza compañía
        setFormData(prev => {
            const updated = structuredClone(prev);
            setNestedValue(updated, "COMPANYID", selectedCompanyId);
            setNestedValue(updated, "CEDIID", "");
            return updated;
        });
    };

    /**
     * Se llama CADA vez que el usuario escribe en un campo.
     * Aquí se hace la validación en tiempo real.
     */
    const handleInputChange = (fieldName, value) => {
        const field = fields.find(f => f.name === fieldName);
        if (!field) return;

        // Validar MaxLength (no deja escribir más)
        if (field.maxLength && value.length > field.maxLength) {
            return;
        }

        // Validar Pattern (Regex para email, números, etc.)
        if (field.pattern) {
            const regex = new RegExp(field.pattern);

            if (value !== "" && !regex.test(value)) {
                // Si falla, aparece un error
                setErrors(prev => ({
                    ...prev,
                    [fieldName]: field.errorMessage || "Formato incorrecto."
                }));
            } else {
                // Si está bien, quita el error
                setErrors(prev => ({
                    ...prev,
                    [fieldName]: ''
                }));
            }
        } else if (errors[fieldName]) {
            // Si no tiene patrón, se asegura de que no tenga error
            setErrors(prev => ({
                ...prev,
                [fieldName]: ''
            }));
        }

        // ---VALIDACIÓN MANUAL DE USERID (Si el usuario lo escribe) ---
        if (fieldName === "USERID") {
            // Verificamos si el ID escrito ya existe en la base de datos
            const idExists = existingUsers.some(u => u.USERID === value.toUpperCase());

            if (idExists) {
                setErrors(prev => ({
                    ...prev,
                    [fieldName]: "Este ID ya existe. Por favor, elija otro."
                }));
            } else {
                // Si no existe (y no hay error de pattern), limpiamos
                if (!errors[fieldName] || errors[fieldName] === "Este ID ya existe. Por favor, elija otro.") {
                    setErrors(prev => ({ ...prev, [fieldName]: '' }));
                }
            }
        }

        // --- LÓGICA ESPECIAL: USERNAME -> USERID ---
        if (fieldName === "USERNAME") {

            // Intentamos generar el ID con la lógica estricta
            const generatedId = generateUserIdFromName(value);

            // Caso 1: Se detectó un nombre incompleto (ej: "Maria de Jesus")
            if (generatedId === "INCOMPLETE_NAME") {
                setErrors(prev => ({
                    ...prev,
                    [fieldName]: "Parece que falta el apellido (Nombre compuesto detectado)."
                }));
                generatedId = ""; // Limpiamos ID
            }

            // Caso 2: No hay suficientes palabras significativas (menos de 2)
            else if (generatedId === null) {
                // Si hay texto escrito pero no es suficiente, mostramos advertencia
                if (value.trim().length > 0) {
                    setErrors(prev => ({
                        ...prev,
                        [fieldName]: "Ingrese al menos un nombre y un apellido."
                    }));
                }
                generatedId = ""; // Limpiamos ID
            }

            // Caso 3: ¡ÉXITO! Generamos el ID
            else if (!isEditMode) {
                setErrors(prev => ({ ...prev, [fieldName]: '' })); // Limpiar errores
                // --- VALIDACIÓN DE COLISIÓN (AUTOGENERADO) ---
                // Si el ID generado ya existe, lo regeneramos hasta encontrar uno libre
                // (Como la función usa randomNumbers, llamarla de nuevo da otro resultado)
                let attempts = 0;
                // "Mientras el ID exista en la lista de usuarios..."
                while (existingUsers.some(u => u.USERID === generatedId) && attempts < 10) {
                    console.log(`Colisión detectada con ${generatedId}, regenerando...`);
                    generatedId = generateUserIdFromName(value);
                    attempts++;

                }
                setFormData(prev => {
                    const updated = structuredClone(prev);
                    setNestedValue(updated, fieldName, value); // Actualiza nombre
                    // Solo tocamos el USERID si hubo un cambio (para bien o para borrarlo)
                    if (generatedId !== undefined) {
                        setNestedValue(updated, "USERID", generatedId);

                        // Si autogeneramos un ID válido, nos aseguramos de borrar cualquier error manual previo en USERID
                        if (generatedId) {
                            setErrors(prevErr => ({ ...prevErr, "USERID": '' }));
                        }
                    }
                    return updated;
                });
                return;
            }
        }
        // Actualizar el estado (con el valor bueno o malo)
        // Uso structuredClone para no mutar el estado de React
        setFormData(prev => {
            const updatedState = structuredClone(prev);
            setNestedValue(updatedState, fieldName, value);
            return updatedState;
        });
    };

    /**
     * Se llama al presionar "Guardar".
     * Frena el envío si hay errores.
     */
    const handleSubmit = () => {
        const newErrors = {};
        const missingFields = [];

        // Revisa campos requeridos
        fields.forEach(field => {
            if (field.required) {
                const value = getNestedValue(formData, field.name);

                const isEmpty =
                    value === '' ||
                    value === undefined ||
                    value === null ||
                    (field.type === 'checkbox' && !value);

                if (isEmpty && !errors[field.name]) {
                    newErrors[field.name] = `${field.label} es obligatorio`;
                    missingFields.push(field.label);
                }
            }
        });

        // Si faltan campos... Alerta!
        if (Object.keys(newErrors).length > 0) {
            setErrors(prev => ({ ...prev, ...newErrors }));
            setAlertTitle("Campos requeridos");
            setAlertMessage(`Los siguientes campos son obligatorios:\n• ${missingFields.join('\n• ')}`);
            setShowErrorAlert(true);
            return;
        }

        // Revisa errores de formato (los de handleInputChange)
        const hasPatternErrors = Object.values(errors).some(errorMsg => errorMsg !== '');

        // Si hay errores de formato... Alerta!
        if (hasPatternErrors) {
            setAlertTitle("Contenido incorrecto");
            setAlertMessage("Por favor, corrija los campos marcados en rojo antes de guardar.");
            setShowErrorAlert(true);
            return;
        }
        //¡Todo bien!
        onSubmit(formData);
        onClose();
    };

    /**
     * Dibuja el componente de UI5 correcto para cada campo.
     * (Input, CheckBox, Select, etc.)
     */
    const renderField = (field) => {
        const value = getNestedValue(formData, field.name);
        const hasError = errors[field.name]; // 'hasError' aquí es el string del mensaje
        // Modificamos solo los combobox
        if (field.name === "COMPANYID") {
            return (
                <div key={field.name} className={hasError ? styles.fieldWrapperErrorModal : styles.fieldWrapperModal}>
                    <Label required={field.required}>{field.label}</Label>
                    <ComboBox
                        placeholder="Selecciona o escribe una sociedad..."
                        style={{ width: '100%' }}
                        // Construimos el mismo formato "VALOR (ID)" para que coincida con la lista
                        value={(() => {
                            // Usamos == por si el ID es número vs string
                            const s = sociedades.find(item => item.IDVALOR == value);
                            return s ? `${s.VALOR} (${s.IDVALOR})` : "";
                        })()}

                        onChange={(e) => {
                            const selectedText = e.target.value;
                            // Buscamos por el texto completo compuesto
                            const selectedSoc = sociedades.find(s => `${s.VALOR} (${s.IDVALOR})` === selectedText);
                            handleCompanyChange(selectedSoc?.IDVALOR || "");
                        }}
                    >
                        {sociedades.map(s => (
                            <ComboBoxItem
                                key={s.IDVALOR}
                                text={`${s.VALOR} (${s.IDVALOR})`} // Formato visual
                            />
                        ))}
                    </ComboBox>
                    {hasError && <Text className={styles.ErrorTextModal}>{hasError}</Text>}
                </div>
            );
        }

        if (field.name === "CEDIID") {
            return (
                <div key={field.name} className={hasError ? styles.fieldWrapperErrorModal : styles.fieldWrapperModal}>
                    <Label required={field.required}>{field.label}</Label>
                    <ComboBox
                        placeholder={cedisDisponibles.length === 0 ? "Selecciona una sociedad primero" : "Selecciona o escribe un CEDI..."}
                        style={{ width: '100%' }}
                        value={(() => {
                            const c = cedisDisponibles.find(item => item.IDVALOR == value);
                            return c ? `${c.VALOR} (${c.IDVALOR})` : "";
                        })()}

                        onChange={(e) => {
                            const selectedText = e.target.value;
                            // Buscamos por el texto completo compuesto
                            const selectedCedi = cedisDisponibles.find(c => `${c.VALOR} (${c.IDVALOR})` === selectedText);
                            handleInputChange("CEDIID", selectedCedi?.IDVALOR || "");
                        }}

                        disabled={cedisDisponibles.length === 0}
                    >
                        {cedisDisponibles.map(c => (
                            <ComboBoxItem
                                key={c.IDVALOR}
                                text={`${c.VALOR} (${c.IDVALOR})`} // Formato visual
                            />
                        ))}
                    </ComboBox>
                    {hasError && <Text className={styles.ErrorTextModal}>{hasError}</Text>}
                </div>
            );
        }

        const fieldType = field.type || 'text';

        switch (fieldType) {
            case 'text':
            case 'email':
            case 'number':
            case 'date':
            case 'password':
                return (
                    <div key={field.name} className={hasError ? styles.fieldWrapperErrorModal : styles.fieldWrapperModal}>
                        <Label required={field.required}>{field.label}</Label>
                        <Input
                            maxLength={field.maxLength}
                            style={{ width: '100%' }}
                            value={value || ''}
                            valueState={hasError ? "Error" : "None"} // Si 'hasError' tiene texto, se pone rojo
                            type={field.type} // El tipo (text, email, number) viene del 'field'
                            placeholder={field.placeholder}
                            onInput={(e) => handleInputChange(field.name, e.target.value)}
                            valueStateMessage={
                                <div slot="valueStateMessage">
                                    {hasError} {/* Muestra el mensaje de error */}
                                </div>
                            }
                            disabled={field.disable || false}
                        />
                        {/* Muestra el error abajo también (por si acaso) */}
                        {hasError && (
                            <Text className={styles.ErrorTextModal}>
                                {hasError}
                            </Text>
                        )}
                    </div>
                );

            case 'checkbox':
                return (
                    <div key={field.name} className={hasError ? styles.fieldWrapperErrorModal : styles.fieldWrapperModal}>
                        <CheckBox
                            checked={value || false}
                            onChange={(e) => handleInputChange(field.name, e.target.checked)}
                            text={field.label}
                            disabled={field.disabled || false}
                        />
                        {hasError && (
                            <Text className={styles.ErrorTextModal}>
                                {hasError}
                            </Text>
                        )}
                    </div>
                );

            case 'combobox':
                return (
                    <div key={field.name} className={hasError ? styles.fieldWrapperErrorModal : styles.fieldWrapperModal}>
                        <Label required={field.required}>{field.label}</Label>
                        <Select
                            className={styles.SelectModal}
                            value={
                                // Busca el label que coincida con el value guardado
                                field.options.find(opt => opt.value === value)?.label || ''
                            }
                            onChange={(e) => {
                                // Lógica inversa: busco el value según el label
                                const selectedOption = e.detail.selectedOption;
                                if (selectedOption && selectedOption.textContent) {
                                    const selectedText = selectedOption.textContent;
                                    const selected = field.options.find(opt => opt.label === selectedText);
                                    if (selected) {
                                        handleInputChange(field.name, selected.value);
                                    } else {
                                        handleInputChange(field.name, '');
                                    }
                                }
                            }}
                            disabled={field.disable || false}
                        >
                            <Option key="placeholder" selected disabled hidden>
                                Selecciona una opción...
                            </Option>
                            {field.options.map(option => (
                                <Option key={option.value} >
                                    {option.label}
                                </Option>
                            ))}
                        </Select>
                        {hasError && (
                            <Text className={styles.ErrorTextModal}>
                                {hasError}
                            </Text>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    // --- El JSX que se renderiza ---
    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
                headerText={title}
                className={styles.DialogModal}
                style={{ maxWidth: '400px', minWidth: '400px' }}
                footer={
                    <>
                        <Button
                            design="Emphasized"
                            className={styles.BtnFooter}
                            onClick={handleSubmit}
                        >
                            {submitButtonText}
                        </Button>
                        <Button
                            design="Transparent"
                            onClick={onClose}
                            className={styles.BtnFooter}
                        >
                            Cancelar
                        </Button>
                    </>
                }
            >
                {/* Aquí se dibujan todos los campos */}
                <div className={styles.fieldsModal}>
                    {fields.map(renderField)}
                </div>
            </Dialog>

            {/* Mi MessageBox para las alertas */}
            <MessageBox
                open={showErrorAlert}
                onClose={() => setShowErrorAlert(false)}
                type="Warning"
                titleText={alertTitle}
            >
                <Text className={styles.SpaceTextModal}>
                    {alertMessage}
                </Text>
            </MessageBox>
        </>
    );
};

export default ReusableModal;