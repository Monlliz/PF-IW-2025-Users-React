import React, { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import { Dialog, Button, Text, Bar, Title, Icon } from '@ui5/webcomponents-react';

const BirthdaySurprise = () => {
    const [isBirthday, setIsBirthday] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Estado para el tamaño de ventana (para que el confeti cubra todo)
    const [windowDimension, setWindowDimension] = useState({ width: window.innerWidth, height: window.innerHeight });

    const detectSize = () => {
        setWindowDimension({ width: window.innerWidth, height: window.innerHeight });
    }

    useEffect(() => {
        window.addEventListener('resize', detectSize);
        
        // --- 1. LÓGICA DE COMPARACIÓN DE FECHAS ---
        const envDateString = import.meta.env.VITE_GLOBAL_BIRTHDAY; // "2025-11-22"

        if (envDateString) {
            const targetDate = new Date(envDateString);
            const today = new Date();

            
            const isSameMonth = targetDate.getUTCMonth() === today.getMonth();
            const isSameDay = targetDate.getUTCDate() === today.getDate();

            // Si coinciden día y mes
            if (isSameMonth && isSameDay) {
                setIsBirthday(true);
                setIsModalOpen(true);
            }
        }

        return () => {
            window.removeEventListener('resize', detectSize);
        }
    }, []);

    const handleClose = () => {
        setIsModalOpen(false);
        setIsBirthday(false); 
    };

    if (!isBirthday) return null;

    return (
        <>
            {/* EL CONFETI: Se renderiza encima de todo */}
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999, pointerEvents: 'none' }}>
                <Confetti
                    width={windowDimension.width}
                    height={windowDimension.height}
                    numberOfPieces={400} // Cantidad de papeles
                    gravity={0.2} // Velocidad de caída
                />
            </div>

            {/* EL MODAL DE UI5 */}
            <Dialog
                open={isModalOpen}
                onClose={handleClose}
                header={
                    <Bar>
                        <Title>¡Feliz Cumpleaños! 🎂</Title>
                    </Bar>
                }
                footer={
                    <Bar design="Footer">
                        <Button onClick={handleClose} design="Emphasized">¡Gracias!</Button>
                    </Bar>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
                    <Icon name="heart" style={{ width: '4rem', height: '4rem', color: '#d142f5' }} />
                    <Text style={{ fontSize: '1.2rem', textAlign: 'center' }}>
                        Hoy es un día muy especial. <br />
                        ¡Esperamos que tengas un día increíble lleno de alegría!
                    </Text>
                </div>
            </Dialog>
        </>
    );
};

export default BirthdaySurprise;