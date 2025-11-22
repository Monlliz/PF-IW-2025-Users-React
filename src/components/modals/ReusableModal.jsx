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
    ComboBoxItem
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


const ReusableModal = ({
    open,
    onClose,
    title,
    fields,
    onSubmit,
    submitButtonText = "Guardar",
    initialData = {},
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
                const value =
                    getNestedValue(initialData, field.name) ??
                    field.default ??
                    (field.type === 'checkbox' ? false : '');
                setNestedValue(initialFormData, field.name, value);
            });
            setFormData(initialFormData);
            setErrors({});

            // 2. Llamada a API y Configuración de Edición
            // 2. Cargar las sociedades y FILTRAR IDs no numéricos
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

                        // --- CORRECCIÓN EN VALUE ---
                        // Construimos el mismo formato "VALOR (ID)" para que coincida con la lista
                        value={(() => {
                            // Usamos == por si el ID es número vs string
                            const s = sociedades.find(item => item.IDVALOR == value);
                            return s ? `${s.VALOR} (${s.IDVALOR})` : "";
                        })()}

                        // --- CORRECCIÓN EN ONCHANGE ---
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

                        // --- CORRECCIÓN EN VALUE ---
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
                            disabled={field.disabled || false}
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