// Convierte un archivo de imagen a dataURL JPEG (máx 1600px) listo para
// guardar en la base de datos. Las URLs blob: del navegador son temporales
// y se rompen al recargar, por eso se convierten antes de subir.
export function archivoADataURL(archivo) {
  return new Promise((resolve, reject) => {
    if (!archivo || !String(archivo.type || '').startsWith('image/')) {
      reject(new Error(`"${archivo?.name || 'archivo'}" no es una imagen válida`));
      return;
    }
    const lector = new FileReader();
    lector.onerror = () => reject(new Error(`No se pudo leer "${archivo.name}"`));
    lector.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error(`Formato no soportado: "${archivo.name}"`));
      img.onload = () => {
        const MAX = 1600;
        const escala = Math.min(1, MAX / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * escala));
        const h = Math.max(1, Math.round(img.height * escala));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = lector.result;
    };
    lector.readAsDataURL(archivo);
  });
}
