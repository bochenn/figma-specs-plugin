declare module "*.svg" {
  const content: string;
  export default content;
}

declare module "*.png" {
  const content: string; // data URL (esbuild "dataurl" loader)
  export default content;
}
