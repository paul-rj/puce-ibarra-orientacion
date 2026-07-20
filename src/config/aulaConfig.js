// Prefijo que identifica un QR de aula/puerta generado por esta app.
// Debe coincidir exactamente con el mismo valor en public/ar-qr.js
// (ese archivo no puede importar este módulo porque ar.html es una página
// estática servida aparte del bundle de Vite).
export const QR_PREFIJO_AULA = 'PUCEAR:AULA:'

export function textoQrAula(codigo) {
  return `${QR_PREFIJO_AULA}${codigo}`
}
