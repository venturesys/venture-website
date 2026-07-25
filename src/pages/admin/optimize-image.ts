/**
 * Redimensiona e recomprime a imagem no navegador, antes de subir.
 *
 * Sem isso, uma foto de celular de 4 MB vai inteira para o repositório e para todo
 * visitante. Como o site serve as imagens direto de `public/media`, não há etapa de
 * otimização depois — o cuidado precisa acontecer aqui, na hora do envio.
 *
 * Formatos que não sobrevivem a um canvas (SVG é vetor, GIF pode ser animado) passam
 * direto, sem alteração.
 */

const LARGURA_MAXIMA = 1600;
const QUALIDADE = 0.82;
const FORMATOS_PRESERVADOS = ['image/svg+xml', 'image/gif'];

export interface ImagemOtimizada {
  file: File;
  bytesOriginais: number;
  bytesFinais: number;
}

export async function optimizeImage(original: File): Promise<ImagemOtimizada> {
  const semAlteracao: ImagemOtimizada = {
    file: original,
    bytesOriginais: original.size,
    bytesFinais: original.size,
  };

  if (FORMATOS_PRESERVADOS.includes(original.type)) {
    return semAlteracao;
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(original);
  } catch {
    // Arquivo que o navegador não decodifica: sobe como veio.
    return semAlteracao;
  }

  try {
    const escala = Math.min(1, LARGURA_MAXIMA / bitmap.width);
    const largura = Math.round(bitmap.width * escala);
    const altura = Math.round(bitmap.height * escala);

    const canvas = document.createElement('canvas');
    canvas.width = largura;
    canvas.height = altura;

    const ctx = canvas.getContext('2d');
    if (!ctx) return semAlteracao;

    ctx.drawImage(bitmap, 0, 0, largura, altura);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/webp', QUALIDADE);
    });

    // Recomprimir nem sempre encolhe (imagem já otimizada, ou muito pequena).
    if (!blob || blob.size >= original.size) {
      return semAlteracao;
    }

    const nome = `${original.name.replace(/\.[^.]+$/, '')}.webp`;

    return {
      file: new File([blob], nome, { type: 'image/webp' }),
      bytesOriginais: original.size,
      bytesFinais: blob.size,
    };
  } finally {
    bitmap.close();
  }
}

export function formatarBytes(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`;
}
