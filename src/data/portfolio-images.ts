import { getImage } from 'astro:assets';
import ruckit from '../../public/assets/figma/portfolio-ruckit.jpg';
import helloKitty from '../../public/assets/figma/portfolio-hello-kitty.jpg';

// Preserve the original public JPEG URL as a fallback for each project.
const originals: Record<string, ImageMetadata> = {
  '/assets/figma/portfolio-ruckit.jpg': ruckit,
  '/assets/figma/portfolio-hello-kitty.jpg': helloKitty,
};

export async function portfolioSrcset(path: string) {
  const src = originals[path];
  if (!src) return undefined;
  const image = await getImage({ src, widths: [400, 612], format: 'webp', quality: 85 });
  return image.srcSet.attribute;
}
