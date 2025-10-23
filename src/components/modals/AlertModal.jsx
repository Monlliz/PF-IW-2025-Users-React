
import React from 'react';
import styles from '../../styles/Components.module.css';
import { Dialog, Button, Title, Bar,Text } from '@ui5/webcomponents-react';

const AlertModal = ({
    open,
    onClose,
    title = "Información",
    message,
    buttonText = "Aceptar",
    design = "Default",
    onButtonClick, // Para manejar acciones adicionales
    showCloseButton = false
}) => {
    const handleButtonClick = () => {
        if (onButtonClick) {
            onButtonClick();
        }
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            headerText={title}
            className={styles.DialogAlert}
            footer={
                <>
                    {showCloseButton && (
                        <Button
                            design="Transparent"
                            onClick={onClose}
                            className={styles.BtnFooter}
                        >
                            Cancelar
                        </Button>
                    )}
                    <Button
                        design={design}
                        onClick={handleButtonClick}
                        className={styles.BtnFooter}
                    >
                        {buttonText}
                    </Button>
                </>
            }
        >
            <div className={styles.MsgAlert}>
                {message}
            </div>
        </Dialog>
    );
};

export default AlertModal;