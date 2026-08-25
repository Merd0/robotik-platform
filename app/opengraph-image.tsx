import { createSocialImage, socialImageSize } from "./social-image";

export const alt = "Robotik Laboratuvarı — interaktif Türkçe robotik dersleri";
export const size = socialImageSize;
export const contentType = "image/png";
export const dynamic = "force-static";

export default function OpenGraphImage() {
  return createSocialImage();
}
