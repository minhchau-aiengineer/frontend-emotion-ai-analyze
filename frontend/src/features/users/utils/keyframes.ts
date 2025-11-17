// users/utils/keyframes.ts

export const KEYFRAMES = `
@keyframes moveX {
  0% { background-position: 0% 0%; }
  100% { background-position: 300% 0%; }
}
@keyframes runLine {
  0% { left: -40%; }
  100% { left: 110%; }
}
@keyframes floatDot {
  0%, 100% { transform: translateY(0); opacity: .35; }
  50% { transform: translateY(-6px); opacity: .8; }
}
`;
