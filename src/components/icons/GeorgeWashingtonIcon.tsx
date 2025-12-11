import React from 'react';
import gwIcon from '../../src/assets/gw_history.png';

const GeorgeWashingtonIcon: React.FC<{ size?: number; className?: string; onClick?: () => void }> = ({
    size = 24,
    className = "",
    onClick
}) => {
    return (
        <div
            className={`${className}`}
            onClick={onClick}
            style={{
                width: size,
                height: size,
                backgroundColor: 'currentColor',
                maskImage: `url(${gwIcon})`,
                maskSize: 'contain',
                maskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskImage: `url(${gwIcon})`,
                WebkitMaskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center'
            }}
        />
    );
};

export default GeorgeWashingtonIcon;
