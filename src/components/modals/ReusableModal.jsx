import { useEffect, useState } from 'react';
import styles from '../../styles/Components.module.css';
import {
    Button,
    Input,
    CheckBox,
    Select,
    Label,
    Option,
    Dialog,
    Text,
    MessageBox
} from '@ui5/webcomponents-react';


const ReusableModal = ({
    open,
    onClose,
    title,
    fields,
    onSubmit,
    submitButtonText = "Guardar",
    initialData = {},
}) => {
    const [formData, setFormData] = useState({});
    const [errors, setErrors] = useState({});
    const [showErrorAlert, setShowErrorAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');

    // Obtener un valor anidado (por ejemplo "DETAIL_ROW.ACTIVED")
    const getNestedValue = (obj, path) => {
        return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), obj);
    };

    //  Asignar un valor anidado (por ejemplo "DETAIL_ROW.ACTIVED" = true)
    const setNestedValue = (obj, path, value) => {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const deep = keys.reduce((acc, key) => {
            if (!acc[key]) acc[key] = {};
            return acc[key];
        }, obj);
        deep[lastKey] = value;
    };
    // Convierte claves tipo "DETAIL_ROW.ACTIVED" en un objeto anidado real
    const unflattenObject = (obj) => {
        const result = {};
        for (const key in obj) {
            const keys = key.split('.');
            keys.reduce((acc, part, index) => {
                if (index === keys.length - 1) {
                    acc[part] = obj[key];
                } else {
                    acc[part] = acc[part] || {};
                }
                return acc[part];
            }, result);
        }
        return result;
    };

    useEffect(() => {
        if (open) {
            const initialFormData = {};
            fields.forEach(field => {
                initialFormData[field.name] =
                    getNestedValue(initialData, field.name) ??
                    field.default ??
                    (field.type === 'checkbox' ? false : '');
            });
            setFormData(initialFormData);
            setErrors({});
        }
    }, [open]);

    const handleInputChange = (fieldName, value) => {
        setFormData(prev => {
            const updated = { ...prev };
            setNestedValue(updated, fieldName, value);
            return updated;
        });
        if (errors[fieldName]) {
            setErrors(prev => ({
                ...prev,
                [fieldName]: ''
            }));
        }
    };

    const handleSubmit = () => {
        const newErrors = {};
        const missingFields = [];

        fields.forEach(field => {
            if (field.required) {
                const value = formData[field.name];
                const isEmpty =
                    value === '' ||
                    value === undefined ||
                    value === null ||
                    (field.type === 'checkbox' && !value);

                if (isEmpty) {
                    newErrors[field.name] = `${field.label} es obligatorio`;
                    missingFields.push(field.label);
                }
            }
        });

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            const errorMsg = `Los siguientes campos son obligatorios:\n• ${missingFields.join('\n• ')}`;
            //setErrorMessage(<pre style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{errorMsg}</pre>);
            setAlertMessage(errorMsg);    // Guarda el mensaje
            setShowErrorAlert(true);    // Pide al componente que se muestre
            return;
        }

        const structuredData = unflattenObject(formData);
        onSubmit(structuredData);

        onClose();
    };

    const renderField = (field) => {
        const commonProps = {
            value: formData[field.name] || '',
            style: { width: '100%' }
        };

        const hasError = errors[field.name];

        switch (field.type) {
            case 'text':
            case 'email':
            case 'number':
            case 'password':
                return (
                    <div key={field.name} className={hasError ? styles.fieldWrapperErrorModal : styles.fieldWrapperModal}>
                        <Label required={field.required}>{field.label}</Label>
                        <Input
                            {...commonProps}
                            valueState={hasError ? "Error" : "None"}
                            type={field.type}
                            placeholder={field.placeholder}
                            onInput={(e) => handleInputChange(field.name, e.target.value)}
                        />
                        {hasError && (
                            <Text className={styles.ErrorTextModal}>
                                {errors[field.name]}
                            </Text>
                        )}
                    </div>
                );

            case 'checkbox':
                return (
                    <div key={field.name} className={hasError ? styles.fieldWrapperErrorModal : styles.fieldWrapperModal}>
                        <CheckBox
                            checked={formData[field.name] || false}
                            onChange={(e) => handleInputChange(field.name, e.target.checked)}
                            text={field.label}
                        />
                        {hasError && (
                            <Text className={styles.ErrorTextModal}>
                                {errors[field.name]}
                            </Text>
                        )}
                    </div>
                );

            case 'combobox':
                // Encontrar la opción seleccionada para mostrar el label
                return (
                    <div key={field.name} className={hasError ? styles.fieldWrapperErrorModal : styles.fieldWrapperModal}>
                        <Label required={field.required}>{field.label}</Label>
                        <Select
                            className={styles.SelectModal}
                            value={
                                field.options.find(opt => opt.value === formData[field.name])?.label || ''
                            }
                            onChange={(e) => {
                                const selectedOption = e.detail.selectedOption;
                                if (selectedOption && selectedOption.textContent) {
                                    const selectedText = selectedOption.textContent;
                                    const selected = field.options.find(opt => opt.label === selectedText);
                                    if (selected) {
                                        handleInputChange(field.name, selected.value);
                                    } else {
                                        handleInputChange(field.name, ''); // si elige placeholder
                                    }
                                }
                            }}
                        >
                            {/* Placeholder que no tiene valor */}
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
                                {errors[field.name]}
                            </Text>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

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
                <div className={styles.fieldsModal}>
                    {fields.map(renderField)}
                </div>
            </Dialog>
            <MessageBox
                open={showErrorAlert}
                onClose={() => setShowErrorAlert(false)}
                type="Warning"  // <-- Esto le da el ícono y estilo de "Atención"
                titleText="Campos requeridos"
            >
                {/* Usamos UIText para respetar los saltos de línea */}
                <Text className={styles.SpaceTextModal}>
                    {alertMessage}
                </Text>
            </MessageBox>

        </>
    );
};

export default ReusableModal;