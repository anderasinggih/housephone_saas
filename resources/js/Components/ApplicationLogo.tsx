import { ImgHTMLAttributes } from 'react';

export default function ApplicationLogo({ className = '', ...props }: ImgHTMLAttributes<HTMLImageElement>) {
    const shouldInvert = !className.includes('text-white');
    return (
        <img
            src="/favicon.ico"
            alt="Logo"
            className={`${className} ${shouldInvert ? 'dark:invert-0 invert' : ''}`}
            {...props}
        />
    );
}

