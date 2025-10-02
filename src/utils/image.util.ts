import fs from "fs";

export const imageToBase64 = (path: string): string => {
  const img = fs.readFileSync(path);
  return img.toString("base64");
};

export const base64ToImage = (
  base64String: string,
  outputPath: string
): void => {
  const imgBuffer = Buffer.from(base64String, "base64");
  fs.writeFileSync(outputPath, imgBuffer);
};

export const checkImageSize = (
  base64String: string,
  maxSizeInMB: number
): boolean => {
  const imgBuffer = Buffer.from(base64String, "base64");
  const sizeInMB = imgBuffer.length / (1024 * 1024);

  return sizeInMB <= maxSizeInMB;
};
