import LogoImg from '@/assets/img/PEDRUN-LOGO-ICON-02_1.png'

type Props = {
    width?: string;
    height?: string;
};

export default function Logo({
    width = "100px",
    height = "100px",
}: Props) {
    return (
        <img alt='Pedrun Logo' src={LogoImg.src} width={width} height={height} />
    );
}