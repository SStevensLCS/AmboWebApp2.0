declare module "react-confetti" {
    import React from "react";

    export interface ConfettiProps {
        width: number;
        height: number;
        numberOfPieces?: number;
        recycle?: boolean;
        gravity?: number;
        drawShape?: (ctx: CanvasRenderingContext2D) => void;
    }

    export default class Confetti extends React.Component<ConfettiProps> { }
}
