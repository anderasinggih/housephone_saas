import { ImgHTMLAttributes } from 'react';

export default function ApplicationLogo(props: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            src="/favicon.ico"
            alt="Logo"
            {...props}
        />
    );
}
